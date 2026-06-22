<!-- eslint-disable vue/one-component-per-file -->
<script setup lang="ts">
import 'dockview-vue/dist/styles/dockview.css';

import {
  PhArrowSquareIn,
  PhArrowSquareOut,
  PhEye,
  PhX,
} from '@phosphor-icons/vue';
import type {
  ContextMenuItem,
  DockviewGroupPanel,
  EdgeGroupPosition,
  FloatingGroupOptions,
  GetTabContextMenuItemsParams,
  IDockviewHeaderActionsProps,
  IDockviewPanel,
  PanelTransfer,
  Position,
} from 'dockview-core';
import type {
  DockviewApi,
  DockviewReadyEvent,
  DockviewWillDropEvent,
  DockviewWillShowOverlayLocationEvent,
  IDockviewPanelHeaderProps,
  IDockviewPanelProps,
  VueComponent,
} from 'dockview-vue';
import { DockviewVue, themeLight } from 'dockview-vue';
import { useTranslation } from 'i18next-vue';
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  useSlots,
  watch,
} from 'vue';

import { TooltipProvider } from '@/components/ui/tooltip';
import type {
  MenuSelector,
  WorkspacePaneId,
  WorkspacePaneVisibility,
} from '@/models/WorkspacePane';
import {
  createAllHiddenPaneVisibility,
  workspacePaneDefinitions,
} from '@/models/WorkspacePane';

interface PaneDefinition {
  allowedEdges: readonly EdgeGroupPosition[];
  defaultSize: number;
  defaultVisible: boolean;
  homeEdge: EdgeGroupPosition;
  id: string;
  paneId: WorkspacePaneId;
  title: string;
  titleSelector: MenuSelector;
}

interface PaneRegistry {
  byId: ReadonlyMap<string, PaneDefinition>;
  configuredEdges: ReadonlySet<EdgeGroupPosition>;
  defaultSizeByHomeEdge: ReadonlyMap<EdgeGroupPosition, number>;
  homeIndexById: ReadonlyMap<string, number>;
  panes: readonly PaneDefinition[];
}

interface ResolvedPane {
  api: DockviewApi;
  definition: PaneDefinition;
  panel: IDockviewPanel;
}

interface PaneContentParams {
  paneId: WorkspacePaneId;
}

const props = defineProps<{
  developerPaneEnabled: boolean;
  paneLayoutResetCounter: number;
  paneVisibility: WorkspacePaneVisibility;
}>();
const emit = defineEmits<{
  (
    event: 'pane-visibility-change',
    paneId: WorkspacePaneId,
    isVisible: boolean,
  ): void;
}>();

type DockDropEvent =
  | DockviewWillDropEvent
  | DockviewWillShowOverlayLocationEvent;
type PanelDragPayload = PanelTransfer & {
  panelId: string;
};
type DropEventGroup = NonNullable<DockDropEvent['group']>;
type GroupedDropEvent = DockDropEvent & {
  group: DropEventGroup;
  kind: Exclude<DockDropEvent['kind'], 'edge'>;
};
type Disposable = { dispose(): void };

type DraggedPane = {
  definition: PaneDefinition;
  panel: IDockviewPanel;
  sourceEdge: EdgeGroupPosition | null;
  sourceEdgeGroup: DropEventGroup | null;
};

type DropTarget =
  | {
      group: DropEventGroup;
      type: 'center-editor';
    }
  | {
      edge: EdgeGroupPosition;
      group: DropEventGroup;
      type: 'edge-group';
    }
  | {
      edge: EdgeGroupPosition;
      type: 'root-edge';
    }
  | { type: 'content-side' }
  | { type: 'floating-tool-group' }
  | { type: 'unsupported' };

// Dockview exposes no public per-group content-zone API. These structural types cover
// the private content drop targets used to make the editor one center zone.
type InternalDropTarget = {
  setTargetZones(zones: Position[]): void;
};
type InternalGroupContent = {
  dropTarget: InternalDropTarget;
  pointerDropTarget: InternalDropTarget;
};
type InternalGroup = {
  model: {
    contentContainer: InternalGroupContent;
  };
};

type DropDecision =
  | {
      intent: 'allow-native-drop';
    }
  | {
      intent: 'allow-native-drop-and-collapse-source-edge-group';
      sourceEdgeGroup: DropEventGroup;
    }
  | {
      edgeGroupToExpand: DropEventGroup;
      intent: 'allow-native-drop-and-expand-edge-group';
    }
  | {
      draggedItem: DraggedPane;
      intent: 'float-in-center';
      targetGroup: DropEventGroup;
    }
  | {
      draggedItem: DraggedPane;
      intent: 'redock-to-root-edge-group';
      targetEdge: EdgeGroupPosition;
    }
  | { intent: 'reject' };

const centerPanelId = 'workspace-center';
const paneContentComponentId = 'paneContent';
const centerEditorComponentId = 'centerPanel';
const dockEdgePositions = ['top', 'left', 'right', 'bottom'] as const;
const dockviewTabsAndActionsContainerSelector =
  '.dv-tabs-and-actions-container';
const blankGroupDragHandleSelector = '.dv-void-container';
const dockviewFloatingGroupSelector = '.dv-groupview-floating';
// Cap an auto-sized floating pane below the full floatable area so a tall pane
// leaves some breathing room rather than filling edge to edge.
const maxFloatingPaneHeightRatio = 0.75;
// A target with only `center` makes Dockview resolve the full content area to a
// single center overlay/drop, instead of edge split zones around the perimeter.
const centerOnlyDropTargetZones: Position[] = ['center'];
const { i18next, t } = useTranslation();
const paneDefinitions = workspacePaneDefinitions.map((pane) => ({
  allowedEdges: pane.allowedEdges,
  defaultSize: pane.defaultSize,
  defaultVisible: pane.defaultVisible,
  homeEdge: pane.homeEdge,
  id: `workspace-${pane.id}`,
  paneId: pane.id,
  title: getPaneTitle(pane.titleSelector),
  titleSelector: pane.titleSelector,
})) satisfies readonly PaneDefinition[];
const paneRegistry = buildPaneRegistry(paneDefinitions);
const lastDockedEdgeByPanelId = new Map<string, EdgeGroupPosition>(
  paneDefinitions.map((pane) => [pane.id, pane.homeEdge]),
);
const dockviewApi = shallowRef<DockviewApi | null>(null);
const dockLayoutContainerElement = ref<HTMLElement | null>(null);
const slots = useSlots();
let willShowOverlayDisposable: Disposable | null = null;
let blankGroupDragBlockerDisposable: Disposable | null = null;
let paneStateApiDisposables: Disposable[] = [];
const paneStateGroupDisposables = new Map<string, Disposable[]>();
let paneStateAnimationFrame = 0;

function asDockComponent(component: unknown): VueComponent {
  return component as VueComponent;
}

