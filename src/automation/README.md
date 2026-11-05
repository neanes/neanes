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

## Footnotes

Clients can request `get_rich_text_format` with `topics: ["footnotes"]` for the
authoring workflow, constraints, and an executable rich-reference insertion example.

`edit_elements` supports `insert_footnote` with a main-score Note or Martyria `elementRef`
(and optional body `elements`) and `remove_footnote` with that musical reference.
Tempo elements cannot own footnotes and expose no footnote properties.
For a main-score RichTextBox, `insert_footnote` also requires `contentKey` and
`htmlOffset`: a UTF-16 offset in the stored panel HTML, within paragraph text or
immediately after a paragraph opening tag. Insertion inside tags, entities, or
surrogate pairs is rejected. The panel must be active for the box's layout.
Rich markers serialize as atomic `span.neanes-footnote` objects with a
`data-footnote-id` attribute; displayed numbers are generated. Markers render
with `font-variant-position: super`, using the font's superscript glyphs when
available and browser-synthesized glyphs otherwise. Surrounding inline formatting
wraps the marker and must be preserved when editing HTML. To remove a rich
reference, update that panel's HTML to remove its span, or remove the owning box.
The same transaction removes the body; undo restores both. Unknown or duplicate
references and references outside main-score rich textboxes are rejected.
Panel reference order is left/center/right for multipanel boxes and top/bottom
for inline boxes, in document order. Plain textbox references are unsupported.
Each reference owns a separate body; nested and shared references are unsupported.
Read RichTextBox `footnoteReferences` with `properties: ["footnoteReferences"]`
to get `{footnoteId, contentKey}` entries in active panel/source order without
fetching HTML. The property is omitted when there are no active references.
It is read-only; `isNotNull` predicates locate boxes with references.
`insert_footnote` returns `createdFootnotes: [{footnoteId, elementRef, contentKey?}]`
for new bodies surviving the transaction. `elementRef` identifies their final
main-score owner; `contentKey` is present for rich references.
Use these IDs directly in body/marker edits; `includeCreated: false` suppresses
this list as well as created element references.

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

`get_page_setup` / `update_page_setup` expose `footnoteFormat` (`numbers` or
`symbols`), `footnoteNumbering` (`continuous`, `page`, or `section`),
`footnoteSymbolSequence` (`standard` or `asterisks`), `firstFootnoteNumber`,
`showFootnoteHorizontalRule`, `footnoteHorizontalRuleLength` (percent), and
`footnoteReferenceParentheses` (defaults to true; applies to Note and Martyria
reference markers). Placement and collision clearance use measured marker
ink bounds. Symbol positions use the same 1-based `firstFootnoteNumber`:
`U+002A`, `U+2020`, `U+2021`, `U+00A7`, `U+00B6`, `U+2016`, then each symbol
twice, three times, and so on. Starting values are limited to 1,000,000 for
numbers or a label of at most 64 repeated symbols (positions 1-384 in the
standard sequence, 1-64 in the asterisks sequence). Invalid starts are rejected
before applying settings; the automatic sequence itself can continue beyond this
starting-value limit.
The `asterisks` sequence uses `*`, `**`, `***`, and so on. Changing format or
symbol sequence preserves the start and numbering.
Page restarts follow physical pages, independent of displayed page numbers.
Section restarts use the same nonempty section running markers as the editor;
content before the first marker belongs to the initial section. Neither page
nor section restarts consume sequence entries for custom markers.
Use `update_footnote` with `footnoteId` and `marker` to change a marker. Null restores
automatic numbering; custom markers are trimmed, contain 1-16 Unicode characters
without control characters, and do not consume an automatic number. `get_elements`
for a footnote collection includes `footnote: {id, marker, label, number}`: `marker`
is the stored override or null, `label` is the displayed string, and `number` is
null for custom markers. Rich textbox references display the label directly;
musical references surround it with parentheses when
`footnoteReferenceParentheses` is enabled. Body labels have no parentheses.
Musical markers are centered above their anchor. Note and Martyria markers use vertical collision clearance from neumes,
barlines, attached marks, and other reference markers. Their ink starts with its bottom 0.75 neume-font em above
the musical baseline, rising only as needed for collision clearance.
Replacing a musical anchor preserves its footnote and marker offsets; explicit
replacement offsets override the inherited value independently for each axis.
Edit `footnoteOffsetX` / `footnoteOffsetY` on Note or Martyria elements (in neume-font em units; positive means right/down). Collision
clearance raises the marker after applying these offsets and accounts for
collision regions across the finished musical line, including neighboring
neumes, barlines, and other reference markers. Musical references do not reserve
horizontal space or change line/page breaks. The Footnote Properties dialog exposes these same
values in a positioning section that starts collapsed, with a draggable preview and reset control.
The preview includes the preceding and following musical elements on the same
line, dimmed and positioned using their page coordinates. Automatic marker
placement in the preview uses the same finished-line obstacles and preceding
reference markers as page layout.
Set `footnotePositionOverride: true` to disable automatic collision clearance for that
marker and use the offsets directly from the default baseline-relative position.
The dialog enables manual controls with an Override position checkbox; enabling it
preserves the current page position, and disabling it resets offsets to zero.
The override is saved, copied, and inherited when replacing musical anchors;
explicit replacement values (including `false`) take precedence.

Page occurrence readers include the `footnote` region; page line counts include
main and footnote lines. Range selections can identify the active footnote
collection. Footnote numbering follows document reference order across pages.
`get_staff_lyrics` and the `set_staff_lyrics` edit action also accept this
collection selector for independent authoritative footnote lyrics.
In documents with footnotes, layout settlement retains the largest measured
rich-text heights at the current body width within each operation. Footnote body
gutters depend only on body marker font size, not displayed labels or numbering. Intrinsic inline widths are retained only for boxes containing
footnote references. Documents without footnotes accept shrinking body heights;
explicit settlement retains only header/footer template maxima. These
reservations are transient and reset for content, settings, and font changes;
fresh measurements replace saved height caches. Width changes discard
the previous height maximum, and delayed measurements at an obsolete width
request another measurement pass. Editor automation, private workers, and
detached exports use the same reservation rules.
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
