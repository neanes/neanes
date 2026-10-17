# Neanes MCP

The Electron app can expose an opt-in MCP Streamable HTTP endpoint while it is running. The web build does not host a server. Document tools operate on interactive workspaces by default, or private documents when passed an isolated session ID. MCP PDF export renders a detached snapshot in a dedicated hidden window. Typed element and lyric transactions are available in both document modes. Folder jobs and temporary export transformations remain planned separately.

## Start locally

Use a dedicated development profile to keep automation work separate from your normal documents:

```sh
mkdir -p /tmp/neanes-mcp/files
export NEANES_MCP=1
export NEANES_MCP_TOKEN="$(openssl rand -hex 32)"
export NEANES_MCP_ROOTS='["/tmp/neanes-mcp/files"]'
export NEANES_DEV_USER_DATA_DIR=/tmp/neanes-mcp/profile
npm run dev
```

For a packaged app, pass `--mcp` or set `NEANES_MCP=1` when launching its executable. The token and roots environment variables are required in either case. `NEANES_DEV_USER_DATA_DIR` only applies to development builds.

The endpoint defaults to `http://127.0.0.1:38765/mcp`. Set `NEANES_MCP_PORT` to select a different port. The startup log prints the actual address without the token. Invalid configuration or an occupied port logs an error and leaves the editor running without MCP.

Configure your MCP client with that URL and an `Authorization: Bearer <NEANES_MCP_TOKEN>` header. The token must have at least 32 characters; use a random secret and keep it out of source control. The endpoint binds to IPv4 loopback, validates the Host header, and rejects browser Origin headers. It uses stateless JSON responses; it does not offer a standalone SSE stream.

`NEANES_MCP_ROOTS` is a JSON array of existing absolute directories allowed for reads and writes. Output parent directories must already exist. Symlink escapes and symlink output files are rejected. No filesystem access is granted by the MCP client's own roots list.

## Isolated sessions

Call `create_session` and pass the returned `sessionId` to document tools (including
`list_documents`, `create_document`, and `open_document`). Omitting it retains the
interactive behavior. A document is accessible only in its owning session; an
interactive ID cannot be used inside a session, and isolated IDs cannot be used
outside it. `selected` is always false and closing an isolated document returns
`selectedDocumentId: null`.

Session IDs are bearer capabilities within the authenticated server, not separate
client identities. Keep them private. The stateless HTTP connection does not own
the session: disconnecting a client leaves its session available for inspection
and cleanup after an uncertain request. Sessions expire after 15 minutes without
a tool call, discarding unsaved drafts. At most 4 sessions may exist with 16 open
documents each. `get_capabilities.isolatedSessions` advertises these bounds.
`SESSION_NOT_FOUND` covers expired/closed/unknown sessions; capacity failures use
`SESSION_LIMIT_REACHED` or `DOCUMENT_LIMIT_REACHED`.

`close_session` requires the session ID and explicit `discardUnsavedChanges: true`
if any owned document is dirty. It checks all documents before removing any.
Session expiry, editor reload/disconnect, and app exit release all private drafts.
No tabs, selection, recovery drafts, recent-file entries, or interactive undo
history are created or changed. The normal editor must still be running.

Opening a file in a session reads its saved contents, independently of interactive
unsaved edits or other sessions. Repeated opens within one session reuse its own
copy by canonical identity and preserve that copy's edits. Explicit saves may
change disk contents, including files open interactively; they never update the
interactive copy. Existing source modification-time/size conflict and overwrite
rules apply. Save to a separate destination to preserve the original disk file.
PDF export uses the shared detached snapshot renderer.

Run the isolated lifecycle regression with a disposable development profile and
`--remote-debugging-port=9334` (see the hidden export instructions below). Pass
`NEANES_DEV_USER_DATA_DIR` to the script as well to check recovery files on disk:

```sh
NEANES_MCP_TOKEN=<same-token> NEANES_DEV_USER_DATA_DIR=/tmp/neanes-mcp/profile node scripts/mcp/isolated-session-smoke.mjs /tmp/neanes-mcp/files
```