const PaneContent = asDockComponent(
  defineComponent({
    name: 'PaneContent',
    props: {
      params: {
        type: Object as PropType<IDockviewPanelProps>,
        required: true,
      },
    },
    setup(panelProps) {
      const panelApi = panelProps.params.api;
      const paneDefinition = requirePaneDefinition(panelApi.id);
      const contentElement = ref<HTMLElement | null>(null);
      let animationFrame = 0;

      // Auto-size is a one-shot per float: when a pane becomes floating we size the
      // frame once to fit its content, then leave it alone. Floating panes use the same
      // viewport sizing contract as docked panes (the content fills the frame, overflow
      // is hidden, and the pane component owns its own scrolling), so a manual resize
      // is honored instead of being fought by a continuous resize observer snapping the
      // frame back to content height.
      const locationDisposable = panelApi.onDidLocationChange(() => {
        scheduleFloatingPanelAutoSize();
      });

      function scheduleFloatingPanelAutoSize() {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(sizeFloatingPanelToContent);
      }

      function sizeFloatingPanelToContent() {
        const element = contentElement.value;

        if (
          element == null ||
          panelApi.location.type !== 'floating' ||
          panelApi.group.activePanel?.id !== panelApi.id
        ) {
          return;
        }

        const headerElement = panelApi.group.element.querySelector<HTMLElement>(
          dockviewTabsAndActionsContainerSelector,
        );
        const sizeUpdate = getFloatingPaneSizeUpdate(
          paneDefinition,
          panelApi.group.element,
          element,
          headerElement,
        );

        panelApi.setSize(sizeUpdate);
      }

      onMounted(() => {
        scheduleFloatingPanelAutoSize();
      });

      onBeforeUnmount(() => {
        locationDisposable.dispose();
        cancelAnimationFrame(animationFrame);
      });

      return () => {
        const paneId = (panelProps.params.params as PaneContentParams).paneId;

        return h(
          // Dockview mounts panel content through its own renderer, so docked tools
          // need their own tooltip provider instead of relying on the editor tree.
          TooltipProvider,
          { delayDuration: 500, skipDelayDuration: 0 },
          {
            default: () =>
              h(
                'div',
                {
                  ref: contentElement,
                  class: 'workspace-pane-content',
                  'data-editor-shortcuts': 'ignore',
                },
                slots[paneId]?.(),
              ),
          },
        );
      };
    },
  }),
);

const PaneTab = asDockComponent(
  defineComponent({
    name: 'PaneTab',
    props: {
      params: {
        type: Object as PropType<IDockviewPanelHeaderProps>,
        required: true,
      },
    },
    setup(panelProps) {
      const panelApi = panelProps.params.api;
      const title = ref(panelApi.title ?? '');

      const titleDisposable = panelApi.onDidTitleChange((event) => {
        title.value = event.title;
      });

      onBeforeUnmount(() => {
        titleDisposable.dispose();
      });

      return () => {
        return h(
          'div',
          {
            class: 'dv-default-tab',
          },
          [h('div', { class: 'dv-default-tab-content' }, title.value)],
        );
      };
    },
  }),
);

// Workspace tool panes are persistent app surfaces, so header actions hide or collapse
// the active panel instead of using Dockview's default close behavior.
const PaneHeaderActions = asDockComponent(
  defineComponent({
    name: 'PaneHeaderActions',
    props: {
      params: {
        type: Object as PropType<IDockviewHeaderActionsProps>,
        required: true,
      },
    },
    setup(headerProps) {
      const params = shallowRef<IDockviewHeaderActionsProps>(
        headerProps.params,
      );

      watch(
        () => headerProps.params,
        (nextParams) => {
          params.value = {
            ...params.value,
            ...nextParams,
          } as IDockviewHeaderActionsProps;
        },
        { immediate: true },
      );

      function preventHeaderActionDrag(event: PointerEvent) {
        // Header actions sit inside Dockview's draggable header/titlebar area. Stop the
        // pointer event so clicking a button cannot start a group drag.
        event.preventDefault();
        event.stopPropagation();
      }

      function toggleVisibility(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        const activePanel =
          params.value.activePanel ?? params.value.group.activePanel;

        if (activePanel == null) {
          return;
        }

        if (isPanelVisible(activePanel.id, params.value.group)) {
          hidePane(activePanel.id);
        } else {
          showPane(activePanel.id);
        }
      }

      function toggleFloating(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        const activePanel =
          params.value.activePanel ?? params.value.group.activePanel;

        if (activePanel == null) {
          return;
        }

        if (activePanel.api.location.type === 'floating') {
          dockPaneToLastDockedEdge(activePanel.id);
          return;
        }

        floatPane(activePanel, params.value.containerApi);
      }

      return () => {
        if (params.value.group.api.location.type === 'edge') {
          return null;
        }

        const activePanel =
          params.value.activePanel ?? params.value.group.activePanel;

        if (activePanel == null || findPaneDefinition(activePanel.id) == null) {
          return null;
        }

        const isFloatingPanel = activePanel.api.location.type === 'floating';
        const isPanelShown = isPanelVisible(activePanel.id, params.value.group);
        const layoutLabel = t(
          isFloatingPanel
            ? ($) => $.toolbar.workspace.dockPane
            : ($) => $.toolbar.workspace.floatPane,
          { ns: 'toolbar' },
        );
        const visibilityLabel = t(
          isPanelShown
            ? ($) => $.toolbar.workspace.hidePane
            : ($) => $.toolbar.workspace.showPane,
          { ns: 'toolbar' },
        );

        return h('div', { class: 'workspace-pane-header-actions' }, [
          h(
            'button',
            {
              'aria-label': layoutLabel,
              class: 'workspace-pane-header-action',
              onClick: toggleFloating,
              onPointerdown: preventHeaderActionDrag,
              title: layoutLabel,
              type: 'button',
            },
            isFloatingPanel ? h(PhArrowSquareIn) : h(PhArrowSquareOut),
          ),
          h(
            'button',
            {
              'aria-label': visibilityLabel,
              class: 'workspace-pane-header-action',
              onClick: toggleVisibility,
              onPointerdown: preventHeaderActionDrag,
              title: visibilityLabel,
              type: 'button',
            },
            isPanelShown ? h(PhX) : h(PhEye),
          ),
        ]);
      };
    },
  }),
);

const CenterEditor = asDockComponent(
  defineComponent({
    name: 'CenterEditor',
    props: {
      params: {
        type: Object as PropType<IDockviewPanelProps>,
        required: true,
      },
    },
    setup() {
      return () =>
        h('div', { class: 'workspace-center-editor' }, slots.center?.());
    },
  }),
);

const dockComponents: Record<string, VueComponent> = {
  [paneContentComponentId]: PaneContent,
  [centerEditorComponentId]: CenterEditor,
};

function findPaneDefinition(panelId: string) {
  return paneRegistry.byId.get(panelId);
}

function requirePaneDefinition(panelId: string) {
  const definition = findPaneDefinition(panelId);

  if (definition == null) {
    throw new Error(
      `Workspace pane "${panelId}" is expected to be registered.`,
    );
  }

  return definition;
}

function requireDockviewPanel(api: DockviewApi, panelId: string) {
  const panel = api.getPanel(panelId);

  if (panel == null) {
    throw new Error(`Dockview panel "${panelId}" is expected to exist.`);
  }

  return panel;
}

