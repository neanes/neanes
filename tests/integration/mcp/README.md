# MCP integration tests

After `npx vite build`, run `npm run test:integration:mcp` for the self-launching
scenarios. Each starts its own disposable worker or editor and cleans up its
processes. Preview artifacts are retained for inspection. Use `-- --list` to list
scenarios or pass names to run a subset.

Editor fixtures wait for a successful document-list operation before mutating
documents. The preview cancellation check disables JavaScript in a real
editor-owned export renderer, confirms that the request is still pending, then
cancels over MCP and checks that the server destroys that window. Window-count
checks apply only to editor-owned renderers; private worker file cleanup is
covered by `message-size`.
Concurrent preview checks pause a real export renderer with the debugger;
page-discovery checks hold a real font download open. Both observe work in
progress, edit the source, then release the dependency and require a revision
conflict. Element-edit round trips reopen both score
formats and compare the complete discovered score, including nested content.
Debugger connections and commands have bounded timeouts. The preview scenario
checks command expiry, a late renderer reply, and subsequent successful commands
using the real Electron debugger connection.

`bridge-protocol` exercises the real stdio Neanes process across its declared MCP revisions,
uses a fresh connection for each negotiation, checks fallback from unsupported
revisions and automation contract publication, and verifies malformed messages
(including unsupported batches) preserve the connection and private drafts.
Stdio framing and validation use the MCP SDK; malformed input is reported on
stderr without a JSON-RPC error reply.
Set `NEANES_TEST_EXECUTABLE` to a freshly packaged app executable to cover direct packaged stdio launch; source builds launch Electron with the repository path and `--mcp`.
Socket tests cover matching and incompatible automation contracts and session authentication. Executable paths remain in the client configuration;
Linux users must refresh it when an update changes the AppImage path.

`message-size` generates real 512-, 1024-, and 2048-pixel lossless PNG files,
inserts each over stdio and editor HTTP using `imagePath`, exports the original
with `get_element_image`, renders a file-backed preview, and checks that saving
preserves the complete image data. Image edit envelopes are approximately
400-500 bytes even for the 14.4 MB PNG; preview metadata is approximately 390
bytes. Discovery and previews contain no inline image data. It also round trips
a 2.56 MB Unicode lyrics-manager write, which exceeds 1 MiB independently of
images. The shared stdio/editor HTTP body limit is 8 MiB, allowing headroom for
large text writes and bulk edits. The scenario checks stdio acceptance just
below 8 MiB and rejection above it; real HTTP socket tests check oversized
request/response rejection, chunked transfer, fragmentation, and recovery.

`agent-access` checks both launch orders, shared editor tab mutations, independent
private stores, socket authentication, preferences without agent settings, and
client/editor shutdown isolation. It requires no policy file or token setup.

`shutdown` checks that explicit Quit removes editor discovery and Unix socket
directories. It also checks window-close shutdown and that closing a macOS window
preserves the connection until the application quits.

Additional scenarios in this directory connect to an existing disposable editor.
Their environment, output-directory, and debugger requirements are documented in
the [MCP guide](../../../electron/mcp/README.md). Run these individually, following
that guide; they are not included in the self-launching command.

`element-copy` copies a passage in private and editor scopes, including nested
annotations/alternate lines, custom style imports and rich-text remapping, and
embedded images. It checks unchanged sources and source files, stale revisions,
invalid ranges, missing documents, locked destination lyrics, same-document
copying, compact acknowledgments, and a real editor undo/redo of the complete
copy and imported styles.
It also checks opting out of lyrics on the main staff and alternate lines while
retaining annotations.

On macOS, agents must launch Electron outside the command sandbox as described in
[AGENTS.md](../../../AGENTS.md). Never connect these tests to the normal user profile.
