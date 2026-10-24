# Neanes MCP

When agent access is enabled, the Electron app starts an authenticated local MCP Streamable HTTP endpoint while running. The web build does not host a server. Through the bridge, document tools use private documents by default. Pass `documentScope: "editor"` to work with open editor tabs. MCP PDF export and page previews render detached snapshots in dedicated hidden windows. Typed element and lyric transactions are available in both document modes. Bounded batch transformations support saved scores and temporary PDF edits. Persistent background jobs remain deferred.

## Normal setup: one connection

Open Edit > Preferences > Agent access (MCP), turn on Allow agent access, and copy the
configuration into your MCP client. Node.js 22+ runs the dependency-free bridge.
One switch controls editor and background access. There are no user-managed tokens, folder permissions, or connection modes to configure. The copied JSON
uses the common `mcpServers` shape; clients using another configuration format need
its command and args values.

Each bridge launches its own private headless Electron worker, profile, and random
loopback port, even when the editor is running. Private operations and capability
queries use that worker without connecting to the editor;
editor dialogs and loading state do not block them. An in-progress connection
never retries edits automatically or migrates drafts after a disconnect.
Disconnecting stops the bridge's worker and never closes an existing editor.

Document tools through the bridge default to one private document store per
worker, regardless of launch order.
Private documents have no idle expiry and last until explicitly closed, the
worker stops, or agent access is revoked. Each worker allows 16 open documents;
`get_capabilities.privateDocuments` reports this limit and `lifetime: "worker"`.
To discover live tabs use `list_documents` with `documentScope: "editor"`, then pass
`documentScope: "editor"` to document tools operating on those IDs. No editor is launched
for that explicit scope; an editor must be open. The bridge discovers the editor
only for explicit editor requests, including after the user opens it later,
while keeping private tasks in the worker. The bridge advertises `documentScope` in
tool input schemas and supplies initialization guidance.

Complete published schemas are available as read-only MCP resources, independently
of documents. `resources/list` lists input and output resources for
every tool; `resources/templates/list` advertises
`neanes://schemas/{tool}/{view}`, where `view` is `input` or `output`.
For example, read `neanes://schemas/edit_elements/input` or
`neanes://schemas/get_paragraph_styles/output` with `resources/read`.
Each JSON resource contains `tool`, `description`, and `schema`. Local `$ref`
values resolve within `schema`. The bridge includes `documentScope` in document
input resources, matching its `tools/list` publication.

Clients may shorten generated tool declarations: Codex 0.163.0-alpha.10.2 removes
some validation keywords and field descriptions, and limits recursive type
expansion. Read the corresponding schema resource for complete bounds, patterns,
defaults, dictionary keys, field guidance, and recursive definitions. Resources
preserve the published schemas without client schema conversion; runtime
validation still enforces additional rules described by each tool, including
cross-field and document-state checks. Small reused types are inline in both
input and output schemas to avoid exhausting client reference budgets; larger
repeated structures remain shared. Tool-level descriptions retain critical
authoring guidance, including lyric parser versus literal-text behavior.

On graceful bridge shutdown, its worker stops and all its private documents are
discarded. HTTP timeouts/disconnects while the
bridge remains alive preserve its documents for inspection. A crashed bridge leaves
its worker a 60-second orphan grace period; private drafts are not recovered.

The bridge ships at `resources/mcp/bridge.mjs` with `bridgeProtocol.mjs`; packaged
startup installs both in the normal profile. The stable profile path works after
a Linux AppImage unmounts, and executable configuration uses the original APPIMAGE
path. No separate npm install is needed. Arguments are `--executable <absolute app
executable>` and `--policy <absolute agent-access.json>`; development also uses
`--app <absolute repository path>`. Startup waits for renderer readiness on a
private pipe. Diagnostics go to stderr, stdout carries only MCP JSON-RPC, and
credentials stay out of command arguments.

Headless capabilities report `mode: "headless"`. Raw HTTP headless document calls
use the worker's private store directly. HTTP requests do
not own that store; the bridge's process lifetime controls worker cleanup.
The hidden host shares document operations, fonts, rich-text measurement, layout,
and PDF output without mounting the editor, recovery, router, or service worker.
New worker documents use built-in defaults. This is desktop Electron without
visible windows; display-server-free Linux operation is not established.

Agent access is off by default. The normal profile's private agent-access.json stores
`enabled` and a generated token. Missing `enabled` means off; explicit legacy
booleans are preserved, while obsolete root/generation fields are ignored.
Only editor startup creates missing credentials, with access disabled. Bridge and
`--headless-mcp` startup refuse missing, invalid, or disabled policy files. Enabling
access requires the preference; environment token/port overrides do not bypass it.
Each worker also has a private random bearer token passed through its environment.
Tokens never appear in settings responses, copied configuration, or settings controls.

Disabling is persisted atomically before the editor transport closes. Hosts recheck
policy at request execution and file operations; idle hosts and bridges check once
per second. Toggling rotates internal credentials, so an off/on cycle cannot revive
an old worker or connection. Explicit refusal never triggers worker fallback.
Private drafts are discarded, editor tabs stay intact, and file commits already
underway finish before worker exit. Preferences asks for confirmation when private
host records report unsaved drafts or an in-progress request. Records live beside
the policy in `agent-access.json.hosts`, contain only process/draft/busy state, and
are removed on shutdown; records from exited processes are ignored and cleaned up.
After enabling again, reconnect clients to start fresh connections.

Editor startup failures are caught, recorded, and leave the editor usable. The
settings section exposes status, Copy configuration, endpoint details, and Retry
connection only after a failure. Retry restarts the transport without changing
credentials. Private bridge tasks use their worker regardless of editor server
failures; explicit editor scope reports that failure. Worker startup failures still
exit the worker because it has no other purpose. Interrupted requests are never
automatically replayed. Workers stop with their owning bridge (or after the existing
orphan grace period), independently of the editor's internal credential file.

Verify after `npx vite build`:

```sh
node scripts/mcp/headless-launch-smoke.mjs
node scripts/mcp/agent-access-smoke.mjs
```

Tests use disposable profiles and folders. Set NEANES_TEST_EXECUTABLE to a built
app executable for packaging checks. Self-launching editor tests use OS-assigned
debugging ports;
NEANES_TEST_MCP_FAILURE=1 occupies the configured port to verify nonfatal editor startup, independent private workers, and retry after the port is released.

Smoke scripts share `smokeClient.mjs` for HTTP connections, MCP outcome assertions,
and optional published-schema validation. `smokeCdp.mjs` owns debugger request
dispatch and JavaScript evaluation. `smokeApp.mjs` creates disposable profiles,
launches Electron, discovers endpoints/debuggers, captures logs, and removes the
profile after stopping the app. Preview image artifacts are retained separately.
`smokePolling.mjs` shares bounded observation polling and metadata-only revision
settlement. Document cleanup uses the metadata reader instead of reconstructing
scores. Scenario scripts retain their readiness and lifecycle assertions; preview
checks also inspect raw response content for images.

## Direct HTTP development setup

```sh
export NEANES_MCP_PORT=38765
export NEANES_MCP_TOKEN="$(openssl rand -hex 32)"
export NEANES_DEV_USER_DATA_DIR=/tmp/neanes-mcp/profile
npm run dev
```

Enable Allow agent access in the disposable development profile first. The default port is OS-assigned, and the internal token is generated automatically.
The environment overrides above are optional developer controls for existing direct
HTTP test clients; normal users and bridge clients do not set them. Settings show
the actual endpoint, but never disclose credentials. Raw HTTP document tools retain
their visible-editor default; the bridge defaults to its private worker and routes
explicit editor scope to the interactive server. NEANES_DEV_USER_DATA_DIR applies to development builds, or
production smoke runs explicitly marked IS_TEST=1.

Authentication uses a bearer token of at least 32 characters. HTTP binds to IPv4
loopback, validates Host, rejects browser Origin headers, and uses stateless JSON
responses. MCP file operations use normal OS permissions with explicit absolute
paths. Existing suffix validation, overwrite protection, source-conflict checks,
in-place score writes that preserve existing file metadata, and symlink-output rules remain. MCP client roots do not restrict
file access.

The mixed-scope smoke tests below use the bridge. Run them with
`NEANES_DEV_USER_DATA_DIR` pointing to the same disposable editor profile.

## Tools

The contracts below describe direct HTTP access to the interactive server. Through
the bridge, document tools default to private worker documents; use `documentScope`
to choose editor tabs.