function resolvePane(panelId: string): ResolvedPane | null {
  const api = dockviewApi.value;
  const definition = findPaneDefinition(panelId);

  if (api == null || definition == null) {
    return null;
  }

  return {
    api,
    definition,
    panel: requireDockviewPanel(api, panelId),
  };
}

function assertHomeEdgeAllowed(pane: PaneDefinition) {
  if (pane.allowedEdges.includes(pane.homeEdge)) {
    return;
  }

  throw new Error(
    `Workspace pane "${pane.id}" homeEdge "${pane.homeEdge}" must be included in allowedEdges.`,
  );
}

function assertPaneIdAvailable(pane: PaneDefinition, seenPaneIds: Set<string>) {
  if (pane.id === centerPanelId) {
    throw new Error(
      `Workspace pane id "${pane.id}" is reserved for the editor center panel.`,
    );
  }

  if (!seenPaneIds.has(pane.id)) {
    seenPaneIds.add(pane.id);
    return;
  }

  throw new Error(`Workspace pane id "${pane.id}" is duplicated.`);
}

function buildPaneRegistry(panes: readonly PaneDefinition[]): PaneRegistry {
  const byId = new Map<string, PaneDefinition>();
  const configuredEdges = new Set<EdgeGroupPosition>();
  const defaultSizeByHomeEdge = new Map<EdgeGroupPosition, number>();
  const homeIndexById = new Map<string, number>();
  const nextHomeIndexByEdge = new Map<EdgeGroupPosition, number>();
  const seenPaneIds = new Set<string>();

  panes.forEach((pane) => {
    assertHomeEdgeAllowed(pane);
    assertPaneIdAvailable(pane, seenPaneIds);

    byId.set(pane.id, pane);
    pane.allowedEdges.forEach((edge) => configuredEdges.add(edge));
    homeIndexById.set(pane.id, nextHomeIndexByEdge.get(pane.homeEdge) ?? 0);
    nextHomeIndexByEdge.set(
      pane.homeEdge,
      (nextHomeIndexByEdge.get(pane.homeEdge) ?? 0) + 1,
    );

    if (!defaultSizeByHomeEdge.has(pane.homeEdge)) {
      defaultSizeByHomeEdge.set(pane.homeEdge, pane.defaultSize);
    }
  });

  return {
    byId,
    configuredEdges,
    defaultSizeByHomeEdge,
    homeIndexById,
    panes,
  };
}

function getPaneTitle(titleSelector: MenuSelector) {
  return t(titleSelector, { ns: 'menu' });
}

function updatePaneTitles() {
  const api = dockviewApi.value;

  paneRegistry.panes.forEach((pane) => {
    const title = getPaneTitle(pane.titleSelector);
    pane.title = title;
    api?.getPanel(pane.id)?.api.setTitle(title);
  });
}

function getEdgeGroupId(side: EdgeGroupPosition) {
  return `workspace-edge-${side}`;
}

function findEdgeGroup(side: EdgeGroupPosition, api: DockviewApi) {
  const group = api.getGroup(getEdgeGroupId(side)) as
    | DockviewGroupPanel
    | undefined;

  if (group == null) {
    return undefined;
  }

  const location = group.api.location;

  if (location.type === 'edge' && location.position === side) {
    return group;
  }

  throw new Error(
    `Workspace edge group "${getEdgeGroupId(side)}" is expected to be registered on edge "${side}".`,
  );
}

function getDefaultEdgeGroupSize(side: EdgeGroupPosition) {
  return (
    paneRegistry.defaultSizeByHomeEdge.get(side) ??
    (side === 'top' || side === 'bottom' ? 64 : 240)
  );
}

function rememberPaneDockedEdge(
  panelId: string,
  edge: EdgeGroupPosition | null,
) {
  const definition = findPaneDefinition(panelId);

  if (definition == null || edge == null) {
    return;
  }

  if (!definition.allowedEdges.includes(edge)) {
    return;
  }

  lastDockedEdgeByPanelId.set(panelId, edge);
}

function rememberPanelCurrentOrPreviousDockedEdge(
  panel: IDockviewPanel,
  previousGroup?: DockviewGroupPanel,
) {
  const currentEdge = getGroupEdge(panel.group);

  if (currentEdge != null) {
    rememberPaneDockedEdge(panel.id, currentEdge);
    return;
  }

  if (previousGroup != null) {
    rememberPaneDockedEdge(panel.id, getGroupEdge(previousGroup));
  }
}

function getPreferredDockEdge(panelId: string, definition: PaneDefinition) {
  const rememberedEdge = lastDockedEdgeByPanelId.get(panelId);

  return rememberedEdge != null &&
    definition.allowedEdges.includes(rememberedEdge)
    ? rememberedEdge
    : definition.homeEdge;
}

function ensureEdgeGroup(side: EdgeGroupPosition, api: DockviewApi) {
  const group = findEdgeGroup(side, api);

  if (group != null) {
    return group;
  }

  api.addEdgeGroup(side, {
    // Edge groups are available immediately, but should not open until a pane is shown.
    collapsed: true,
    id: getEdgeGroupId(side),
    // Pane configs own initial sizes; Dockview's generic defaults are too broad here.
    initialSize: getDefaultEdgeGroupSize(side),
    minimumSize: side === 'top' || side === 'bottom' ? 48 : 160,
  });

  return findEdgeGroup(side, api) as DockviewGroupPanel;
}

function ensureCenterEditorPanel(api: DockviewApi) {
  const centerPanel =
    api.getPanel(centerPanelId) ??
    api.addPanel({
      id: centerPanelId,
      component: centerEditorComponentId,
      // Do NOT set renderer: 'always' (or a defaultRenderer on <DockviewVue>). Print
      // relies on the editor living in .dv-content-container (Dockview's default
      // onlyWhenVisible renderer), not the .dv-render-overlay portal, which the @media
      // print block at the bottom of this file hides. Switching to 'always' silently
      // makes the score print blank.
    });

  // The center panel is the permanent editor surface, not a visible tab target. Keep it
  // unlocked so Dockview can emit content drops; the content targets are constrained
  // separately so those drops all report as center.
  centerPanel.group.header.hidden = true;
  restrictEditorDropZonesToCenter(centerPanel.group);

  return centerPanel;
}

function restrictEditorDropZonesToCenter(group: DockviewGroupPanel) {
  const contentContainer = (group as unknown as InternalGroup).model
    .contentContainer;

  // Private Dockview reach-in: collapse the editor group's content drop targets to one
  // center zone so the overlay and drop position match the float action.
  contentContainer.dropTarget.setTargetZones(centerOnlyDropTargetZones);
  contentContainer.pointerDropTarget.setTargetZones(centerOnlyDropTargetZones);
}

