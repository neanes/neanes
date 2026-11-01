# Footnotes implementation plan

Status: the main-score and rich-textbox reference proofs of concept, custom
markers, and shared Undo/Redo routing are implemented. Remaining styling,
continuation, and exporter completion work is planned.

## Proof-of-concept usage and limits

- Right-click a main-score neume and choose Insert Footnote. Use the existing
  score tools to insert textboxes and neumes directly in the footnote area.
- Click a superscript reference to edit its body. Click the body number to return
  to the reference. Rich textboxes also support references at the caret through
  the Minimal divider icon beside Link in their formatting toolbar's insert tools.
  The icon combines a raised 1, separator, and short note line. It has a translated
  Insert Footnote tooltip and accessible label. Plain textboxes do not support references;
  headers, footers, annotations, and footnote bodies cannot receive references.
- Neume references use parentheses, with ordinary music spacing on both sides.
  The gaps participate in justification; the marker stays with its owning neume.
  Rich textbox references and body labels omit parentheses. Right-click a reference
  or body label and choose Footnote Properties to select an automatic number, a
  preset symbol, or short custom text. Custom markers do not consume an automatic
  number; marker changes and renumbering are undoable together.
- Page Setup has a Footnotes section for First Footnote Number, separator
  visibility, and separator length as a percentage of the content width.
- Footnote content has its own staff, lyrics, and musical state, with one shared
  document undo history. The Lyrics pane follows the active staff and identifies
  footnote lyrics by number. Playback remains scoped to the main score.
- A footnote stays whole with its reference line. Oversized content is flagged
  and displayed in an editable overflow area below the physical page. Settled
  PDF/PNG/print output is blocked until the content fits.
- The proof of concept uses the existing score typography for body content.
  Separate footnote typography and continuation remain later stages. Plain textbox references remain excluded.
- PDF, PNG, and printing include footnotes. HTML, LaTeX, and MusicXML export are
  explicitly blocked for documents with footnotes until those exporters support
  them, so these exports cannot silently discard content.
- The reusable line preparation/positioning and explicit active-content context
  replace index-only editor assumptions. Page assignment reserves footnote heights
  in the existing forward pass; existing text measurement reconciliation remains.
- `tests/integration/mcp/footnotes-smoke.mjs` exercises real private/editor
  documents, keyboard and textbox editing, context-menu insertion, numbering across
  a digit boundary, footer placement, copying, undo/redo, both save formats, and
  rendered PNG/PDF output. See the stages below for the complete feature scope.

## Intended behavior

A footnote reference links a position in the main score to a separate sequence
of score elements. The footnotes referenced on a page appear at the bottom of
that page's content area, above the footer. Their area grows upward, reducing
the space available for the main score. An optional horizontal rule separates
the footnotes from the main content. Its length is configurable as a percentage
of the footnote area's width, including 100% for a full-width rule. The proposed
default is 40%, aligned to the reading-direction start edge.

The complete feature should support references after neumes and at the caret
inside rich textboxes. References inside plain textboxes are out of scope; plain
textboxes remain supported as footnote body content. Clicking a reference should focus its footnote
for editing with the usual score tools. Provide a way to return to the reference.
Each inserted reference initially creates a separate footnote; shared references
to one footnote are outside the initial scope.

Footnotes should eventually accept textboxes, rich textboxes, neumes with lyrics,
martyrias, tempo marks, mode keys, images, drop caps, and their associated
annotations and alternate lines. Reuse element ownership rules rather than
treating auxiliary elements as unrelated content. Footnote music has independent
musical state and does not affect the main score's pitch calculations or playback.
Nested footnotes are excluded. Headers, footers, and running-marker metadata
remain document-level features rather than features of footnote content.

Automatic markers are parenthesized superscript numbers in document reference order. Numbering
continues across pages. A document setting, **First footnote number**, defaults to
1 and allows a document excerpt to continue an earlier document's numbering.
For example, a starting value of 12 produces markers 12, 13, 14. Custom markers
are a later stage.

## Layout approach and constraints

`src/services/LayoutService.ts` already separates paragraph line breaking from
placement of completed paragraphs onto pages. Completed paragraphs contain
positions and line heights. This is a suitable foundation, but the current
placement loop handles individual positioned items, not complete candidate lines.
Footnotes require a line-level pagination decision before committing positions.

The proposed flow is:

1. Resolve reference order and automatic marker labels before line breaking.
2. Include reference-marker geometry in the owning neume's or textbox's layout.
3. Lay out main content and each footnote into lines at known widths, with
   independent musical state for each footnote. Do not paginate footnotes by
   recursively calling `processPages` with a synthetic score.
