# Dockable workspace (Dockview behind a declarative pane registry and a centralized inspector)

## Abstract

Neanes presents its editing UI as a dockable-panel workspace built on the
**Dockview** layout manager (`dockview-vue` / `dockview-core` 6.6.1). The score
editor and the registered tool panes (neume selector, common combos, properties,
lyrics, and the optional developer pane) live inside a Dockview grid the user can
re-dock, float, hide, and resize.
Adopting a general-purpose viewport manager for an app with very specific layout
rules creates four problems this subsystem solves:

1. **A viewport manager vs. a printable document.** Dockview positions everything
   with window-derived inline pixel geometry (`top`/`left`/`width`/`height`) that
   never reflows to paper width. The score must live _inside_ Dockview yet print as
   normal paged document flow, or it prints blank, shrunk to ~67%, or clipped to one
   page (the three failure modes that section 4 dissects).
2. **"Panels you close" vs. "drawers you toggle."** Dockview's native model
   destroys/recreates panels and treats close as removal. The app's panes are
   _persistent app surfaces_: hiding one collapses a drawer rather than destroying it,
   and its visibility is shared state across a Vue ref, Dockview's live layout, and
   the OS application menu -- three things that must stay in sync without echoing
   each other into a loop.
3. **Generic drag-and-drop vs. constrained layout.** Dockview's default DnD creates
   arbitrary grid splits anywhere. The workspace allows panes only on declared
   edges, keeps the editor as a single non-splittable center zone, and floats a tool
   over the score when dropped on it.
4. **One selection driving many surfaces.** A selection must feed the properties
   pane, contextual toolbars, and global structural toolbar actions at once,
   without duplicating the per-element update logic or the undo wiring.

The design rests on a **declarative pane registry** (problem 3's allow-list and the
source of every layout default), a **permanent center editor panel** wired for
print correctness (problem 1), an **edge-group drawer model** with **session-sticky
edge memory** and a **two-way visibility control loop** (problem 2), a **custom
drop-decision state machine** (problem 3), and a centralized selection value
(**`InspectorContext`**) feeding a **router -> `Partial<Element>` -> command** pipeline
shared by the inspector surfaces (problem 4; section 3).

The centerpiece is `src/components/WorkspaceDockLayout.vue` (~1.9k lines), the single
wrapper around Dockview; its host is `src/components/TheEditor.vue`. Neanes is an
Electron desktop app: a _main_ process owns the native OS menu and windows, and a
_renderer_ process runs the Vue UI, the two communicating over IPC channels.

---

## 1. The foundation: panes, the registry, and the host

### 1.1 The library and the wrapper