function addToolPane(
  pane: PaneDefinition,
  api: DockviewApi,
  centerPanel: IDockviewPanel,
  edge: EdgeGroupPosition = pane.homeEdge,
) {
  const group = ensureEdgeGroup(edge, api);

  const addInactive = group.activePanel != null;

  api.addPanel({
    id: pane.id,
    component: paneContentComponentId,
    ...(pane.homeEdge === 'left' || pane.homeEdge === 'right'
      ? { initialWidth: pane.defaultSize }
      : { initialHeight: pane.defaultSize }),
    ...(addInactive ? { inactive: true } : {}),
    params: { paneId: pane.paneId },
    position: {
      referenceGroup: group,
    },
    title: pane.title,
  });

  if (pane.defaultVisible && edge === pane.homeEdge) {
    group.api.expand();
  }

  // addPanel can activate the edge group; restore the editor surface as the active
  // Dockview panel after drawer initialization.
  centerPanel.api.setActive();
}

function syncDeveloperPanePresence(enabled: boolean, api: DockviewApi) {
  const developerPane = paneRegistry.byId.get('workspace-developer');

  if (developerPane == null) {
    return;
  }

  const existingPanel = api.getPanel(developerPane.id);

  if (!enabled) {
    if (existingPanel != null) {
      rememberPanelCurrentOrPreviousDockedEdge(existingPanel);
      api.removePanel(existingPanel);
    }
    return;
  }

  if (existingPanel != null) {
    return;
  }

  addToolPane(
    developerPane,
    api,
    ensureCenterEditorPanel(api),
    developerPane.homeEdge,
  );
}

function activateSiblingPane(group: DockviewGroupPanel, panelId: string) {
  const siblingPanel = group.panels.find(
    (panel) => panel.id !== panelId && findPaneDefinition(panel.id) != null,
  );

  if (siblingPanel == null) {
    return false;
  }

  siblingPanel.api.setActive();
  return true;
}

function emitPaneVisibilityChange(
  paneId: WorkspacePaneId,
  isVisible: boolean,
  emitChange: boolean,
) {
  if (!emitChange) {
    return;
  }

  if (lastEmittedPaneVisibility?.[paneId] === isVisible) {
    return;
  }

  if (lastEmittedPaneVisibility != null) {
    lastEmittedPaneVisibility = {
      ...lastEmittedPaneVisibility,
      [paneId]: isVisible,
    };
  }

  emit('pane-visibility-change', paneId, isVisible);
}

function hidePane(panelId: string, emitChange = true) {
  const resolvedPanel = resolvePane(panelId);

  if (resolvedPanel == null) {
    return;
  }

  const { api, definition, panel } = resolvedPanel;

  // Workspace hide collapses the drawer, rather than using Dockview's default per-panel
  // close behavior. Collapsing the edge group avoids pretending an inactive sibling
  // means the clicked panel was hidden.
  if (panel.api.location.type === 'edge') {
    rememberPanelCurrentOrPreviousDockedEdge(panel);
    panel.group.api.collapse();
    emitPaneVisibilityChange(definition.paneId, false, emitChange);
    return;
  }

  const targetEdge = getPreferredDockEdge(panel.id, definition);
  const targetGroup = ensureEdgeGroup(targetEdge, api);

  // Dockview moveTo mutates panel/group ownership synchronously and may fire layout
  // events. Keep this hide sequence inline: move inactive, then decide whether a
  // sibling should stay active or the destination drawer should close.
  panel.api.moveTo({
    group: targetGroup,
    skipSetActive: true,
  });

  rememberPaneDockedEdge(panel.id, targetEdge);

  if (!activateSiblingPane(targetGroup, panel.id)) {
    targetGroup.api.collapse();
  }

  emitPaneVisibilityChange(definition.paneId, false, emitChange);
}

function showPane(panelId: string, emitChange = true) {
  const resolvedPanel = resolvePane(panelId);

  if (resolvedPanel == null) {
    return;
  }

  const { definition, panel } = resolvedPanel;

  // Skip redundant activation: Dockview remounts panel content DOM on every setActive
  // (even for the already-active panel), which swallows in-flight pointer clicks.
  // Replaying requested visibility should not mutate the active tab/group when Dockview
  // already satisfies that request.
  if (panel.group.activePanel !== panel) {
    panel.api.setActive();
  }

  if (panel.api.location.type === 'edge') {
    panel.group.api.expand();
  }

  emitPaneVisibilityChange(definition.paneId, true, emitChange);
}

function computePaneVisibility(): WorkspacePaneVisibility {
  const visibility = createAllHiddenPaneVisibility();
  const api = dockviewApi.value;

  if (api == null) {
    return visibility;
  }

  paneRegistry.panes.forEach((definition) => {
    const panel = api.getPanel(definition.id);

    if (panel == null || !isPanelVisible(panel.id, panel.group)) {
      return;
    }

    visibility[definition.paneId] = true;
  });

  return visibility;
}

let lastEmittedPaneVisibility: WorkspacePaneVisibility | null = null;

function emitPaneVisibilityState() {
  const visibility = computePaneVisibility();
  const previousVisibility = lastEmittedPaneVisibility;
  lastEmittedPaneVisibility = visibility;

  paneRegistry.panes.forEach((pane) => {
    const isVisible = visibility[pane.paneId];

    if (
      previousVisibility == null ||
      previousVisibility[pane.paneId] !== isVisible
    ) {
      emit('pane-visibility-change', pane.paneId, isVisible);
    }
  });
}

function scheduleVisibilityStateEmit() {
  if (paneStateAnimationFrame !== 0) {
    return;
  }

  paneStateAnimationFrame = requestAnimationFrame(() => {
    paneStateAnimationFrame = 0;
    emitPaneVisibilityState();
  });
}

function disposeStateListeners() {
  cancelAnimationFrame(paneStateAnimationFrame);
  paneStateAnimationFrame = 0;
  paneStateApiDisposables.forEach((disposable) => disposable.dispose());
  paneStateApiDisposables = [];
  paneStateGroupDisposables.forEach((disposables) => {
    disposables.forEach((disposable) => disposable.dispose());
  });
  paneStateGroupDisposables.clear();
}

function disposeGroupStateListeners(groupId: string) {
  const disposables = paneStateGroupDisposables.get(groupId);

  if (disposables == null) {
    return;
  }

  disposables.forEach((disposable) => disposable.dispose());
  paneStateGroupDisposables.delete(groupId);
}

function watchGroupState(group: DockviewGroupPanel) {
  if (paneStateGroupDisposables.has(group.id)) {
    return;
  }

  paneStateGroupDisposables.set(group.id, [
    group.api.onDidActivePanelChange(() => scheduleVisibilityStateEmit()),
    group.api.onDidCollapsedChange(() => scheduleVisibilityStateEmit()),
    group.api.onDidLocationChange(() => scheduleVisibilityStateEmit()),
  ]);
}

function installStateListeners(api: DockviewApi) {
  disposeStateListeners();

  api.groups.forEach((group) => watchGroupState(group));
  paneStateApiDisposables.push(
    api.onDidAddGroup((group) => {
      watchGroupState(group);
      scheduleVisibilityStateEmit();
    }),
    api.onDidRemoveGroup((group) => {
      disposeGroupStateListeners(group.id);
      scheduleVisibilityStateEmit();
    }),
    api.onDidMovePanel((event) => {
      rememberPanelCurrentOrPreviousDockedEdge(event.panel, event.from);
      scheduleVisibilityStateEmit();
    }),
    api.onDidActivePanelChange(() => scheduleVisibilityStateEmit()),
  );
}