- `get_capabilities`: supported style actions, units, and formats. Pass `includeFonts: true` to add this host's installed/bundled font families (omitted by default). Pass `includeErrorCodes: true` for the stable error-code vocabulary.
- `list_documents`: open workspace IDs, revisions, canonical source paths, source format (`byz`, `byzx`, or null), selection, and unsaved state.
- `get_element_catalog`: defaults to a small inventory of element types, child collections, units, and stored header/footer variants. Request `elementTypes: ["Note"]` and/or `properties: ["lyrics", "isMelisma"]` for focused schemas; `view: "read" | "edit" | "both"` defaults to both. Read schemas are in `properties`, writable validation schemas in `editProperties` (null for `Empty`). A property filter omits types without matching properties. `includeProperties: true` requests all property schemas; `includeNeumes: true` adds the full enum vocabulary. Schemas use self-contained local `$defs`/`$ref`; clients must resolve references within each schema. The shared `tempoBpmDefaults` map exposes all tempo-sign BPM defaults. Dimensions are CSS pixels; line height is a multiplier. Tool input schemas use JSON Schema input semantics, so defaulted fields may be omitted; response schemas describe settled output. Tool schemas advertise compact property maps; the server still validates every supplied property against its complete element-specific schema.
- `get_rich_text_format`: document-independent CKEditor HTML authoring guide for RichTextBox content/panel fields and Annotation.text. Optional `topics` selects `basics`, `inline`, and/or `opentype` (default: `basics` + `inline`). Covers paragraph classes, escaping, panels, word/selection span overrides (color, size, family, weight/slant), and complete edit calls; `opentype` gives supported font-variant values and inheritance/reset rules. Use spans for local overrides; create paragraph styles for reusable paragraph formatting. Read before the first rich-text edit. TextBox content remains plain text.
- `get_mode_key_templates`: compact mode-key template summaries with stable English descriptions, internal `scale`/`scaleNote`, and `supportsOptionalDiatonicFthora`. Optional `mode` (1-4 authentic, 5 plagal first, 6 plagal second, 7 grave, 8 plagal fourth) and `templateIds` filters combine with AND; no filters returns all templates. No document is required. Musical terminology is interpreted by the agent; there is no text search or alias catalog.
- `get_elements`: typed, read-only elements from `collection` (default `{ kind: "staff" }`). Ranges are zero-based, `start` inclusive and `end` exclusive; omitted `end` means the collection size. `offset` and `nextOffset` are relative to that range; `limit` defaults to 100, maximum 1000. Empty ranges and an offset at the range end return no elements. Out-of-bounds or reversed ranges return `INVALID_ELEMENT_RANGE`. Pass the first page's `revision` as `expectedRevision` on subsequent pages to reject mixed-revision reads. Each element has an opaque `elementRef`, its collection index, typed live `properties`, and child-collection counts. Discover children with `{ kind: "children", parentRef: elementRef, collection: "annotations" | "alternateLines" | "elements" }`. Unknown/removed/cross-document references return `ELEMENT_NOT_FOUND`; an unsupported child collection returns `INVALID_ELEMENT_COLLECTION`. References survive movement, content changes, and undo restoration of the same live object, but only within one open document; closing/reopening assigns fresh references. They are not saved IDs or layout indexes. Staff reads include the terminal `Empty` sentinel. Read stored templates with `{ kind: "headers" | "footers", variant: "default" | "firstPage" | "odd" | "even" | "chapterOpening" }`, including disabled variants; these are not page-resolved instances. Element properties omit null and undefined values except `lineHeight: null` for text boxes and drop caps, which explicitly resets line height to normal. Omitted `lineHeight` inherits the paragraph style; a numeric value overrides its multiplier. Other missing properties are unset. Values such as `false`, `0`, and `""` remain present. Use `properties: ["quantitativeNeume", "lyrics"]` to select fields, or `properties: []` for identities/indexes/child counts only. Unknown property names are rejected; fields inapplicable to an element type are omitted. `includeContent: false` omits image `data` and all five text-box `content*` fields, even if selected. Annotation `text` and drop-cap `content` are included by default when requested by the field projection. If an annotation or drop cap exceeds the element budget, its content is omitted with an explicit `omittedContent` field listing the property; use `get_element_content` to retrieve it exactly. Note lyrics remain ordinary properties. Properties default to all readable fields, with large content excluded (`includeContent: false`). Pages may end before `limit` to fit a 24,000-character JSON budget; always follow `nextOffset`. In a projected view, missing fields may be unrequested or excluded content; do not infer defaults or use projections as complete replacement definitions. Retrieve content explicitly by selecting its property with `includeContent: true`. The catalog marks unsettable properties optional; published outputs use compact property envelopes while runtime validation remains element-specific. Properties omit layout caches; annotations/alternate lines expose their stored x/y offsets.
- `find_text`: find literal text across lyrics, drop caps, annotations, and plain/rich text-box panels, with snippets and element references. See the text search contract below.
- `find_elements`: search stored element fields with `eq`, `in`, `isNull`, and `isNotNull`, nested inside `and`/`or` groups. Optional `elementTypes` restricts types. Defaults to document scope (staff and descendants, then stored header/footer variants, including disabled variants), compact `properties: []`, and `includeContent: false`. Results carry a `collection` and zero-based `index` per match. See the search contract below.
- `get_element`: retrieve an existing `elementRef` at its current location, with optional `before`/`after` counts (0 to 499 each). Returns the anchor reference, its collection, collection size, half-open `start`/`end`, and elements in collection order, including the anchor. Windows clip at collection boundaries and count actual elements without filtering. Defaults to all readable properties excluding large content. Supports `properties`, `includeContent`, and optional `expectedRevision`. Removed/foreign references return `ELEMENT_NOT_FOUND`.
- `get_element_content`: read exact original string chunks from text-box/rich-text/drop-cap `content` or panel fields, annotation `text`, or image `data` URLs. Supply `documentId`, `elementRef`, `property`, and optional `offset`/`limit` (default 8000, range 2-8000). Offsets and `totalLength` use UTF-16 code units; chunks never split surrogate pairs. Returns `content`, `offset`, `nextOffset`, `totalLength`, document ID and revision. Concatenate chunks in order, passing the first returned revision as `expectedRevision` on continuations to reject mixed-revision content. Empty strings return an empty final chunk. No HTML, text, or base64 transformation occurs. Inapplicable fields return `INVALID_ELEMENT_CONTENT`; unavailable references return `ELEMENT_NOT_FOUND`; out-of-range offsets or offsets inside surrogate pairs return `INVALID_ELEMENT_RANGE`.
- `get_staff_lyrics`: read the staff lyrics manager text and lock state in bounded chunks, independently of element content. Supply `documentId`, `offset`/`limit` (default/max 8000; minimum 2), and `expectedRevision` for continuations. Returns `text`, `locked`, `offset`, `nextOffset`, `totalLength`, document ID and revision. Offsets count UTF-16 code units and chunks never split surrogate pairs. Concatenate `text` chunks in order; pass the first returned revision as `expectedRevision` to reject mixed-revision reads. Empty text returns an empty final chunk. Does not edit or save.
- `get_document_properties`: title and author in `properties`, plus the document summary. Pairs with `replace_document_properties`.
- `get_page_setup`: live page geometry, notation defaults and layout settings in `settings`. Optional `properties` selects fields; `[]` returns only the summary with empty settings. Dimensions are CSS pixels. Typography is managed through paragraph styles; header/footer configuration has its own reader.
- `update_page_setup`: partial `changes` in one undo step. Requires `expectedRevision`. Omitted fields stay unchanged. `pageWidth`/`pageHeight` are read-only and computed from `pageSize`, `landscape`, and (for `Custom`) `pageWidthCustom`/`pageHeightCustom`. Custom dimensions are before orientation. Margins must leave positive content area. Unknown fields, invalid types and nonpositive dimensions are rejected before mutation. Does not save.
- `get_header_footer_settings`: visibility, template selection flags, margins, horizontal rules, `firstPageNumber`, `numerals`, and `richHeaderFooter` in `settings`. Supports the same `properties` projection as `get_page_setup`.
- `update_header_footer_settings`: partial `changes` in one undo step; requires `expectedRevision`. Preserves template content, including when changing `richHeaderFooter` (the generation preference). Use `get_elements`/`edit_elements` with header/footer collections for content and template type changes. Does not save.

All three focused readers accept optional `expectedRevision`. Settings writes return only the document summary. If settlement fails after a write, `details.editsApplied` and `revision` describe the committed state; inspect it before retrying. The old `get_document` tool has been removed; use these readers together with element, lyrics and paragraph-style tools instead of reading a raw save-format score.