## Tools

- `get_capabilities`: supported style actions, units, formats, and installed/bundled font families. Pass `includeErrorCodes: true` for the stable error-code vocabulary.
- `list_documents`: open workspace IDs, revisions, canonical source paths, source format (`byz`, `byzx`, or null), selection, and unsaved state.
- `get_element_catalog`: defaults to a small inventory of element types, child collections, units, and stored header/footer variants. Request `elementTypes: ["Note"]` and/or `properties: ["lyrics", "isMelisma"]` for focused schemas; `view: "read" | "edit" | "both"` defaults to both. Read schemas are in `properties`, writable validation schemas in `editProperties` (null for `Empty`). A property filter omits types without matching properties. `includeProperties: true` requests all property schemas; `includeNeumes: true` adds the full enum vocabulary. Schemas use self-contained local `$defs`/`$ref`; clients must resolve references within each schema. The shared `tempoBpmDefaults` map exposes all tempo-sign BPM defaults. Dimensions are CSS pixels; line height is a multiplier. Tool input schemas use JSON Schema input semantics, so defaulted fields may be omitted; response schemas describe settled output. Tool schemas advertise compact property maps; the server still validates every supplied property against its complete element-specific schema.
- `get_elements`: typed, read-only elements from `collection` (default `{ kind: "staff" }`). Ranges are zero-based, `start` inclusive and `end` exclusive; omitted `end` means the collection size. `offset` and `nextOffset` are relative to that range; `limit` defaults to 100, maximum 1000. Empty ranges and an offset at the range end return no elements. Out-of-bounds or reversed ranges return `INVALID_ELEMENT_RANGE`. Pass the first page's `revision` as `expectedRevision` on subsequent pages to reject mixed-revision reads. Each element has an opaque `elementRef`, its collection index, typed live `properties`, and child-collection counts. Discover children with `{ kind: "children", parentRef: elementRef, collection: "annotations" | "alternateLines" | "elements" }`. Unknown/removed/cross-document references return `ELEMENT_NOT_FOUND`; an unsupported child collection returns `INVALID_ELEMENT_COLLECTION`. References survive movement, content changes, and undo restoration of the same live object, but only within one open document; closing/reopening assigns fresh references. They are not saved IDs or layout indexes. Staff reads include the terminal `Empty` sentinel. Read stored templates with `{ kind: "headers" | "footers", variant: "default" | "firstPage" | "odd" | "even" | "chapterOpening" }`, including disabled variants; these are not page-resolved instances. Element properties omit null and undefined values except `lineHeight: null` for text boxes and drop caps, which explicitly resets line height to normal. Omitted `lineHeight` inherits the paragraph style; a numeric value overrides its multiplier. Other missing properties are unset. Values such as `false`, `0`, and `""` remain present. Use `properties: ["quantitativeNeume", "lyrics"]` to select fields, or `properties: []` for identities/indexes/child counts only. Unknown property names are rejected; fields inapplicable to an element type are omitted. `includeContent: false` omits image `data`, all five text-box `content*` fields, drop-cap `content`, and annotation `text`, even if selected. Note lyrics remain ordinary properties. Both options default to the complete existing view. In a projected view, missing fields may be unrequested or excluded content; do not infer defaults or use projections as complete replacement definitions. Retrieve content explicitly by selecting its property with `includeContent: true` (the default). The catalog marks unsettable properties optional; published outputs use compact property envelopes while runtime validation remains element-specific. Properties omit layout caches; annotations/alternate lines expose their stored x/y offsets.
- `get_document`: metadata and serialized score, with staff elements paginated by `offset` and `limit` (default 100, maximum 1000). `nextOffset` is null on the final page. Optional `sections` selects any of `documentProperties`, `pageSetup`, `paragraphStyles`, `headers`, `footers`, `staffElements`, and `staffLyrics`. Omission preserves the complete view; `[]` returns only score version/app-version fields plus the document summary. Use `["staffElements"]` for subsequent pages without repeating styles, headers/footers, or staff lyric-manager text. `nextOffset` is null when elements are not selected. Selected views retain save-format field names but are not complete loadable scores. Pass `expectedRevision` on subsequent reads to reject mixed revisions. Serialized dimensions use CSS pixels.
- `edit_elements`: apply an ordered, validated transaction to one document using its latest `expectedRevision`. Actions run on detached live-model drafts; schema, reference, font/style, musical component, and collection validation completes before commands mutate the document. Invalid batches leave no partial musical edits or history entries. Successful changes form one undo step, preserve existing element identities and collection arrays, and do not save. A no-op returns `applied: false` without adding history. The result includes current document metadata/revision and `created` entries (`clientId`, `elementRef`, `elementType`) for inserted/replacement objects still present. See the transaction contract below.
- `create_document`: create and select a document using the user's current defaults. Optional `title` sets its metadata title.
- `open_document`: open an absolute `.byzx` or `.byz` path. An already-open file is selected by canonical identity without replacing unsaved changes, including when its interactive path uses a directory alias. The requested suffix selects decoding; canonical identity does not change that format. Returns `created: true` only when a workspace was added; reused workspaces return false.
- `close_document`: closes one workspace without saving or deleting score files. Requires `documentId` and `expectedRevision`. Unsaved or recovered workspaces return `UNSAVED_CHANGES` unless `discardUnsavedChanges: true` is explicit. Stale revisions are rejected even when discarding. Recovered drafts require saving or explicit discard even if their dirty flag is clear; error details include `hasUnsavedChanges` and `isRecovered`. Recovery snapshots and pending recovery timers are removed. Closing a background workspace preserves the selection; closing the selected one selects a neighbor. Closing the last workspace creates a blank workspace and keeps MCP running. Returns `{ documentId, selectedDocumentId }`. Cleanup failure after removal reports `RECOVERY_CLEANUP_FAILED` with `details.closed: true`; inspect the document list instead of retrying that close. A pending native save or interactive close returns `EDITOR_BUSY`; close waits for exports and native file opens.
- `get_paragraph_styles`: complete writable style definitions, optionally filtered by `ids` (unknown IDs return `STYLE_NOT_FOUND`; `[]` selects none). `includeResolved: false` omits resolved metadata. By default returns all definitions in `styles`, and separate read-only `resolvedStyles` with effective values, built-in flags, and display labels. These definitions use the live model shape (`overrides` and `fontStyle`), unlike `get_document.score.paragraphStyles`, which uses the serialized save shape. Dimensions are CSS pixels; `lineHeight` is a unitless multiplier.
- `edit_paragraph_styles`: an atomic batch of `create`, `replace`, and `delete` actions. Each create/replace supplies a complete definition (`id`, `parentStyleId`, `overrides`, and `displayName` for custom styles). Built-in names are read-only metadata and must be omitted. Missing overrides inherit; supported null values explicitly reset. Each ID can appear once per batch. Action order does not matter: a child may refer to a parent created later in the payload. Validation checks the final graph for missing parents, cycles, duplicate IDs/names, and protected built-ins before applying anything. Built-in styles cannot be created, deleted, or renamed. Custom null parents normalize to `default-text`. Deleted styles' untouched children inherit from their nearest surviving ancestor or `default-text`; content references use their nearest surviving ancestor or surface default. Explicit references to a parent deleted in the same batch are rejected. Newly assigned font families must exist; unchanged unavailable families are preserved. The response defaults to a document summary and `affectedStyleIds`: definitions actually changed, created, deleted, or reparented (not every descendant whose resolved values changed). Pass `includeStyles: true` to also return the complete `styles`, `resolvedStyles`, and `units`. The entire edit is one undo step and preserves per-element overrides. Before returning, it measures the target workspace's resizable body text boxes and enabled headers/footers with the updated styles, even when that workspace is in the background. Measurement preserves the selected workspace. Saves and recovery snapshots wait for pending measurements; failed measurement reports `TEXT_BOX_MEASUREMENT_FAILED` rather than saving stale heights. Does not save.
- `replace_document_properties`: replaces the complete metadata object, requiring both `title` and `author`. One undo step; does not save.
- `save_document`: save to `filePath`, or to the document's source if omitted. Save-as changes the workspace's source path. Existing unrelated destinations require `overwrite: true`. Saving back to the source checks its last known modification time and size, even when overwrite is true. Writes use a temporary file followed by an atomic commit. Same-source saves preserve the format used to open the score, including extensionless or differently suffixed symlink targets, and preserve the alias itself. Save-as to a different identity uses the destination suffix. Unrelated symlink outputs remain forbidden. The result includes `savedRevision` (the revision written) and `savedContentUnchanged` (whether that saved snapshot is still current). `revision` describes the current workspace, which can include newer interactive edits or the new source path.
- `export_pdf`: render to an explicit absolute PDF path without a save dialog or external PDF viewer. Existing destinations require `overwrite: true`. Does not save the score. Export uses a dedicated hidden renderer and leaves tabs, selection, editor input, and undo history available. The result includes `exportedRevision`, identifying the snapshot written to the PDF; `revision` describes the workspace at completion and may include newer interactive edits. Snapshot metadata and file-name tokens are captured together. No workspace, recovery state, or save is created by the hidden renderer. Rendering failure uses `EXPORT_RENDER_FAILED`; an aborted HTTP request cancels pending rendering and disposes its window. Cancellation uses `EXPORT_CANCELLED` when a response can still be delivered. Existing destination checks and atomic output commits still apply; cancellation racing with a completed commit can have an unknown outcome.

