import { nextTick, onBeforeUnmount, shallowRef, toRaw } from 'vue';

import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import {
  type DocumentEditor,
  DocumentService,
} from '@/services/documents/DocumentService';
import { LayoutService } from '@/services/LayoutService';
import {
  getFontFamilyLoadDescriptors,
  getScoreFontLoadDescriptors,
} from '@/services/rendering/fontReadiness';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';
import {
  getResizableTextBoxes,
  type TextBoxHeightMeasurement,
} from '@/services/rendering/textBoxMeasurement';
import { SaveService } from '@/services/SaveService';

import type { EditorBusyState } from '../contracts/editorBusy';
import { useEditorAutomation } from './useEditorAutomation';

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
  const pendingTextBoxMeasurements = new Map<string, Promise<void>>();
  let textBoxMeasurementQueue = Promise.resolve();
  let editorUnmounted = false;
  const workspaceTextBoxMeasurement = shallowRef<{
    workspace: Workspace;
    resolve(): void;
    reject(error: Error): void;
  } | null>(null);
  const workspacePageMeasurement = shallowRef<{
    workspace: Workspace;
    resolve(pages: Page[]): void;
    reject(error: Error): void;
  } | null>(null);
  function completePageMeasurement(pages: Page[]) {
    const request = workspacePageMeasurement.value!;
    workspacePageMeasurement.value = null;
    request.resolve(pages);
  }
  function failPageMeasurement(error: Error) {
    const request = workspacePageMeasurement.value;
    if (request !== null) {
      workspacePageMeasurement.value = null;
      request.reject(error);
    }
  }

  function queueWorkspaceTextBoxMeasurement(workspace: Workspace) {
    dirtyTextBoxWorkspaces.add(workspace.id);
    const pending = textBoxMeasurementQueue.then(async () => {
      if (editorUnmounted || !isActive(workspace)) {
        return;
      }
      await Promise.all(
        getScoreFontLoadDescriptors(
          SaveService.SaveScoreToJson(workspace.score),
        ).map((descriptor) => document.fonts.load(descriptor)),
      );
      await document.fonts.ready;
      // Compute target widths and inherited legacy text styles before mounting measurements.
      LayoutService.processPages(toRaw(workspace));
      if (getResizableTextBoxes(workspace.score).length > 0) {
        await new Promise<void>((resolve, reject) => {
          workspaceTextBoxMeasurement.value = { workspace, resolve, reject };
        });
        await nextTick();
        LayoutService.processPages(toRaw(workspace));
      }
      if (!isActive(workspace)) {
        return;
      }
      if (workspace.id === options.selectedWorkspace()?.id) {
        options.changed(workspace);
      } else if (!automation.ownsPrivateWorkspace(workspace)) {
        options.changed(workspace);
      }
    });
    pendingTextBoxMeasurements.set(workspace.id, pending);
    textBoxMeasurementQueue = pending
      .catch(() => undefined)
      .then(() => nextTick());
    void pending.then(
      () => {
        if (pendingTextBoxMeasurements.get(workspace.id) === pending) {
          pendingTextBoxMeasurements.delete(workspace.id);
          dirtyTextBoxWorkspaces.delete(workspace.id);
        }
      },
      () => {
        // Keep the workspace dirty so the next save retries instead of persisting stale heights.
        if (pendingTextBoxMeasurements.get(workspace.id) === pending) {
          pendingTextBoxMeasurements.delete(workspace.id);
        }
      },
    );
    return pending;
  }

  async function settleWorkspaceTextBoxes(workspace: Workspace) {
    if (
      dirtyTextBoxWorkspaces.has(workspace.id) &&
      !pendingTextBoxMeasurements.has(workspace.id)
    ) {
      queueWorkspaceTextBoxMeasurement(workspace);
    }
    let pending;
    while ((pending = pendingTextBoxMeasurements.get(workspace.id)) != null) {
      await pending;
    }
  }

  function completeWorkspaceTextBoxMeasurement(
    heights: TextBoxHeightMeasurement[],
  ) {
    const request = workspaceTextBoxMeasurement.value;
    // A removed workspace can cancel the request before its component unmounts.
    if (request == null) {
      return;
    }
    for (const { element, height } of heights) {
      element.height = height;
    }
    workspaceTextBoxMeasurement.value = null;
    request.resolve();
  }

  function failWorkspaceTextBoxMeasurement(error: Error) {
    const request = workspaceTextBoxMeasurement.value;
    if (request == null) {
      return;
    }
    workspaceTextBoxMeasurement.value = null;
    request.reject(error);
  }

  const documents = new DocumentService({
    ...options,
    async settle(workspace) {
      await settleWorkspaceTextBoxes(workspace);
      await nextTick();
      await document.fonts.ready;
      if (workspace.id === options.selectedWorkspace()?.id) {
        options.changed(workspace);
        await nextTick();
      }
    },
    async ensureFonts(families) {
      await Promise.all(
        getFontFamilyLoadDescriptors(families).map((descriptor) =>
          document.fonts.load(descriptor),
        ),
      );
    },
    elementsChanged(workspace) {
      dirtyTextBoxWorkspaces.add(workspace.id);
    },
    changeStyles(workspace, operation) {
      operation();
      void queueWorkspaceTextBoxMeasurement(workspace);
    },
  });
  function disposeWorkspace(workspace: Workspace) {
    dirtyTextBoxWorkspaces.delete(workspace.id);
    pendingTextBoxMeasurements.delete(workspace.id);
    if (workspaceTextBoxMeasurement.value?.workspace.id === workspace.id) {
      failWorkspaceTextBoxMeasurement(new Error('DOCUMENT_NOT_FOUND'));
    }
    if (workspacePageMeasurement.value?.workspace.id === workspace.id) {
      failPageMeasurement(new Error('DOCUMENT_NOT_FOUND'));
    }
  }
  const automation = useEditorAutomation({
    documents,
    enabled: options.enabled,
    busyState: options.busyState,
    createScore: options.createScore,
    prepare: options.prepare,
    dispose: disposeWorkspace,
    settle: queueWorkspaceTextBoxMeasurement,
    snapshot: options.snapshot,
    renderPages: (workspace) =>
      new Promise<Page[]>((resolve, reject) => {
        workspacePageMeasurement.value = { workspace, resolve, reject };
      }),
  });
  function isActive(workspace: Workspace) {
    return (
      options.workspaces().some((item) => item.id === workspace.id) ||
      automation.ownsPrivateWorkspace(workspace)
    );
  }
  onBeforeUnmount(() => {
    editorUnmounted = true;
    if (workspaceTextBoxMeasurement.value) {
      failWorkspaceTextBoxMeasurement(new Error('DOCUMENT_NOT_FOUND'));
    }
    if (workspacePageMeasurement.value) {
      failPageMeasurement(new Error('DOCUMENT_NOT_FOUND'));
    }
  });
  return {
    automation,
    disposeWorkspace,
    workspaceTextBoxMeasurement,
    workspacePageMeasurement,
    completePageMeasurement,
    failPageMeasurement,
    completeWorkspaceTextBoxMeasurement,
    failWorkspaceTextBoxMeasurement,
  };
}