- `get_selection`: inspect the selection for an explicit `documentId`, with optional `expectedRevision`. Returns `status: "active"` for the selected interactive tab, `"remembered"` for a background tab, or `"unavailable"` for a private document. `selection` is null when none is reachable. See the selection contract below.
- `get_pages`: settled page summaries with `pageCount`, `layoutId`, and paginated `pages`. Each summary contains one-based physical `pageNumber`, numeric `displayedPageNumber`, `lineCount`, and `occurrenceCount`. Supports optional `expectedRevision` and `expectedLayoutId`; `offset`/`limit` paginate pages (default 100, max 1000). Pages may end early to fit the 24,000-character discovery budget; follow `nextOffset`.
- `get_page_elements`: compact occurrences on a required one-based physical `pageNumber`. Filter `regions` (`staff`, `header`, `footer`, all by default), `elementTypes`, and `where` with the existing stored-field predicate grammar. `offset`/`limit` paginate matching occurrences. Pages may end early to fit the 24,000-character discovery budget; follow `nextOffset`. Each has `elementRef`, `elementType`, `collection`, `index`, `region`, and zero-based `lineIndex` for staff/descendants. The response also includes the page summary, `pageCount`, and `layoutId`. Use `get_element` for properties/content.
- `edit_elements`: apply an ordered, validated transaction to one document using its latest `expectedRevision`. Actions run on detached live-model drafts; schema, reference, font/style, musical component, and collection validation completes before commands mutate the document. Invalid batches leave no partial musical edits or history entries. Successful changes form one undo step, preserve existing element identities and collection arrays, and do not save. A no-op returns `applied: false` without adding history. The result includes current document metadata/revision, `createdCount`, and `created` entries (`clientId`, `elementRef`, `elementType`) for inserted/replacement objects still present. Set `includeCreated: false` for a compact acknowledgment that keeps `createdCount` and omits `created`; references are included by default. See the transaction contract below.
- `create_document`: create and select a document using the user's current defaults. Optional `title` sets its metadata title.
- `open_document`: open an absolute `.byzx` or `.byz` path. An already-open file is selected by canonical identity without replacing unsaved changes, including when its interactive path uses a directory alias. The requested suffix selects decoding; canonical identity does not change that format. Returns `created: true` only when a workspace was added; reused workspaces return false.
- `close_document`: closes one workspace without saving or deleting score files. Requires `documentId` and `expectedRevision`. Unsaved or recovered workspaces return `UNSAVED_CHANGES` unless `discardUnsavedChanges: true` is explicit. Stale revisions are rejected even when discarding. Recovered drafts require saving or explicit discard even if their dirty flag is clear; error details include `hasUnsavedChanges` and `isRecovered`. Recovery snapshots and pending recovery timers are removed. Closing a background workspace preserves the selection; closing the selected one selects a neighbor. Closing the last workspace creates a blank workspace and keeps MCP running. Returns `{ documentId, selectedDocumentId }`. Cleanup failure after removal reports `RECOVERY_CLEANUP_FAILED` with `details.closed: true`; inspect the document list instead of retrying that close. A pending native save or interactive close returns `EDITOR_BUSY`; close waits for exports and native file opens.
- `get_paragraph_styles`: `view: "ids"` returns only `styleIds` and the document summary; `ids` filters either view and unknown IDs fail with `STYLE_NOT_FOUND`. The default `view: "definitions"` returns complete writable style definitions, optionally filtered by `ids` (unknown IDs return `STYLE_NOT_FOUND`; `[]` selects none). `includeResolved: false` omits resolved metadata. By default returns all definitions in `styles`, and separate read-only `resolvedStyles` with effective values, built-in flags, and display labels. These definitions use the live model shape (`overrides` and `fontStyle`). Dimensions are CSS pixels; `lineHeight` is a unitless multiplier.
- `edit_paragraph_styles`: an atomic batch of `create`, `replace`, `update`, and `delete` actions. `update` takes an `id` and sparse `changes` (`displayName`, `parentStyleId`, and/or `overrides`); supplied overrides merge into existing overrides, and omitted fields stay unchanged. An empty overrides object preserves existing overrides. Supported null values explicitly reset. `resetOverrides` removes named override keys to resume inheritance; it can be used alone, without `changes`, or alongside changes to other overrides. Setting and resetting the same override is rejected. Resetting an already absent override leaves it absent. Each create/replace supplies a complete definition (`id`, `parentStyleId`, `overrides`, and `displayName` for custom styles). Built-in names are read-only metadata and must be omitted. For create/replace, missing overrides inherit; supported null values explicitly reset. Each ID can appear once per batch. Action order does not matter: a child may refer to a parent created later in the payload. Validation checks the final graph for missing parents, cycles, duplicate IDs/names, and protected built-ins before applying anything. Built-in styles cannot be created, deleted, or renamed. Custom null parents normalize to `default-text`. Deleted styles' untouched children inherit from their nearest surviving ancestor or `default-text`; content references use their nearest surviving ancestor or surface default. Explicit references to a parent deleted in the same batch are rejected. Text font families do not need to be available on this computer; their names are preserved for rendering elsewhere. Local previews/PDFs use locally available fonts and may fall back. Notation fonts remain restricted to supported chant fonts. The response defaults to a document summary and `affectedStyleIds`: definitions actually changed, created, deleted, or reparented (not every descendant whose resolved values changed). Pass `includeStyles: true` to also return the complete `styles`, `resolvedStyles`, and `units`. The entire edit is one undo step and preserves per-element overrides. Before returning, it measures the target workspace's resizable body text boxes and enabled headers/footers with the updated styles, even when that workspace is in the background. Measurement preserves the selected workspace. Saves and recovery snapshots wait for pending measurements; failed measurement reports `TEXT_BOX_MEASUREMENT_FAILED` rather than saving stale heights. Does not save.
- `replace_document_properties`: replaces the complete metadata object, requiring both `title` and `author`. One undo step; does not save.
- `save_document`: save to `filePath`, or to the document's source if omitted. Save-as changes the workspace's source path. Existing unrelated destinations require `overwrite: true`. Saving back to the source checks its last known modification time and size, even when overwrite is true. Existing score files are written in place to preserve their filesystem metadata. A failed or interrupted write can leave partial content; no atomic replacement is promised. Same-source saves preserve the format used to open the score, including extensionless or differently suffixed symlink targets, and preserve the alias itself. Save-as to a different identity uses the destination suffix. Unrelated symlink outputs remain forbidden. The result includes `savedRevision` (the revision written) and `savedContentUnchanged` (whether that saved snapshot is still current). `revision` describes the current workspace, which can include newer interactive edits or the new source path.
- `preview_page`: return one full-page PNG as an MCP image content block, without writing an output file. Works with unsaved editor or private-worker documents. Supply `documentId`, optional `expectedRevision`, and one-based physical `pageNumber`. `maxEdge` defaults to 1600 pixels and accepts 256-2048, preserving aspect ratio (up to 192 DPI); the PNG is limited to 4 MiB. Text and structured results contain metadata only: `capturedRevision`, current `revision`, `pageCount`, `pageNumber`, `mimeType`, `width`, and `height`, plus the document summary. The image is the second content block, with `type: "image"`, `mimeType: "image/png"`, and base64 `data`. Clients must support MCP image content to inspect it. Concurrent source changes reject with `REVISION_CONFLICT`. The image renderer returns `pageCount` from its settled snapshot without running page discovery. Rendering failures return `EXPORT_RENDER_FAILED`; out-of-range pages return `INVALID_PAGE_NUMBER`. Rendering uses the shared settled pages, opaque white background, export overlays, font/image readiness, cancellation, and disposal. Does not select, edit, save, or create a private copy. Pending input follows the same normal document settlement as other reads.
- `export_pdf`: render to an explicit absolute PDF path without a save dialog or external PDF viewer. Existing destinations require `overwrite: true`. Does not save the score. Export uses a dedicated hidden renderer and leaves tabs, selection, editor input, and undo history available. The result includes `exportedRevision`, identifying the snapshot written to the PDF; `revision` describes the workspace at completion and may include newer interactive edits. Snapshot metadata and file-name tokens are captured together. No workspace, recovery state, or save is created by the hidden renderer. Rendering failure uses `EXPORT_RENDER_FAILED`; an aborted HTTP request cancels pending rendering and disposes its window. Cancellation uses `EXPORT_CANCELLED` when a response can still be delivered. Existing destination checks still apply; cancellation racing with a completed commit can have an unknown outcome.

### Text search contract

`find_text` takes `documentId`, optional `expectedRevision`, and
`query` (1-256 UTF-16 code units, containing searchable text). It never selects,
edits, or saves. The editor's next/previous search uses the same text extraction
and matching service.

```json
{
  "documentId": "...",
  "query": "Κύριε",
  "fields": ["lyrics", "content"],
  "limit": 100
}
```

- Literal substring matching, case-insensitive by default; `caseSensitive: true`
  preserves case. Both query and content use NFC Unicode normalization and ignore
  Arabic tatweel. Case-insensitive matching equates Greek sigma and final sigma.
  Diacritics remain significant. There is no regex or fuzzy mode.
- Searches note `lyrics`, drop-cap `content`, annotation `text`, and all five
  text-box fields (`content`, `contentBottom`, `contentLeft`, `contentCenter`,
  `contentRight`). Optional `fields` limits these fields. Stored panels are
  searched even when their display mode is inactive. Rich text boxes and
  annotations are parsed as HTML, with entities decoded, block/line boundaries
  separated by whitespace, and script/style content excluded. Plain text stays
  literal. Document metadata and lyrics-manager source text are excluded.
