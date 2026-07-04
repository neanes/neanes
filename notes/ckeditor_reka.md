# Rich-text editing subsystem (CKEditor 5 behind a custom Reka-UI toolbar)

## Abstract

Neanes embeds a CKEditor 5 editor inside each rich-text box and annotation, and
drives it through a custom Vue 3 + Reka-UI toolbar and properties panel. This
arrangement creates two problems that the subsystem solves:

1. **Focus & selection.** The custom controls (font combobox, size field, color
   picker, and CKEditor's own link/image/table/find balloons) take DOM focus
   away from the editable. Left alone, the app reads that as the editor losing
   focus -- it disables the toolbar, drops the command, and persists prematurely --
   and the text selection the control is meant to act on stops being painted.
2. **Content persistence.** Rich-text content lives inside the live editor and is
   only _stale_ in the model until an explicit flush copies it back. Every path
   that serializes or clones a score must flush first, and geometry updates must
   be kept off the content path, or content is lost / selections collapse.

The design rests on a **focus zone** and a **fake selection marker** (for the first problem)
plus a small set of **flush gates** (for the second problem), all on a shared
foundation: an editor registry that maps each live editor to the model element
that owns it.

---

## 1. The foundation: how rich text is embedded

### 1.1 The editor

`src/customEditor.ts` defines the editor class `InlineEditor`, a subclass of
CKEditor's **`DecoupledEditor`**. It is configured with an **empty
`toolbar.items`** and a hidden menu bar, so the editing UI comes entirely from the
Vue components. Editing features (bold, font, lists, links, images, tables,
find-and-replace, plus the custom `InsertNeume` and `NeanesFakeSelectionEditing`
plugins) are registered as `builtinPlugins`, which provides their editing
commands; the Vue toolbar and panel are what invoke those commands.

This has a consequence the whole of section 2 turns on: CKEditor's focus tracker
covers **only its own UI** -- the editable DOM root and the balloons/dialogs in its
body collection (section 2.7) -- and knows nothing of our Vue toolbar or panel.
(DecoupledEditor _does_ register an internal toolbar view with the tracker, via
`init()` -> `_initToolbar()` -> `focusTracker.add(view.toolbar)`, but the host
decides where that element lives and `RichTextEditor.vue` never mounts it, so it
stays detached from the document and can never take focus.)

### 1.2 Snapshot content binding

Text boxes and annotations pass current content into `RichTextEditor.vue` through
its `modelValue` prop (`content`, `contentLeft` / `contentCenter` / friends, or
`element.text`), but `RichTextEditor.vue` does not forward that live prop to
`@ckeditor/ckeditor5-vue`'s `<Ckeditor>` wrapper. It takes a one-time snapshot
(`const initialData = props.modelValue`) and binds the wrapper as
`:model-value="initialData"`, so the wrapper's model->editor watch only seeds
initial content at creation. Separately, `disable-two-way-data-binding` turns off
the wrapper's editor->model emit. After creation, `RichTextEditor.vue` owns
parent->editor syncing with its own guarded watcher, and content is pulled back
out explicitly by calling `editor.getData()` at chosen moments (blur, flush). This
is what makes `element.content` _stale during editing_ -- the central fact of
section 3.

A `RichTextBoxElement` can host **several sub-editors at once** (the multipanel
left/center/right variant, and the inline top/bottom variant), so "the editor for
an element" is really "the currently focused one of that element's sub-editors."

### 1.3 The editor registry and ownership -- `useRichTextEditorRegistry.ts`

A module-level registry connects each live editor to the model element that owns
it and tracks which editor is currently active:

- `registerEditor(editor, owner)` -- called from `RichTextEditor`'s `ready`
  handler. Records `editor -> owner`, and on first registration wires three
  listeners: the editing view's `focus` and the UI focus tracker's
  `change:isFocused` both drive `setActiveEditor` / `clearActiveEditor`, and the
  editor's `destroy` unregisters everything.
- `activeEditor` / `activeEditorOwner` (`shallowRef`s) -- the single globally
  focused editor and its owner.
- `getActiveEditorForOwner(owner)` / `useActiveEditorForOwner(owner)` -- the active
  editor _iff_ it belongs to `owner`. The toolbar and panel use this as their
  `scopedEditor`; command enablement (`isCommandEnabled`) requires it to be
  non-null, and `execForOwner` runs a command only when it is.
- `resolveActiveOrLastEditorForOwner(owner)` --
  `getActiveEditorForOwner(owner) ?? <last-active editor for owner>`. The fallback
  is what makes the focus zone _sticky_ (section 2.4): a transient blur that nulls
  `activeEditor` does not change this value.

"Owner" is always the element model object (`props.element`). All of an element's
sub-editors share one owner.

### 1.4 The custom UI and where content gets persisted

- **`RichTextToolbar.vue`** -- the floating toolbar (undo/redo, font, size, bold/
  italic/underline, alignment, remove-format, lists, indent, neume insertion, and
  the native link/image/table/find buttons).
- **`PropertiesRichTextStyle.vue`** -- the properties-panel section (font, size,
  color, style, alignment, script, and neume-attribute controls).
- **`TextBoxRich.vue`** -- lays out an element's sub-editors and, on
  `RichTextEditor`'s `blur`, calls `getPendingUpdates()` (which diffs each
  sub-editor's `getData()` against the model) and emits `update`. **Blur is the
  everyday persistence path.** The gates in section 3 exist for the cases
  where no blur fires.

| File                                                  | Responsibility                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `customEditor.ts`                                     | `InlineEditor` (DecoupledEditor) + plugin/config registration                   |
| `RichTextEditor.vue`                                  | `<Ckeditor>` wrapper; registry register/unregister; `blur`/`ready` emits        |
| `TextBoxRich.vue`                                     | sub-editor layout; pull content on blur; geometry via `update:height`           |
| `useRichTextEditorRegistry.ts`                        | editor-owner registry; active-editor tracking; command state                    |
| `useRichTextSelectionGuard.ts`                        | keeps the editor focused while a control is engaged; shows the selection marker |
| `richtextselection.ts` / `.css`                       | the fake-selection marker plugin                                                |
| `RichTextToolbar.vue` / `PropertiesRichTextStyle.vue` | the custom toolbar and properties panel                                         |
| `TheEditor.vue`                                       | the flush gates and the persistence pipeline                                    |

---

## 2. Focus & selection while a custom control is engaged

### 2.1 The problem

Three toolbar/panel controls own keyboard focus while operating on the editor's
selection -- the **font combobox** (has a search input), the **font-size field**,
and the **color picker** (hex input + canvas) -- as do CKEditor's own **link,
image, table, and find** balloons. Each takes DOM focus away from the editable,
and without the mechanisms in this section that reads as the editor blurring. Two
independent things then break:

- **App logic.** The focus tracker fires `isFocused -> false`, clearing the active
  editor. The scoped editor goes null, so the controls disable and their commands
  silently no-op, and the `blur` emit fires, persisting mid-edit.
- **Selection painting.** Even when a command does run, the selection highlight
  vanishes, because painting is governed by a _different_ tracker (section 2.2).

### 2.2 The governing fact: two distinct focus trackers

There are two distinct focus trackers, and the design hinges on never conflating
them:

| Tracker                                  | Governs                                                       | Kept correct by                                          |
| ---------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `editor.ui.focusTracker.isFocused`       | App logic: active editor, command enablement, the `blur` emit | **Layer A** -- register our UI with it                   |
| `editor.editing.view.document.isFocused` | Whether the renderer _paints_ the real selection              | **Layer B** -- a fake marker painted regardless of focus |

The decisive detail: **`editor.ui.focusTracker.add(element)` does not affect the
editing view's `isFocused`.** The renderer skips painting the DOM selection while
the editing view is unfocused, so extending the UI focus tracker (Layer A) keeps
the app logic correct but the real highlight still disappears the moment focus
enters a dropdown. A second mechanism (Layer B) must stand in for the highlight.
This is the same reason CKEditor's own link/emoji/bookmark features draw a fake
selection.

### 2.3 The unifying model: one focus zone

> The editable, our toolbar, our properties panel, the shared dropdown portal,
> and CKEditor's own balloons together form **one focus zone**. While focus is
> anywhere in that zone the editor is logically focused and active; only when
> focus leaves the _whole_ zone is it a genuine blur.

CKEditor already does exactly this for its own balloons, via
`editor.ui.focusTracker.add(...)`. The design generalizes that mechanism to our
Reka UI rather than inventing a parallel one -- which is why native balloons need
no code of ours (section 2.7).

### 2.4 Layer A -- the focus bridge

`attachFocusZone(owner, containerRef)` (`useRichTextSelectionGuard.ts`), called
from the toolbar's and panel's setup scope, registers the consumer's container
element **and the shared dropdown portal root** on the _current_ editor's
`editor.ui.focusTracker`. Reka teleports the rich-text dropdowns/popovers into a
single body-level portal (`#neanes-rich-text-portal-root`, from
`useRichTextPortalRoot`), so registering that one node covers every dropdown.
With both registered, focus moving into the toolbar, panel, or any dropdown is
_not_ a blur: the active editor stays set, controls stay enabled, commands run,
and no premature `blur` is emitted. A real blur -- focus leaving the entire zone --
still fires `isFocused -> false` natively and runs the normal clear + persist.

Three properties make this robust:

- **Sticky registration.** `attachFocusZone` watches
  `resolveActiveOrLastEditorForOwner(owner)`. When a transient blur nulls
  `activeEditor`, that getter falls back to the last-active editor, so its value
  is _unchanged_ and the watch does not re-run -- the registration persists across
  blurs. It re-keys only when a genuinely _different_ editor becomes current, or
  the container/owner changes.

  Stickiness is **required**, not an optimization. The font-size field takes focus
  in the _same task_ as the editable's blur, and CKEditor evaluates blur
  containment when the blur fires (it defers the blur with `setTimeout(0)` and a
  capture-phase containment check). The capture-phase focus listener that
  `focusTracker.add` installs only cancels the pending blur if the container is
  _already_ registered. Registering reactively inside the field's own `focusin`
  is one tick too late. Sticky registration guarantees the listener already
  exists, and as a bonus makes control-to-control handoffs and Reka's transient
  close-focus moves dip-free.

- **One editor owns the portal at a time (enforced).** Per-editor containers are
  tracked per editor, but the shared portal is a singleton, so it must be tracked
  on exactly one editor's focus tracker -- if it were on two at once, focusing one
  dropdown would fire `change:isFocused(true)` on both and set the active editor to
  the wrong owner. The portal is therefore tracked through a module-level
  `portalRegistration` (`{ editor, root, refcount }`). `acquireZone` ref-counts
  within the same editor (the toolbar and panel share it) but **hands ownership
  over** when a different editor acquires -- removing the portal from the previous
  owner before adding it to the new one. This is what makes the invariant
  structural: a multipanel box has several sub-editors, and its toolbar and panel
  re-key independently as the active sub-editor changes, so a plain per-editor
  refcount would leave the portal registered on both the old and the new editor
  during that window. (`focusTracker.add` throws on a duplicate; the bookkeeping
  prevents that, and the call is wrapped defensively regardless.)

- **Cleanup without surprises.** `editor.once('destroy', ...)` drops bookkeeping
  without calling `remove` (the tracker dies with the editor), and
  `onScopeDispose(release)` handles component unmount.

### 2.5 Layer B -- the fake selection marker

`NeanesFakeSelectionEditing` (`src/ckeditor-plugins/richtextselection/`) registers a
single marker, `NEANES_RICH_TEXT_SELECTION_MARKER`, rendered in the editing
downcast two ways:

- an **expanded** range becomes a highlight (`markerToHighlight`, CSS class
  `ck-fake-neanes-selection`);
- a **collapsed** selection becomes a zero-width caret element
  (`markerToElement` returning an inert `UIElement` span,
  `ck-fake-neanes-selection_collapsed`), so a bare caret stays visible. The
  collapsed-at-block-end case is anchored on the last non-content position so it
  always has somewhere to render.

The marker is added with `usingOperation: false, affectsData: false`, so it
**never touches saved data or the undo stack and never moves the model
selection**. Its CSS makes it **inert** -- `pointer-events: none`, non-focusable --
which matters because it lives _inside_ the editable and must not intercept the
click that re-places the caret or trip a Reka dismissal. (The marker CSS also
neutralizes descendant `background-color`s within the highlighted range, because
content pasted from word processors often carries opaque backgrounds that would
otherwise paint over the translucent highlight and hide it.)

Show/hide is driven externally by the guard's `beginSelectionGuard` /
`endSelectionGuard`, ref-counted **per owner** (`engageCount`) -- not per editor.
The session is keyed by owner and remembers which sub-editor's marker is currently
shown, so a disengage acts on the same marker the engage raised even if the owner's
active sub-editor changed in between. This is the Layer B analog of the portal's
single-owner handover (section 2.4): keying the lifecycle to the stable identity
(the owner) and handing the marker over on a sub-editor switch keeps it structural,
where a plain per-editor count would strand a marker on the old sub-editor whenever
`beginSelectionGuard` and `endSelectionGuard` resolve different ones.

- **`beginSelectionGuard(owner)`** -- increment the count, cancel any pending hide,
  and show the marker over the current model selection. If a _different_ sub-editor
  became active while the session was already open, hand the marker over first --
  hide the old sub-editor's, show the new one's.
- **`endSelectionGuard(owner, { refocus })`** -- decrement; when it reaches zero,
  schedule (one `requestAnimationFrame`) an optional editable refocus followed by
  hiding the pinned sub-editor's marker, then drop the session (so it stops pinning
  that editor). A `beginSelectionGuard` arriving before that frame cancels the hide,
  so a control-to-control handoff doesn't flicker.

