# Embedded Initial Martyria in Rich Text

## Goal

Make an initial martyria (mode key) a first-class inline object inside a rich
text box. Reuse the existing Vue `ModeKey` renderer and the existing "Select
Initial Martyria" dialog rather than implementing a separate CKEditor drawing
or a second mode-key model.

The current branch has not been released. Remove the standalone `ModeKeyElement`
inline feature completely. There is no saved-file compatibility or migration
requirement for inline mode keys created by this branch.

## Product behavior

### Insert

- Keep the rich-text toolbar button for inserting an initial martyria.
- Clicking the button opens the existing `ModeKeyDialog` (the dialog presented
  to users as "Initial Martyria") instead of immediately inserting a fixed
  template.
- Capture and preserve the CKEditor selection before opening the dialog. The
  chosen martyria is inserted at that saved selection when the user confirms or
  double-clicks a template.
- Build the dialog's draft `ModeKeyElement` from the current document defaults
  and the formatting at the saved cursor position.
- The inserted martyria's font size must initially match the effective rich-text
  font size at the cursor. Read an explicit CKEditor `fontSize` attribute first;
  if none exists, resolve the active paragraph style and rich-text fallback.
- Preserve the dialog's existing optional-diatonic-fthora behavior, including
  its document-level setting update.
- Canceling the dialog makes no content change. If the editor or saved selection
  is no longer valid, cancel the pending insertion safely.

### Select and edit

- Treat the embedded martyria as one CKEditor inline object. It is selectable,
  deletable, copyable, and undoable as a single unit.
- Double-clicking it opens the same `ModeKeyDialog`, initialized from the
  embedded martyria's complete current state.
- The rich-text properties panel shows an embedded "Initial Martyria" section
  whenever the object is selected.
- That section contains a "Select Initial Martyria" button that opens the same
  dialog for replacement/editing.
- The section also exposes the applicable normal mode-key settings directly:
  style, font-size override, color override, stroke-width override, BPM,
  attraction flags, tempo, and the underlying musical fields already available
  for a normal mode key.
- Applying a template in the dialog replaces the embedded martyria's template
  and musical structure while preserving the same override behavior used by a
  standalone mode key.
- Provide the existing style-management action from the properties section so
  users can open `InitialMartyriaStylesDialog`. Changes made there refresh the
  selected and all other mounted embedded martyriae immediately.
- Do not expose standalone-container settings that have no inline meaning:
  page alignment, margins, ambitus display, or right-aligned tempo placement.

## CKEditor architecture

- Promote `insertmodekeypoc` to a production `insertmodekey` plugin and remove
  all POC names, CSS classes, and fixed-template assumptions.
- Register a CKEditor inline object model element, tentatively named `modeKey`.
- Use a normal CKEditor widget as the selectable container and a `RawElement`
  inside it as the Vue mount host. Vue owns only the raw host; CKEditor owns the
  model object, selection, outer DOM, and lifecycle.
- Continue rendering with the existing `ModeKey.vue`. Pass an explicit
  `embedded` rendering context rather than retaining `ModeKeyElement.inline`.
- Keep the embedded renderer's local zoom neutral (`--zoom: 1`). It is already
  inside the independently scaled rich-text surface and must not apply the
  workspace zoom a second time.
- Give the widget an accessible label derived from the selected martyria.
- Explicitly unmount Vue roots when widgets disappear and when the editor is
  destroyed so `ResizeObserver` and Vue resources are released.

## Embedded data model and serialization

- Persist all durable properties needed to reproduce and interpret the
  martyria:
  - template ID and mode;
  - scale and physical scale note;
  - martyria, note, fthora, and quantitative-neume fields;
  - tempo and BPM;
  - attraction and permanent-enharmonic-Zo flags;
  - initial-martyria style ID;
  - font-size, color, and stroke-width overrides.
- Do not persist computed dimensions, resolved typography, Vue state, or layout
  caches.
- Use CKEditor model attributes as the editing source of truth. Serialize them
  to controlled HTML with a versioned Neanes payload so saved rich text can be
  inspected without mounting Vue or CKEditor.
- Add one shared codec for validation, defaults, serialization, deserialization,
  scanning, and attribute-to-`ModeKeyElement` hydration. Unknown or malformed
  payloads must not affect musical mode and must degrade safely in the editor.
- Keep the save format at version 1 in accordance with the repository's existing
  compatibility policy.

## Dialog targeting and selection preservation

The existing `ModeKeyDialog` currently assumes that `selectedElement` is a
standalone `ModeKeyElement`. Replace that assumption with an explicit dialog
target:

- `standalone`: update the selected score element as today;
- `rich-text-insert`: insert into a saved editor selection;
- `rich-text-edit`: update a specifically selected CKEditor `modeKey` object.

For rich-text targets:

- Store the target editor and a CKEditor model selection marker before opening
  the modal.
- Hydrate a temporary `ModeKeyElement` for the dialog and previews.
- On confirmation, execute either `insertModeKey` or `updateModeKeyAttributes`
  against the stored target in one CKEditor model batch.
- Remove the marker and return focus to the editor after confirm or cancel.
- Double-click and the properties-panel button must go through the same target
  setup and update path; neither should contain its own replacement logic.

## Shared properties UI

- Extract reusable semantic and appearance controls from
  `PropertiesModeKey.vue` into a shared mode-key settings component or
  composable.
- Standalone mode keys use the full control set.
- Embedded mode keys use the applicable subset and send changes through a new
  `updateModeKeyAttributes` CKEditor command.
- Follow the existing embedded-neume command pattern: the command observes the
  selected object, exposes its current properties, and updates model attributes
  in a single change block.
- Extend `PropertiesRichTextStyle.vue` and `PropertiesRichTextBox.vue` with the
  initial-martyria style collection and the events required to open both the
  selector and style-management dialogs.
- Keep all new visible labels in every locale file.

## Rich-text formatting integration

- Allow `fontSize` and `fontColor` on the CKEditor `modeKey` object schema.
- When a selection contains text before the martyria, the martyria, and text
  after it, the existing rich-text font-size and color controls must update all
  three in one operation.
- Map those CKEditor attributes to the embedded martyria's font-size and color
  overrides.
- Clearing a formatting attribute has semantic meaning:
  - surrounding text returns to its paragraph style;
  - the martyria returns to its initial-martyria style.
- Insertion creates a font-size override only when needed to match the effective
  cursor size. Other martyria properties continue to inherit their selected or
  document-default initial-martyria style.
- Verify CKEditor's standard `FontCommand` first. It operates over schema-valid
  selection ranges and should include the inline object. If object reconversion
  is unreliable, wrap the font commands so text and `modeKey` objects are
  updated in the same CKEditor batch while preserving the existing toolbar and
  properties UI.

## Style resolution and live refresh

Resolve embedded appearance in this order:

1. Explicit embedded overrides.
2. The embedded martyria's selected initial-martyria style.
3. The document-default initial-martyria style.
4. The paragraph style referenced by that initial-martyria style.

Thread `score.initialMartyriaStyles` through every `TextBoxRich` rendering
surface, including staff, header, footer, multipanel, and calculation-only
renders.

Mounted widgets must refresh without modifying CKEditor data when any of these
change:

- page setup or document-default initial-martyria style;
- custom initial-martyria style collection;
- paragraph styles referenced by initial-martyria styles;
- embedded martyria attributes.

Style deletion, replacement, copy, and paste must scan embedded payloads and
remap their initial-martyria and paragraph-style dependencies using the existing
clipboard/style-resolution infrastructure.

## Automatic musical mode detection

Create one pure resolver for a rich-text box:

```text
effective mode change =
    manual mode-change override, when enabled
    otherwise the last valid embedded initial martyria
    otherwise no mode change
```

- Rename the current "Change Mode" UI to "Mode Change Override". Keep its
  existing persisted fields, but make clear that it overrides automatic
  detection rather than enabling it.
- Determine the last embedded martyria in a stable content-field order:
  - ordinary/inline rich-text box: `content`, then `contentBottom`;
  - multipanel rich-text box: `contentLeft`, `contentCenter`, `contentRight`;
  - within a field: CKEditor document order.
- Do not reverse the structural field order for RTL text.
- A rich-text box occupies one position in the staff sequence. Only the last
  martyria in that box affects score elements following the box; embedded
  positions do not interleave with staff notes.
- Hydrate the effective embedded payload into a normal `ModeKeyElement` and
  reuse the normal mode-key semantic processing path.
- Replace the reduced rich-text mode-change branches in audio analysis, layout
  and martyria calculation, MusicXML export, and lyric segmentation with the
  shared resolver.
- Embedded mode-key insertion, removal, editing, and CKEditor undo/redo must
  update musical state without waiting for editor blur. Listen for a changed
  embedded-mode-key signature, synchronize the affected content field, and
  request the existing save/layout/analysis refresh only when that semantic
  signature changes.

## Remove the unreleased standalone-inline implementation