- Whitespace collapses to one space in ordinary text. Leading/trailing query
  whitespace is ignored. Within lyrics, whitespace is ignored entirely: phrases
  can span successive notes and drop caps, passing over notation without lyrics.
  Text boxes end lyric runs. Matches never join panels or cross collections into
  annotations, alternate lines, or header/footer templates. `fields` selects which
  lyric fields contribute to a run.
- `scope` follows `find_elements`: document scope includes descendants and all
  stored header/footer variants, including disabled templates, once per stored
  location. Collection scope searches only that collection unless
  `includeDescendants: true` is supplied.
- Each occurrence (including overlaps) returns an anchor `elementRef`,
  `collection`, and `elements` with every participating element's reference,
  type, zero-based index, and matched field. Use `get_element` to retrieve source
  content or context. Order follows depth-first anchor order, then field order
  as listed above and occurrence order within a field.
- `snippet` is normalized searchable text, with up to 60 UTF-16 code units of
  context on each side (extended when necessary to preserve a surrogate pair).
  `matchStart` inclusive and `matchEnd` exclusive index into that snippet. They
  are not offsets into stored HTML or source lyrics; lyric snippets omit spaces.
- `offset`/`nextOffset` count occurrences. `limit` defaults to 100, maximum 1000;
  the JSON page budget may end a page early. Follow `nextOffset` with the same
  query and returned `revision` as `expectedRevision`. No exact total is
  computed. Offset equal to match count returns an empty page; a larger offset
  returns `INVALID_ELEMENT_RANGE`. A single span whose references exceed the
  page budget returns `RESPONSE_TOO_LARGE`; narrow the query or scope.

Build with `npx vite build`, then run the standalone regression outside the agent
command sandbox on macOS:

```sh
node scripts/mcp/text-search-smoke.mjs
```

It starts a disposable Electron profile and checks editor and private-worker
searches, rich HTML/entities, cross-note lyrics, nested collections, disabled
headers, field filters, pagination, published schemas, document ownership, stale
revisions, and unchanged document snapshots.

### Element search contract

Use `find_elements` first to locate mode keys, martyriae, or elements matching
properties, instead of scanning `get_elements`. Use `get_elements` to read a known
contiguous range. For example, find Third Mode in an open editor document:

```json
{
  "documentId": "...",
  "documentScope": "editor",
  "elementTypes": ["ModeKey"],
  "where": { "field": "mode", "op": "eq", "value": 3 },
  "properties": ["mode"],
  "scope": { "kind": "collection", "collection": { "kind": "staff" } }
}
```

Mode values are 1-4 for the authentic modes, 5 for plagal first, 6 for plagal
second, 7 for grave, and 8 for plagal fourth. To locate a whole section, omit
`where` from this query: all mode keys give both the Third Mode start and the next
mode-key boundary in one compact response (follow `nextOffset` if present).
Pass the start match's `index` as `get_elements.start` and the next match's
`index` as exclusive `end`, using their staff `collection` and the returned
`revision` as `expectedRevision`. If there is no next mode key, omit `end`.

`find_elements` accepts the same `documentId` and optional
`expectedRevision` as element discovery. It never edits or saves. Predicates use
live fields listed by `get_element_catalog`. Use bare property names such as
`"mode"`, not `"properties.mode"`. Inherited typography, uncatalogued layout caches,
IDs, and arbitrary object paths are outside this contract. The calculated
`scaleNotes` and `scaleNotesVirtual` arrays are readable via `properties`, but
predicates accept only scalar values: these arrays support `isNull`/`isNotNull`,
not array equality or pitch membership.
Dimensions, including font sizes, use CSS pixels.

```json
{
  "documentId": "...",
  "elementTypes": ["Note", "Martyria"],
  "where": {
    "or": [
      { "field": "measureBarLeft", "op": "isNotNull" },
      { "field": "measureBarRight", "op": "isNotNull" }
    ]
  },
  "properties": ["measureBarLeft", "measureBarRight"],
  "limit": 100
}
```

- `eq` takes `value`; `in` takes a nonempty `values` array. Equality is exact and case-sensitive. Values must be valid for the catalog field on at least one applicable type; values are not coerced. Use `elementTypes: ["TextBox"]` with `paragraphStyleId` equality to find a style assignment, or `["DropCap"]` with `fontSize` equality/membership to find explicit font-size overrides. Inherited font sizes do not match a numeric override predicate.
- `isNull` matches null or undefined; `isNotNull` matches any non-nullish value, including `false`, `0`, and `""`. A field inapplicable to the element type never matches any operator. Exact `eq`/`in` with null matches explicit null, not undefined. For example, `lineHeight` equality to null selects explicit normal resets, while `isNull` also selects inherited line heights.
- `and` and `or` take nonempty predicate arrays and can nest. The recursive shape is `Predicate = { and: Predicate[] } | { or: Predicate[] } | { field, op, value? , values? }`, with leaf operands determined by `op`. Complete schemas preserve recursive `$ref` definitions even if a client renders children as `Array<unknown>`. The entire tree allows at most 100 nodes and 8 levels, including the root. Each `in` list allows at most 100 values. Unknown fields, invalid values, malformed operators, and excessive predicates return `VALIDATION_ERROR`.
- `scope` defaults to `{ "kind": "document" }`. To restrict it, use `{ "kind": "collection", "collection": { "kind": "staff" }, "includeDescendants": false }`, or another existing collection selector. Document scope traverses descendants automatically. Collection scope includes descendants only when requested.
- Order is depth-first: each element precedes its annotations and alternate lines (including their elements), in collection order. Staff comes first, then headers and footers, each in `default`, `firstPage`, `odd`, `even`, `chapterOpening` order. Stored templates are returned once per stored location, not once per rendered page. The staff `Empty` sentinel is included unless filtered out.
- `offset` and `nextOffset` count matching elements, not scanned elements. `limit` defaults to 100, maximum 1000. Follow `nextOffset` with the same query and the returned `revision` as `expectedRevision`. An offset equal to the match count returns an empty page; a larger offset returns `INVALID_ELEMENT_RANGE`. No exact total is computed for each page.
- Each match's zero-based `index` is relative to its returned `collection`, not the match list or page; pass that collection and index to `get_elements` to read a range.
- `properties` defaults to `[]`; matching fields are not automatically returned. Request them explicitly. Projection does not restrict predicate evaluation. `includeContent: false` omits image/text-box content even when selected; annotation/drop-cap content remains included when projected unless over budget. To retrieve matching content, explicitly select its field and set `includeContent: true`. Search and element reads exclude large content by default.

Use `get_element` with a returned reference to retrieve details or nearby context
without another collection scan by the client. Neighbors stay in the anchor's
own collection; an annotation's neighbors are annotations, and an alternate-line
note's neighbors are notes in that alternate line. Spatial proximity and resolved typography remain separate future features.
Use the page tools for layout-based discovery and get_selection for UI context.

