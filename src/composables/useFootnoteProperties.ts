import { computed, type Ref, ref, watch } from 'vue';

import {
  FootnoteAnchorElement,
  MartyriaElement,
  NoteElement,
  TempoElement,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import {
  footnoteMarkerUpdateCommand,
  orderedFootnotes,
} from '@/services/FootnoteService';
import { CommandFactory } from '@/services/history/CommandService';

export function useFootnoteProperties(
  workspace: Ref<Workspace>,
  pages: Ref<Page[]>,
  flush: (workspace: Workspace) => void,
  save: () => void,
) {
  const footnotePropertiesDialogIsOpen = ref(false);
  const editedFootnoteId = ref<string | null>(null);
  const editedFootnote = computed(() =>
    orderedFootnotes(workspace.value.score).find(
      ({ footnote }) => footnote.id === editedFootnoteId.value,
    ),
  );
  const footnotePreviewLineElements = computed(() => {
    const reference = editedFootnote.value?.reference;
    if (!(reference instanceof FootnoteAnchorElement)) {
      return [];
    }
    return (
      pages.value[reference.page - 1]?.lines[reference.line - 1]?.elements ?? []
    );
  });
  const footnotePreviewNeighbors = computed(() => {
    const reference = editedFootnote.value?.reference;
    const musicalElements = footnotePreviewLineElements.value.filter(
      (element): element is NoteElement | MartyriaElement | TempoElement =>
        element instanceof NoteElement ||
        element instanceof MartyriaElement ||
        element instanceof TempoElement,
    );
    const index = musicalElements.findIndex((element) => element === reference);
    return [musicalElements[index - 1], musicalElements[index + 1]].filter(
      (element) => element !== undefined,
    );
  });
  watch(editedFootnote, (entry) => {
    if (entry === undefined) {
      footnotePropertiesDialogIsOpen.value = false;
    }
  });

  function openFootnoteProperties(id: string) {
    flush(workspace.value);
    editedFootnoteId.value = id;
    footnotePropertiesDialogIsOpen.value = true;
  }

  function updateFootnoteMarker(
    marker: string | null,
    offsets: Pick<
      FootnoteAnchorElement,
      'footnoteOffsetX' | 'footnoteOffsetY' | 'footnotePositionOverride'
    >,
  ) {
    const entry = editedFootnote.value!;
    const commands = [footnoteMarkerUpdateCommand(entry.footnote, marker)];
    if (entry.reference instanceof FootnoteAnchorElement) {
      commands.push(
        new CommandFactory<FootnoteAnchorElement>().create(
          'update-properties',
          {
            target: entry.reference,
            newValues: offsets,
          },
        ),
      );
    }
    workspace.value.commandService.executeAsBatch(commands);
    save();
  }

  return {
    footnotePropertiesDialogIsOpen,
    editedFootnote,
    footnotePreviewLineElements,
    footnotePreviewNeighbors,
    openFootnoteProperties,
    updateFootnoteMarker,
  };
}