function applyPaneVisibility(visibility: WorkspacePaneVisibility) {
  const api = dockviewApi.value;

  if (api == null) {
    return;
  }

  syncDeveloperPanePresence(props.developerPaneEnabled, api);

  const visibleAtStart = computePaneVisibility();
  const panesToShow = paneRegistry.panes.filter(
    (pane) => visibility[pane.paneId] && !visibleAtStart[pane.paneId],
  );
  const panesToHide = paneRegistry.panes.filter(
    (pane) => !visibility[pane.paneId] && visibleAtStart[pane.paneId],
  );

  panesToShow.forEach((pane) => showPane(pane.id, false));
  panesToHide.forEach((pane) => {
    const { panel } = resolvePane(pane.id)!;

    if (isPanelVisible(panel.id, panel.group)) {
      hidePane(pane.id, false);
    }
  });
}

function resetLayout() {
  const api = dockviewApi.value;

  if (api == null) {
    return;
  }

  syncDeveloperPanePresence(props.developerPaneEnabled, api);

  paneRegistry.panes.forEach((paneDefinition) => {
    const panel = api.getPanel(paneDefinition.id);

    if (panel == null) {
      return;
    }

    const homeGroup = ensureEdgeGroup(paneDefinition.homeEdge, api);
    const homeIndex = paneRegistry.homeIndexById.get(paneDefinition.id);

    if (homeIndex == null) {
      throw new Error(
        `Workspace pane "${paneDefinition.id}" is missing a home index.`,
      );
    }

    if (
      panel.group !== homeGroup ||
      panel.group.panels.indexOf(panel) !== homeIndex
    ) {
      panel.api.moveTo({
        group: homeGroup,
        index: homeIndex,
        skipSetActive: true,
      });
    }

    rememberPaneDockedEdge(panel.id, paneDefinition.homeEdge);
  });

  applyPaneVisibility(props.paneVisibility);
  ensureCenterEditorPanel(api).api.setActive();
}

function dockPaneToLastDockedEdge(panelId: string) {
  const resolvedPanel = resolvePane(panelId);

  if (resolvedPanel == null) {
    return;
  }

  const { api, definition, panel } = resolvedPanel;
  const targetEdge = getPreferredDockEdge(panel.id, definition);
  const targetGroup = ensureEdgeGroup(targetEdge, api);

  // Keep this separate from hidePane. Docking from the menu should use Dockview's
  // normal activation, while hide intentionally skips activation and may collapse the
  // drawer.
  panel.api.moveTo({
    group: targetGroup,
  });
  rememberPaneDockedEdge(panel.id, targetEdge);
  targetGroup.api.expand();
  emit('pane-visibility-change', definition.paneId, true);
}

function floatPane(panel: IDockviewPanel, api: DockviewApi) {
  const definition = requirePaneDefinition(panel.id);
  const sourceEdgeGroup = getSourceEdgeGroup(panel);

  rememberPanelCurrentOrPreviousDockedEdge(panel);
  api.addFloatingGroup(panel, getInitialFloatingPaneSize(panel, definition));
  collapseSourceEdgeGroup(sourceEdgeGroup);
}

function isEdgeGroupCollapsed(group: DockviewGroupPanel) {
  const location = group.api.location;

  return location.type === 'edge' && group.api.isCollapsed();
}

function isPanelVisible(
  panelId: string,
  group: DropEventGroup,
  isCollapsed = isEdgeGroupCollapsed(group),
) {
  const location = group.api.location;

  return (
    group.activePanel?.id === panelId &&
    (location.type !== 'edge' || !isCollapsed)
  );
}

function isContextMenuPanelVisible(
  panel: GetTabContextMenuItemsParams['panel'],
) {
  return isPanelVisible(panel.id, panel.group);
}

function buildPaneMenuItems(
  panel: IDockviewPanel,
  api: DockviewApi,
): ContextMenuItem[] {
  const panelDefinition = findPaneDefinition(panel.id);

  if (panelDefinition == null) {
    return [];
  }

  const items: ContextMenuItem[] = [];

  // Workspace tools are persistent panes; this menu exposes app-level drawer actions
  // instead of Dockview's default close/remove-oriented commands.
  if (panel.api.location.type === 'floating') {
    items.push({
      label: t(($) => $.toolbar.workspace.dockPane, { ns: 'toolbar' }),
      action: () => dockPaneToLastDockedEdge(panel.id),
    });
  } else {
    items.push({
      label: t(($) => $.toolbar.workspace.floatPane, { ns: 'toolbar' }),
      action: () => floatPane(panel, api),
    });
  }

  if (isContextMenuPanelVisible(panel)) {
    items.push({
      label: t(($) => $.toolbar.workspace.hidePane, { ns: 'toolbar' }),
      action: () => hidePane(panel.id),
    });
  } else {
    items.push({
      label: t(($) => $.toolbar.workspace.showPane, { ns: 'toolbar' }),
      action: () => showPane(panel.id),
    });
  }

  return items;
}

function onTabContextMenu(
  params: GetTabContextMenuItemsParams,
): ContextMenuItem[] {
  return buildPaneMenuItems(params.panel, params.api);
}

function initializeLayout(api: DockviewApi) {
  const centerPanel = ensureCenterEditorPanel(api);

  paneRegistry.configuredEdges.forEach((direction) =>
    ensureEdgeGroup(direction, api),
  );
  paneRegistry.panes.forEach((panel) => {
    if (panel.paneId === 'developer' && !props.developerPaneEnabled) {
      return;
    }

    addToolPane(panel, api, centerPanel);
  });
}

function onDockviewReady(event: DockviewReadyEvent) {
  dockviewApi.value = event.api;
  installBlankGroupDragBlockers();
  willShowOverlayDisposable?.dispose();
  // dockview-vue does not emit this event, but the core API does; we need it so
  // rejected zones do not show a misleading drop overlay.
  willShowOverlayDisposable = event.api.onWillShowOverlay(
    onDockviewWillShowOverlay,
  );

  initializeLayout(event.api);
  applyPaneVisibility(props.paneVisibility);
  installStateListeners(event.api);
  emitPaneVisibilityState();
}

function onDockviewWillShowOverlay(
  event: DockviewWillShowOverlayLocationEvent,
) {
  const dragData = event.getData();
  const dropResolution = decideDrop(event, dragData);

  // Preventing the overlay also prevents Dockview from accepting that drop.
  if (dropResolution.intent === 'reject') {
    event.preventDefault();
  }
}

function onDockviewWillDrop(event: DockviewWillDropEvent) {
  const dragData = event.getData();
  const dropResolution = decideDrop(event, dragData);

  if (dropResolution.intent === 'reject') {
    event.preventDefault();
    return;
  }

  if (dropResolution.intent === 'float-in-center') {
    event.preventDefault();
    floatPaneAtDropPoint(
      event,
      dropResolution.draggedItem,
      dropResolution.targetGroup,
    );
    return;
  }

  if (dropResolution.intent === 'allow-native-drop-and-expand-edge-group') {
    scheduleEdgeGroupExpansion(dropResolution.edgeGroupToExpand);
    return;
  }

  if (dropResolution.intent === 'allow-native-drop') {
    return;
  }

  if (
    dropResolution.intent === 'allow-native-drop-and-collapse-source-edge-group'
  ) {
    scheduleSourceEdgeGroupCollapse(dropResolution.sourceEdgeGroup);
    return;
  }

  if (dropResolution.intent === 'redock-to-root-edge-group') {
    event.preventDefault();
    redockPaneToEdge(
      event,
      dropResolution.targetEdge,
      dropResolution.draggedItem,
    );
  }
}