Run the search regression against a disposable app profile:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/element-search-smoke.mjs
```

It checks editor and private-worker searches, nested collections, predicates,
compact projections, reference windows, read-only state, revision conflicts,
validation bounds, and cleanup. Published input/output schemas are validated.

### Settled page queries

Both page tools work with editor and private-worker documents. They use
the same full-page renderer as Electron PDF/PNG/printing: load fonts, await rich
text and image decoding, measure page-specific content, and repeat layout until
heights converge (maximum 12 passes). Shared header/footer templates reserve the
largest observed height across pages/passes. Query rendering uses a private live
model copy, retaining blank children and mapping occurrences back to the original
live references. It creates no tab, history, recovery draft, or output file and
does not modify the source with page-specific measurements. A hidden offscreen
component is removed on success or failure, with a 45-second rendering deadline.
Neanes must be running; no human interaction or selected tab is required.

```json
{
  "documentId": "...",
  "pageNumber": 3,
  "regions": ["staff"],
  "elementTypes": ["TextBox"],
  "where": { "field": "paragraphStyleId", "op": "eq", "value": "default-text" },
  "expectedRevision": 7,
  "expectedLayoutId": "<layoutId from get_pages>"
}
```

Physical page numbers select the actual rendered sheets, starting at 1.
Displayed numbering reflects the document's numbering offset; it does not select
a sheet. Layout-only empty trailing pages are omitted like export. A fully empty
score can have zero rendered pages. Header/footer occurrences include only the
chosen enabled template on that page, not all stored variants. The same template
reference can occur on multiple pages; distinguish occurrences by document,
layoutId, pageNumber, region, and elementRef. The template reference remains the
editing target. Staff notes include their rendered annotations, alternate-line
containers, and alternate-line notes. `lineIndex` is their owning staff line,
not a text-wrapped line inside a text box. Layout members can include the terminal
`Empty` sentinel when it shares a nonempty rendered page. Counts are unfiltered;
occurrence pagination counts filtered matches. Order is header, then staff in
line/collection order (parent, annotations, alternate-line containers and their
notes), then footer.

Each request renders again and returns a SHA-256 `layoutId` fingerprint of page
membership, numbering, line placement, and geometry. Use the same `expectedRevision`
and `expectedLayoutId` across page and occurrence reads. Concurrent content changes
return `REVISION_CONFLICT`; a changed fingerprint returns `LAYOUT_CONFLICT` even
when content revisions match (for example, changed font metrics). Restart discovery
after either conflict. Layout IDs are not saved IDs or retained server state.
Newly opened documents have new element references and therefore new layout IDs.
Pagination can change across machines with different fonts. Results describe the
settled Neanes rendering, not a permanent page assignment.

Out-of-range pages return `INVALID_PAGE_NUMBER`; offsets beyond the page/match
count return `INVALID_ELEMENT_RANGE`. Invalid queries return `VALIDATION_ERROR`.
Rendering failures and nonconvergence return `LAYOUT_SETTLEMENT_FAILED` with a
reason. Ordinary preparation/measurement errors can also occur before page
rendering. Client timeout/disconnect can leave bounded read-only rendering in
progress until its completion or deadline. No page query saves or exports.

Run `scripts/mcp/page-discovery-smoke.mjs` with an allowed absolute output
directory, `NEANES_MCP_TOKEN`, and optionally `NEANES_DEBUG_URL` for concurrent
interactive-edit and offscreen-cleanup checks. It covers both document modes,
repeated templates, numbering, pagination, references, conflicts, failure/retry,
and PDF compatibility. Use a disposable application profile.

### UI selection contract

Use `list_documents` and its `selected: true` entry to identify the interactive
document, then call `get_selection` with that ID. Check `status: "active"` before
interpreting a response as the user's current selection: tabs can change between
requests. Active means the selected Neanes tab, regardless of OS window focus.
The tool does not activate tabs or change selection. Background tabs return their
remembered selection. Isolated documents always return `status: "unavailable"`
and `selection: null`; fully automated workflows should use explicit discovery,
search, and element references instead.

A single selection returns `kind` (`element`, `lyrics`, `annotation`,
`alternateLine`, or `headerFooter`) and a compact `target` containing `elementRef`,
`elementType`, `collection`, and zero-based `index`. Nested selections identify
the selected annotation or alternate-line container, rather than its staff
parent. The child collection's `parentRef` supplies that context. An alternate
line's final note may drive the toolbar, but it is not reported as a separate
caret selection. Lyrics identify the owning note. Headers/footers identify the
stored template and variant, without identifying a repeated page occurrence.
Use `get_element` for properties or neighboring context.

A staff range returns `kind: "range"`, `collection: { "kind": "staff" }`,
normalized half-open `start`/`end`, and directional `anchorRef`/`focusRef`. The UI's
inclusive endpoints are converted to the API's existing half-open convention.
Ranges do not expand into an unbounded reference list; use `get_elements` to
retrieve their contents. Removed or unreachable selected objects return null.

Selection is a snapshot of editor state, not a promise that the user will keep
it selected. Moving the selection does not advance the document-content revision
or create an undo step. `expectedRevision` checks content only; use the returned
references and revision for subsequent edits rather than following later UI
selection changes. Caret offsets and highlighted text inside lyrics or rich-text
editors are not exposed. Existing editor-readiness/busy and document
access rules apply.

Run the regression against a disposable app started with
`--remote-debugging-port=9334`:

```sh
NEANES_MCP_TOKEN=<same-token> NEANES_DEBUG_URL=http://127.0.0.1:9334 node scripts/mcp/selection-smoke.mjs
```

### Element transaction contract

`edit_elements` accepts `actions` (1 to 1000). All element definitions use
`{ elementType, properties?, clientId? }`; omitted insertion properties use the
live element constructor defaults and the document's paragraph styles. `clientId`
is a batch-local name matching `[A-Za-z][A-Za-z0-9_-]{0,63}`. Later actions may
use `@clientId` wherever an element reference is accepted, including a child
collection's `parentRef`. Forward references and duplicate names are rejected.
References from discovery remain scoped to the owning open document.

Actions:

- `insert`: `collection` defaults to staff. `elements` supplies 1 to 1000 typed definitions. Optional `index` is zero-based; omission inserts before the staff's terminal `Empty`, or appends to another collection.
- `update`: supplies `elementRef`, its expected `elementType`, optional `properties`, and optional `reset` property names. Omitted properties stay unchanged. Explicit null clears nullable fields; `lineHeight: null` means normal. `reset` restores constructor defaults, including undefined/inherited `lineHeight`. A property cannot appear in both `properties` and `reset`. At least one property/reset is required. IDs, element types, nested collections, and layout caches cannot be assigned as properties. Use `get_element_catalog.editProperties` for permitted names and value schemas.
- `replace`: supplies `elementRef` and a new `element` definition. Positional break state transfers, unless explicitly overridden. The replacement gets a new reference; omitted content and formatting use constructor defaults. Child collections are not carried across replacement.
- `remove`: supplies `elementRef`.
- `remove_range`: supplies `collection`, `start`, and `end` (inclusive/exclusive). Ranges and insertion indexes refer to the current draft after earlier actions, not the original document.
- `assign_lyrics`: supplies `text` and optional `collection`, `start` (default zero), and `end` (default collection size). It uses the same lyric tokenizer, melisma/hyphen handling, RTL rules, and Greek handling as the editor. Supports staff or alternate-line note collections; preserves explicit element formatting. Locked staff lyrics reject assignments to the main staff; alternate-line assignments remain independent.
- `set_staff_lyrics`: supplies the complete lyrics-manager state, `text` and `locked`. Assigns that text across the staff using the shared lyric service in the same undo step. When locked, later structural changes reassign the authoritative text; direct main-staff note lyric/melisma and drop-cap content edits are rejected. Alternate-line notes remain independently editable. Unlock with this action before editing individual main-staff lyrics. Unlocked staff text is derived from element lyrics during normal settlement.

On creation/replacement of `Tempo`, `Martyria`, or `ModeKey`, a supplied tempo
sign derives its BPM from `get_element_catalog.tempoBpmDefaults` when `bpm` is
omitted. For example, `{ elementType: "Tempo", properties: { neume: "Quick" } }`
uses 168 BPM. Explicit `bpm` overrides this default. Partial updates preserve an
omitted BPM even when the sign changes; supply `bpm` when changing both.

Martyria `tempo`, `tempoLeft`, and `tempoRight` are mutually exclusive in the
final transaction state. Switching positions requires explicitly clearing the
previous field with `null` or `reset`; omitted properties remain unchanged.
Conflicts reject the whole batch with `INVALID_NEUME_COMBINATION`.

Lyric ranges must include complete tied, melismatic, or hyphenated groups.
`assign_lyrics` rejects a boundary cutting such a group with
`INVALID_ELEMENT_RANGE` and guidance to expand `start`/`end`, or use explicit
note text and flags. This also applies to Greek melismas, whose initial vowel
and final consonant depend on the complete group. Rejected ranges make no
changes, including outside the passage. A drop cap resets preceding-note context.

`assign_lyrics` also rejects unconsumed input with `INVALID_ELEMENT_RANGE`,
including nonempty text assigned to an empty range. Extend the range or shorten
the text; no partial assignment is committed. Whitespace-only remainder is
ignored. Consumption follows the shared tokenizer, including drop caps,
`acceptsLyrics`, implicit continuations, and Greek handling. The separate
`set_staff_lyrics` action may retain excess text when locked, so later structural
changes can assign it to future notes.

Fthora selection has an intentional coupled change: creating an element with a
fthora, or changing its fthora, defaults the corresponding chromatic interpretation
as the editor does unless it is explicitly supplied. Resending the same fthora
preserves an omitted custom interpretation. This applies to primary, secondary,
tertiary, and martyria quantitative-neume fthoras. Other model setters can clear
components that are incompatible with a newly selected quantitative neume.

Lyric parser syntax applies to `assign_lyrics.text` and `set_staff_lyrics.text`.
Spaces separate syllables, `-` marks a hyphenated syllable, and `_` marks an
extension. With three notes set to `acceptsLyrics: "Yes"`:

| Parser input | Stored lyric text on the three notes | Effect                                                          |
| ------------ | ------------------------------------ | --------------------------------------------------------------- |
| `Al-le-lu`   | `Al`, `le`, `lu`                     | Hyphenated syllables                                            |
| `Al___`      | `Al`, `""`, `""`                     | Extension across three notes                                    |
| `τω___`      | `τω`, `""`, `""`                     | Greek vowel continues across the melisma                        |
| `των___`     | `τω`, `""`, `ων`                     | Final consonant moves to the last note; the split is hyphenated |

Each `_` in an extension accounts for one eligible note, including its start.
A standalone `_` surrounded by spaces leaves a note blank. Greek examples assume
`pageSetup.disableGreekMelismata: false`; when true, automatic Greek vowel and
final-consonant redistribution is disabled (`των___` stores `των`, `""`, `""`),
while marker syntax still works. Continuing vowels are rendered by layout rather
than copied into every note's stored `lyrics`.

`acceptsLyrics` controls parser consumption: `Yes` accepts syllables and
continuations; `No` skips the note; `MelismaOnly` continues the preceding syllable
without consuming a new one. `Default` derives behavior from the quantitative
neume and preceding tie. Set `Yes` when constructing examples that require
predictable note-by-note assignment.

Direct `update.properties.lyrics` is literal text. `lyrics: "Al-"` stores the
hyphen and does not infer flags. Prefer the parser actions for marker syntax.
For a direct hyphen start, supply `lyrics: "Al"`, `isMelisma: true`,
`isMelismaStart: true`, and `isHyphen: true`. For an extension start use
`isHyphen: false`. Continuations use `lyrics: ""`, `isMelisma: true`,
`isMelismaStart: false`, and the matching `isHyphen`. For a plain syllable, clear
all three flags. Omitted flags stay unchanged.

The final staff must retain its single terminal `Empty` element. It cannot be
created, updated, removed, or replaced. Staff accepts notes, martyriae, tempo,
text/rich-text boxes, drop caps, mode keys, and images. Notes own annotations and
alternate lines; alternate lines contain notes. Each stored header/footer
variant must finish with exactly one text or rich-text box. New images require
embedded base64 image data; file paths and remote image URLs are not accepted.
New font assignments must name an available family; unchanged missing families
are retained. Style references must exist. Note setters normalize musical
combinations in canonical property order; secondary/tertiary marks require a
corresponding quantitative component. Nesting is bounded to 16 levels.

For example, construct a note and its annotation in one undo step:

```js
{
  documentId,
  expectedRevision,
  actions: [
    {
      action: 'insert',
      elements: [{ elementType: 'Note', clientId: 'note', properties: { quantitativeNeume: 'Oligon' } }]
    },
    {
      action: 'insert',
      collection: { kind: 'children', parentRef: '@note', collection: 'annotations' },
      elements: [{ elementType: 'Annotation', properties: { text: '<p>Comment</p>' } }]
    },
    { action: 'assign_lyrics', start: 0, end: 1, text: 'Al-' }
  ]
}
```

The target document's stale selections are cleared after removal; property edits
preserve selection, and staff structure edits clear its index-based selection
range. Other documents' content, selection, and history are untouched. The normal
font/layout/text-measurement lifecycle runs after commit, including background
and private-worker documents. A subsequent settlement failure is not rolled back over
possible interactive edits: error details include `editsApplied` and `revision`.
Inspect the document before retrying. Timeouts/disconnects retain the existing
unknown-outcome contract. Rich-text normalization can advance revisions; always
use the latest returned/read revision.

All document-targeting tools require `documentId`. Close, edit, replace, save, and export also require `expectedRevision` from the latest read or successful operation. A revision conflict requires reading again; do not automatically retry a stale write. Revisions are opaque per-workspace numbers that can advance after user or agent edits and after changing the source path. They also cover discovery-visible properties and ordered element identities in all collections, including blank children omitted by score serialization. Replacing or reordering identical live objects can therefore advance a revision without changing saved score data.

For batch cleanup, record the initial document IDs and close only workspaces introduced by the run. `open_document.created` distinguishes newly opened workspaces from reused ones. A reused workspace may contain the user's unsaved edits; opening it does not authorize closing or discarding it.

For a font change, use a sparse update with the revision returned by opening the
score or the latest successful operation. No style read is needed. For example:

```js
{
  documentId: opened.documentId,
  expectedRevision: opened.revision,
  changes: [{
    action: 'update',
    id: 'default-text',
    changes: {
      overrides: { fontFamily: 'Source Serif' }
    }
  }]
}
```

The update preserves the style's name, parent, and every other override. To remove
one override and resume inheritance, use a reset-only update:

```js
{ action: 'update', id: 'lyrics', resetOverrides: ['fontFamily'] }
```

`null` remains an explicit reset value for nullable fields; `resetOverrides`
removes the override itself. `replace` still removes every omitted override.
Page setup and header/footer settings already support sparse `changes`, such as
`update_page_setup` with `changes: { topMargin: 48 }`.

Use the returned revision for subsequent edits, saves, or exports. Read definitions through `get_paragraph_styles`, or request `includeStyles: true` on the edit to include full state. `styles` is writable; `resolvedStyles` and `units` are read-only metadata. Omitting a style from a batch leaves it unchanged; deletion always requires an explicit action.

Calls are serialized across clients. Requests report `EDITOR_NOT_READY` during startup or after a renderer disconnect. Editor document operations report `EDITOR_BUSY` during loading, document closing, open dialogs, or print rendering; the message explains what must finish before retrying. Error details include `reason` (`loading`, `workspace_closing`, `dialog_open`, `printing`, or `native_save`), plus `dialog` for open dialogs (including `preferences` and `recovery`) or `documentIds` for closing workspaces. Native save contention can also return `EDITOR_BUSY`. Capability and element catalog queries bypass the editor busy check, but still require authorization and a ready renderer. Document reads remain subject to the busy check. If a request times out, its outcome may be unknown: inspect documents/files before retrying, and reload the editor to reconnect. File conflict detection uses modification time and size; it does not lock files against other applications.

## Result and error contract

Every tool advertises a JSON output schema. `structuredContent` contains one of:

```json
{ "success": true, "result": { "documentId": "...", "revision": 3 } }
```

```json
{
  "success": false,
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Read the document again before changing, saving, or exporting it.",
    "details": {
      "documentId": "...",
      "expectedRevision": 2,
      "actualRevision": 3
    }
  }
}
```

The success result is tool-specific (`list_documents` returns an array). The text content contains the identical JSON envelope for text-only clients. Errors also set MCP `isError: true`. Clients must branch on `error.code`; human-readable messages are diagnostic and may change. Invalid tool arguments use `VALIDATION_ERROR` with bounded `details.issues` (first paths, shortened messages, and occurrence counts), `issueCount`, and `omittedIssueCount`. Repeated batch failures are grouped; full enum lists are available through a focused catalog query. Unknown tools use `TOOL_NOT_FOUND`. Invalid score/ZIP input uses `INVALID_SCORE`/`INVALID_SCORE_ARCHIVE`. File failures use `FILE_NOT_FOUND`, `FILE_EXISTS`, `PERMISSION_DENIED`, or `IO_ERROR`, with platform `systemCode` and path/syscall where available. Request `get_capabilities` with `includeErrorCodes: true` for the complete domain conflict, scope, editor-state, font, and style code vocabulary. Published schemas use a string code; runtime validation retains the complete enum. Unexpected server failures use `INTERNAL_ERROR`.

Timeouts and renderer disconnects report `details.outcome: "unknown"`; a timeout also reports `requiresReload: true`. A failure is not a guarantee that no side effects occurred. Inspect the workspace/output before retrying an uncertain operation. Malformed JSON-RPC envelopes remain MCP protocol errors rather than tool outcomes.

Read-only JSON results are limited to 64,000 serialized characters (the finite, opt-in full element catalog has a separate 128,000-character budget and is not paginated) before the text/structured-content duplication (preview image blocks have their separate image limit). Oversized results return `RESPONSE_TOO_LARGE`; request fewer properties, a lower limit or smaller neighbor window, or exclude content. A single oversized element is rejected explicitly rather than truncated; use `get_element_content` for exact original content chunks, or `preview_page` to inspect rendered images. Successful write acknowledgments are exempt from read-response budgets: a completed write returns success with its complete result, including every created `clientId` to `elementRef` mapping unless `includeCreated: false` requests a count-only acknowledgment. Full style state requested on an edit is also preserved. Large manager text is available through `get_staff_lyrics`. Results validate at the server boundary. Style editing has its own complete writable definition schema.

## Verification

Pure unit tests cover style graph and metadata validation, undo/redo, serialization, filesystem scope, overwrite behavior, and file conflicts:

```sh
npx vitest run src/services/documents src/automation electron/main/files electron/main/automation/files.test.ts src/utils/OperationQueue.test.ts
```

Run the read-only element discovery regression against a disposable profile. It checks editor and private-worker reads, nested collections, header/footer templates, pagination, reference ownership, revision conflicts, explicit overrides, and unchanged source content after reads:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/element-discovery-smoke.mjs /tmp/neanes-mcp/files
```