### Element transaction contract

`edit_elements` accepts `actions` (1 to 1000). All element definitions use
`{ elementType, properties?, clientId? }`; omitted insertion properties use the
live element constructor defaults and the document's paragraph styles. `clientId`
is a batch-local name matching `[A-Za-z][A-Za-z0-9_-]{0,63}`. Later actions may
use `@clientId` wherever an element reference is accepted, including a child
collection's `parentRef`. Forward references and duplicate names are rejected.
References from discovery remain scoped to the owning open document/session.

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
and isolated documents. A subsequent settlement failure is not rolled back over
possible interactive edits: error details include `editsApplied` and `revision`.
Inspect the document before retrying. Timeouts/disconnects retain the existing
unknown-outcome contract. Rich-text normalization can advance revisions; always
use the latest returned/read revision.

All document-targeting tools require `documentId`. Close, edit, replace, save, and export also require `expectedRevision` from the latest read or successful operation. A revision conflict requires reading again; do not automatically retry a stale write. Revisions are opaque per-workspace numbers that can advance after user or agent edits and after changing the source path. They also cover discovery-visible properties and ordered element identities in all collections, including blank children omitted by score serialization. Replacing or reordering identical live objects can therefore advance a revision without changing saved score data.

For batch cleanup, record the initial document IDs and close only workspaces introduced by the run. `open_document.created` distinguishes newly opened workspaces from reused ones. A reused workspace may contain the user's unsaved edits; opening it does not authorize closing or discarding it.