### 2.6 Restoring editable focus -- `tryRefocusEditable`

When a control closes, focus must usually return to the editable so the real
selection repaints and the user can keep typing. `tryRefocusEditable` calls
`editor.editing.view.focus()` only when the closing overlay **orphaned** focus --
`document.activeElement` is `<body>`/null (e.g. Escape, or a popover whose trigger
refocus we prevent), **or** focus landed on one of _our own controls_ inside the
zone (a trigger/option/listbox). It deliberately does **not** steal focus when the
user placed it in the editable (clicked text) or genuinely outside the zone
(clicked the score canvas). The two cases are distinguished by `isInOwnFocusZone`,
which tests the editor's registered containers **and the shared portal**.

Counting the portal here is essential. On a combobox close-by-select, Reka's
`ComboboxContentImpl` keeps focus on the selected option -- which lives in the
portal -- at the moment `endSelectionGuard({ refocus: true })` runs (`engageCount` is already 0).
Without counting the portal, the guard would mistake that for a deliberate move
elsewhere, never refocus the editable, and the selection would stay invisible with
focus stranded on the dropdown.

The refocus is deterministic, not a race against Reka's timing. Reka's
`ComboboxContentImpl` wraps its content in a `FocusScope` whose mount- and
unmount-auto-focus are both prevented, so it never fights us for focus; its only
close-focus move is refocusing the combobox trigger on unmount, and that is gated
on `!activeElement || activeElement === document.body`. So wherever focus sits
when the dropdown closes -- on the selected option (in the portal) or on the
trigger (inside a registered container) -- it is inside the zone, and
`isInOwnFocusZone` recognizes it so `tryRefocusEditable` pulls it back. The
one-frame `requestAnimationFrame` in `endSelectionGuard` is **not** timing the unmount; it only
coalesces control-to-control handoffs (a following `beginSelectionGuard` cancels it). Once the
editable is focused, Reka's gated trigger-steal is a no-op (`activeElement` is no
longer `<body>`), in whatever order the two happen. (The color picker is a
`Popover`, which exposes a cancelable `close-auto-focus` it prevents directly; the
size field passes `refocus: false` because the user is usually tabbing to a
deliberate next target.)

