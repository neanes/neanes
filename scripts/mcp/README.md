# Neanes MCP (stage 1)

The Electron app can expose an opt-in MCP Streamable HTTP endpoint while it is running. The web build does not host a server. Stage 1 operates on visible interactive workspaces; isolated sessions, folder jobs, element editing, and temporary export transformations are planned separately.

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

## Tools

- `get_capabilities`: supported style actions, units, formats, and installed/bundled font families.
- `list_documents`: open workspace IDs, revisions, canonical source paths, source format (`byz`, `byzx`, or null), selection, and unsaved state.
- `get_document`: metadata and serialized score, with staff elements paginated by `offset` and `limit` (default 100, maximum 1000). `nextOffset` is null on the final page. Serialized dimensions use CSS pixels.
- `create_document`: create and select a document using the user's current defaults. Optional `title` sets its metadata title.
- `open_document`: open an absolute `.byzx` or `.byz` path. An already-open file is selected by canonical identity without replacing unsaved changes, including when its interactive path uses a directory alias. The requested suffix selects decoding; canonical identity does not change that format. Returns `created: true` only when a workspace was added; reused workspaces return false.
- `close_document`: closes one workspace without saving or deleting score files. Requires `documentId` and `expectedRevision`. Unsaved or recovered workspaces return `UNSAVED_CHANGES` unless `discardUnsavedChanges: true` is explicit. Stale revisions are rejected even when discarding. Recovered drafts require saving or explicit discard even if their dirty flag is clear; error details include `hasUnsavedChanges` and `isRecovered`. Recovery snapshots and pending recovery timers are removed. Closing a background workspace preserves the selection; closing the selected one selects a neighbor. Closing the last workspace creates a blank workspace and keeps MCP running. Returns `{ documentId, selectedDocumentId }`. Cleanup failure after removal reports `RECOVERY_CLEANUP_FAILED` with `details.closed: true`; inspect the document list instead of retrying that close. A pending native save or interactive close returns `EDITOR_BUSY`; close waits for exports and native file opens.
- `get_paragraph_styles`: all writable style definitions in `styles`, and separate read-only `resolvedStyles` with effective values, built-in flags, and display labels. These definitions use the live model shape (`overrides` and `fontStyle`), unlike `get_document.score.paragraphStyles`, which uses the serialized save shape. Dimensions are CSS pixels; `lineHeight` is a unitless multiplier.
- `edit_paragraph_styles`: an atomic batch of `create`, `replace`, and `delete` actions. Each create/replace supplies a complete definition (`id`, `parentStyleId`, `overrides`, and `displayName` for custom styles). Built-in names are read-only metadata and must be omitted. Missing overrides inherit; supported null values explicitly reset. Each ID can appear once per batch. Action order does not matter: a child may refer to a parent created later in the payload. Validation checks the final graph for missing parents, cycles, duplicate IDs/names, and protected built-ins before applying anything. Built-in styles cannot be created, deleted, or renamed. Custom null parents normalize to `default-text`. Deleted styles' untouched children inherit from their nearest surviving ancestor or `default-text`; content references use their nearest surviving ancestor or surface default. Explicit references to a parent deleted in the same batch are rejected. Newly assigned font families must exist; unchanged unavailable families are preserved. The entire edit is one undo step and preserves per-element overrides. Before returning, it measures the target workspace's resizable body text boxes and enabled headers/footers with the updated styles, even when that workspace is in the background. Measurement preserves the selected workspace. Saves and recovery snapshots wait for pending measurements; failed measurement reports `TEXT_BOX_MEASUREMENT_FAILED` rather than saving stale heights. Does not save.
- `replace_document_properties`: replaces the complete metadata object, requiring both `title` and `author`. One undo step; does not save.
- `save_document`: save to `filePath`, or to the document's source if omitted. Save-as changes the workspace's source path. Existing unrelated destinations require `overwrite: true`. Saving back to the source checks its last known modification time and size, even when overwrite is true. Writes use a temporary file followed by an atomic commit. Same-source saves preserve the format used to open the score, including extensionless or differently suffixed symlink targets, and preserve the alias itself. Save-as to a different identity uses the destination suffix. Unrelated symlink outputs remain forbidden. The result includes `savedRevision` (the revision written) and `savedContentUnchanged` (whether that saved snapshot is still current). `revision` describes the current workspace, which can include newer interactive edits or the new source path.
- `export_pdf`: render to an explicit absolute PDF path without a save dialog or external PDF viewer. Existing destinations require `overwrite: true`. Does not save the score. Export briefly blocks editor input and native menus and restores the selected workspace afterward. External file opens wait until export completes; an already-running external open finishes before export starts.