function resolveDraggedPane(
  event: DockDropEvent,
  dragData: PanelDragPayload,
  definition: PaneDefinition,
): DraggedPane {
  const panel = requireDockviewPanel(event.api, dragData.panelId);
  const sourceEdgeGroup = getSourceEdgeGroup(panel);

  return {
    definition,
    panel,
    sourceEdge: sourceEdgeGroup == null ? null : getGroupEdge(sourceEdgeGroup),
    sourceEdgeGroup,
  };
}

function getGroupEdge(group: DropEventGroup): EdgeGroupPosition | null {
  const location = group.api.location;

  return location.type === 'edge' ? location.position : null;
}

function getSourceEdgeGroup(panel: IDockviewPanel): DropEventGroup | null {
  return panel.group.api.location.type === 'edge' ? panel.group : null;
}

function collapseSourceEdgeGroup(group: DropEventGroup | null) {
  if (group == null || group.api.location.type !== 'edge') {
    return;
  }

  group.api.collapse();
}

function scheduleSourceEdgeGroupCollapse(group: DropEventGroup) {
  queueMicrotask(() => collapseSourceEdgeGroup(group));
}

function isEdgeDirection(
  position: DockDropEvent['position'],
): position is EdgeGroupPosition {
  return dockEdgePositions.includes(position as EdgeGroupPosition);
}

function isPaneAllowedOnEdge(
  draggedItem: DraggedPane,
  targetEdge: EdgeGroupPosition,
) {
  return draggedItem.definition.allowedEdges.includes(targetEdge);
}

function isPanelDragPayload(
  dragData: PanelTransfer,
): dragData is PanelDragPayload {
  return dragData.panelId != null;
}

function getDraggedPaneDefinition(panelId: string) {
  if (panelId === centerPanelId) {
    return null;
  }

  return findPaneDefinition(panelId) ?? null;
}

function isGroupedDropEvent(event: DockDropEvent): event is GroupedDropEvent {
  // Dockview root drops are the only group-less drop events. Every tab, header-space,
  // and content target is constructed with its DockviewGroupPanel.
  return event.kind !== 'edge';
}

function isCenterEditorGroup(group: DropEventGroup) {
  return group.panels.some((panel) => panel.id === centerPanelId);
}

function isFloatingGroupTarget(event: GroupedDropEvent, group: DropEventGroup) {
  if (isCenterEditorGroup(group)) {
    return false;
  }

  if (group.api.location.type !== 'floating') {
    return false;
  }

  return (
    event.kind === 'tab' ||
    event.kind === 'header_space' ||
    (event.kind === 'content' && event.position === 'center')
  );
}

function classifyGroupedDropTarget(event: GroupedDropEvent): DropTarget {
  const targetGroup = event.group;

  if (event.kind === 'content' && event.position !== 'center') {
    return { type: 'content-side' };
  }

  if (event.kind === 'content' && isCenterEditorGroup(targetGroup)) {
    return { group: targetGroup, type: 'center-editor' };
  }

  if (targetGroup.api.location.type === 'edge') {
    return {
      edge: targetGroup.api.location.position,
      group: targetGroup,
      type: 'edge-group',
    };
  }

  if (isFloatingGroupTarget(event, targetGroup)) {
    return { type: 'floating-tool-group' };
  }

  return { type: 'unsupported' };
}

function classifyDropTarget(event: DockDropEvent): DropTarget {
  if (isGroupedDropEvent(event)) {
    return classifyGroupedDropTarget(event);
  }

  return isEdgeDirection(event.position)
    ? { edge: event.position, type: 'root-edge' }
    : { type: 'unsupported' };
}

function isSameGroupNoopDrop(
  event: DockDropEvent,
  dropTarget: DropTarget,
  dragData: PanelDragPayload,
) {
  return (
    'group' in dropTarget &&
    dropTarget.group.id === dragData.groupId &&
    event.kind === 'content' &&
    event.position === 'center'
  );
}

function decideDrop(
  event: DockDropEvent,
  dragData: PanelTransfer | undefined,
): DropDecision {
  if (dragData == null) {
    // This workspace only accepts internal Dockview panel drags; external or unknown
    // payloads would otherwise fall through to generic Dockview rules.
    return { intent: 'reject' };
  }

  if (dragData.viewId !== event.api.id) {
    // Dockview scopes its native DnD behavior by viewId. Keep custom handlers under the
    // same boundary before resolving local panel/group ids.
    return { intent: 'reject' };
  }

  if (!isPanelDragPayload(dragData)) {
    // Dockview uses null panel ids for whole-group and tab-group transfers. Keep
    // workspace rearrangement focused on explicit single-tab drags.
    return { intent: 'reject' };
  }

  const paneDefinition = getDraggedPaneDefinition(dragData.panelId);

  if (paneDefinition == null) {
    // Any unknown/non-workspace drop would fall back to Dockview's generic layout
    // behavior, which can create groups/splits outside this workspace's rules.
    return { intent: 'reject' };
  }

  const draggedItem = resolveDraggedPane(event, dragData, paneDefinition);
  const dropTarget = classifyDropTarget(event);

  if (isSameGroupNoopDrop(event, dropTarget, dragData)) {
    // Dockview reports same-group center content drops as valid targets, but they are
    // no-ops in this workspace.
    return { intent: 'reject' };
  }

  switch (dropTarget.type) {
    case 'center-editor':
      // Any tool tab dropped on the editor center floats over the score surface.
      return {
        draggedItem,
        intent: 'float-in-center',
        targetGroup: dropTarget.group,
      };
    case 'content-side':
      // Dockview side-zone content drops split groups into adjacent panes. Workspace
      // tools are always tabs, so side-zone content drops are never valid.
      return { intent: 'reject' };
    case 'root-edge':
      if (draggedItem.sourceEdge === dropTarget.edge) {
        // A drop from an edge group back onto the same root edge is just Dockview
        // spelling a no-op as a root-edge drop.
        return { intent: 'reject' };
      }

      if (!isPaneAllowedOnEdge(draggedItem, dropTarget.edge)) {
        return { intent: 'reject' };
      }

      // Dockview's root-edge default creates grid splits. We only enable that root
      // target so collapsed workspace edge groups can receive redocked tools.
      return {
        draggedItem,
        intent: 'redock-to-root-edge-group',
        targetEdge: dropTarget.edge,
      };
    case 'edge-group':
      if (!isPaneAllowedOnEdge(draggedItem, dropTarget.edge)) {
        // Dockview would allow any panel in any edge group; workspace tools declare
        // their legal edge directions explicitly.
        return { intent: 'reject' };
      }

      return {
        edgeGroupToExpand: dropTarget.group,
        intent: 'allow-native-drop-and-expand-edge-group',
      };
    case 'floating-tool-group':
      if (draggedItem.sourceEdgeGroup != null) {
        return {
          intent: 'allow-native-drop-and-collapse-source-edge-group',
          sourceEdgeGroup: draggedItem.sourceEdgeGroup,
        };
      }

      return { intent: 'allow-native-drop' };
    case 'unsupported':
      return { intent: 'reject' };
  }
}