### 2.7 Where each control plugs in

- **`RichTextToolbar.vue`** has a single root `<div ref="toolbarRoot">` and calls
  `attachFocusZone(() => props.element, toolbarRoot)`. The font combobox and the
  paragraph-style and font-style selects wire
  `@update:open` -> `beginSelectionGuard` / `endSelectionGuard({ refocus: true })`; the size field wires
  `@focuscapture` -> `beginSelectionGuard` and `@blurcapture` -> `endSelectionGuard({ refocus: false })`.
- **`PropertiesRichTextStyle.vue`** is a fragment, so it is wrapped in
  `<div ref="panelRoot" class="contents">`. Tailwind's `contents`
  (`display: contents`) removes the wrapper's own box -- preserving the panel's
  layout -- while keeping it a real DOM ancestor, which is all `focusTracker`
  containment and capture-phase listeners need. Font combobox, paragraph-style and
  font-style selects, and color picker
  wire `@update:open` -> `beginSelectionGuard` / `endSelectionGuard({ refocus: true })`; the size field wires
  focus/blur capture.
- **Select-shaped controls** (`ParagraphStyleSelect`, `FontStyleSelect`) ride the
  same zone, with two `richTextPortal`-gated preventions of their own: the trigger
  `preventDefault`s its mousedown (the editable keeps focus while opening), and
  `close-auto-focus` is prevented on the content. The latter is load-bearing:
  unlike the combobox, whose close-time trigger refocus is gated on
  `activeElement` being `<body>`, Reka's `Select` refocuses its trigger on
  content unmount **unconditionally** -- and the unmount trails the close
  animation, so it lands _after_ the guard's refocus and would yank focus off
  the editable again. Preventing it leaves the guard (section 2.6) as the only
  authority over where focus goes on close.