For a font change, read `get_paragraph_styles`, take the complete `lyrics` definition from `styles`, and submit it to `edit_paragraph_styles` with an updated `overrides` object. Preserve its other overrides. For example, the client can construct:

```js
{
  documentId: result.documentId,
  expectedRevision: result.revision,
  changes: [{
    action: 'replace',
    style: {
      ...result.styles.find(style => style.id === 'lyrics'),
      overrides: {
        ...result.styles.find(style => style.id === 'lyrics').overrides,
        fontFamily: 'Source Serif',
        fontSize: 12.5 * 96 / 72 // 12.5 points in CSS pixels
      }
    }
  }]
}
```

Use the returned revision for subsequent edits, saves, or exports. Read definitions through `get_paragraph_styles`, or request `includeStyles: true` on the edit to include full state. `styles` is writable; `resolvedStyles` and `units` are read-only metadata. Omitting a style from a batch leaves it unchanged; deletion always requires an explicit action.

Calls are serialized across clients. Requests report `EDITOR_NOT_READY` during startup or after a renderer disconnect, and `EDITOR_BUSY` while a dialog or print operation is active. If a request times out, its outcome may be unknown: inspect documents/files before retrying, and reload the editor to reconnect. File conflict detection uses modification time and size; it does not lock files against other applications.

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