`WorkspaceDockLayout.vue` is the single wrapper around `dockview-vue`'s
`<DockviewVue>`. It imports the library CSS (`dockview-vue/dist/styles/dockview.css`)
and pins `:theme="themeLight"` (Dockview's built-in light theme) explicitly, because
**the fallback is a dark "Abyss" theme**, so an omitted theme would render the
workspace dark. The wrapper exposes a
deliberately tiny contract to the host:

- **Props:** `developerPaneEnabled`, `paneVisibility`, `paneLayout`, and
  `layoutResetCounter`. `paneVisibility` is the desired visibility map;
  `paneLayout` is the saved pane edge/floating state; `layoutResetCounter` is a
  monotonically-incrementing reset trigger.
- **Emit:** `pane-visibility-change(paneId, isVisible)` -- fired whenever Dockview's
  own state changes (a drag, the header buttons, the context menu), and
  `layout-change(layout)` -- fired when pane edge/floating state changes.

Everything else -- panel construction, drawer behavior, float/dock, DnD policy,
print -- is internal. The component _builds_ the layout programmatically from the
registry (section 1.2) every mount, then applies any saved pane layout supplied by
the host.

### 1.2 The declarative pane registry -- `WorkspacePane.ts`

`src/models/WorkspacePane.ts` is the single source of truth for what panes exist and
their defaults. `workspacePaneDefinitions` is a `const`-asserted array; each entry is
a `WorkspacePaneConfig`:

- `id` -- stable pane id (`neume-selector`, `common-combos`, `properties`,
  `lyrics`, `developer`).
- `allowedEdges` -- `readonly PaneEdge[]`; all registered panes may dock on
  `['left','right']`.
- `homeEdge` -- the default/reset edge, which must be in `allowedEdges`.
- `defaultSize` -- drawer size: 240 for left panes, 320 for right-home panes.
- `defaultVisible` -- `neume-selector` and `properties` are `true`; the other panes
  start hidden.
- `titleSelector` -- an i18next `SelectorParam<'menu'>` resolving the pane title
  (e.g. `$.menu.view.properties`).

From this one array the model derives the types the rest of the app keys off:
`WorkspacePaneId` (the union of ids), `WorkspacePaneVisibility =
Record<WorkspacePaneId, boolean>`, and two factories used everywhere --
`createDefaultPaneVisibility()` (each pane's `defaultVisible`) and
`createAllHiddenPaneVisibility()` (all `false`). Adding a pane is a single entry
here; the editor, the menus, and the dock all expand from it.

Inside `WorkspaceDockLayout.vue` the definitions are re-projected into a richer
`PaneDefinition` (prefixing the Dockview panel id with `workspace-` as `id` while
keeping the original unprefixed id as `paneId`, and resolving `titleSelector` into a
`title` string while keeping the selector itself for re-resolution on language change)
and indexed once into a `PaneRegistry` by `buildPaneRegistry`:
`byId`, `configuredEdges` (the set of edges any pane uses -- which edge groups to
create), `defaultSizeByHomeEdge`, `homeIndexById` (each pane's slot _order_
within its home edge, so reset restores not just the edge but the position), and
`panes` (the ordered `PaneDefinition` list that `initializeLayout` and
`updatePaneTitles` iterate).
`buildPaneRegistry` also enforces three structural invariants up front:
`homeEdge` in `allowedEdges`, ids are unique, and no pane may claim the reserved
`workspace-center` id.

### 1.3 The permanent center editor panel

The score is not a slot rendered "somewhere in" the dock -- it is a real Dockview
panel with the reserved id `workspace-center` (`centerPanelId`), created by
`ensureCenterEditorPanel` and rendered by the `CenterEditor` dock component, which
simply emits the host's `#center` slot. Three things make it special:

- **Its header is hidden** (`group.header.hidden = true`) -- it is a surface, not a
  closeable tab.
- **Its drop zones are collapsed to a single center zone** by
  `restrictEditorDropZonesToCenter`, a deliberate reach into Dockview internals
  (`group.model.contentContainer.{dropTarget,pointerDropTarget}.setTargetZones(['center'])`)
  because Dockview exposes no public per-group content-zone API. This makes the
  editor non-splittable: a tool dropped on it resolves to one center overlay (which
  the DnD policy turns into a float, section 2.6) rather than splitting the score
  into side-by-side grids.
- **It must keep Dockview's default `onlyWhenVisible` renderer.** Dockview can render
  a panel two ways: `onlyWhenVisible` keeps its content in the in-flow
  `.dv-content-container` (mounted only while visible), whereas `renderer: 'always'`
  moves the content into `.dv-render-overlay`, an absolutely-positioned overlay layer
  that stays mounted while hidden. A prominent code comment forbids `'always'` (and
  any `defaultRenderer` on `<DockviewVue>`): the print CSS (section 4) hides that
  overlay layer, so an editor rendered there "silently makes the score print blank."
  This is the first of several places where print correctness dictates a Dockview
  decision.

### 1.4 Where the host plugs in -- the three zones of `TheEditor.vue`

`TheEditor.vue`'s shell is three stacked zones:

1. **`ToolbarMain`** (top, always visible) -- the global insert/action bar
   (entry-mode toggle, insert actions, breaks, delete, zoom, playback).
2. **`WorkspaceDockLayout`** (the growing middle) -- mounted once, with six named
   slots (the five registered pane slots plus `#center`): `#neume-selector` (the neume palette),
   `#common-combos` (frequently-used
   neume combinations for one-click insertion), `#properties` (`PropertiesPane`),
   `#lyrics` (`LyricsPane`), `#developer` (`DeveloperPane`), and `#center` (the page
   DOM). It is passed `:developer-pane-enabled`, `:pane-visibility`,
   `:pane-layout`, and `:pane-layout-reset-counter`, and handles
   `@pane-visibility-change` and `@layout-change`.
3. **`contextual-toolbar-panel`** (bottom strip, conditional) -- the per-element
   toolbars (section 3.4), shown for a subset of selection kinds.

The dock's panel content is rendered through Dockview's own renderer, not Vue's
normal tree, by four in-component dock components registered on `<DockviewVue>`:
`CenterEditor` (the `#center` host) and `PaneContent` (every tool pane) are
registered through the `:components` map, while `PaneTab` is bound to
`:default-tab-component` and `PaneHeaderActions` to `:right-header-actions-component`.
`PaneContent` reads its `paneId` from the panel params, emits `slots[paneId]?.()`
inside `<div class="workspace-pane-content" data-editor-shortcuts="ignore">`, and --
because the content is mounted outside the editor's Vue tree -- wraps it in its own
`TooltipProvider` (the context component tooltips read from, otherwise inherited from
the host tree). The `data-editor-shortcuts="ignore"` marker is read by
`isEditorShortcutIgnored` in `TheEditor` so keystrokes typed inside a pane (a
property field, a lyrics textarea) don't trigger editor shortcuts (section 3.6).

| File                             | Responsibility                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `WorkspaceDockLayout.vue`        | the entire Dockview wrapper: registry projection, layout build, drawer/float/dock, visibility loop, DnD policy, print CSS |
| `models/WorkspacePane.ts`        | declarative pane registry + visibility types/factories                                                                    |
| `TheEditor.vue`                  | host: the three zones, `inspectorContext`, the `updateXxx` handlers, `paneVisibility` state, menu/IPC wiring              |
| `properties/InspectorContext.ts` | the selection discriminated union (section 3)                                                                             |
| `properties/PropertiesPane.vue`  | context -> per-element pane router                                                                                        |
| `properties/Properties*.vue`     | 10 per-element-type structured editors                                                                                    |
| `LyricsPane.vue`                 | bulk staff-lyrics text editor                                                                                             |
| `DeveloperPane.vue`              | optional layout diagnostics and toggles                                                                                   |
| `electron/main/index.ts`         | native View menu + pane-visibility menu sync                                                                              |
| `ipc/ipcChannels.ts`             | the three pane IPC channels + args type                                                                                   |

---

## 2. The pane lifecycle: drawers, visibility, float, dock

### 2.1 The problem: Dockview closes panels; the app toggles drawers

Dockview treats tabs as removable documents in a workspace: closing a tab destroys
the panel. Neanes' normal panes are persistent fixed tools that are shown or hidden;
the developer pane exists only while developer panels are enabled. Pane headers use
`PaneHeaderActions` for the float/dock and hide/show buttons, tab context menus use
`onTabContextMenu` -> `buildPaneMenuItems` for Float/Dock and Hide/Show actions, and
"hide" never removes a normal pane.

### 2.2 The drawer model

Each configured edge gets one **edge group** -- a Dockview "drawer" created by
`ensureEdgeGroup` with `addEdgeGroup(side, { collapsed: true, id: 'workspace-edge-<side>', ... })`.
Edge groups exist from first mount but start collapsed; a pane lives in its home
edge group, and "visible" means that group is expanded with the pane active. The
single predicate `isPanelVisible(panelId, group)` encodes this:

> A pane is visible iff it is its group's `activePanel` **and** the group is not a
> collapsed edge drawer (`location.type !== 'edge' || !isCollapsed`).

`showPane` activates the panel (skipping a redundant `setActive` -- explained below) and
expands its edge group. `hidePane` is asymmetric and more careful: if the pane sits
in an edge group it just collapses the drawer; otherwise (floating, or sharing a
group) it `moveTo`s the pane into its preferred edge group inactive, then either
activates a sibling there or collapses the drawer. Both paths funnel through
`emitPaneVisibilityChange`, the single chokepoint that notifies the host.

A subtle Dockview fact shapes `showPane`: **`setActive` remounts the panel's content
DOM**, even when the panel is already active, which swallows an in-flight pointer
click. So `showPane` guards `if (panel.group.activePanel !== panel) panel.api.setActive()`
-- replaying a "show" request the layout already satisfies must not churn the DOM.

### 2.3 Session-sticky edge memory

A pane remembers the edge it was last docked on so float->redock and hide->reshow
return it there, not always to `homeEdge`. `lastDockedEdgeByPanelId` (a module
`Map`) is seeded from each pane's `homeEdge` and updated by `rememberPaneDockedEdge`
-- which validates against `allowedEdges`, so a pane can never remember an illegal
edge. `getPreferredDockEdge` returns the remembered edge if still allowed, else
`homeEdge`. The memory is in-session only (a `Map`, reset on reload); like the rest
of the layout it is never persisted (section 5).

### 2.4 The two-way visibility control loop

This is the heart of problem 2. Pane visibility is authoritatively owned by
`TheEditor`'s `paneVisibility` ref, but Dockview's live layout is the _actual_ state,
and they can each change independently (the host toggles via menu; the user toggles
via a header button or drag). The loop keeps them consistent and -- critically --
**does not feed back on itself**:

- **Host -> Dockview (intent down).** `WorkspaceDockLayout` deep-watches
  `props.paneVisibility` (`flush: 'post'`, i.e. after the DOM has updated) and calls
  `applyPaneVisibility`, which
  diffs the desired map against `computePaneVisibility()` (what Dockview currently
  shows) and only `showPane`/`hidePane`s the _delta_ -- each with **`emitChange = false`**,
  so applying intent does not echo back up.
- **Dockview -> host (actual up).** `installStateListeners` subscribes, per group, to
  `onDidActivePanelChange`, `onDidCollapsedChange`, and `onDidLocationChange`, and per
  api to `onDidAddGroup`/`onDidRemoveGroup`/`onDidMovePanel` plus a second api-level
  `onDidActivePanelChange`. Any of them
  schedules a single `requestAnimationFrame`-coalesced (rAF) `emitPaneVisibilityState`,
  which recomputes
  visibility and emits `pane-visibility-change` only for panes whose value actually
  changed (deduped against `lastEmittedPaneVisibility`).
- **Host closes the loop.** `onPaneVisibilityChange` -> `setPaneVisibility`, which
  **early-returns if the value is unchanged**.

Three independent guards therefore stop an infinite echo: `emitChange = false` on the
intent-down path, the `lastEmittedPaneVisibility` dedup on the actual-up path, and
the unchanged-value short-circuit in `setPaneVisibility`. A round-trip (section 2.8)
settles in one pass.

### 2.5 Float and dock

A pane can float over the workspace. `floatPane` calls `addFloatingGroup` and
collapses the now-empty source edge drawer; `dockPaneToLastDockedEdge` moves it back
to its preferred edge and expands. A floating pane is **auto-sized once per float**,
not continuously: `PaneContent` watches `onDidLocationChange` and, on becoming
floating, schedules a one-shot `sizeFloatingPanelToContent`. Width fits content (or
the pane default, whichever is larger); height fits content but is clamped to 75% of
the available floating area, the dock viewport (`maxFloatingPaneHeightRatio`), so a
tall pane (the full neume selector) scrolls internally instead of filling the screen. Height is measured with
a synchronous trick -- temporarily set the content's inline height to `auto`, read
`scrollHeight`, restore -- because the floating content otherwise fills its frame
(`height: 100%`) and would report the frame height. After the one-shot, the frame is
left alone so a manual resize sticks: docked and floating panes share one sizing
contract (content fills the frame, the pane owns its own scrolling).

### 2.6 Constraining drag-and-drop -- the decision state machine

Dockview's generic DnD would let any panel split any group anywhere. The workspace
supplies a custom _policy_ (using Dockview's mechanism) with a pure function `decideDrop(event,
dragData) -> DropDecision`, consulted from two places: `onWillShowOverlay` (so a
rejected target shows no misleading drop overlay -- this event is only on the core
api, not surfaced by `dockview-vue`, so it's wired manually in `onDockviewReady`) and
`onWillDrop` (the actual drop). `decideDrop` first rejects anything that isn't an
internal single-tab drag within this view (`dragData == null`, foreign `viewId`,
group/null-panel transfers, unknown panel ids), then classifies the target
(`classifyDropTarget`) and returns one of:

| `DropDecision.intent`                              | Trigger                                                                    | Effect                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `reject`                                           | foreign/unknown drag, content-side zone, disallowed edge, same-group no-op | `preventDefault` (no overlay, no drop)                                                      |
| `float-in-center`                                  | tool dropped on the editor center                                          | `preventDefault` + `addFloatingGroup` at the drop point, collapse source drawer             |
| `redock-to-root-edge-group`                        | tool dropped on a root edge                                                | `preventDefault` + `moveTo` the permanent edge group (avoids Dockview's grid split), expand |
| `allow-native-drop-and-expand-edge-group`          | tool dropped into an existing (allowed) edge drawer                        | let Dockview drop, then expand the drawer                                                   |
| `allow-native-drop-and-collapse-source-edge-group` | tool dropped into a floating group, leaving an empty drawer                | let Dockview drop, then collapse the emptied source                                         |
| `allow-native-drop`                                | floating-to-floating                                                       | let Dockview handle it                                                                      |

The allow-list is enforced here (`isPaneAllowedOnEdge` against `allowedEdges`), root
edges redirect into the permanent edge groups rather than new grid splits, and the
editor center always means "float over the score." Whole-group drags from Dockview's
blank header handle (`.dv-void-container`) are blocked entirely by capture-phase
`pointerdown`/`dragstart` listeners (`installBlankGroupDragBlockers`), and
`dnd-strategy="pointer"` is selected for consistent panel dragging.

### 2.7 Why reach into Dockview internals

Two mechanisms have no public API and are reached via documented-in-comment private
structures: collapsing the editor's content drop zones to center
(`contentContainer.dropTarget.setTargetZones`, section 1.3) and the
`onWillShowOverlay` core event. Both are isolated behind named helper functions and
typed `Internal*` shapes so an upgrade has one place to re-audit.

### 2.8 A worst-case sequence: toggling a pane from the OS menu

The hardest interaction is a visibility change that originates _outside_ the
renderer and must round-trip through every layer without looping. Trace "show the
Properties pane" from the native menu:

1. **Menu click.** The native checkbox item's handler immediately _reverts_ its own
   optimistic toggle (`menuItem.checked = paneMenuVisibility[paneId]`, the menu's own
   last-known shadow of pane state) and sends
   `FileMenuViewPaneVisibility { paneId: 'properties', visible: true }` to the
   renderer. The menu does not trust itself -- the renderer is the source of truth.
2. **Host applies intent.** `onFileMenuViewPaneVisibility` -> `setPaneVisibility`
   sets `paneVisibility.properties = true` (the value changed, so it proceeds).
3. **Intent down.** The deep watch fires `applyPaneVisibility`, which sees
   `properties` should be visible but isn't, and calls `showPane('workspace-properties', false)`
   -- `emitChange = false`. The right edge drawer expands with the pane active.
4. **Actual up.** Dockview's `onDidCollapsedChange`/`onDidActivePanelChange` fire ->
   rAF -> `emitPaneVisibilityState` recomputes and finds `properties` newly visible
   -> emits `pane-visibility-change('properties', true)`.
5. **Loop closes.** `onPaneVisibilityChange` -> `setPaneVisibility('properties', true)`
   -- value unchanged, **early return.** No further watch, no further emit.
6. **Menu re-syncs.** Separately, the `paneVisibility` watcher in `TheEditor` emits
   `SetWorkspacePaneVisibility` (the full map) to main; `syncPaneMenuItems` sets the
   native checkbox `checked` to the authoritative `true`. The optimistic toggle
   reverted in step 1 is reconciled here.

A user dragging the same pane out of its drawer starts at step 4 (Dockview
state changed first); the host records the new state and re-emits the menu sync, but
`applyPaneVisibility` finds no delta, so nothing moves twice.

### 2.9 Invariants the design preserves

- **A pane is never destroyed.** Hide = collapse/relocate; show = activate/expand.
  Any "close" affordance must route through `hidePane`, not Dockview's removal.
  The developer pane is the explicit exception, because disabling developer panels
  removes that optional Dockview panel from the workspace.
- **The center panel keeps the `onlyWhenVisible` renderer and a single center drop
  zone.** Both are load-bearing for print (section 4) and for "drop-on-editor =
  float," respectively.
- **Visibility changes are idempotent and non-echoing.** Intent-down uses
  `emitChange = false`; actual-up dedups against `lastEmittedPaneVisibility`;
  `setPaneVisibility` short-circuits unchanged values. Breaking any one risks a
  feedback loop.
- **A pane only ever docks on an `allowedEdges` edge.** Enforced in `decideDrop`,
  `rememberPaneDockedEdge`, and `getPreferredDockEdge`; remembered edges are
  re-validated, never trusted blindly.
- **Edge and order are both restored on reset.** `resetLayout` uses `homeIndexById`,
  not just `homeEdge`, so reset is deterministic regardless of drag history.

---

## 3. The inspector: one selection, many surfaces

### 3.1 `InspectorContext` -- collapsing many selection signals into one tagged value

`TheEditor` tracks selection through a dozen selection signals (`selectedElement`,
`selectedTextBoxElement`, `selectedRichTextBoxElement`, `selectedLyrics`,
`selectedElementForNeumeToolbar`, `selectionRange`, ... -- writable and read-only
`computed`s over `selectedWorkspace`, not bare refs). The `InspectorContext` type
(in `InspectorContext.ts`) collapses all of them into one discriminated union, and a
single Vue `computed` -- `inspectorContext` -- derives its value centrally:

```ts
type InspectorContext =
  | { kind: 'none' }
  | { kind: 'annotation'; element: AnnotationElement }
  | {
      kind: 'text-box';
      element: TextBoxElement;
      source: 'score' | 'header-footer';
    }
  | {
      kind: 'rich-text-box';
      element: RichTextBoxElement;
      source: 'score' | 'header-footer';
    }
  | { kind: 'drop-cap'; element: DropCapElement }
  | { kind: 'image-box'; element: ImageBoxElement }
  | { kind: 'lyrics'; element: NoteElement }
  | { kind: 'mode-key'; element: ModeKeyElement }
  | { kind: 'neume'; element: NoteElement }
  | { kind: 'martyria'; element: MartyriaElement }
  | { kind: 'tempo'; element: TempoElement };
```

The computed is a **priority cascade** (first match wins): annotation, text-box,
rich-text-box, drop-cap, image-box, lyrics, mode-key, neume, martyria, tempo, else
`none`. Two `kind`s share the `NoteElement` payload: the _same_ note appears as
`lyrics` (lyric-styling surface) or `neume` (neume-spacing surface) depending on which
selection path is active. To make the union narrow type-safely, the `is*` selection
helpers are TypeScript type guards (`element is NoteElement`, etc.). This single value
is the contract every inspector surface consumes -- there is exactly one place that
decides "what is selected," and everything downstream is derived solely from it.

### 3.2 The router and the `Partial<Element>` -> command pipeline

`PropertiesPane.vue` is a pure dispatcher with no editing logic. It narrows the union
into ten per-kind computed null-guards (`const neumeElement = computed(() =>
ctx.kind === 'neume' ? ctx.element : null)`), renders exactly one `Properties*` child
via a `v-if`/`v-else-if` chain (with an `Empty` placeholder for `none`), and
keys each child by the inspector kind and `element.id`, e.g. `neume-${element.id}`,
so switching the selected element
**remounts** the form rather than reusing stale derived state.

Each `Properties*.vue` follows one shape: it takes `:element` (concrete type) plus
the shared context it needs (`pageSetup` for min/max bounds, `fonts` for the three
font-bearing panes, `innerNeume` only for `PropertiesNeume`), reads values directly
off `element` (the element is treated as read-only input -- there is no local `v-model`
copy), groups its controls inside `PaneAccordion` / `PaneSection`, and
emits a single generic `update` carrying a **`Partial<Element>`**. The router re-emits
that enriched with the element: `@update="emit('update:neume', neumeElement, $event)"`.
The host handler applies it uniformly, routing every edit through the app's undo/redo
command bus (`commandService`) and then persisting the workspace (`save()`):

> **The pipeline.** `Properties*` emits `update(Partial<Element>)` -> `PropertiesPane`
> emits `update:<kind>(element, partial)` -> `TheEditor.updateXxx(element, partial)`
> -> `commandService.execute(<type>Factory.create('update-properties', { target, newValues: partial }))`
> -> `save()`.

For the two `NoteElement` kinds the dispatch is shared: both `update:neume` and
`update:lyrics` route to one host handler, `updateNoteAndSave` (a thin
`updateNote` + `save()` wrapper), since they edit the same note via different
surfaces.

The load-bearing detail: the emitted partial flows _unchanged_ into the generic
`UpdatePropertiesCommand<T>`, whose args are exactly `{ target: T; newValues: Partial<T> }`.
The command applies each key onto the target and snapshots the prior value for undo.
**The pane's partial _is_ the undo diff** -- which is why panes emit partials rather
than bespoke diff objects, and why there is no per-pane undo code. Most payloads are
single-key (`{ marginTop: $event }`); a few are derived multi-key built in small
script helpers (style toggle-groups decomposing into `bold`/`italic`/`underline` or
CSS `fontWeight`/`fontStyle`; image width/height coupled through `aspectRatio`;
`__none__` select sentinels mapping to `''`/`null`). Handlers add only element-specific
side effects around the same core -- e.g. `updateNote` increments a `keyHelper`
counter the neume controls watch (forcing them to re-read the element) and
conditionally `refreshStaffLyrics()` (re-flows lyric text across the notes);
`updateTextBox`/`updateRichTextBox` pass a
`noHistory` flag when the _only_ changed key is the layout-derived `height`, keeping
pure resizes out of the undo stack.

Pane section state is editor-global environment state, not element state.
`TheEditor.vue` owns the `openSections` arrays and passes them into
`DeveloperPane.vue` and `PropertiesPane.vue`; `PropertiesPane.vue` forwards that
state to the currently mounted `Properties*` child. Each top-level `PaneAccordion`
is a controlled component that takes `openSections` and emits
`update:open-sections`, while each `PaneSection` registers its stable section id
through `paneSectionRegistrationKey`. When the visible section set changes, the
accordion filters user changes to the currently registered sections but preserves
open ids for hidden sections, so collapsing `style` on a text box does not discard
the state of `martyria`, `tempo`, or the developer-only `glue` section when those
sections are not currently mounted. Reset layout restores
`DEFAULT_PANE_ACCORDION_STATE`.

### 3.3 Structural actions and `LyricsPane`

`ToolbarMain` owns the global structural document operations:
`toggle-line-break`, `toggle-page-break`, `delete-selected-element`, and
`copy-element-link`. `TheEditor` applies them to the current score selection through
the same command/save infrastructure used by the menus. These are **operations, not
property partials**: they edit an element's place in the document rather than an
inspector form field, and they do not add a pane id to the registry.

`LyricsPane.vue` is a sibling docked pane with a different job:

- **`LyricsPane.vue`** is the odd one out: it does _not_ consume `InspectorContext`
  at all. Its props are scalars (`locked: boolean`, `lyrics: string`); it is a bulk
  editor for the whole staff's lyric text (a `Textarea` bound to `staff.lyrics.text`),
  emitting `update:lyrics` (-> `updateStaffLyrics`, which writes the text and schedules
  a debounced re-flow of lyric text across notes, one pending re-flow per workspace),
  `update:locked`, and the staff-level actions `activate-staff-lyrics` and
  `assign-accepts-lyrics`. Do not confuse it
  with `PropertiesLyrics.vue`, which edits the lyric _styling_ of one selected note
  and emits `Partial<NoteElement>`.

### 3.4 The coexisting inspector and toolbar surfaces

Two inspector surfaces coexist, both fed by the same `inspectorContext`:

1. **The docked `properties` pane** -- the structured settings editor (right side).
2. **The bottom `contextual-toolbar-panel`** -- the per-element toolbars, shown only
   when `inspectorContext.kind` in `{ neume, martyria, mode-key, lyrics, text-box,
rich-text-box, annotation, drop-cap }`.

`ToolbarMain` is the global top toolbar: it owns insert/actions that are always
available from the main surface (entry mode, break controls, copy element link,
delete, zoom, playback), while the inspector surfaces below are selected by
`InspectorContext`.

For those contextual-toolbar kinds, **the properties pane and a contextual toolbar
render at the same time, in different places.** They are not redundant: the toolbar holds the
glyph-builder / quick-insert actions that are awkward in a vertical form (insert
pelastikon/gorthmikon; for neumes the whole accidental/fthora/gorgon/klasma/ison/tie
palette), emitting many granular events (`@update:fthora`, `@update:accidental`,
`@insert:pelastikon`, ...) handled by dedicated `setX` functions; the pane holds the
settings (fonts, sizes, colors, margins, alignment, BPM). Crucially **both surfaces
emit the same generic `@update` partial to the same `updateXxx` handler**, so there
is one update path and no duplicated logic -- the toolbar and the pane are two
front-ends over one command. The division of labor across element kinds is:

- **Pane-only kinds** -- `image-box` and `tempo` have no contextual toolbar; all of
  their controls live in `PropertiesImageBox` and `PropertiesTempo`.
- **Pane + toolbar kinds** -- `neume`, `martyria`, `mode-key`, `text-box`,
  `rich-text-box`, `annotation`, `drop-cap`, and `lyrics` split their controls:
  settings in the pane, glyph/insert/rich-text actions in the contextual toolbar
  (`ToolbarNeume`, `ToolbarMartyria`, `ToolbarModeKey`, `ToolbarTextBox`,
  `RichTextToolbar`, `ToolbarDropCap`, `ToolbarLyrics`).
- **Cross-cutting controls** -- line/page breaks, delete, and copy-element-link live
  in `ToolbarMain`; the "edit initial martyria" dialog trigger lives in
  `ToolbarModeKey`; and the syllable-positioning dialog trigger lives in
  `ToolbarNeume`.

### 3.5 The `source: 'score' | 'header-footer'` discriminator

Only `text-box` and `rich-text-box` carry `source`, because those two element types
can exist in two places: inline in the score body, or inside the page header/footer
template. The same `Properties*` editor serves both, but it uses `source` to show
score-only controls such as running-marker role/text only for inline score boxes.
The value is computed by identity -- if the element selected _as a score element_ is
the same object as the selected text box, it's `'score'`, else `'header-footer'`.

### 3.6 Invariants the design preserves

- **`inspectorContext` is the single selection authority.** Every surface (panes _and_
  the contextual toolbars) reads it; nothing re-derives "what is selected" from raw
  refs. Additional surfaces consume the union; they do not add parallel selection paths.
- **Panes are stateless over the element.** They read `element` and emit partials;
  they keep no editable copy. The `:key` remount guarantees no stale derived state
  leaks across selections.
- **Pane sections are stable environment state.** Section ids are semantic
  (`style`, `positioning`, `tempo`, `display`, etc.), not tied to element ids;
  adding or renaming one must account for `DEFAULT_PANE_ACCORDION_STATE`.
- **One update path per element type.** Toolbar and pane both emit `Partial<Element>`
  to the same `updateXxx` -> `UpdatePropertiesCommand`. Adding a control on either
  surface must reuse that handler, never write the element directly.
- **Layout-derived fields stay out of history.** Height-only updates carry
  `noHistory`; a resize must never produce an undo entry.
- **Typing inside a pane is not an editor shortcut.** Pane content is marked
  `data-editor-shortcuts="ignore"`; `isEditorShortcutIgnored` honors it.

---

## 4. Printing through a viewport manager

Print is a first-class constraint, not an afterthought, because Dockview is
fundamentally hostile to paged output: it is a fixed-viewport manager that writes
**window-derived inline pixel geometry** (`top`/`left`/`width`/`height`) onto its
containers, and that geometry does not reflow to paper width (816px for US Letter).
`visibility: hidden` does not help -- hidden boxes still occupy layout. The design
addresses this on three fronts.

### 4.1 Keep the editor in the document-flow renderer

As established in section 1.3, the center panel must use Dockview's default
`onlyWhenVisible` renderer so the score lives in `.dv-content-container`, not the
`.dv-render-overlay` overlay layer. The print CSS hides that overlay; if the score
were in it, the printout would be blank. This is why `renderer: 'always'` is
explicitly forbidden.

### 4.2 Flatten the center branch, hide the rest -- the print `@media` block

`WorkspaceDockLayout.vue`'s scoped `@media print` block does two things, both driven
by Dockview's inline geometry:

- **Flatten the center branch** -- every Dockview ancestor of `.workspace-center-editor`
  (selected with `:has()` filters: `.dv-shell`, `.dv-dockview`, `.dv-grid-view`,
  `.dv-branch-node`, `.dv-split-view-container`, `.dv-view-container`, `.dv-view`,
  `.dv-groupview`, `.dv-content-container`, `.dv-vue-part`, and the editor itself) is
  reset to `position: static; display: block; width: auto; height: auto`. This
  defeats two distinct Chromium print bugs:
  1. **Shrink-to-fit (~67%, top-left).** A box wider than the paper makes Blink scale
     the _entire_ printout down, clamped at `printingMaximumShrinkFactor = 1.5` ->
     ~67%. `width: auto` + `position: static` (which inerts the inline `left`/`width`)
     kills it. This is a layout bug, not a raster/HiDPI one -- the 150% display scale
     matching the 1.5 clamp was a coincidence.
  2. **Single clipped page.** An `overflow: hidden` ancestor with a fixed,
     window-derived height clips the page flow to one fragment. `height: auto` (an
     auto-height `overflow: hidden` box does not clip) kills it.
     The reset is deliberately minimal -- only position/display/width/height -- because
     testing with multi-page content showed the other properties (`contain`, transforms,
     `overflow`, `inset`, flex, margins) have no effect once the box is statically
     positioned and auto-sized.
- **Hide non-center machinery** -- non-center `.dv-view`s, sash containers (the
  draggable splitters between panes), and the three overlay hosts (`.dv-render-overlay`,
  `.dv-overlay-render-container`, `.dv-floating-overlay-host`) are `display: none`,
  since each still carries window-scale inline geometry.

The geometry _behavior_ is version-independent Chromium, but the _selector set_ is
audited against `dockview-core` 6.6.1 + `themeLight`; a comment flags it for re-audit
on any Dockview upgrade.

### 4.3 Suppress portal-anchor trailing pages

`App.vue` adds one print rule: `body > :not(#app) { display: none !important }`.
Vue's `<Teleport>` (and Reka UI components built on it) render their content elsewhere
in the DOM, leaving stray anchor nodes as direct `<body>` children; without this rule,
Blink honors a trailing `break-after` on them and emits a blank final page.

---

## 5. State ownership: what is persisted, and the menu sync

### 5.1 The layout is editor-global environment state

Dockview's full layout JSON is not serialized with `api.toJSON()`/`fromJSON()`, and
pane state is not part of the `Workspace` model or score file. Instead,
`TheEditor.vue` persists a small editor-global `editorEnvironment` record in
`localStorage`. That record stores the pieces of layout state the editor owns:
pane visibility, home edge/floating state for panes that differ from defaults, pane
accordion sections for the developer and properties panes, status-bar visibility,
and zoom defaults.

On launch the dock is built programmatically from `workspacePaneDefinitions`
(`initializeLayout` -> `ensureCenterEditorPanel` + `ensureEdgeGroup` per edge +
`addToolPane` per pane). After construction, the saved `editorEnvironment.paneLayout`
is applied to move/show/hide/float panes. If there is no saved pane layout,
`paneVisibility` is seeded from `createDefaultPaneVisibility()`.

Consistent with this, lyrics-pane visibility is simply persisted as part of the
editor environment -- editor-global like every other pane, not a per-workspace field.
The serialized per-workspace record (`WorkspaceLocalStorage`, the blob written to
`localStorage`) carries no pane state at all.

### 5.2 One layout shared across all workspaces

`WorkspaceDockLayout` is mounted once, not per-tab and not keyed to the workspace.
Switching workspaces (tabs) swaps the _content inside the center panel_ (the page DOM
re-renders for the selected workspace), but the dock structure -- edges, panes, sizes,
floating windows -- is untouched. Panel arrangement is a property of the editor
session, not of any document.

The center panel also hosts the workspace tab strip. Because Dockview can change the
center width when edge panes open, close, resize, or restore without a window resize,
`TheEditor.vue` observes the tab-strip host and schedules `Vue3TabsChrome.doLayout()`
after those geometry changes settle. That keeps the tab widths in sync with the live
center pane without storing any extra layout state.

### 5.3 The menu sync (the one cross-process channel)

The cross-process state wiring keeps the OS application menu's checkboxes in
agreement with the renderer. The native **View** menu (built in
`electron/main/index.ts`) holds one checkbox per currently enabled pane plus "Reset
Layout," and a lyrics entry with a `CmdOrCtrl+L` accelerator. The browser build's
`FileMenuBar.vue` mirrors this menu with `MenubarCheckboxItem`s.
Three IPC channels carry the state:

| Channel                      | Direction        | Payload                        | Purpose                                        |
| ---------------------------- | ---------------- | ------------------------------ | ---------------------------------------------- |
| `FileMenuViewPaneVisibility` | main -> renderer | `{ paneId, visible? }`         | a menu click; `visible` omitted = toggle       |
| `FileMenuViewResetLayout`    | main -> renderer | --                             | the Reset Layout item                          |
| `SetWorkspacePaneVisibility` | renderer -> main | full `WorkspacePaneVisibility` | push authoritative state to re-sync checkboxes |

The defining pattern (section 2.8) is that **the menu never trusts its own optimistic
toggle**: the checkbox handler reverts `menuItem.checked` to the last-known value and
defers to the renderer, which applies the change and echoes the real state back via
`SetWorkspacePaneVisibility` -> `syncPaneMenuItems`. The main process keeps a runtime
shadow `paneMenuVisibility` only so checkboxes survive a menu rebuild (e.g. on
language change); it is never written to disk and is lost on quit. `Reset Layout`
sends `FileMenuViewResetLayout` -> `resetLayout()`, which clears persisted editor
layout state, resets zoom defaults, and bumps `layoutResetCounter`; the dock's
watcher restores every pane to its home edge and index and re-applies default
visibility.

---

## 6. External behaviors relied upon

The design leans on specific, verified behaviors of its dependencies. These are the
load-bearing third-party contracts; a major version bump should re-check them.

**`dockview-core` / `dockview-vue` 6.6.1:**

- `addEdgeGroup(side, { collapsed, id, initialSize, minimumSize })`, and group
  `api.collapse()` / `api.expand()` / `api.isCollapsed()` -- the drawer mechanism.
  (section 2.2)
- `panel.api.location.type` is `'edge' | 'floating' | ...`, and `location.position`
  gives the edge side -- the basis of `isPanelVisible` and edge memory. (section 2.2)
- **`setActive` remounts the panel's content DOM**, even for the already-active panel
  -- hence the redundant-activation guard in `showPane`. (section 2.2)
- `addFloatingGroup(panel, options)` and `panel.api.moveTo({ group, index, skipSetActive })`
  -- float and dock/redock. (section 2.5, section 2.6)
- The default renderer is `onlyWhenVisible` (content in `.dv-content-container`);
  `'always'` portals content into `.dv-render-overlay`. The choice is print-visible.
  (section 1.3, section 4)
- `onWillShowOverlay` exists on the **core** api but is _not_ surfaced by
  `dockview-vue`, so it is wired manually from `event.api` in `onDockviewReady`.
  (section 2.6)
- `onWillDrop` / drop `event.getData()` returns a `PanelTransfer` with
  `viewId`/`panelId`/`groupId` (null panel id = whole-group/tab-group transfer); the
  drop is scoped by `viewId`. (section 2.6)
- A group's content drop zones can be constrained via the **private**
  `group.model.contentContainer.{dropTarget,pointerDropTarget}.setTargetZones([...])`;
  there is no public equivalent. (section 1.3)
- `:components`, `:default-tab-component`, `:right-header-actions-component`,
  `:get-tab-context-menu-items`, and `dnd-strategy="pointer"` are the extension
  points used for the custom tab/header/menu/DnD behavior. (section 1.4, section 2.6)
- Floating groups default to `z-index: 999`; Dockview writes a `--dv-overlay-z-index`
  token onto generated overlay/resize elements, overridden to `35` so panes sit above
  the editor's adorners (selection highlights and overlays drawn on the score) but
  below app dialogs/menus/tooltips. The DOM class names
  (`.dv-shell`, `.dv-floating-overlay-host`, `.dv-void-container`, the print-CSS
  `.dv-*` ancestors) are themselves a relied-upon contract. (section 2.6, section 4)
- The fallback theme is dark "Abyss"; `themeLight` must be passed explicitly.
  (section 1.1)

**Vue 3:**

- Dockview mounts panel content through its _own_ renderer, outside the host's Vue
  tree, so each pane re-establishes context it would otherwise inherit (its own
  `TooltipProvider`). Slot content is reached via `useSlots()` and emitted from
  `defineComponent` dock components. (section 1.4)

**Chromium print:**

- Shrink-to-fit clamps at `printingMaximumShrinkFactor = 1.5` (~67%) for any box
  wider than the paper; `position: static` inerts inline `left`/`width`. (section 4)
- An `overflow: hidden` box with a fixed height clips paged flow; with `height: auto`
  it does not. (section 4)
- Teleport anchors as direct `<body>` children can carry a trailing `break-after`
  into a blank final page. (section 4)

---

## 7. File map

The subsystem spans these files, grouped by concern.

**The dock and its model:**

- `src/models/WorkspacePane.ts` -- declarative pane registry (`workspacePaneDefinitions`),
  `WorkspacePaneId`/`WorkspacePaneVisibility`, and the visibility factories.
- `src/components/WorkspaceDockLayout.vue` -- the entire Dockview wrapper: registry
  projection + assertions (`buildPaneRegistry`), layout build (`initializeLayout`,
  `ensureCenterEditorPanel`, `ensureEdgeGroup`, `addToolPane`), the drawer model
  (`showPane`/`hidePane`/`isPanelVisible`), edge memory (`lastDockedEdgeByPanelId`),
  the visibility loop (`applyPaneVisibility`, `installStateListeners`,
  `emitPaneVisibilityState`), float/dock + auto-size (`floatPane`,
  `dockPaneToLastDockedEdge`, `PaneContent`'s one-shot sizing), the DnD state machine
  (`decideDrop` and friends), the dock components (`PaneContent`/`PaneTab`/
  `PaneHeaderActions`/`CenterEditor`), and the print `@media` block.

**The host:**

- `src/components/TheEditor.vue` -- the three zones; the `inspectorContext` computed;
  the `updateXxx` handlers and the `Partial<Element>` -> command pipeline;
  `paneVisibility` / `layoutResetCounter` / `setPaneVisibility` / `resetLayout` /
  `onPaneVisibilityChange`; the pane IPC handlers and the `SetWorkspacePaneVisibility`
  menu-sync emit; `isEditorShortcutIgnored`.
- `src/models/EditorEnvironment.ts` -- the editor-global persisted environment
  shape and default pane accordion section state.

**The inspector:**

- `src/components/properties/InspectorContext.ts` -- the selection discriminated union.
- `src/components/properties/PropertiesPane.vue` -- the context -> pane router.
- `src/components/pane/PaneAccordion.vue`,
  `src/components/pane/PaneSection.vue`,
  `src/components/pane/PaneSectionRegistration.ts` -- the shared pane accordion
  and section-state registration contract.
- `src/components/properties/Properties{Annotation,TextBox,RichTextBox,DropCap,ImageBox,Lyrics,ModeKey,Neume,Martyria,Tempo}.vue`
  -- the per-element structured editors.
- `src/components/LyricsPane.vue` -- bulk staff-lyrics text editor (selection-independent).
- `src/components/Toolbar{Neume,Martyria,ModeKey,TextBox,DropCap,Lyrics}.vue` and
  `src/components/RichTextToolbar.vue` -- the contextual toolbars (glyph/insert/rich-text
  actions), rendered in the `contextual-toolbar-panel` alongside the docked panes.
- `src/components/ToolbarMain.vue` -- the global top toolbar, including structural
  actions such as breaks, delete, and copy-element-link.
- `src/components/DeveloperPane.vue` -- optional layout diagnostics and developer
  toggles.

**Menu, IPC, and chrome:**

- `electron/main/index.ts` -- the native View menu (`createPaneMenuItem`,
  `paneMenuItemIds`), `syncPaneMenuItems`, the optimistic-revert click handler, and
  the `SetWorkspacePaneVisibility` listener.
- `src/components/FileMenuBar.vue` -- the browser View menu (parallel
  `MenubarCheckboxItem`s + Reset Layout).
- `src/ipc/ipcChannels.ts` -- `FileMenuViewPaneVisibility`,
  `FileMenuViewResetLayout`, `SetWorkspacePaneVisibility`, and
  `FileMenuViewPaneVisibilityArgs`.
- `src/App.vue` -- the print rule hiding stray teleport anchors.
- `src/i18n/*/menu.json`, `toolbar.json` -- the `menu.view.*` pane titles and the
  `toolbar.{properties,workspace}` strings.