- **Neume-attribute controls** in the panel (the neume `InputUnit`s, `Select`s,
  and the neume color picker) are intentionally **not** wired to `beginSelectionGuard`/`endSelectionGuard`.
  They live inside `panelRoot` or open into the portal, so Layer A keeps the
  editor active and `updateNeumeAttributes` works -- but no _text_ marker is wanted
  over a selected widget.
- **Native balloons** (`RichTextToolbarItem` -> link/image/table/find) need **no
  code of ours**. CKEditor owns its body collection (`editor.ui.view.body` --
  balloons, dialogs) and keeps those elements in its own `editor.ui.focusTracker`
  as they are added, and those buttons `preventDefault` their mousedown, so opening
  them keeps `isFocused` true automatically. This is the same public mechanism
  (`focusTracker`) Layer A uses for our Reka UI; we rely on CKEditor keeping its
  balloons in its own focus zone, not on any internal of how it does so.

### 2.8 Sharing the controls with non-rich-text usages

`FontCombobox`, `ColorPicker`, `ParagraphStyleSelect`, `FontStyleSelect`, and
`InputUnit`/`InputFontSize` are also used by
non-rich-text dialogs and panels, so their focus-related behavior is scoped so
those other usages are unaffected:

- The `update:open`, `focuscapture`, and `blurcapture` emits are inert wherever a
  parent doesn't handle them.
