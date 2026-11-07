<script setup lang="ts">
import {
  PhAlignRight,
  PhBookmarkSimple,
  PhClipboardText,
  PhCopy,
  PhCrosshair,
  PhScissors,
  PhSelectionAll,
  PhSlidersHorizontal,
} from '@phosphor-icons/vue';

import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import type {
  FootnoteAnchorElement,
  ImageBoxElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
} from '@/models/Element';

defineProps<{
  contextMenuFootnoteId: string | null;
  contextMenuFootnoteAnchor: FootnoteAnchorElement | null;
  contextMenuMartyria: MartyriaElement | null;
  contextMenuModeKey: ModeKeyElement | null;
  contextMenuImageBox: ImageBoxElement | null;
  contextMenuNote: NoteElement | null;
  isMainStaffAnchor: boolean;
  canCutCopySelected: boolean;
  canPasteSelected: boolean;
  canSelectAllElements: boolean;
  contextMenuHasElementProperties: boolean;
  canSaveContextMenuSelectionAsCombo: boolean;
}>();
const emit = defineEmits<{
  'close-auto-focus': [event: Event];
  'pointer-down': [];
  'pointer-up': [event: PointerEvent];
  'footnote-properties': [id: string];
  cut: [];
  copy: [];
  paste: [includeLyrics: boolean];
  'select-all': [];
  'update-martyria': [
    element: MartyriaElement,
    values: Partial<MartyriaElement>,
  ];
  'default-style': [element: ModeKeyElement, value: boolean];
  'update-mode-key': [element: ModeKeyElement, values: Partial<ModeKeyElement>];
  'update-image-box': [
    element: ImageBoxElement,
    values: Partial<ImageBoxElement>,
  ];
  'save-combo': [];
  'insert-footnote': [element: FootnoteAnchorElement];
  'edit-footnote': [element: FootnoteAnchorElement];
  'remove-footnote': [element: FootnoteAnchorElement];
  positioning: [element: NoteElement];
  'change-key': [element: ModeKeyElement];
  'show-properties': [];
}>();
</script>

