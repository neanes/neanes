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
The standalone **Verify Packaged MCP** workflow (`mcp-ci-verify.yml`) runs only
when manually triggered. In GitHub Actions, choose that workflow, click
**Run workflow**, and select the branch to verify. It builds native packages on
Windows, macOS, and Linux without publishing, then runs `bridge-protocol` and
`headless-launch` through `.github/actions/packaged-mcp`. Regular CI and release
workflows do not run these packaged checks.

macOS tests extract the release ZIP; Linux tests extract the release AppImage
without FUSE; Windows tests use the packaged application directory, including
its bundled stdio launcher. The scenarios cover protocol negotiation, tool
listing, private document edits, save/reopen, preview/PDF export, independent
clients, and shutdown. Only the runner's native architecture is exercised.
These checks do not install the Windows installer or simulate an upgrade over
an existing installation.

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

`footnotes` checks independent footnote text/music editing in private and editor
scopes, real context-menu insertion and keyboard input, numbering and marker
placement, same-page ownership, footer placement, stable page discovery, oversized
body recovery with offscreen page unmount/remount, copying with new identities,
undo/redo, BYZ/BYZX save/reopen, and
PNG/PDF rendering. Its disposable output directory retains visual artifacts.

Marker geometry checks cover centered markers, unchanged natural and justified
spacing, tight lines, centered line endings, and RTL placement. Collision
clearance raises markers above overlapping ink without changing horizontal
layout. `footnote-markers` checks clearance from single, short, and centered
barlines on both sides, neighboring neumes, and other reference markers in LTR
and RTL. Rendered examples are retained with the footnote artifacts.

`footnote-styles-context` checks pitch/scale inheritance from musical anchors,
local body music, anchor edits, paragraph-style marker typography, martyria save
data, and centered ordinary/right-aligned LTR/RTL musical markers.

`rich-text-footnotes` tests caret insertion with surrounding inline formatting,
focused default rich-body creation, atomic marker deletion, double-click navigation,
native text Undo/Redo before flush and score-level body reconciliation, save/reopen, and copying for ordinary, inline top/bottom,
and left/center/right multipanel rich textboxes. It also uses the real system
clipboard to copy a marker across documents, checking fresh body identities,
custom lyric style imports, and a single undo step for the complete paste.

`footnote-markers` exercises Footnote Properties through real context menus on
neume references, rich text widgets, and footnote body labels. It checks the
custom-marker checkbox, custom-text validation, previews, cancel,
automatic-marker restoration, number skipping, Undo/Redo, plain rich-text labels
versus parenthesized neume labels, MCP marker metadata, BYZ/BYZX persistence, PNG
rendering, and navigation.
It also checks gorgon clearance after mark and reference offsets, musical-anchor
position controls and previews, reset, undo/redo, and martyria footnote persistence.
Tempo elements reject footnote insertion and offer no footnote context-menu actions.
Page Setup parentheses are checked for pending edits, preview/rendering, and
persistence; marker ink clearance is compared across glyphs with different ink
heights.

Rich text history checks type in paragraph two, undo/redo a merged typing batch,
and type again after Undo. They verify the caret, backward selection ranges, and
panel focus across all six textbox layouts. Marker
checks also verify that MCP rejects annotation references without advancing the
document revision; pure transaction tests cover annotations nested in main notes,
alternate-line notes, and footnote notes.

`rich-text-history-boundary` types into a footnote-bearing rich textbox, then into
an ordinary rich, multipanel rich, or plain textbox without flushing it. Native
Edit menu Undo prefers the focused CKEditor's native history and falls back to
score history when the native command has no entry. Redo completes any outstanding
score redo branch before restoring native typing.
After blur, score Undo/Redo replays whole flushed textbox transactions without
moving focus or discarding the redo branch. New pending typing before a score
Redo must branch history before replay and remain undoable. The checks avoid MCP
reads while typing is pending, since read settlement would otherwise hide the
regression.

The history-boundary scenario also saves pending typing in a rich textbox without
footnotes, then sends real Undo/Redo keyboard events and toolbar clicks after Save and
blur/refocus. The toolbar must remain enabled for committed score history even
when local Undo has no pending edit.
It checks both native typing history and score fallback without double handling.
It verifies that committed edits stop being available to local Undo, the live editor and caret survive
Save, and earlier document edits remain reachable. Saving partially undone typing
preserves native Redo through keyboard, toolbar, and menu actions; fresh typing
still replaces that redo branch, and score Undo reaches the saved edit once.
The same-textbox check crosses from native Undo to score Undo and redoes both
edits. Paragraph-two carets and backward selections survive Save and score
Undo/Redo across ordinary, inline top/bottom, and left/center/right panels;
continued typing must stay at the restored caret.
Blurred annotation replay retains its read-only state and focus, restores the
selection, and preserves native Redo after refocusing the annotation.
The disposable Electron window
is activated with native show/focus before selecting rich text.

The two-textbox Redo regression runs through menu actions, real keyboard events,
and toolbar clicks without footnotes: commit A's edit, type and undo in B, undo A, then Redo.
A must be restored before B's native typing. Blurring B between the two Redos must
not change history; after restoring and committing B, both edits must still be
undoable.

The `footnote-end-content` scenario checks hidden populated-body terminators,
visible empty-body targets, reference focus, appending after text and music,
keyboard end navigation, deletion/undo/redo, stable pagination, and PDF/PNG output.
It launches a real disposable Electron app; use unsandboxed execution on macOS.

`footnote-body-alignment` compares body labels with baseline-aligned inline text in
text and neume font contexts at multiple zoom levels, checks numeric punctuation,
and retains a screenshot.