To also exercise revision conflicts after live child edits that serialize identically,
start that disposable Electron instance with `--remote-debugging-port=9334` and
set `NEANES_DEBUG_URL=http://127.0.0.1:9334` when running the script. This optional
check changes blank annotations in its own interactive test document, verifies
that saved data stays identical, and requires stale pagination to be rejected.

Run the element transaction regression against the same disposable app. It
constructs nested scores through MCP, checks rejected batches, lyric locks,
style override preservation, saves/reopens, PDF export, and interactive isolation.
With the app's disposable debugging endpoint enabled, `NEANES_DEBUG_URL` also
checks one-step UI undo/redo and the unrelated interactive workspace's live state.

```sh
NEANES_MCP_TOKEN=<same-token> NEANES_DEBUG_URL=http://127.0.0.1:9334 node scripts/mcp/element-edit-smoke.mjs /tmp/neanes-mcp/files
```

Run the rich-text lifecycle regression after `npx vite build`. It launches its own
disposable Electron profile and checks that MCP content updates survive remounts,
including panels, headers/footers and annotations. It also checks history,
pending user typing, blur, and saved HTML. On macOS, run it outside the agent's
command sandbox as described in AGENTS.md.

```sh
node scripts/mcp/rich-text-update-smoke.mjs
```