- `ColorPicker`'s focus interception (preventing trigger refocus on close, staying
  a _non-modal_ popover so the user can click back into the editor) is gated on its
  `richTextPortal` prop. When that prop is unset, Reka's default focus-return
  behavior applies, which keyboard accessibility relies on. The selects' trigger
  mousedown and `close-auto-focus` preventions (section 2.7) are gated on the same
  prop, for the same reason.
- `FontCombobox`'s `@mousedown.prevent` on its trigger is the conventional combobox
  pattern (the trigger is `tabindex="-1"` and opens on click).

### 2.9 How it composes: a worst-case sequence

The font combobox is the hardest interaction -- it opens a search input (stealing
focus), holds a selection to act on, and refocuses its own trigger on close.
Tracing it shows every layer cooperating. Assume an expanded selection in editor
A, whose toolbar root and the shared portal are already registered (sticky).

1. **Idle.** The editable is focused, `isFocused` is true, and A is the active
   editor for the owner.
2. **Press the trigger.** `@mousedown.prevent` keeps the editable focused; the
   click opens the combobox -> `@update:open(true)` -> `beginSelectionGuard(A)`, which shows the
   fake marker over the model selection.
3. **Reka focuses the search input** (in the portal). The editable blurs, but
   CKEditor's deferred blur check finds `document.activeElement` inside the
   registered portal, treats it as contained, and **fires no blur** -- A stays
   active and the toolbar stays enabled. The real highlight is gone (the editing
   view is unfocused), so the marker stands in for it.
4. **Pick a font.** `@update:model-value` -> `onFontFamilyChanged` ->
   `execForOwner` runs `fontFamily` on the still-intact model selection; `open`
   becomes false.
5. **Close.** `@update:open(false)` -> `endSelectionGuard(A, { refocus: true })`. Reka parks
   focus on the trigger/option (inside the registered container/portal), so
   `isFocused` never dips. One frame later the deferred callback runs:
   `document.activeElement` is our own chrome, so `isInOwnFocusZone` is true ->
   `editor.editing.view.focus()` pulls focus back to the editable. Reka does not
   fight this -- its combobox prevents its own focus-scope auto-focus, and its only
   close move (refocus the trigger) is gated on `activeElement` being `<body>`, so
   once we hold focus it is a no-op regardless of ordering (section 2.6). The real
   selection repaints with the new font, then the marker hides.
6. **A genuine blur, later** (click the canvas or outside): focus leaves the
   editable, toolbar, and portal together -> `isFocused -> false` fires natively
   -> the normal clear + `blur`/persist runs.