4. For each candidate main-content line, gather all its references before testing
   page fit. Include any lines that must stay together, such as multiline drop
   caps and their continuation lines.
5. Test the combined height of accepted main content, the candidate group,
   accepted footnotes, newly introduced footnotes, separator, and spacing against
   the available height after header/footer overflow reservations.
6. If the group does not fit, close the current page and consider that group on
   the next page. Commit reference ownership and footnote reservations only when
   accepting the group. Never move a reference without its required footnote
   content.
7. Finalize footnote positions using the reserved area's top edge, preserving
   reading order from top to bottom. Anchor the area's bottom above the footer
   reservation. Pages without footnotes reserve no footnote area or separator.

With fixed widths and known heights, adding a candidate only increases the
reserved space. Rejection can leave earlier accepted groups intact. This permits
forward pagination without repeatedly repaginating the document to discover
which references belong on each page. It does not promise optimal vertical page
breaking or eliminate existing measurement reconciliation.

### Measurement and existing dependencies

- `SettledScorePages.vue` and `LayoutReconciliation` already rerun layout when
  rendered textbox heights change. Extend existing measurement discovery to
  footnote content, including private MCP documents and print/export rendering.
  Measure content at the same width used by the footnote line layout.
- Fixed footnote widths prevent page assignment alone from changing content
  height. Exclude page-dependent tokens from the proof of concept; later token
  support must define stable measurement behavior explicitly.
- Numbering is document-wide so moving a reference between pages does not change
  its label width. Reserve the actual marker width before line breaking, including
  digit-boundary changes and a non-default starting number.
- Existing header/footer overflow reservations and chapter-opening selection
  already have limitations documented in `LayoutService`. Preserve their behavior
  initially and verify interactions; do not claim footnotes fix those limitations.
- Extract reusable line construction and content-relative positioning rather than
  duplicating Knuth-Plass, lyrics, martyria, melisma, or measure-bar logic.
  Existing postprocessing currently operates on pages and must respect content
  boundaries when reused for footnotes.
- Explicit page breaks within footnote content are initially unsupported.
  Ordinary line and paragraph breaks remain meaningful.

## Stage 1: reusable line layout and page placement

Purpose: establish the minimum layout boundary needed for a credible proof of
concept, without changing existing document behavior.

- Separate reusable element-sequence line layout from page assignment, incrementally
  within the existing service or through focused helpers.
- Represent candidate lines with their elements, positions, height, paragraph
  boundaries, and keep-together requirements before assigning page coordinates.
- Separate musical context per content sequence. Give footnotes their own lyric
  setup and initial musical context using existing defaults.
- Ensure postprocessing does not transfer bars, melismas, ison alignment, or
  musical state between the main score and footnotes, or between footnotes.
- Keep raw-object layout writes and existing change detection behavior intact.

Exit criteria: existing layout tests pass, representative documents have unchanged
pagination, and a second independent sequence can be laid out at a specified width
without creating a second document or inheriting the main score's musical state.

## Stage 2: initial end-to-end proof of concept

This stage must include editable neumes, not just textual footnotes.

### Model and persistence

- Add a document-owned footnote collection. Each footnote has a stable identifier
  and its own element sequence, allowing mixed text and music and multiple lines.
- Add a reference attached after a main-score neume. Keep identity separate from
  the computed number. Allow one footnote per neume initially.
- Add document-wide footnote settings, including `firstFootnoteNumber` (default
  1), separator visibility and length, and the minimum spacing/style defaults needed for
  usable output. The exact saved field grouping is an implementation decision.
- Save and load footnotes and reference links through the existing v1 serializers.
  Older documents load with no footnotes and the default starting number. Do not
  bump the score version or add forward-compatibility gates.
- Allocate identifiers consistently across the document. Define traversal of main
  content and footnotes for ID assignment, discovery, saving, and measurement.

### User interaction

- Provide Insert Footnote for a selected neume. Create the reference and body as
  one undoable operation and focus the new footnote.
- Support plain textboxes and neumes with lyrics in the footnote, including the
  minimal supporting musical elements needed to establish a mode and write a
  useful example. Reuse normal editing commands for that content sequence.
- Route selection, keyboard input, properties, and deletion through the active
  content sequence rather than assuming every editable element is in the main
  staff. Keep document settings and undo history on the same workspace.
- Clicking the superscript selects/focuses its footnote; provide return navigation.
- Add First footnote number to document/page setup following the existing First
  page number interaction. Accept positive integers, persist the value, and make
  changes undoable. Changing it updates both references and body labels and
  recalculates marker geometry. Insertion/deletion renumbers subsequent notes.
- Deleting a reference or its owning neume removes its footnote in the same
  undoable operation. Replacing an owning neume preserves its reference when the
  logical position is preserved. Define cut/copy/paste to copy bodies with their
  references and remap identities; do not silently lose or share a body.
