import { nextTick, onBeforeUnmount, toRaw } from 'vue';

import type { Workspace } from '@/models/Workspace';
import {
  type DocumentEditor,
  DocumentService,
} from '@/services/documents/DocumentService';
import { LayoutService } from '@/services/LayoutService';
import {
  loadFontFamilies,
  loadScoreFonts,
} from '@/services/rendering/fontReadiness';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';
import { getResizableTextBoxes } from '@/services/rendering/textBoxMeasurement';
import { SaveService } from '@/services/SaveService';

import type { EditorBusyState } from '../contracts/editorBusy';
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
  },
) {
  const dirtyTextBoxWorkspaces = new Set<string>();
  let editorUnmounted = false;
  const { textBoxes, pages } = useWorkspaceMeasurements();

  // Automation requests await settlement serially, including private batch documents.
  async function measureWorkspaceTextBoxes(workspace: Workspace) {
    // Let the previous measurement's component unmount before mounting the next.
    await nextTick();
    if (editorUnmounted || !isActive(workspace)) {
      return;
    }
    await loadScoreFonts(SaveService.SaveScoreToJson(workspace.score));
    await document.fonts.ready;
    if (editorUnmounted || !isActive(workspace)) {
      return;
    }
    // Compute target widths and inherited legacy text styles before mounting measurements.
    LayoutService.processPages(toRaw(workspace));
    if (getResizableTextBoxes(workspace.score).length > 0) {
      await textBoxes.start(workspace);
      await nextTick();
      if (editorUnmounted || !isActive(workspace)) {
        return;
      }
      LayoutService.processPages(toRaw(workspace));
    }
    if (
      workspace.id === options.selectedWorkspace()?.id ||
      !automation.ownsPrivateWorkspace(workspace)
    ) {
      options.changed(workspace);
    }
  }

  const documents = new DocumentService({
    ...options,
    async settle(workspace) {
      if (dirtyTextBoxWorkspaces.has(workspace.id)) {
        await measureWorkspaceTextBoxes(workspace);
        // A failed measurement leaves the workspace dirty so the next save retries.
        dirtyTextBoxWorkspaces.delete(workspace.id);
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
      settle: measureWorkspaceTextBoxes,
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