<template>
  <ContextMenuContent
    class="chrome-menu"
    @close-auto-focus="emit('close-auto-focus', $event)"
    @pointerdown.capture="emit('pointer-down')"
    @pointerup.capture="emit('pointer-up', $event)"
  >
    <ContextMenuItem
      v-if="contextMenuFootnoteId !== null"
      data-testid="footnote-properties-menu"
      @select="emit('footnote-properties', contextMenuFootnoteId)"
      >{{
        $t(($) => $.menu.footnotes.properties, { ns: 'menu' })
      }}</ContextMenuItem
    >
    <template v-else>
      <ContextMenuItem :disabled="!canCutCopySelected" @select="emit('cut')">
        <PhScissors />
        {{ $t(($) => $.menu.edit.cut, { ns: 'menu' }) }}
      </ContextMenuItem>
      <ContextMenuItem :disabled="!canCutCopySelected" @select="emit('copy')">
        <PhCopy />
        {{ $t(($) => $.menu.edit.copy, { ns: 'menu' }) }}
      </ContextMenuItem>
      <ContextMenuItem
        :disabled="!canPasteSelected"
        @select="emit('paste', false)"
      >
        <PhClipboardText />
        {{ $t(($) => $.menu.edit.paste, { ns: 'menu' }) }}
      </ContextMenuItem>
      <ContextMenuItem
        :disabled="!canPasteSelected"
        @select="emit('paste', true)"
      >
        <PhClipboardText />
        {{ $t(($) => $.menu.edit.pasteWithLyrics, { ns: 'menu' }) }}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        :disabled="!canSelectAllElements"
        @select="emit('select-all')"
      >
        <PhSelectionAll />
        {{ $t(($) => $.menu.edit.selectAll, { ns: 'menu' }) }}
      </ContextMenuItem>
      <template v-if="contextMenuHasElementProperties">
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          v-if="contextMenuMartyria != null"
          :model-value="contextMenuMartyria.alignRight"
          @update:model-value="
            emit('update-martyria', contextMenuMartyria, {
              alignRight: $event === true,
            })
          "
        >
          <PhAlignRight class="h-4 w-4" weight="duotone" />
          {{
            $t(($) => $.toolbar.common.alignRight, {
              ns: 'toolbar',
            })
          }}
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          v-if="contextMenuModeKey != null"
          :model-value="contextMenuModeKey.useDefaultStyle"
          @update:model-value="
            emit('default-style', contextMenuModeKey, $event === true)
          "
        >
          {{
            $t(($) => $.toolbar.common.useDefaultStyle, {
              ns: 'toolbar',
            })
          }}
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          v-if="contextMenuModeKey != null"
          :model-value="contextMenuModeKey.showAmbitus"
          @update:model-value="
            emit('update-mode-key', contextMenuModeKey, {
              showAmbitus: $event === true,
            })
          "
        >
          {{
            $t(($) => $.toolbar.initialMartyria.showAmbitus, {
              ns: 'toolbar',
            })
          }}
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          v-if="contextMenuImageBox != null"
          :model-value="contextMenuImageBox.lockAspectRatio"
          @update:model-value="
            emit('update-image-box', contextMenuImageBox, {
              lockAspectRatio: $event === true,
            })
          "
        >
          {{
            $t(($) => $.toolbar.imageBox.maintainAspectRatio, {
              ns: 'toolbar',
            })
          }}
        </ContextMenuCheckboxItem>
      </template>
      <ContextMenuSeparator />
      <ContextMenuItem
        v-if="canSaveContextMenuSelectionAsCombo"
        @select="emit('save-combo')"
      >
        <PhBookmarkSimple />
        {{ $t(($) => $.menu.edit.saveAsCombo, { ns: 'menu' }) }}
      </ContextMenuItem>
      <template v-if="contextMenuFootnoteAnchor != null && isMainStaffAnchor">
        <ContextMenuItem
          v-if="contextMenuFootnoteAnchor.footnoteId === null"
          @select="emit('insert-footnote', contextMenuFootnoteAnchor)"
          >{{
            $t(($) => $.menu.footnotes.insert, { ns: 'menu' })
          }}</ContextMenuItem
        >
        <template v-else>
          <ContextMenuItem
            @select="
              emit('footnote-properties', contextMenuFootnoteAnchor.footnoteId!)
            "
            >{{
              $t(($) => $.menu.footnotes.properties, { ns: 'menu' })
            }}</ContextMenuItem
          >
          <ContextMenuItem
            @select="emit('edit-footnote', contextMenuFootnoteAnchor)"
            >{{
              $t(($) => $.menu.footnotes.edit, {
                ns: 'menu',
                number: contextMenuFootnoteAnchor.footnoteMarker,
              })
            }}</ContextMenuItem
          >
          <ContextMenuItem
            @select="emit('remove-footnote', contextMenuFootnoteAnchor)"
            >{{
              $t(($) => $.menu.footnotes.remove, { ns: 'menu' })
            }}</ContextMenuItem
          >
        </template>
      </template>
      <ContextMenuItem
        v-if="contextMenuNote != null"
        @select="emit('positioning', contextMenuNote)"
      >
        <PhCrosshair />
        {{ $t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' }) }}
      </ContextMenuItem>
      <ContextMenuItem
        v-if="contextMenuModeKey != null"
        @select="emit('change-key', contextMenuModeKey)"
      >
        <span
          class="inline-grid size-4 shrink-0 place-items-center font-['Source_Serif'] text-sm leading-none"
          aria-hidden="true"
        >
          Ηχ
        </span>
        {{
          $t(($) => $.toolbar.initialMartyria.changeInitialMartyria, {
            ns: 'toolbar',
          })
        }}
      </ContextMenuItem>
      <ContextMenuItem @select="emit('show-properties')">
        <PhSlidersHorizontal />
        {{ $t(($) => $.menu.view.properties, { ns: 'menu' }) }}
      </ContextMenuItem>
    </template>
  </ContextMenuContent>
</template>
