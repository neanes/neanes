import { nextTick, onBeforeUnmount, toRaw } from 'vue';

import type { ScoreElement } from '@/models/Element';
import type { LayoutDiagnosticsOptions } from '@/models/LayoutDiagnostics';
import type { Page } from '@/models/Page';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { detachLayout } from '@/services/rendering/detachLayout';
import {
  type LiveLayoutOutcome,
  settleWorkspace,
} from '@/services/rendering/settleWorkspace';
import type {
  MeasuredTextBox,
  TextBoxHeightMeasurement,
} from '@/services/rendering/textBoxMeasurement';
import { TextBoxMeasurementCache } from '@/services/rendering/textBoxMeasurementCache';

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
    templatePages: Page[] | undefined,
    boxes: ReadonlySet<MeasuredTextBox>,
  ) => Promise<TextBoxHeightMeasurement[]>;
  textBoxEditor: () => { fonts: string[]; language: string };
  cancelMeasurement: () => void;
}) {
  const measurements = new TextBoxMeasurementCache();
  // Breaks retained by each score's last settled publish, on the original
  // elements. Reusing them keeps the synchronous layout of unchanged content
  // identical to the settled one.
  const settledBreaks = new WeakMap<Score, ReadonlySet<ScoreElement>>();
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
    let measuredBreaks: ReadonlySet<ScoreElement> | undefined;

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
              return measurements.measure(
                detached.workspace,
                templatePages,
                detached.originals,
                options.textBoxEditor(),
                (boxes) =>
                  options.measureTextBoxes(
                    detached.workspace,
                    templatePages,
                    boxes,
                  ),
                isCurrent,
              );
            },
            layoutOptions,
          );
          const breaksBefore = new Set<ScoreElement>();
          for (const copy of result.breaksBefore) {
            const original = detached.originals.get(copy);
            if (original !== undefined) {
              breaksBefore.add(original);
            }
          }
          measuredBreaks = breaksBefore;
          return {
            copies: detached.copies,
            applyHeights: detached.applyHeights,
            pages: result.pages,
            breaksBefore,
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
        if (outcome === 'settled' && measuredBreaks !== undefined) {
          settledBreaks.set(score, measuredBreaks);
        }
        return outcome;
      })
      .catch((error: unknown): LiveLayoutOutcome => {
        const failedWhileCurrent = isCurrent();
        if (current?.promise === promise) {
          invalidate();
        }
        if (!failedWhileCurrent) {
          return 'superseded';
        }
        // The synchronous layout stays published.
        throw error;
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

  // Restart settlement even when the content revision is unchanged, so that
  // uncommitted rich-text drafts are measured.
  function refresh(workspace: Workspace) {
    invalidate();
    void start(workspace).catch(console.error);
  }

  function breaksFor(workspace: Workspace) {
    const { score } = toRaw(workspace);
    return options.enabled() ? settledBreaks.get(score) : undefined;
  }

  return {
    start,
    wait,
    invalidate,
    refresh,
    breaksFor,
    clearMeasurements: () => measurements.clear(),
    get isSettled() {
      return current?.outcome === 'settled' && current.isCurrent();
    },
    get waitingForBlur() {
      return waitingForBlur;
    },
  };
}