The size field is the same shape but simpler (`@focuscapture` / `@blurcapture`
with `refocus: false`, since the user is usually tabbing to a deliberate next
target). The color picker is also the same shape but, being a `Popover`, cancels
its own close refocus with `@close-auto-focus.prevent`; the combobox has no such
cancelable event, so it relies on the zone reclamation in step 5 instead (section
2.6).

### 2.10 Invariants the design preserves

A change anywhere in this subsystem should keep all of these true:

- **The zone is registered before focus can enter it.** Registration is sticky and
  keyed to the current editor, never created on control-open -- otherwise the
  capture-phase listener is not present in time to cancel the editable's blur
  (section 2.4).
- **`focusTracker.remove` runs only on editor change or unmount**, never during a
  control close. A transient close-focus move must not deregister anything, or it
  reintroduces the very `isFocused` dip the zone exists to prevent.
- **`beginSelectionGuard` / `endSelectionGuard` are idempotent and ref-counted per
  owner, targeting that owner's active sub-editor's marker.** Overlapping
  engagements and control-to-control handoffs hide-then-show without flicker and
  without disturbing the zone registration. A sub-editor switch mid-engagement
  hands the marker over rather than stranding it -- the same structural move as the
  portal handover, applied to Layer B (section 2.4, section 2.5).
- **At most one editor is tracked per consumer at a time**, so focusing a dropdown
  can never set the active editor to the wrong owner (section 2.4).
- **The editable is deliberately not a dismissable layer.** We never
  `preventDefault` Reka's `focusOutside` / `pointerDownOutside` for editable
  interactions: clicking the text _should_ dismiss an open dropdown and place the
  caret. The marker is inert (`pointer-events: none`) for the same reason -- it
  must not absorb that click (section 2.5).

---

## 3. Content persistence: the flush invariant

### 3.1 Content is live in the editor, stale in the model

Because content is bound one way (section 1.2), live keystrokes never propagate back to
`element.content`. The model field is updated only by an explicit **flush**:

```ts
flushPendingRichTextEditors(workspace)
  -> getPendingRichTextBoxUpdates(element)   // diffs each sub-editor's getData()
  -> updateRichTextBox(element, updates)      // writes element.content, then save()
```

This deferral is **deliberate**. Writing `element.content` runs
`updateRichTextBox` -> `save()` -> `LayoutService.processPages()` plus a localStorage
write. Flushing on every keystroke or every toolbar interaction would pay that full
layout round-trip continuously. Instead, content is flushed at a small number of
well-defined moments.

Flushing on _editing-view blur_ (which would drop the explicit flushes) is **not**
viable: Ctrl+S, copy, and cut with the caret still in the editable never blur the
editing view, so the explicit flushes would still be required -- and it would
reintroduce the per-interaction layout cost. So the flush stays explicit, funneled
through a few gates (section 3.2) rather than scattered or automated.

### 3.2 The invariant and its gates

> **Invariant.** Any path that reads `element.content` to serialize or clone the
> score for persistence, export, or the clipboard must flush the live editors
> first.

To stop that from being a rule each new call site has to remember, the flush is
funneled through two gates plus one boundary flush, all in `TheEditor.vue`:

- **`prepareWorkspaceForSerialization(workspace)`** -- the gate for
  serialize / export / print. Save, save-as, print, and the PDF/PNG/HTML/MusicXML/
  LaTeX exporters all route through it; it flushes before handing off. Any
  exporter that routes its serialization through this function gets the flush for
  free. (It also runs a lyrics serialization step, unrelated to rich text.)
- **`flushAndCloneForClipboard(elements)`** -- the gate for copy / cut. It
  flushes and then `clone()`s in one helper, so the flush and the clone are
  inseparable and a new clipboard path cannot forget the flush. (`clone()` -
  `getClipboardProperties()` reads `element.content`, which is why the order
  matters.)
- **Flush on workspace switch** -- the `selectedWorkspace` setter flushes the
  workspace being _left_ before switching. Combined with the rule that only the
  _selected_ workspace has live editors (`flushPendingRichTextEditors`
  early-returns for any other workspace), this guarantees a non-selected workspace
  is always already fresh. Closing a workspace or the application flushes for the
  same reason.

During ordinary editing, none of these is the common case: the everyday flush is
the **blur** path (section 1.4). The gates cover precisely the actions that read
content _without_ first blurring the editable.

### 3.3 The deliberate exception: debounced autosave