With the development app running and ready, run the real MCP client smoke test from another terminal with the same token:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/smoke.mjs /tmp/neanes-mcp/files
```

The smoke test creates an interactive workspace and unique output files, updates lyrics defaults, saves/reopens both formats, exports PDFs (including custom 6 x 9-inch portrait and landscape paper dimensions), and checks revision conflicts, external changes, output collisions, authentication, and Origin rejection. It closes the workspaces introduced by the run and leaves output files available for inspection. Run it with an isolated development profile.

To verify reuse of an interactively opened workspace through a path alias, run the additional smoke test with the same token, URL, and isolated development profile:

```sh
NEANES_MCP_TOKEN=<same-token> NEANES_DEV_USER_DATA_DIR=/tmp/neanes-mcp/profile node scripts/mcp/interactive-open-smoke.mjs /tmp/neanes-mcp/files
```

This invokes a real second Electron instance to open the file, changes the open workspace without saving, and verifies that MCP preserves its ID and unsaved content when opening the canonical path. On macOS with a canonical `/private/tmp` output directory, it uses the corresponding `/tmp` path for the interactive open.

To verify real recovery cleanup and last-document behavior, run this only against an isolated development profile with one blank workspace (the regular smoke test restores that state):

```sh
NEANES_MCP_TOKEN=<same-token> NEANES_DEV_USER_DATA_DIR=/tmp/neanes-mcp/profile node scripts/mcp/close-document-smoke.mjs
```

It waits for a real recovery snapshot, explicitly discards that draft, verifies the snapshot does not return, checks partial cleanup failure using an invalid recovery path on disk, then closes the last blank workspace and verifies that a fresh blank workspace replaces it while MCP stays available.

To compare background and foreground typography measurement using real editors:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/background-style-smoke.mjs /tmp/neanes-mcp/files
```

This uses matching scores with plain, rich, multipanel, header, and footer text boxes. It changes inherited typography in a background workspace, saves immediately, and compares persisted heights with a foreground control while checking that selection and the active workspace's heights stay unchanged. It closes only workspaces introduced by the run.

## Hidden export regression

Run the development Electron app with a dedicated profile and `--remote-debugging-port=9334`, or launch a production build with that flag, `--no-update`, and an explicit disposable `--user-data-dir=/tmp/neanes-mcp/export-profile`. The `NEANES_DEV_USER_DATA_DIR` override applies only to development builds. The debugging endpoint must be restricted to a disposable test instance; this test intentionally changes tabs and edits a document through the real renderer.

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/rendering/hidden-export-smoke.mjs /tmp/neanes-mcp/files
```

Set `NEANES_DEBUG_URL` for another local debugging endpoint. The test constructs a multi-page score with notes, lyrics, melismas, a drop cap, martyria, tempo, rich text, and headers/footers. It first exercises selection, range selection, lyric focus/editing/undo, flushing pending inline-rich-text edits on tab switches, and page-specific focus for repeated headers. It also checks style undo/redo with unchanged heights while switching tabs, and exports long title, chapter, and filename tokens in headers/footers with horizontal rules. It then exports a background document while changing tabs and editing the source, checks the exported and current revisions, verifies unchanged control content and undo history, and checks disposal after success, a broken-image failure, and HTTP cancellation. It closes its introduced workspaces. The resulting PDF remains available for visual inspection.

To verify Print Overlays against actual PDF drawing and text content, use the same isolated app and debugging endpoint:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/rendering/print-overlays-smoke.mjs /tmp/neanes-mcp/files
```

This test reloads the disposable editor with each overlay preference, exports a real PDF, and checks that guides, all bounding-box options, lyric baselines, glue widths, and adjustment ratios add PDF content. It also checks that disabling Print Overlays, Overlays, or Developer Panels suppresses them. It restores the original preferences and closes its documents. Run it separately from other smoke tests because it reloads the renderer.

The snapshot protocol uses a separate `export.html` entry, without the normal editor, router, preferences persistence, recovery hooks, or service worker. Main creates one hidden window per export and accepts readiness/results only from that window. The renderer receives the save-format score, source/name metadata, language, and system-font face metadata. All Electron PDF exports (menu, command line, and MCP), native printing, and PNG exports use this renderer. It loads referenced fonts before canvas layout, waits for rich-text editors and image decoding, and measures the resolved text on each page. Height changes trigger another layout/render pass before readiness. Shared header/footer templates reserve their largest observed height across pages and passes; a bounded reconciliation loop fails explicitly if layout does not settle. Main destroys the window and removes its listeners after every outcome. Rendering has a 45-second deadline; native print dialogs and image overwrite dialogs are excluded from it. PNG pages are converted and written one at a time, with a new deadline for the next page after each write. The editor's existing 60-second MCP request timeout remains the outer limit for MCP PDFs. Browser printing and PNG downloads retain their browser paths; the existing SVG plumbing is unchanged.

## MCP PNG preview regression

After `npx vite build`, run outside the agent command sandbox:

```sh
node scripts/mcp/preview-smoke.mjs
```

This starts and stops a disposable editor and bridge using OS-assigned debugging ports.
It checks unsaved interactive/private documents, multiple pages, image delivery
through the bridge, pixel bounds and visible content, revision/layout conflicts,
cancellation, concurrent edits, broken-image failure, renderer disposal, and
unchanged source content/history/selection. Output PNGs remain in the reported
temporary directory. It does not use the normal profile.

## Native printing and PNG regression