function floatPaneAtDropPoint(
  event: DockviewWillDropEvent,
  draggedItem: DraggedPane,
  targetGroup: DropEventGroup,
) {
  rememberPaneDockedEdge(draggedItem.panel.id, draggedItem.sourceEdge);
  event.api.addFloatingGroup(
    draggedItem.panel,
    toFloatingGroupOptions(event, targetGroup, draggedItem),
  );
  collapseSourceEdgeGroup(draggedItem.sourceEdgeGroup);
}

function toFloatingGroupOptions(
  event: DockviewWillDropEvent,
  targetGroup: DropEventGroup,
  draggedItem: DraggedPane,
): FloatingGroupOptions {
  const coordinateRoot = targetGroup.element
    .closest('.dv-shell')!
    .querySelector<HTMLElement>('.dv-floating-overlay-host')!;

  const { left, top } = coordinateRoot.getBoundingClientRect();

  return {
    ...getInitialFloatingPaneSize(draggedItem.panel, draggedItem.definition),
    x: event.nativeEvent.clientX - left,
    y: event.nativeEvent.clientY - top,
  };
}

function getInitialFloatingPaneSize(
  panel: IDockviewPanel,
  pane: PaneDefinition,
): FloatingGroupOptions {
  // Height is left to the one-shot auto-size, which fits the frame to content once the
  // pane has floated (see getFloatingPaneHeightUpdate).
  return {
    width: getInitialFloatingPaneWidth(panel, pane),
  };
}

function getFloatingPaneSizeUpdate(
  pane: PaneDefinition,
  groupElement: HTMLElement,
  contentElement: HTMLElement,
  headerElement: HTMLElement | null,
) {
  return {
    ...getFloatingPaneWidthUpdate(
      pane,
      groupElement,
      contentElement,
      headerElement,
    ),
    ...clampFloatingPaneHeight(
      getFloatingPaneHeightUpdate(contentElement, headerElement),
      groupElement,
    ),
  };
}

function getFloatingPaneWidthUpdate(
  pane: PaneDefinition,
  groupElement: HTMLElement,
  contentElement: HTMLElement,
  headerElement: HTMLElement | null,
) {
  const defaultWidth = pane.defaultSize;
  const desiredWidth = Math.ceil(
    Math.max(
      defaultWidth,
      contentElement.scrollWidth +
        getFloatingPaneHorizontalChromeWidth(groupElement, contentElement),
      headerElement?.scrollWidth ?? 0,
    ),
  );

  if (desiredWidth <= getCurrentFloatingPaneWidth(groupElement)) {
    return {};
  }

  return { width: desiredWidth };
}

function getFloatingPaneHeightUpdate(
  contentElement: HTMLElement,
  headerElement: HTMLElement | null,
) {
  return {
    height: Math.ceil(
      measureNaturalContentHeight(contentElement) +
        (headerElement?.getBoundingClientRect().height ?? 0),
    ),
  };
}

function clampFloatingPaneHeight(
  heightUpdate: { height: number },
  groupElement: HTMLElement,
) {
  // Tall content (e.g. the full Neume Selector) must not open a floating window taller
  // than the area it can float in; the pane scrolls internally instead.
  return {
    height: Math.min(
      heightUpdate.height,
      getMaxFloatingPaneHeight(groupElement),
    ),
  };
}

function getMaxFloatingPaneHeight(groupElement: HTMLElement) {
  const overlayHost = groupElement
    .closest('.dv-shell')
    ?.querySelector<HTMLElement>('.dv-floating-overlay-host');
  const availableHeight =
    overlayHost?.getBoundingClientRect().height ?? window.innerHeight;

  return Math.floor(availableHeight * maxFloatingPaneHeightRatio);
}

function measureNaturalContentHeight(contentElement: HTMLElement) {
  // Floating pane content fills its frame (height:100%), so a plain scrollHeight read
  // would report the frame height. Temporarily lift the height constraint to measure
  // the content's natural height. This is synchronous (no paint between mutation and
  // restore), so it never flashes.
  const previousInlineHeight = contentElement.style.height;
  contentElement.style.height = 'auto';
  const naturalHeight = contentElement.scrollHeight;
  contentElement.style.height = previousInlineHeight;

  return naturalHeight;
}

function getFloatingPaneHorizontalChromeWidth(
  groupElement: HTMLElement,
  contentElement: HTMLElement,
) {
  const groupWidth = Math.ceil(groupElement.getBoundingClientRect().width);
  const contentWidth = Math.ceil(contentElement.getBoundingClientRect().width);

  return Math.max(0, groupWidth - contentWidth);
}

function getInitialFloatingPaneWidth(
  panel: IDockviewPanel,
  pane: PaneDefinition,
) {
  const defaultWidth = pane.defaultSize;
  const currentGroupWidth = Math.ceil(
    panel.group.element.getBoundingClientRect().width,
  );

  return Math.max(defaultWidth, currentGroupWidth);
}

function getCurrentFloatingPaneWidth(groupElement: HTMLElement) {
  const overlayElement = groupElement.closest<HTMLElement>(
    '.dv-resize-container',
  );
  const measuredElement = overlayElement ?? groupElement;
  const styleWidth = Number.parseFloat(measuredElement.style.width);

  if (Number.isFinite(styleWidth)) {
    return Math.ceil(styleWidth);
  }

  return Math.ceil(measuredElement.getBoundingClientRect().width);
}

function redockPaneToEdge(
  event: DockviewWillDropEvent,
  targetEdge: EdgeGroupPosition,
  draggedItem: DraggedPane,
) {
  const targetGroup = ensureEdgeGroup(targetEdge, event.api);

  // Root-edge drops are not accepted directly because Dockview's default would split
  // the center grid. Move the dragged panel into our permanent edge group instead.
  // Resolve the stable destination before moveTo; after moveTo, only use this permanent
  // edge group, not source panel/group references that may have moved.
  draggedItem.panel.api.moveTo({
    group: targetGroup,
  });

  rememberPaneDockedEdge(draggedItem.panel.id, targetEdge);
  targetGroup.api.expand();
}

function scheduleEdgeGroupExpansion(group: DropEventGroup) {
  queueMicrotask(() => {
    group.api.expand();
  });
}

function isBlankGroupDragHandle(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target.closest(blankGroupDragHandleSelector) != null &&
    target.closest(dockviewFloatingGroupSelector) == null
  );
}

