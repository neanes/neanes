import { nextTick, onBeforeUnmount, toRaw } from 'vue';

import type { Workspace } from '@/models/Workspace';
import {
  type DocumentEditor,
  DocumentService,
} from '@/services/documents/DocumentService';
import {
  loadFontFamilies,
  loadScoreFonts,
} from '@/services/rendering/fontReadiness';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';
import {
  type LiveLayoutOutcome,
  settleWorkspace,
} from '@/services/rendering/settleWorkspace';
import { needsFootnoteSettlement } from '@/services/rendering/workspaceLayoutSettlement';
import { SaveService } from '@/services/SaveService';

import { editorBusyError, type EditorBusyState } from '../contracts/editorBusy';
import { useEditorAutomation } from './useEditorAutomation';
import { useWorkspaceMeasurements } from './useWorkspaceMeasurements';

// Owns the automation document adapter and its offscreen measurements. The editor
// supplies application operations and retains normal editing/persistence flows.
export function useEditorDocumentAutomation(
  options: Omit<
    DocumentEditor,
    'settle' | 'elementsChanged' | 'changeStyles' | 'ensureFonts'
  > & {
    enabled: boolean;
    busyState(): EditorBusyState | null;
    snapshot(workspace: Workspace): ScoreRenderSnapshot;
    awaitCurrentFootnoteLayout(
      workspace: Workspace,
    ): Promise<LiveLayoutOutcome>;
  },
) {
  const dirtyTextBoxWorkspaces = new Set<string>();
  let editorUnmounted = false;
  const { textBoxes, pages } = useWorkspaceMeasurements();
  const selectedDuringMeasurement = new Error('WORKSPACE_BECAME_SELECTED');

  async function settleSelectedFootnoteLayout(workspace: Workspace) {
    const outcome = await options.awaitCurrentFootnoteLayout(workspace);
    if (outcome === 'deferred') {
      throw editorBusyError({ reason: 'layout_deferred' });
    }
    if (outcome === 'superseded') {
      throw new Error(
        'LAYOUT_CONFLICT: The selected document changed while settling its layout. Read it again before retrying.',
      );
    }
    return true;
  }

  // Automation requests await settlement serially, including private batch documents.
  async function measureWorkspaceTextBoxes(workspace: Workspace) {
    // Let the previous measurement's component unmount before mounting the next.
    await nextTick();
    if (editorUnmounted || !isActive(workspace)) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
    await loadScoreFonts(SaveService.SaveScoreToJson(workspace.score));
    await document.fonts.ready;
    if (editorUnmounted || !isActive(workspace)) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
    if (isSelectedFootnoteLayout(workspace)) {
      return settleSelectedFootnoteLayout(workspace);
    }
    try {
      await settleWorkspace(toRaw(workspace), async (templatePages) => {
        await nextTick();
        if (editorUnmounted || !isActive(workspace)) {
          throw new Error('DOCUMENT_NOT_FOUND');
        }
        if (isSelectedFootnoteLayout(workspace)) {
          throw selectedDuringMeasurement;
        }
        const heights = await textBoxes.start(workspace, templatePages);
        if (isSelectedFootnoteLayout(workspace)) {
          throw selectedDuringMeasurement;
        }
        return heights;
      });
    } catch (error) {
      if (error === selectedDuringMeasurement) {
        return settleSelectedFootnoteLayout(workspace);
      }
      throw error;
    }
    if (isSelectedFootnoteLayout(workspace)) {
      return settleSelectedFootnoteLayout(workspace);
    }
    if (
      workspace.id === options.selectedWorkspace()?.id ||
      !automation.ownsPrivateWorkspace(workspace)
    ) {
      options.changed(workspace);
    }
    return false;
  }

  function isSelectedFootnoteLayout(workspace: Workspace) {
    return (
      workspace.id === options.selectedWorkspace()?.id &&
      needsFootnoteSettlement(workspace.score)
    );
  }

  const documents = new DocumentService({
    ...options,
    async settle(workspace) {
      const selectedFootnotes = isSelectedFootnoteLayout(workspace);
      if (selectedFootnotes || dirtyTextBoxWorkspaces.has(workspace.id)) {
        const published = await measureWorkspaceTextBoxes(workspace);
        // A failed measurement leaves the workspace dirty so the next save retries.
        dirtyTextBoxWorkspaces.delete(workspace.id);
        if (published) {
          return;
        }
      }
      if (selectedFootnotes) {
        return;
      }
      await nextTick();
      await document.fonts.ready;
      if (workspace.id === options.selectedWorkspace()?.id) {
        options.changed(workspace);
        await nextTick();
      }
    },
    ensureFonts: loadFontFamilies,
    elementsChanged(workspace) {
      dirtyTextBoxWorkspaces.add(workspace.id);
    },
    changeStyles(workspace, operation) {
      operation();
      dirtyTextBoxWorkspaces.add(workspace.id);
    },
  });
  function disposeWorkspace(workspace: Workspace) {
    dirtyTextBoxWorkspaces.delete(workspace.id);
    textBoxes.cancel(workspace);
    pages.cancel(workspace);
  }
  const automation = useEditorAutomation({
    documents,
    enabled: options.enabled,
    busyState: options.busyState,
    hooks: {
      createScore: options.createScore,
      prepare: options.prepare,
      dispose: disposeWorkspace,
      async settle(workspace) {
        await measureWorkspaceTextBoxes(workspace);
      },
    },
    snapshot: options.snapshot,
    renderPages: pages.start,
  });
  function isActive(workspace: Workspace) {
    return (
      options.workspaces().some((item) => item.id === workspace.id) ||
      automation.ownsPrivateWorkspace(workspace)
    );
  }
  onBeforeUnmount(() => {
    editorUnmounted = true;
  });
  return {
    automation,
    disposeWorkspace,
    workspaceTextBoxMeasurement: textBoxes.pending,
    workspacePageMeasurement: pages.pending,
    completePageMeasurement: pages.complete,
    failPageMeasurement: pages.fail,
    completeWorkspaceTextBoxMeasurement: textBoxes.complete,
    failWorkspaceTextBoxMeasurement: textBoxes.fail,
  };
}