With the same disposable profile, debugging endpoint, and MCP configuration:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/rendering/rendering-migration-smoke.mjs /tmp/neanes-mcp/files
```

This exercises actual detached PNG rendering and filesystem output. It checks a two-page custom landscape score with rich text, an embedded image, resolved header/footer tokens, and overlays. It verifies dimensions at 96 and 192 DPI, page selection, transparent/opaque backgrounds, source content/revision/selection/undo preservation, empty page selection, broken-image failure, and disposal when a rendering window is closed. It intentionally supplies stale heights in the detached snapshot to exercise measurement and repagination. Output images remain available for visual inspection. Do not run it concurrently with other smoke tests.

Add `--native-print-cancel` to open the real native print dialog with custom landscape paper after the PNG checks. Cancel that dialog to complete the check; no physical print is required. The test verifies cancellation and window disposal, and checks that the source score remains unchanged. Printer selection, copies, page ranges, orientation, and other device options remain in the system dialog. The rendering deadline does not limit the time spent choosing print settings.

Alternatively, add `--native-print-save`, choose the native dialog's PDF output, and save to the exact path printed by the script. This verifies successful completion and disposal without sending a physical printer job. Inspect its output separately: custom-paper native printing can insert blank pages between score pages. This also occurs on unchanged master when its print IPC receives valid native dimensions, bypassing master's separate inches-versus-microns argument error. The migration does not change page heights or add pagination workarounds for this pre-existing behavior. A two-page Letter-landscape control produces two pages on both master and the migrated renderer with MCP disabled.

## Code organization

Shared document operations live in `src/services/documents/`: workspace creation and opening, metadata and paragraph-style edits, serialization, save completion, and export preparation. Both the editor UI and MCP call `DocumentService`. Editor hooks supply rendering, focus, recovery, and layout behavior; persistence callbacks supply either dialog-based or explicit-path file writes.

`electron/main/files/scoreFiles.ts` owns shared score encoding and in-place I/O. `electron/main/automation/scoreFiles.ts` adds canonical file identity and API conflict/overwrite checks. Dialog-driven saves retain their existing write behavior; explicit-path saves preserve existing files and their metadata as well. `electron/main/automation/files.ts` validates explicit paths and formats without imposing folder restrictions. General file types live in `src/services/documents/fileTypes.ts`.

`src/automation/` owns automation-only contracts, discovery, edit planning, read projections, revisions, private stores, renderer dispatch, and its Electron IPC client. See [the automation architecture](../../src/automation/README.md) for the directory map and dependency rule. `TheEditor.vue` attaches `useEditorAutomation` through explicit application hooks. Shared document and file services do not import automation types or tool contracts; ESLint enforces this boundary.

The shared paragraph-style service owns graph validation, replacement, and deleted-style reference repair. API create/replace/delete batches and read projections live under automation. Shared rendering regression scripts live in `scripts/rendering/`; they still use MCP as a test driver.

The editor and hidden export renderer both use `ScorePageContent.vue` for headers, footers, notation, lyrics, and element rendering. The editor retains its page DOM wrappers, visibility tracking, focus handling, and mutation handlers. Each page owns its child refs and exposes methods for element, lyric, annotation, and page-specific header/footer lookup; the editor holds only page-component refs. Page content forwards typed interaction events; editor-only badges and developer overlays are supplied through slots. Print pages use local component refs to await rich-text readiness. Overlay markup, geometry, and styles also live in the shared page component. Snapshots capture overlay preferences, and the detached renderer regenerates layout diagnostics so enabled Print Overlays settings apply to every PDF route.

## Score file discovery

`discover_score_files` lists regular `.byz` and `.byzx` files on the Neanes host
without opening or validating their contents. Pass an absolute `folderPath` and
optionally `recursive: true` (default false). Symlink entries are skipped, including
directory symlinks; the explicitly supplied root is resolved to its canonical path.
No document ID or editor scope is required. Cancellation or a 60-second
request deadline releases the API queue immediately. An in-flight OS filesystem
call may finish later; discovery stops before processing its result or traversing
another folder. Discovery timeout returns `AUTOMATION_TIMEOUT` without requiring
an editor reload.

Results contain `files` (absolute paths) and `nextOffset`. Request the next page
with `offset: nextOffset` until it is null; `limit` defaults to 100 and accepts 1-100.
Order is deterministic: sorted files in each folder, followed by child folders in
sorted depth-first order. Pagination rescans the tree, so keep folder/options and
the tree unchanged while collecting pages. Collect the manifest before batch writes.
The tool caps each traversal at 10,000 directory entries and each page at about
16,000 JSON path characters; a traversal that exceeds the entry cap returns
`RESPONSE_TOO_LARGE` and requires a narrower folder. Unreadable subfolders fail the
request rather than returning an apparently complete list.

```js
const paths = [];
let offset = 0;
do {
  const page = await call('discover_score_files', {
    folderPath: '/scores',
    recursive: true,
    offset,
  });
  paths.push(...page.files);
  offset = page.nextOffset;
} while (offset !== null);
// Use paths.map(filePath => ({ filePath })) in explicit batch manifests.
```

Batch manifests are limited to 100 files; split larger discoveries into explicit
manifests and inspect each batch's results before continuing.

## Batch transformations

`batch_update_files` processes an explicit manifest of up to 100 saved scores in
request-owned private documents. It never reuses interactive tabs or caller-owned
private documents and does not accept `documentScope`. It holds
one score at a time, so the 16-open-document worker limit does not constrain the
manifest. The normal bridge routes it to its private worker.

```js
const query = {
  files: [
    { filePath: '/scores/first.byzx' },
    {
      filePath: '/scores/second.byz',
      edits: { pageSetup: { bottomMargin: 60 } },
    },
  ],
  edits: {
    paragraphStyles: [
      {
        action: 'update',
        id: 'default-text',
        changes: { overrides: { fontFamily: 'Source Serif' } },
      },
    ],
    pageSetup: { topMargin: 50 },
  },
  save: 'inPlace',
};
```

Each `edits` object optionally contains `paragraphStyles` (the existing style
create/replace/update/delete actions), `pageSetup`, `headerFooter`, and sparse
`documentProperties` (title/author). Shared edits run first, then that file's edits;
per-file edits can override shared values while preserving unrelated fields.
Each layer's style graph must be valid. Settings use the same fields and units as
the corresponding single-document update tools. The published batch input is inline:
some clients expose local schema references as `unknown`, hiding required fields.
Compact settings and style-override dictionaries list writable field names without
repeating detailed value constraints. The style-action envelope lists all action
fields; `id` is required for update/delete, and `style` for create/replace.
Use `edit_paragraph_styles.changes`, `update_page_setup.changes`, and
`update_header_footer_settings.changes` for detailed constraints. Runtime validation
still enforces the complete contracts, including action-specific requirements.
Element-reference transactions,
folder discovery, scripts, and conditional selection are outside this tool.

`save` defaults to `inPlace`; unchanged scores skip the disk write. With `copy`,
every file requires a distinct `outputFilePath` (.byz or .byzx), and even unchanged
scores are copied. `none` discards temporary edits after any PDF export. An optional
per-file `pdfFilePath` exports the transformed score. For export-only batches,
omit `edits`, set `save: "none"`, and supply each `pdfFilePath`. To save edits and
export PDFs, use `save: "inPlace"` or `"copy"`; the score is saved before PDF export. Existing unrelated outputs
require `overwrite: true`; same-source saves retain normal source-conflict checks.
Directories must exist. Inputs and outputs are checked for canonical identity
collisions across the entire manifest before any writes, including when resuming.
Copies cannot overwrite any input. Separate files commit independently; saving a
score and exporting its PDF are also separate commits.

`dryRun: true` loads, validates, applies edits, and settles text measurements without
saving or rendering PDFs. It reports whether the score would change, but does not
guarantee destination permissions/availability or successful PDF rendering.

Results contain `index`, input `filePath`, `status` (completed/unchanged/dryRun/failed),
`changed` when known, committed `savedFilePath`/`pdfFilePath`,
and a compact error code/message. A later PDF failure retains already
committed output paths. No document definitions or transient IDs/revisions are
returned. `onError` defaults to `stop`; `continue` attempts later files. Cancellation
and access revocation stop further work at authorization/render checkpoints.

The tool yields between files after a soft 20-second work budget or a 16,000-character
result threshold. A single slow file can still hit the existing 60-second request
timeout. The response has `stopReason` (complete/error/timeBudget/responseBudget/cancelled)
and `nextIndex` (the first unattempted file, or null). `complete` means every remaining
file was attempted, not that every file succeeded. To continue, send the identical
manifest/options with `startIndex: nextIndex`; failed files require separate inspection
and an explicit retry. Never restart at zero merely because the batch yielded.
There is no stored job, cross-file rollback, or automatic replay. If the connection
is lost before the report arrives, inspect outputs before retrying.

## Response size guidance

Capabilities omit fonts by default; opt in with `includeFonts: true` only when
checking this host's available fonts. Text font assignments do not require local
installation. Use `get_paragraph_styles` with `view: "ids"` for IDs alone.
Replacing a style still needs its complete definition to preserve other overrides.

Prefer focused catalog queries with `view: "edit"` when preparing edits, projected
`get_elements` reads, and `get_paragraph_styles` with `ids` and
`includeResolved: false` when replacing a style. Keep the complete returned
`overrides` object when changing a single field. Use `assign_lyrics` for parser
semantics; use literal property updates when exact text/flags are required.
Pagination limits element count, not arbitrary string size. Omit embedded content
or select only the properties needed before inspecting image-rich documents.

The server publishes compact discovery property/error envelopes and retains
strict runtime validation. Detailed property constraints come from
`get_element_catalog`; error codes come from
`get_capabilities({ includeErrorCodes: true })`. Success/error responses still
include identical text and structured representations for client compatibility.
Wire characters do not measure model-specific tokens or establish what a client
places in its context.

`src/automation/contracts/tokenEfficiency.test.ts` budgets the exact served
`tools/list` definitions (including descriptions and annotations), separate input
and output views, and validates published schemas. Pure discovery/document/style
regressions cover representative response sizes; the transaction smoke script
checks focused reads in both editor and private-worker document modes.

## Mode-key templates

Discover templates with `get_mode_key_templates`, usually filtered by mode. For
example, mode 6 includes template 604, "Heptaphonic (Makam Hicâzkâr)"; mode 7
includes template 703, "Pentaphonic (Makam Ferâhnâk)". Mode 1 includes both 100,
"Heirmologic and Sticheraric", and 104, "Heirmologic (from Di)". Inspect the
returned descriptions and starting notes to choose the requested variant.

ModeKey insertions and replacements require both construction properties:

```json
{
  "action": "insert",
  "elements": [
    {
      "elementType": "ModeKey",
      "properties": {
        "templateId": 100,
        "useOptionalDiatonicFthoras": true
      }
    }
  ]
}
```

For an existing mode key, use an `update` action with its `elementRef`,
`elementType: "ModeKey"`, and the same pair of properties. Supplying either
requires both, even when reapplying the same template. The server applies every
template-owned musical and notation field and clears fields absent from the new
template. It preserves unrelated style, alignment, tempo/BPM, break, attraction,
and ambitus settings on updates. Styling and tempo updates alone need no template
pair. These actions use the existing revision checks and atomic undo transaction.

`useOptionalDiatonicFthoras` is an operation input, not a stored element property.
It adds the optional diatonic sign when supported. False never removes built-in
fthoras; either value is accepted without effect for templates with no optional
sign. It does not change the page-setup preference. Read resulting notation with
`get_elements`/`get_element`. Do not combine template application with raw
notation/scale properties or resets of those fields. Advanced custom notation
can be applied in a separate update; a stored template ID then identifies its
origin rather than guaranteeing that all notation still matches the template.
