import type { ZoomFitMode } from '@/models/Workspace';
import type { PaneEdge, WorkspacePaneId } from '@/models/WorkspacePane';
import { workspacePaneDefinitions } from '@/models/WorkspacePane';

export const DEFAULT_PANE_ACCORDION_STATE: Partial<
  Record<WorkspacePaneId, string[]>
> = {
  developer: ['display', 'line', 'inspector'],
  properties: [
    'style',
    'size',
    'positioning',
    'neume',
    'tempo',
    'martyria',
    'initial-martyria',
    'mode-change',
    'running-marker',
    'scrollable',
    'neume-attributes',
  ],
};

export type EditorPaneLayout = {
  [PaneId in WorkspacePaneId]?: {
    visible: boolean;
    edge: PaneEdge;
    floating: boolean;
  };
};

export type PaneAccordionState = Partial<Record<WorkspacePaneId, string[]>>;

export type PersistedEditorEnvironment = Partial<{
  defaultZoom: number;
  defaultZoomFitMode: ZoomFitMode;
  statusBarIsVisible: false;
  paneLayout: EditorPaneLayout;
  paneAccordionState: PaneAccordionState;
}>;

export class EditorEnvironment {
  defaultZoom = 1;
  defaultZoomFitMode: ZoomFitMode | null = null;
  statusBarIsVisible = true;
  paneLayout: EditorPaneLayout | null = null;
  paneAccordionState: PaneAccordionState = {};

  static createFrom(data: PersistedEditorEnvironment) {
    return Object.assign(new EditorEnvironment(), data);
  }

  toJSON(): PersistedEditorEnvironment {
    return {
      ...persistZoom(this.defaultZoom, this.defaultZoomFitMode),
      ...(this.statusBarIsVisible ? {} : { statusBarIsVisible: false }),
      ...persistPaneLayout(this.paneLayout),
      ...persistPaneAccordionState(this.paneAccordionState),
    };
  }
}

function persistZoom(
  defaultZoom: number,
  defaultZoomFitMode: ZoomFitMode | null,
): PersistedEditorEnvironment {
  return {
    ...(defaultZoom === 1 ? {} : { defaultZoom }),
    ...(defaultZoomFitMode == null ? {} : { defaultZoomFitMode }),
  };
}

function persistPaneLayout(
  paneLayout: EditorPaneLayout | null,
): PersistedEditorEnvironment {
  if (paneLayout == null) {
    return {};
  }

  const persistedLayout: EditorPaneLayout = {};

  workspacePaneDefinitions.forEach((definition) => {
    const paneState = paneLayout[definition.id];

    if (
      paneState != null &&
      shouldPersistPaneLayoutState(definition, paneState)
    ) {
      persistedLayout[definition.id] = paneState;
    }
  });

  return Object.keys(persistedLayout).length === 0
    ? {}
    : { paneLayout: persistedLayout };
}

function shouldPersistPaneLayoutState(
  definition: (typeof workspacePaneDefinitions)[number],
  state: NonNullable<EditorPaneLayout[WorkspacePaneId]>,
) {
  if (definition.id === 'developer') {
    return true;
  }

  return (
    state.visible !== definition.defaultVisible ||
    state.edge !== definition.homeEdge ||
    state.floating
  );
}

function persistPaneAccordionState(
  paneAccordionState: PaneAccordionState,
): PersistedEditorEnvironment {
  const persistedState: PaneAccordionState = {};

  workspacePaneDefinitions.forEach((definition) => {
    const openSections = paneAccordionState[definition.id];

    if (
      openSections != null &&
      !arraysHaveSameValues(
        openSections,
        DEFAULT_PANE_ACCORDION_STATE[definition.id] ?? [],
      )
    ) {
      persistedState[definition.id] = openSections;
    }
  });

  return Object.keys(persistedState).length === 0
    ? {}
    : { paneAccordionState: persistedState };
}

function arraysHaveSameValues(a: readonly string[], b: readonly string[]) {
  const values = new Set(a);
  const otherValues = new Set(b);

  return (
    values.size === otherValues.size &&
    [...values].every((value) => otherValues.has(value))
  );
}