All document-targeting tools require `documentId`. Close, edit, replace, save, and export also require `expectedRevision` from the latest read or successful operation. A revision conflict requires reading again; do not automatically retry a stale write. Revisions are opaque per-workspace numbers that can advance after user or agent edits and after changing the source path.

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

Use the returned revision for subsequent edits, saves, or exports. `styles` is writable; `resolvedStyles` and `units` are read-only metadata. Omitting a style from a batch leaves it unchanged; deletion always requires an explicit action.

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

The success result is tool-specific (`list_documents` returns an array). The text content contains the identical JSON envelope for text-only clients. Errors also set MCP `isError: true`. Clients must branch on `error.code`; human-readable messages are diagnostic and may change. Invalid tool arguments use `VALIDATION_ERROR` with `details.issues` (paths and messages). Unknown tools use `TOOL_NOT_FOUND`. Invalid score/ZIP input uses `INVALID_SCORE`/`INVALID_SCORE_ARCHIVE`. File failures use `FILE_NOT_FOUND`, `FILE_EXISTS`, `PERMISSION_DENIED`, or `IO_ERROR`, with platform `systemCode` and path/syscall where available. Domain conflict, scope, editor-state, font, and style codes are enumerated in every output schema. Unexpected server failures use `INTERNAL_ERROR`.

Timeouts and renderer disconnects report `details.outcome: "unknown"`; a timeout also reports `requiresReload: true`. A failure is not a guarantee that no side effects occurred. Inspect the workspace/output before retrying an uncertain operation. Malformed JSON-RPC envelopes remain MCP protocol errors rather than tool outcomes.

Results validate at the server boundary. `get_document.result.score` remains the existing serialized .byzx document contract; its schema exposes it as JSON, rather than maintaining a second schema for the full save format. Style editing has its own complete writable definition schema.

## Verification

Pure unit tests cover style graph and metadata validation, undo/redo, serialization, filesystem scope, overwrite behavior, and file conflicts:

```sh
npx vitest run src/services/documents src/services/automation electron/main/files electron/main/automation/files.test.ts electron/main/OperationQueue.test.ts
```

With the development app running and ready, run the real MCP client smoke test from another terminal with the same token:

```sh
NEANES_MCP_TOKEN=<same-token> node scripts/mcp/smoke.mjs /tmp/neanes-mcp/files
```

The smoke test creates an interactive workspace and unique output files, updates lyrics defaults, saves/reopens both formats, exports a PDF, and checks revision conflicts, external changes, output collisions, authentication, and Origin rejection. It closes the workspaces introduced by the run and leaves output files available for inspection. Run it with an isolated development profile.

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

## Code organization

Shared document operations live in `src/services/documents/`: workspace creation and opening, metadata and paragraph-style edits, serialization, save completion, and export preparation. Both the editor UI and MCP call `DocumentService`. Editor hooks supply rendering, focus, recovery, and layout behavior; persistence callbacks supply either dialog-based or explicit-path file writes.

`electron/main/files/ScoreFiles.ts` owns shared score encoding, reads and writes, canonical file identity, conflict checks, and atomic output. Dialog-driven saves retain their existing write behavior; explicit-path saves use overwrite and conflict options. `electron/main/automation/files.ts` adds the configured folder-access policy. General file types live in `src/services/documents/fileTypes.ts`.

The automation folders contain MCP schemas, tool dispatch, revisions and pagination, transport/IPC request handling, and access policy. Shared document and file services do not import automation types or tool contracts.