Because this branch has never shipped, remove the feature directly with no
migration path:

- Remove `ModeKeyElement.inline` from the runtime model, clipboard properties,
  and tests.
- Remove `inline` from the v1 saved `ModeKeyElement` shape and from save/load
  code added on this branch.
- Remove the Inline switch and conditional standalone controls from
  `PropertiesModeKey.vue` and `ToolbarModeKey.vue`.
- Remove all standalone-inline mode-key branches from `LayoutService`,
  `ByzHtmlExporter`, `isBlockElement`, and related tests.
- Replace `ModeKey.vue` checks of `element.inline` with the explicit `embedded`
  rendering context where inline rendering differences are genuinely needed.
- Preserve the general mode-key geometry and initial-martyria style work from
  the previous commits; the embedded renderer depends on it. Do not revert the
  commits wholesale.
- Do not attempt to open or convert score files produced only by unreleased
  builds of this branch.

## Export and non-editor consumers

- PDF and PNG output may use the live Vue-mounted DOM.
- ByzHTML export must replace semantic embedded markers with static mode-key
  HTML through the existing mode-key exporter; exported HTML cannot depend on a
  Vue mount.
- Plain-text extraction, running markers, search, and language inference should
  ignore the payload and treat the widget as a non-text object.
- Copy/paste between scores must carry any referenced custom initial-martyria
  styles and their paragraph-style dependencies.

## Implementation order and gates

### 1. Production visual and interaction gate

- Rename and harden the POC plugin.
- Open `ModeKeyDialog` from the insert button while preserving the cursor.
- Insert the selected template with the effective cursor font size.
- Support object selection, double-click editing, properties-panel dialog
  editing, delete/backspace, undo/redo, copy/paste, and save/reload.
- Confirm baseline alignment at several surrounding font sizes and fonts.
- Confirm proportional rendering at 50%, 100%, and 200% workspace zoom.
- Confirm a text-plus-widget selection can change font size and color together.
- Stop and reassess the architecture if baseline or range formatting remains
  unreliable.

### 2. Full properties and reactive styles

- Add the complete payload and `updateModeKeyAttributes` command.
- Extract and reuse normal mode-key property controls.
- Add selector and style-manager buttons to the embedded properties section.
- Thread styles into every rich-text surface and refresh mounts reactively.

### 3. Automatic mode semantics

- Add the codec, scanner, deterministic ordering, and effective-mode resolver.
- Add immediate semantic synchronization.
- Reuse the standalone mode-key path in analysis, layout, MusicXML, and lyrics.
- Rename and reposition the manual mode-change controls as an override.

### 4. Remove standalone inline mode keys

- Delete the unreleased runtime, UI, save/load, layout, exporter, and test
  branches.
- Retain only the embedded rendering context and shared geometry.

### 5. Export, clipboard, and hardening

- Add static ByzHTML rendering.
- Add style dependency collection and ID remapping.
- Add malformed/unknown payload handling and accessibility labeling.

## Verification

Add pure tests where DOM behavior is not required:

- payload codec and validation;
- content-field ordering and "last martyria wins";
- manual override precedence;
- template replacement and override preservation;
- style dependency collection and remapping;
- audio analysis and mode state;
- martyria/layout state;
- MusicXML and ByzHTML export;
- save/reload round trips;
- confirmation that new saves contain no standalone mode-key `inline` field.

Use real browser/manual tests for CKEditor and Vue integration, consistent with
the repository rule against DOM emulation, mocks, and stubs:

- insert dialog confirm, double-click confirm, and cancel;
- preserved cursor and focus restoration;
- properties-panel edit button;
- style-manager changes updating mounted widgets;
- selection across text and widget;
- font-size/color apply and clear;
- delete/backspace and arrow-key navigation;
- copy/paste and undo/redo;
- save/reload;
- multiple widgets and last-one-wins behavior;
- manual override behavior;
- baseline alignment and zoom scaling.

## Completion criteria

- There is no standalone inline mode-key feature or compatibility code.
- The toolbar insertion button always uses the existing initial-martyria
  chooser.
- An embedded martyria can be edited by double-clicking it or by using the
  properties-panel chooser button.
- Embedded and standalone martyriae share renderer, template semantics, style
  resolution, and musical-mode processing.
- Style/default changes refresh embedded rendering immediately.
- Rich-text range formatting can include embedded martyriae.
- Automatic mode detection uses the last embedded martyria unless the explicit
  manual override is enabled.
- Baseline alignment and zoom behavior remain visually correct.
