import type { SelectorParam } from 'i18next';

export type PaneEdge = 'top' | 'left' | 'right' | 'bottom';
export type MenuSelector = SelectorParam<'menu'>;

const leftPaneDefaultSize = 240;
const rightPaneDefaultSize = 300;

type WorkspacePaneConfig = {
  allowedEdges: readonly PaneEdge[];
  defaultSize: number;
  defaultVisible: boolean;
  homeEdge: PaneEdge;
  id: string;
  titleSelector: MenuSelector;
};

export const workspacePaneDefinitions = [
  {
    allowedEdges: ['left', 'right'],
    defaultSize: leftPaneDefaultSize,
    defaultVisible: true,
    homeEdge: 'left',
    id: 'neume-selector',
    titleSelector: ($) => $.menu.view.neumeSelector,
  },
  {
    allowedEdges: ['left', 'right'],
    defaultSize: leftPaneDefaultSize,
    defaultVisible: false,
    homeEdge: 'left',
    id: 'common-combos',
    titleSelector: ($) => $.menu.view.commonCombos,
  },
  {
    allowedEdges: ['left', 'right'],
    defaultSize: rightPaneDefaultSize,
    defaultVisible: true,
    homeEdge: 'right',
    id: 'properties',
    titleSelector: ($) => $.menu.view.properties,
  },
  {
    allowedEdges: ['left', 'right'],
    defaultSize: rightPaneDefaultSize,
    defaultVisible: false,
    homeEdge: 'right',
    id: 'selection',
    titleSelector: ($) => $.menu.view.selection,
  },
  {
    allowedEdges: ['left', 'right'],
    defaultSize: rightPaneDefaultSize,
    defaultVisible: false,
    homeEdge: 'right',
    id: 'lyrics',
    titleSelector: ($) => $.menu.view.lyrics,
  },
] as const satisfies readonly WorkspacePaneConfig[];

export type WorkspacePane = (typeof workspacePaneDefinitions)[number];
export type WorkspacePaneId = WorkspacePane['id'];
export type WorkspacePaneVisibility = Record<WorkspacePaneId, boolean>;

export function createDefaultPaneVisibility(): WorkspacePaneVisibility {
  return buildPaneVisibility((pane) => pane.defaultVisible);
}

export function createAllHiddenPaneVisibility(): WorkspacePaneVisibility {
  return buildPaneVisibility(() => false);
}

function buildPaneVisibility(predicate: (pane: WorkspacePane) => boolean) {
  return Object.fromEntries(
    workspacePaneDefinitions.map((pane) => [pane.id, predicate(pane)]),
  ) as WorkspacePaneVisibility;
}
