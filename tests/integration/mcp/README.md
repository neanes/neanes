# MCP integration tests

After `npx vite build`, run `npm run test:integration:mcp` for the self-launching
scenarios. Each starts its own disposable worker or editor and cleans up its
processes. Preview artifacts are retained for inspection. Use `-- --list` to list
scenarios or pass names to run a subset.

`bridge-protocol` exercises the real stdio Neanes process across its declared MCP revisions,
uses a fresh connection for each negotiation, checks fallback from unsupported
revisions and automation contract publication, and verifies malformed messages
(including unsupported batches) preserve the connection and private drafts.
Stdio framing and validation use the MCP SDK; malformed input is reported on
stderr without a JSON-RPC error reply.
Set `NEANES_TEST_EXECUTABLE` to a freshly packaged app executable to cover direct packaged stdio launch; source builds launch Electron with the repository path and `--mcp`.
Socket tests cover matching and incompatible automation contracts and session authentication. Executable paths remain in the client configuration;
Linux users must refresh it when an update changes the AppImage path.

`message-size` generates real 512-, 1024-, and 2048-pixel lossless PNGs, inserts
each over stdio and directly over the editor socket, then checks that saving
preserves the complete image data. The measured request sizes are approximately
1.15, 4.59, and 18.35 MiB. A 1 MiB receive limit rejected even the 512-pixel image;
the shared 32 MiB limit accommodates the 2048-pixel image with headroom for its
base64 envelope. Editor response framing retains its existing 32 MiB limit.
The scenario also checks stdio acceptance just below 32 MiB and rejection above
it; socket tests check oversized unfinished-message rejection and recovery.
Run the script directly with `--probe` to report below/above-1-MiB image outcomes
without requiring large-image acceptance when comparing an older build.

`agent-access` checks both launch orders, shared editor tab mutations, independent
private stores, socket authentication, preferences without agent settings, and
client/editor shutdown isolation. It requires no policy file or token setup.

`dev-server` starts a real Vite development editor, then launches Electron with
`--mcp` without a Vite URL environment variable. It checks URL discovery, editor
tabs, private previews, and PDF exports. It runs last because Vite rebuilds the
main/preload entries in development mode. Run `npx vite build` afterward if you
need production build artifacts.

Additional scenarios in this directory connect to an existing disposable editor.
Their environment, output-directory, and debugger requirements are documented in
the [MCP guide](../../../electron/mcp/README.md). Run these individually, following
that guide; they are not included in the self-launching command.

On macOS, agents must launch Electron outside the command sandbox as described in
[AGENTS.md](../../../AGENTS.md). Never connect these tests to the normal user profile.