- Translate every new user-visible string in all supported locales.

### Pagination and rendering

- Keep each footnote whole with the line containing its reference. Several
  references on the same line reserve all their bodies before acceptance.
- Stack bodies in reference order, with matching labels, above the footer.
  Start with page content width and fixed shared footnote style defaults.
- Add the optional separator once per nonempty footnote area and account for its
  thickness and spacing in fit calculations. Include a document-wide length
  control in the proof of concept: greater than 0% through 100% of the footnote
  area width. Visibility is controlled separately. Changing length does not
  change the reserved vertical space.
- If a reference group plus its whole footnotes cannot fit on an otherwise empty
  page, surface an explicit layout problem. Do not loop, silently clip content,
  or silently export it as successful. Define editor diagnostics and export
  failure behavior as part of this stage.
- Include footnotes in editor rendering, print preview, PDF, and PNG output, in
  both Electron and web paths where those outputs are supported.

### Automation and acceptance

- Update MCP schemas, discovery/read projections, edit handlers, and documentation
  for the supported footnote content and settings. Expose stable footnote/reference
  identities and distinguish footnote element locations from main-staff locations.
- Add pure tests for numbering, persistence, identity remapping, and fit decisions,
  plus real editor/MCP and rendering scenarios for the complete user workflow.
- Prove mixed text/music editing, multiple music lines, independent musical state,
  reference movement to the next page, multiple references on one line, footnotes
  with visible footers, separator on/off and partial/full lengths, undo/redo,
  deletion, and save/reopen.
- Verify first numbers such as 12 and 98, including the 99-to-100 width change.
  Verify oversized content reports a problem and repeated layout is deterministic
  after measurements are stable.

Exit criteria: a user can insert a reference after a neume, write text and chant
in its body, change the first number, and produce correct saved and printed output
without a new page-assignment settling loop. Whole-footnote size limits remain
explicit until Stage 5.

## Stage 3: complete footnote content and styling

- Support rich textboxes, images, drop caps, and the remaining applicable score
  elements. Validate auxiliary-element ownership and keep-together rules.
- Provide separate footnote defaults for text, neumes, lyrics, line spacing,
  inter-footnote spacing, and separation from the main content/footer. Reuse
  paragraph styles and normal element overrides where applicable.
- Extend the initial separator visibility/length controls with thickness, color,
  alignment, and spacing. Keep these settings document-wide.
- Verify RTL layout, facing-page margins, font changes, and zoom. Define marker
  placement in RTL text and music explicitly.
- Keep footnote music out of main-score playback. Optional isolated playback of a
  footnote is a future enhancement, not required by this plan.

Exit criteria: all allowed content types render and edit through shared services,
with consistent styling and no cross-sequence musical or layout effects.

## Stage 4: references inside rich textboxes

The reference proof of concept is implemented for main-score rich textboxes,
including ordinary/scrollable boxes, top/bottom inline panels, and left/center/right
multipanel boxes. Panels are numbered in that order, then by position within each
panel. A whole rich textbox remains on its reference page with all its footnotes.

The formatting toolbar uses the custom Minimal divider SVG for Insert Footnote:
a raised 1 above a separator and short note line, drawn at 16px using currentColor.
It sits beside Link with the insert tools, separate from history and text
formatting. It retains a translated tooltip and accessible button label. The
action is available only in main-score rich textboxes. Insertion and pasted references are rejected in
headers, footers, annotations, and footnote bodies.

Markers are CKEditor inline objects with persistent IDs and generated labels.
Rich textboxes retain CKEditor's native typing, deletion, and Undo/Redo, including
caret restoration. Keyboard shortcuts, the rich-text toolbar, and the Edit menu
share the same routing and combined history availability.
Undo first uses the focused rich editor's native history, then score history.
Redo replays any outstanding score redo branch before restoring native typing,
so another textbox's undone text cannot replace that branch. The existing score
history availability supplies this state; no additional history tracker is used.
Blur, serialization, copying, navigation, and workspace changes flush pending
text. Each flush records the resulting HTML and added/removed footnote bodies
together in one score-history transaction.
Marker insertion and paste flush immediately so the new body is available.
Deleting a marker leaves its body and numbering unchanged until the next flush.
Committing changed HTML clears that editor's native Undo/Redo stacks without
changing its caret. Native history covers edits since the last flush; score
history owns committed textbox updates and restores removed bodies together with
their markers. No session body cache or caret snapshots are needed. Score history
does not move focus or restore a rich-text caret. Rich text dirty checks use
CKEditor's normalized baseline, so serialization-only HTML differences do not
create edits. Text editors update through props without forced history-time
remounts. Changing editor configuration
(for example, importing new paragraph-style definitions) still rebuilds CKEditor
and resets its local history; the flushed paste remains a score-level undo step.
Clipboard copies include detached body snapshots and style definitions; pasted
references receive new IDs. Clipboard metadata is not stored in textbox content. Headers, footers, annotations, and footnote bodies
cannot receive references. Panel layout changes that would hide a reference are
rejected, and the inline toggle is disabled while a box contains references.

