import { onBeforeUnmount, shallowRef } from 'vue';

import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import type { TextBoxHeightMeasurement } from '@/services/rendering/textBoxMeasurement';

function useMeasurement<Result>() {
  let sequence = 0;
  const pending = shallowRef<{
    id: number;
    workspace: Workspace;
    templatePages?: Page[];
    resolve(result: Result): void;
    reject(error: Error): void;
  } | null>(null);
  function fail(error: Error) {
    const request = pending.value;
    if (request !== null) {
      pending.value = null;
      request.reject(error);
    }
  }
  function cancel(workspace?: Workspace) {
    if (
      workspace === undefined ||
      pending.value?.workspace.id === workspace.id
    ) {
      fail(new Error('DOCUMENT_NOT_FOUND'));
    }
  }
  onBeforeUnmount(() => cancel());
  return {
    pending,
    start: (workspace: Workspace, templatePages?: Page[]) =>
      new Promise<Result>((resolve, reject) => {
        pending.value = {
          id: ++sequence,
          workspace,
          templatePages,
          resolve,
          reject,
        };
      }),
    complete(result: Result) {
      const request = pending.value;
      // Disposal can cancel a request before its measuring component unmounts.
      if (request !== null) {
        pending.value = null;
        request.resolve(result);
      }
    },
    fail,
    cancel,
  };
}

export function useWorkspaceMeasurements() {
  return {
    textBoxes: useMeasurement<TextBoxHeightMeasurement[]>(),
    pages: useMeasurement<Page[]>(),
  };
}