The success result is tool-specific (`list_documents` returns an array). The text content contains the identical JSON envelope for text-only clients. Errors also set MCP `isError: true`. Clients must branch on `error.code`; human-readable messages are diagnostic and may change. Invalid tool arguments use `VALIDATION_ERROR` with `details.issues` (paths and messages). Unknown tools use `TOOL_NOT_FOUND`. Invalid score/ZIP input uses `INVALID_SCORE`/`INVALID_SCORE_ARCHIVE`. File failures use `FILE_NOT_FOUND`, `FILE_EXISTS`, `PERMISSION_DENIED`, or `IO_ERROR`, with platform `systemCode` and path/syscall where available. Request `get_capabilities` with `includeErrorCodes: true` for the complete domain conflict, scope, editor-state, font, and style code vocabulary. Published schemas use a string code; runtime validation retains the complete enum. Unexpected server failures use `INTERNAL_ERROR`.

Timeouts and renderer disconnects report `details.outcome: "unknown"`; a timeout also reports `requiresReload: true`. A failure is not a guarantee that no side effects occurred. Inspect the workspace/output before retrying an uncertain operation. Malformed JSON-RPC envelopes remain MCP protocol errors rather than tool outcomes.

Results validate at the server boundary. `get_document.result.score` remains the existing serialized .byzx document contract; its schema exposes it as JSON, rather than maintaining a second schema for the full save format. Style editing has its own complete writable definition schema.

## Verification

Pure unit tests cover style graph and metadata validation, undo/redo, serialization, filesystem scope, overwrite behavior, and file conflicts:

```sh
npx vitest run src/services/documents src/services/automation electron/main/files electron/main/automation/files.test.ts electron/main/OperationQueue.test.ts
```

Run the read-only element discovery regression against a disposable profile. It checks interactive and isolated reads, nested collections, header/footer templates, pagination, reference ownership, revision conflicts, explicit overrides, and unchanged source content after reads:

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
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/hidden-export-smoke.mjs /tmp/neanes-mcp/files
```

Set `NEANES_DEBUG_URL` for another local debugging endpoint. The test constructs a multi-page score with notes, lyrics, melismas, a drop cap, martyria, tempo, rich text, and headers/footers. It first exercises selection, range selection, lyric focus/editing/undo, flushing pending inline-rich-text edits on tab switches, and page-specific focus for repeated headers. It also checks style undo/redo with unchanged heights while switching tabs, and exports long title, chapter, and filename tokens in headers/footers with horizontal rules. It then exports a background document while changing tabs and editing the source, checks the exported and current revisions, verifies unchanged control content and undo history, and checks disposal after success, a broken-image failure, and HTTP cancellation. It closes its introduced workspaces. The resulting PDF remains available for visual inspection.

To verify Print Overlays against actual PDF drawing and text content, use the same isolated app and debugging endpoint:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/print-overlays-smoke.mjs /tmp/neanes-mcp/files
```

This test reloads the disposable editor with each overlay preference, exports a real PDF, and checks that guides, all bounding-box options, lyric baselines, glue widths, and adjustment ratios add PDF content. It also checks that disabling Print Overlays, Overlays, or Developer Panels suppresses them. It restores the original preferences and closes its documents. Run it separately from other smoke tests because it reloads the renderer.