function blockBlankGroupDrag(event: Event) {
  if (!isBlankGroupDragHandle(event.target)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

function installBlankGroupDragBlockers() {
  const container = dockLayoutContainerElement.value;

  blankGroupDragBlockerDisposable?.dispose();

  if (container == null) {
    blankGroupDragBlockerDisposable = null;
    return;
  }

  const options: AddEventListenerOptions = { capture: true };
  const eventTypes = ['pointerdown', 'dragstart'] as const;

  eventTypes.forEach((eventType) => {
    container.addEventListener(eventType, blockBlankGroupDrag, options);
  });

  blankGroupDragBlockerDisposable = {
    dispose() {
      eventTypes.forEach((eventType) => {
        container.removeEventListener(eventType, blockBlankGroupDrag, options);
      });
    },
  };
}

onBeforeUnmount(() => {
  willShowOverlayDisposable?.dispose();
  willShowOverlayDisposable = null;
  blankGroupDragBlockerDisposable?.dispose();
  blankGroupDragBlockerDisposable = null;
  disposeStateListeners();
  dockviewApi.value = null;
});

watch(
  () => props.paneVisibility,
  (paneVisibility) => applyPaneVisibility(paneVisibility),
  { deep: true, flush: 'post' },
);

watch(
  () => props.paneLayoutResetCounter,
  () => resetLayout(),
  { flush: 'post' },
);

watch(
  () => i18next.language,
  () => updatePaneTitles(),
  { flush: 'post' },
);
</script>

<template>
  <div ref="dockLayoutContainerElement" class="workspace-dock-layout-container">
    <!-- Root edge DnD uses Dockview's default overlay, but root drops are
    intercepted in decideDrop so tools redock into permanent edge
    groups instead of Dockview's default grid splits. -->
    <!-- Pointer DnD is kept for consistent panel dragging. Whole-group drags
    from Dockview's blank header handle are blocked in this wrapper. -->
    <!-- The theme is explicit because Dockview's fallback is a dark Abyss theme. -->
    <DockviewVue
      class="workspace-dock-layout"
      :components="dockComponents"
      :default-tab-component="PaneTab"
      :get-tab-context-menu-items="onTabContextMenu"
      :right-header-actions-component="PaneHeaderActions"
      dnd-strategy="pointer"
      scrollbars="native"
      :theme="themeLight"
      @ready="onDockviewReady"
      @will-drop="onDockviewWillDrop"
    />
  </div>
</template>

<style scoped>
.workspace-dock-layout-container {
  display: flex;
}

.workspace-dock-layout-container,
.workspace-dock-layout {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.workspace-dock-layout,
.workspace-dock-layout-container :deep(.dv-shell),
.workspace-dock-layout-container :deep(.dv-floating-overlay-host),
.workspace-dock-layout-container :deep(.dv-render-overlay),
.workspace-dock-layout-container :deep(.dv-resize-container) {
  /*
   * Dockview defaults floating groups to z-index 999. Keep workspace panes above editor
   * adorners, but below app-level dialogs, menus, and tooltips at z-50. Dockview
   * writes this token onto generated overlay/resize elements too, so set it directly
   * on those elements instead of relying only on inheritance from the component host.
   */
  --dv-overlay-z-index: 35;
}

:deep(.workspace-pane-header-actions) {
  display: flex;
  align-items: center;
  height: 100%;
}

:deep(.workspace-pane-header-action) {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  height: 100%;
  min-width: 24px;
  padding: 4px;
  border: 0;
  color: inherit;
  background: transparent;
}

:deep(.workspace-pane-header-action:hover) {
  border-radius: 2px;
  background-color: var(--dv-icon-hover-background-color);
}

:deep(.workspace-pane-content),
:deep(.workspace-center-editor) {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

/*
 * Floating panes use the same viewport sizing contract as docked panes: the content
 * fills the frame and the pane component owns its own scrolling. Keeping one contract
 * everywhere means resizing a floating frame shorter yields a usable scroll region
 * instead of clipping a natural-height child.
 */
:deep(.workspace-center-editor),
:deep(.dv-groupview-floating .workspace-pane-content) {
  overflow: hidden;
}

@media print {
  /*
   * Print only the center editor, not Dockview's interactive layout.
   *
   * Dockview is a fixed viewport manager; the printed score needs normal paged document
   * flow. Two print bugs, both from Dockview's window-derived inline pixel geometry
   * (top/left/width/height) that does not reflow to the paper width (816px for letter),
   * and which `visibility: hidden` leaves occupying layout:
   *
   *   - ~67% top-left: Blink print shrink-to-fit, NOT a GPU/HiDPI raster bug. Any box
   *     wider than the paper makes Blink scale the WHOLE printout down to fit, clamped
   *     at Settings::printingMaximumShrinkFactor = 1.5 -> ~67%, top-left. (The 150%
   *     display scale matching the 1.5 clamp was a coincidence.) Killed by `width:
   *     auto` + `position: static` (the inline left/width go inert once the box is
   *     statically positioned).
   *   - 1 clipped page: an `overflow: hidden` ancestor with a fixed, window-derived
   *     height clips the page flow to a single fragment. Killed by `height: auto` (an
   *     auto-height overflow:hidden box does not clip).
   *
   * So flatten the center branch with just position/display/width/height. Deliberately
   * NOT reset (a fragmentation harness prints 3 perfect pages with each of these on an
   * ancestor): contain, transform/will-change/translate3d, overflow:visible (auto
   * height already prevents the clip), inset/top/left (inert under position:static),
   * flex/min-width/min-height/margin/padding (no flex container or padding survives
   * this chain). The geometry reset is version-independent Chromium behavior.
   *
   * The exact selector set, however, is audited against dockview-core 6.6.1 +
   * themeLight: a Dockview upgrade (a new px-positioned container, a theme that pads)
   * can re-open this, so revisit with Dockview's source open. The `:has()` filters keep
   * the editor branch while leaving the rest hideable.
   */
  .workspace-dock-layout-container,
  .workspace-dock-layout,
  :deep(.dv-shell:has(.workspace-center-editor)),
  :deep(.dv-dockview:has(.workspace-center-editor)),
  :deep(.dv-grid-view:has(.workspace-center-editor)),
  :deep(.dv-branch-node:has(.workspace-center-editor)),
  :deep(.dv-split-view-container:has(.workspace-center-editor)),
  :deep(.dv-view-container:has(.workspace-center-editor)),
  :deep(.dv-view:has(.workspace-center-editor)),
  :deep(.dv-groupview:has(.workspace-center-editor)),
  :deep(.dv-content-container:has(.workspace-center-editor)),
  :deep(.dv-vue-part:has(.workspace-center-editor)),
  :deep(.workspace-center-editor) {
    position: static !important;
    display: block !important;
    width: auto !important;
    height: auto !important;
  }

  /*
   * Non-center Dockview machinery still carries window-scale inline geometry; hide it
   * where it diverges from the center branch. Non-center views (and everything nested
   * in them), the sashes inside the kept split containers, and the three px-positioned
   * overlay hosts cover every other case in 6.6.1 (each non-center
   * grid/branch/group/part nests inside one of these).
   */
  :deep(.dv-view:not(:has(.workspace-center-editor))),
  :deep(.dv-sash-container),
  :deep(.dv-render-overlay),
  :deep(.dv-overlay-render-container),
  :deep(.dv-floating-overlay-host) {
    display: none !important;
  }
}
</style>
