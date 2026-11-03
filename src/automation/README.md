# Automation code

This directory owns automation-only renderer behavior and contracts shared with
Electron main. Shared document operations live in `src/services/documents/`,
reusing the existing model, history, lyric, layout, and rendering services.

- `contracts/`: tool inputs, outputs, errors, property schemas, published JSON
  schemas, and API guidance. These modules are also imported by Electron main.
- `documents/`: API discovery and references, revisions, read projections,
  sequential edit planning, the MCP adapter to shared document operations, and
  private document ownership, capacity, and disposal. Workers own one store; batch
  operations own separate temporary stores.
- `renderer/`: the editor integration hook, request dispatch, readiness, worker
  lifecycle, and explicit-path PDF dispatch.
- `ipc/`: the Electron-only client for automation file and export requests.

`electron/main/automation/` owns HTTP/MCP transport, authentication, file validation,
request coordination, and tool publication. Its entry point is `host.ts`.
The editor attaches `useEditorAutomation` with explicit application hooks; it
retains interactive selection, focus, dialogs, recovery, and rendering.

Shared application services must not import automation modules. ESLint enforces
this for services, models, utilities, composables, and Electron file/export code.
Automation prepares edit plans, waits for fonts, checks revisions, and commits
through `DocumentService.changeElements`. That shared callback supplies change
notifications without depending on API action types or element references.
Paragraph style graph validation and reference repair stay shared; API action
batches and read projections live here.

Score encoding and in-place writes remain in `electron/main/files/scoreFiles.ts`. Automation file policy lives in `electron/main/automation/scoreFiles.ts` and reuses that encoding. Existing score files are not atomically replaced.
Detached rendering remains in `electron/main/export/`, `ExportRenderer.vue`,
`ScorePrintPages.vue`, and `ScorePageContent.vue`; ordinary printing and exports
use that same code. File I/O types in `src/services/documents/fileTypes.ts` are
shared by both file paths, rather than being MCP tool contracts.

Tests live beside their owners. MCP lifecycle and transaction scripts live in
`tests/integration/mcp/`. Shared rendering regressions live in `tests/integration/rendering/`; they
use the Electron debugging endpoint as their test driver.

Future automation jobs and export transformations belong in this feature area
(and its Electron counterpart), reusing shared document and rendering behavior.

## Footnotes (proof of concept)

`edit_elements` supports `insert_footnote` with a main-score Note or Martyria `elementRef`
(and optional body `elements`) and `remove_footnote` with that musical reference.
For a main-score RichTextBox, `insert_footnote` also requires `contentKey` and
`htmlOffset`: a UTF-16 offset in the stored panel HTML, within paragraph text or
immediately after a paragraph opening tag. Insertion inside tags, entities, or
surrogate pairs is rejected. The panel must be active for the box's layout.
Rich markers serialize as atomic `span.neanes-footnote` objects with a
`data-footnote-id` attribute; displayed numbers are generated. Native superscript
and surrounding inline formatting wrap the marker. These wrappers must be
preserved when editing HTML. To remove a rich
reference, update that panel's HTML to remove its span, or remove the owning box.
The same transaction removes the body; undo restores both. Unknown or duplicate
references and references outside main-score rich textboxes are rejected.
Panel reference order is left/center/right for multipanel boxes and top/bottom
for inline boxes, in document order. Plain textbox references are unsupported.
Each reference owns a separate body; nested and shared references are unsupported.
Read the musical anchor's read-only `footnoteId`, calculated `footnoteNumber` (automatic references only), and `footnoteMarker` (the displayed label), then use
`collection: { kind: "footnote", footnoteId }` with normal element readers/edits.
The body retains its terminal Empty element and its own lyrics. In populated
bodies the terminal has no layout box, reservation, or page occurrence; completely
empty bodies retain the visible insertion target and its page occurrence.
Collection readers and edits continue to include the terminal. Musical state
starts from immediately after the anchor and then evolves independently. Rich
references use the context at their textbox. With no explicit body elements, a
rich reference creates an empty RichTextBox styled with Footnote Text; musical
references create an empty staff.
Removing its main-score reference removes the body in the same history operation;
copying the reference copies the body with a new identity.

`get_page_setup` / `update_page_setup` expose `firstFootnoteNumber`,
`showFootnoteHorizontalRule`, and `footnoteHorizontalRuleLength` (percent).
Use `update_footnote` with `footnoteId` and `marker` to change a marker. Null restores
automatic numbering; custom markers are trimmed, contain 1-16 Unicode characters
without control characters, and do not consume an automatic number. `get_elements`
for a footnote collection includes `footnote: {id, marker, label, number}`: `marker`
is the stored override or null, `label` is the displayed string, and `number` is
null for custom markers. Rich textbox references display the label directly;
neume and martyria references surround it with parentheses. Body labels have no parentheses.

Page occurrence readers include the `footnote` region; page line counts include
main and footnote lines. Range selections can identify the active footnote
collection. Footnote numbering follows document reference order across pages.
`get_staff_lyrics` and the `set_staff_lyrics` edit action also accept this
collection selector for independent authoritative footnote lyrics.
Whole-footnote pagination is used initially. An oversized body remains editable
and saveable, but settled page discovery/visual export fails explicitly until it
fits. Run the self-launching `footnotes` integration scenario for both document
scopes and real editor/rendering behavior.

Footnote typography uses the built-in `footnote-text`, `footnote-body-marker`,
and `footnote-reference` paragraph styles. Superscript is not a paragraph-style
property. The body-marker style inherits Footnote Text, including its font size.
Body labels render on the baseline, with a period after numeric markers and no
period after symbols. Parenthesized musical references retain their existing position and configured
reference font size without scaling. Rich references use native inline formatting
rather than the musical reference style.
