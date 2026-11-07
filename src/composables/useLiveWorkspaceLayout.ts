import { nextTick, onBeforeUnmount, toRaw } from 'vue';

import type { LayoutDiagnosticsOptions } from '@/models/LayoutDiagnostics';
import type { Page } from '@/models/Page';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { detachLayout } from '@/services/rendering/detachLayout';
import {
  type LiveLayoutOutcome,
  settleWorkspace,
} from '@/services/rendering/settleWorkspace';
import type { TextBoxHeightMeasurement } from '@/services/rendering/textBoxMeasurement';

export type LiveLayoutTrial = {
  isCurrent: () => boolean;
  measure: (
    options: LayoutDiagnosticsOptions,
    prepare: (copies: ReturnType<typeof detachLayout>['copies']) => void,
  ) => Promise<
    Pick<ReturnType<typeof detachLayout>, 'copies' | 'applyHeights'> &
      Awaited<ReturnType<typeof settleWorkspace>>
  >;
};

type LayoutRequest = {
  isCurrent: () => boolean;
  outcome?: LiveLayoutOutcome;
  promise: Promise<LiveLayoutOutcome>;
  cancel: () => void;
};

export function useLiveWorkspaceLayout(options: {
  selectedWorkspace: () => Workspace;
  enabled: () => boolean;
  settle: (
    workspace: Workspace,
    trial: LiveLayoutTrial,
  ) => Promise<LiveLayoutOutcome>;
  measureTextBoxes: (
    workspace: Workspace,
    templatePages?: Page[],
  ) => Promise<TextBoxHeightMeasurement[]>;
  cancelMeasurement: () => void;
  onFailure: (workspace: Workspace, score: Score) => void;
}) {
  let current: LayoutRequest | undefined;
  let disposed = false;
  let waitingForBlur = false;

  function invalidate() {
    const request = current;
    current = undefined;
    waitingForBlur = false;
    request?.cancel();
    options.cancelMeasurement();
  }

  onBeforeUnmount(() => {
    disposed = true;
    invalidate();
  });

  function isSelected(workspace: Workspace, score: Score) {
    return (
      !disposed &&
      workspace === toRaw(options.selectedWorkspace()) &&
      workspace.score === score &&
      options.enabled()
    );
  }

  function start(workspace: Workspace): Promise<LiveLayoutOutcome> {
    const source = toRaw(workspace);
    const { score, contentRevision } = source;
    if (!isSelected(source, score)) {
      return Promise.resolve('superseded');
    }
    if (current?.isCurrent()) {
      return current.promise;
    }
    if (current !== undefined) {
      invalidate();
    }

    const cancellation = Promise.withResolvers<LiveLayoutOutcome>();
    const deadline = Promise.withResolvers<never>();
    const timer = setTimeout(() => {
      deadline.reject(
        new Error(
          'LAYOUT_SETTLEMENT_FAILED: The layout did not settle within 20 seconds.',
        ),
      );
    }, 20_000);
    const isCurrent = () =>
      current?.promise === promise &&
      isSelected(source, score) &&
      source.contentRevision === contentRevision;

    async function run(): Promise<LiveLayoutOutcome> {
      // Let canceled measurement components unmount before starting another.
      await nextTick();
      await document.fonts.ready;
      if (!isCurrent()) {
        return 'superseded';
      }
      return options.settle(workspace, {
        isCurrent,
        async measure(layoutOptions, prepare) {
          const detached = detachLayout(source);
          prepare(detached.copies);
          const result = await settleWorkspace(
            detached.workspace,
            async (templatePages) => {
              await nextTick();
              if (!isCurrent()) {
                throw new Error('LAYOUT_MEASUREMENT_STALE');
              }
              return options.measureTextBoxes(
                detached.workspace,
                templatePages,
              );
            },
            layoutOptions,
          );
          return {
            copies: detached.copies,
            applyHeights: detached.applyHeights,
            ...result,
          };
        },
      });
    }

    const promise: Promise<LiveLayoutOutcome> = Promise.race([
      run(),
      cancellation.promise,
      deadline.promise,
    ])
      .then((outcome): LiveLayoutOutcome => {
        if (!isCurrent()) {
          return 'superseded';
        }
        request.outcome = outcome;
        waitingForBlur = outcome === 'deferred';
        return outcome;
      })
      .catch((error: unknown): LiveLayoutOutcome => {
        const failedWhileCurrent = isCurrent();
        if (current?.promise === promise) {
          invalidate();
        }
        if (failedWhileCurrent) {
          options.onFailure(source, score);
          throw error;
        }
        return 'superseded';
      })
      .finally(() => clearTimeout(timer));

    const request: LayoutRequest = {
      isCurrent,
      promise,
      cancel: () => cancellation.resolve('superseded'),
    };
    current = request;
    return promise;
  }

  async function wait(workspace: Workspace): Promise<LiveLayoutOutcome> {
    const source = toRaw(workspace);
    const score = source.score;
    // MCP mutations can wait before and after editing. Bound retries without
    // letting an individual caller cancel a newer shared request.
    const deadline = Promise.withResolvers<never>();
    const timer = setTimeout(() => {
      deadline.reject(
        new Error(
          'LAYOUT_SETTLEMENT_FAILED: The current layout did not settle within 25 seconds.',
        ),
      );
    }, 25_000);
    let attempts = 0;
    try {
      while (isSelected(source, score)) {
        if (attempts++ === 12) {
          throw new Error(
            'LAYOUT_SETTLEMENT_FAILED: The layout was superseded too many times.',
          );
        }
        const pending = start(workspace);
        const outcome = await Promise.race([pending, deadline.promise]);
        await nextTick();
        if (
          outcome !== 'superseded' &&
          current?.promise === pending &&
          current.isCurrent()
        ) {
          return outcome;
        }
      }
      return 'superseded';
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    start,
    wait,
    invalidate,
    get isPublished() {
      return current?.outcome === 'published' && current.isCurrent();
    },
    get waitingForBlur() {
      return waitingForBlur;
    },
  };
}