The snapshot protocol uses a separate `export.html` entry, without the normal editor, router, preferences persistence, recovery hooks, or service worker. Main creates one hidden window per export and accepts readiness/results only from that window. The renderer receives the save-format score, source/name metadata, language, and system-font face metadata. All Electron PDF exports (menu, command line, and MCP), native printing, and PNG exports use this renderer. It loads referenced fonts before canvas layout, waits for rich-text editors and image decoding, and measures the resolved text on each page. Height changes trigger another layout/render pass before readiness. Shared header/footer templates reserve their largest observed height across pages and passes; a bounded reconciliation loop fails explicitly if layout does not settle. Main destroys the window and removes its listeners after every outcome. Rendering has a 45-second deadline; native print dialogs and image overwrite dialogs are excluded from it. PNG pages are converted and written one at a time, with a new deadline for the next page after each write. The editor's existing 60-second MCP request timeout remains the outer limit for MCP PDFs. Browser printing and PNG downloads retain their browser paths; the existing SVG plumbing is unchanged.

## Native printing and PNG regression

With the same disposable profile, debugging endpoint, and MCP configuration:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/rendering-migration-smoke.mjs /tmp/neanes-mcp/files
```

This exercises actual detached PNG rendering and filesystem output. It checks a two-page custom landscape score with rich text, an embedded image, resolved header/footer tokens, and overlays. It verifies dimensions at 96 and 192 DPI, page selection, transparent/opaque backgrounds, source content/revision/selection/undo preservation, empty page selection, broken-image failure, and disposal when a rendering window is closed. It intentionally supplies stale heights in the detached snapshot to exercise measurement and repagination. Output images remain available for visual inspection. Do not run it concurrently with other smoke tests.

Add `--native-print-cancel` to open the real native print dialog with custom landscape paper after the PNG checks. Cancel that dialog to complete the check; no physical print is required. The test verifies cancellation and window disposal, and checks that the source score remains unchanged. Printer selection, copies, page ranges, orientation, and other device options remain in the system dialog. The rendering deadline does not limit the time spent choosing print settings.

Alternatively, add `--native-print-save`, choose the native dialog's PDF output, and save to the exact path printed by the script. This verifies successful completion and disposal without sending a physical printer job. Inspect its output separately: custom-paper native printing can insert blank pages between score pages. This also occurs on unchanged master when its print IPC receives valid native dimensions, bypassing master's separate inches-versus-microns argument error. The migration does not change page heights or add pagination workarounds for this pre-existing behavior. A two-page Letter-landscape control produces two pages on both master and the migrated renderer with MCP disabled.

## Code organization

Shared document operations live in `src/services/documents/`: workspace creation and opening, metadata and paragraph-style edits, serialization, save completion, and export preparation. Both the editor UI and MCP call `DocumentService`. Editor hooks supply rendering, focus, recovery, and layout behavior; persistence callbacks supply either dialog-based or explicit-path file writes.

`electron/main/files/ScoreFiles.ts` owns shared score encoding, reads and writes, canonical file identity, conflict checks, and atomic output. Dialog-driven saves retain their existing write behavior; explicit-path saves use overwrite and conflict options. `electron/main/automation/files.ts` adds the configured folder-access policy. General file types live in `src/services/documents/fileTypes.ts`.

The automation folders contain MCP schemas, tool dispatch, revisions and pagination, transport/IPC request handling, and access policy. Shared document and file services do not import automation types or tool contracts.

The editor and hidden export renderer both use `ScorePageContent.vue` for headers, footers, notation, lyrics, and element rendering. The editor retains its page DOM wrappers, visibility tracking, focus handling, and mutation handlers. Each page owns its child refs and exposes methods for element, lyric, annotation, and page-specific header/footer lookup; the editor holds only page-component refs. Page content forwards typed interaction events; editor-only badges and developer overlays are supplied through slots. Print pages use local component refs to await rich-text readiness. Overlay markup, geometry, and styles also live in the shared page component. Snapshots capture overlay preferences, and the detached renderer regenerates layout diagnostics so enabled Print Overlays settings apply to every PDF route.

## Response size guidance

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

`src/services/automation/tokenEfficiency.test.ts` budgets the exact served
`tools/list` definitions (including descriptions and annotations), separate input
and output views, and validates published schemas. Pure discovery/document/style
regressions cover representative response sizes; the transaction smoke script
checks focused reads in both interactive and isolated document modes.