Real Electron tests cover insertion, deletion, navigation, Undo/Redo, save/reopen,
whole-element copying, inline clipboard copying across documents, and custom
footnote lyric style imports. The original stage criteria remain below for the
broader feature; conversion workflows are not introduced by this proof of concept.

- Add caret-position references in rich textboxes, including supported panels,
  using a CKEditor inline model object and serialization conversions. Plain
  textboxes do not support references and retain their existing content model.
- Treat references as atomic editable objects. Define cursor movement, selection,
  deletion, text conversion, and clipboard behavior; preserve their link while
  surrounding text changes. Do not store references as unmaintained text offsets.
- Include marker geometry in text measurement. A whole textbox currently remains
  on one page, so its references belong to that page without splitting the box.
- Order references by document position, then panel order and position within the
  panel; define that panel order before implementation and use it consistently in
  numbering, navigation, saving, clipboard, and MCP projections.
- Prevent insertion in headers, footers, and footnote bodies. Update search and
  text-edit APIs so ordinary text edits cannot leave dangling references.
- When converting rich text containing references to a plain textbox, require
  explicit resolution of the references rather than silently discarding them or
  converting them to unlinked marker text. Define this interaction before enabling
  such a conversion.

Exit criteria: inline references survive editing, clipboard operations, undo/redo,
and save/reopen in rich textboxes and participate in the same pagination rules.
Plain textboxes cannot receive references but remain usable within footnote bodies.

## Stage 5: footnote continuation across pages

- Permit breaks between complete footnote lines or elements, preserving any
  keep-together groups. Splitting within a textbox is a separate future capability.
- Keep the reference line and a meaningful initial portion of its footnote on the
  same page. Specify minimum initial/continuation content and ordering before
  implementing the split policy.
- Carry unfinished bodies forward in a continuation queue. Reserve carried content
  before accepting new main-content groups; define how much main content must be
  retained and when a footnote-only continuation page is necessary.
- Define continuation labels and separator treatment. A continued footnote retains
  its original identity and number, with one editable body behind rendered fragments.
- Ensure every pagination step consumes a content group or reports an oversized
  unbreakable group. Handle an overheight textbox/image explicitly even when
  continuation is enabled.
- Extend page emptiness, rendering, selection/navigation, and export logic for
  footnote-only pages. Test competing long footnotes and carried content alongside
  newly referenced notes.

Exit criteria: long footnotes continue predictably using forward placement with
bounded local fit decisions, without whole-document fixed-point pagination.

## Stage 6: custom markers and output completion

Marker properties are implemented. A nullable per-footnote string stores the
override independently of reference IDs. Footnote Properties offers automatic,
asterisk, dagger, double dagger, and custom text, with reference/body previews.
Custom text is limited to 1-16 Unicode characters without control characters.
Custom markers do not consume automatic numbers. The marker's location determines
parentheses: neume references have them; rich text references and body labels do
not. Symbol and custom overrides survive saving, copying, and Undo/Redo. Duplicate
custom labels are permitted. Per-page numbering and exporter completion remain
future work.

- Implemented: per-footnote symbols and short text with stable IDs and measured
  geometry. Custom markers do not consume automatic numbers; duplicates are allowed.
- Page-restarting numbering and shared references are separate optional extensions;
  neither is required for the agreed document-wide numbering feature.
- Audit HTML, LaTeX, and MusicXML export paths. Implement native footnote semantics
  where supported and define explicit fallback/unsupported behavior elsewhere;
  outputs must not silently discard references or bodies. Track limitations from
  the proof-of-concept stage until each exporter is covered.
- Complete user documentation and MCP examples for insertion, navigation, numbering,
  custom markers, styling, and continuation limits.

## Verification throughout the stages

Use pure unit tests and real application integration tests, without mocks, spies,
DOM emulation, or fake editors. Run targeted checks as each stage lands and the
required type, lint, and regression checks before completion. Use disposable
Electron profiles and unsandboxed macOS launches as required by `AGENTS.md`.

The main architectural acceptance condition is that page ownership is decided
from precomputed line geometry and reference data. Existing font/textbox
measurement reconciliation may rerun layout; footnotes must not introduce a
second iterative loop that alternates page assignment and footnote discovery.