`save()` auto-persists to local/dev storage by serializing with
`SaveService.SaveScoreToJson(score)` **without flushing**. This is intentional:

- `save()` runs frequently -- often via the 250 ms-debounced `saveDebounced` (e.g.
  on every height change while editing) -- and flushing there would force a
  `getData()` + full-layout round-trip every time.
- It would also be re-entrant: `updateRichTextBox` itself calls `save()`.

So the autosaved snapshot may lag the in-editor text by **one flush**. That is
acceptable because it is corrected on the next blur or explicit save, and the
_authoritative_ save (`saveWorkspace` -> `prepareWorkspaceForSerialization`) always
flushes first. The precise statement of the invariant is therefore _"flush before
**explicit** serialize/clone,"_ not _"always flush before any serialize."_

This is also why the flush is **not** pushed down into
`SaveService.SaveScoreToJson`, which would be the only way to make it fully
structural: that function is the universal, pure serializer with no editor or
workspace access, and the autosave exception means it must _not_ always flush.
The gates plus this note are the correct level of abstraction.

### 3.4 Geometry must not round-trip content

A font or size change that alters a box's rendered height fires `TextBoxRich`'s
`ResizeObserver`. That callback emits **`update:height`** (->
`updateRichTextBoxHeight`, which sets `element.height` directly and debounce-saves)
-- **not** `update` (-> `updateRichTextBox`).

The distinction is load-bearing. `updateRichTextBox` unconditionally merges
`getPendingRichTextBoxUpdates(element)` into its change, and those pending updates
include the editor's current `getData()`. Because content is stale in the model
during editing (section 3.1), a height-only change routed through `updateRichTextBox`
would get a `content` key injected, with two bad effects:

1. The change becomes two-keyed, breaking the single-key `noHistory` guard, so a
   pure resize produces a spurious undo entry and a full save.
2. The injected content echoes back through `:model-value` to the wrapper, which
   could call `editor.data.set()` -- and `data.set()` resets the model selection to
   document start. A geometry change would silently **collapse the user's
   selection** mid-edit.

Routing geometry through `update:height` keeps it off the content path entirely:
no `getData` merge, no `data.set`, no collapse, no churn. Content is still
persisted reliably by the blur and gate flushes, so nothing is lost.

### 3.5 Echo suppression: content is pushed only when it differs

`data.set()` resets the model selection to the document start (section 3.4), so
re-pushing content the editor already holds would collapse the user's selection
mid-edit. A round-trip does exactly that: a flush writes `editor.getData()` into
`element.content`, which flows straight back in through `:model-value`. The content
has not changed, but a naive bind would still call `data.set()`.

`RichTextEditor.vue` suppresses that echo itself, with two independent moves.
First, it binds `:model-value` to a **one-time snapshot** (`const initialData =
props.modelValue`), so the value the `<Ckeditor>` wrapper sees never changes after
creation and the wrapper's own model->editor watch never re-fires -- `:model-value`
therefore only ever seeds the editor's initial content. (Separately,
`disable-two-way-data-binding` turns off the wrapper's _reverse_ editor->model
emit -- the one-way binding of section 1.2 -- so live keystrokes don't flow back out
through the wrapper either.) Second, it drives every later content update itself,
from its own `watch(() => props.modelValue, ...)`, calling `editor.data.set()`
directly **only when the incoming content differs from the editor's live
`getData()`**. An echo (equal to live content) is dropped, so no `data.set()` runs
and the selection survives; genuinely new content
-- undo, file load, or switching which element the editor is bound to -- differs,
so it is applied.

