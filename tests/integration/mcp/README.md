# MCP integration tests

After `npx vite build`, run `npm run test:integration:mcp` for the self-launching
scenarios. Each starts its own disposable worker or editor and cleans up its
processes. Preview artifacts are retained for inspection. Use `-- --list` to list
scenarios or pass names to run a subset.

`bridge-protocol` exercises the real stdio Neanes process across its declared MCP revisions,
uses a fresh connection for each negotiation, checks fallback from unsupported
revisions and automation contract publication, and verifies batch rejection and
malformed messages preserve the connection and private drafts.
Set `NEANES_TEST_EXECUTABLE` to a freshly packaged app executable to cover direct packaged stdio launch; source builds launch Electron with the repository path and `--mcp`.
Socket tests cover matching and incompatible automation contracts and session authentication. Executable paths remain in the client configuration;
Linux users must refresh it when an update changes the AppImage path.

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