Owning the sync, rather than leaning on the wrapper's internal `lastEditorData`
deduplication, keeps the app independent of a third-party implementation detail and
avoids two failure modes. (1) The wrapper maintained its dedupe key on a ~300 ms
debounce, so a flush within that window of a multi-character burst could slip an
echo through and collapse the selection; comparing against the live `getData()` is
synchronous, so no such window exists. (2) The live comparison must drive
`data.set()` _directly_. A guard that instead mirrors the incoming value into an
intermediate `ref` (letting the wrapper's own watch do the `set`) can silently fail
to apply a real change that happens to equal a stale mirror value -- e.g. undoing a
non-selected box back to a value it held before an unflushed edit -- because
assigning a `ref` its current value is a no-op, so the `set` never fires and the
editor drifts out of sync with the model. Calling `data.set()` from the comparison
has no such hole.

---

## 4. External behaviors relied upon

The design leans on specific, verified behaviors of its dependencies. They are the
load-bearing third-party contracts; a major version bump should re-check them.

**CKEditor 5:**

- `editor.ui.focusTracker.add(el)` / `.remove(el)` -- accept a DOM element, listen
  in the capture phase, and defer blur with `setTimeout(0)` + a containment check.
  Registering a node cancels a pending blur when focus moves into it. (section 2.4)
- `editor.ui.focusTracker.add` does **not** affect
  `editor.editing.view.document.isFocused`; the renderer skips painting the real
  selection while the editing view is unfocused. (section 2.2)
- `editingDowncast.markerToHighlight` / `markerToElement`, and
  `writer.addMarker(name, { usingOperation: false, affectsData: false, range })` --
  a marker that never affects data, undo, or the selection. (section 2.5)
- `editor.ui.view.body` (the body collection: balloons, dialogs) is kept in the
  editor's own `editor.ui.focusTracker` by CKEditor as elements are added, so its
  native balloons stay inside the editor's focus zone without our help. (section 2.7)
- `DataController.set()` (reached via the Vue wrapper's `editor.data.set`) resets
  the model selection to document start. (section 3.4)

**reka-ui:**

- `Combobox` focuses its input on open; `ComboboxContentImpl` refocuses the
  trigger on unmount **only** when `!activeElement || activeElement ===
document.body`, and defers that unmount behind its open/close animation. (section 2.6)
- `Popover` distinguishes modal vs non-modal and, when non-modal, exposes a
  cancelable `close-auto-focus`. (section 2.6, section 2.8)
- `NumberField` re-focuses its input on stepper activation, which the size field's
  focus/blur-capture debounce must tolerate. (section 2.7)

**`@ckeditor/ckeditor5-vue`:**

- Two-way binding is disabled (the wrapper's editor->model emit is off), and
  `:model-value` is bound to a one-time snapshot so the wrapper's model->editor
  watch never re-fires -- so the app does not depend on the wrapper's internal
  `lastEditorData` dedupe. `RichTextEditor.vue` owns the model->editor sync,
  pushing a changed `props.modelValue` to `editor.data.set()` only when it differs
  from the live `getData()`. (section 3.5)

---

## 5. File map

The subsystem spans these files, grouped by concern.

**The editor and its host:**

- `src/customEditor.ts` -- `InlineEditor` (DecoupledEditor) config (empty toolbar)
  and plugin registration, including `NeanesFakeSelectionEditing`.
- `src/components/RichTextEditor.vue` -- the `<Ckeditor>` wrapper; registers and
  unregisters editors and emits `ready`/`blur`; owns content echo suppression with
  two-way binding disabled (section 3.5).
- `src/components/TextBoxRich.vue` -- lays out an element's sub-editors, pulls
  content on blur, and routes geometry through `update:height` (section 3.4).
- `src/composables/useRichTextEditorRegistry.ts` -- the editor-to-owner registry,
  active-editor tracking, and `resolveActiveOrLastEditorForOwner` (sticky
  registration).

**Focus and selection:**

- `src/composables/useRichTextSelectionGuard.ts` -- the focus zone (Layer A) and
  the selection marker's `beginSelectionGuard`/`endSelectionGuard` lifecycle (Layer B).
- `src/ckeditor-plugins/richtextselection/richtextselection.ts` + `.css` -- the
  fake-selection marker plugin and its inert styling.
- `src/composables/useRichTextPortalRoot.ts` -- the shared body-level dropdown
  portal that the focus zone registers.

**The custom UI:**

- `src/components/RichTextToolbar.vue`,
  `src/components/properties/PropertiesRichTextStyle.vue` -- the toolbar and
  properties panel; they attach the focus zone and wire the marker (section 2.7).
- `src/components/FontCombobox.vue`, `ColorPicker.vue`, `InputUnit.vue`,
  `InputFontSize.vue` -- controls shared with non-rich-text usages, carrying
  reuse-safe focus events (section 2.8).

**Persistence:**

- `src/components/TheEditor.vue` -- the persistence pipeline and the flush gates:
  `prepareWorkspaceForSerialization`, `flushAndCloneForClipboard`,
  `flushPendingRichTextEditors`, `updateRichTextBox` / `updateRichTextBoxHeight`,
  and the `save()` autosave exception (section 3).
