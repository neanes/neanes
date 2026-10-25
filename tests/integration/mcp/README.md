# MCP integration tests

After `npx vite build`, run `npm run test:integration:mcp` for the self-launching
scenarios. Each starts its own disposable worker or editor and cleans up its
processes. Preview artifacts are retained for inspection. Use `-- --list` to list
scenarios or pass names to run a subset.

`bridge-protocol` exercises the real stdio bridge across its declared MCP revisions,
uses a fresh connection for each negotiation, checks fallback from unsupported
revisions and automation contract publication, and verifies batch rejection and
malformed messages preserve the connection and private drafts.
Set `NEANES_TEST_EXECUTABLE` to a freshly packaged app executable to cover installed
bridge files and copied configuration; source builds use the development bridge.
Compatibility tests cover matching, missing, and incompatible automation contracts
independently of app versions. Executable paths remain in the client configuration;
Linux users must refresh it when an update changes the AppImage path.

Additional scenarios in this directory connect to an existing disposable editor.
Their environment, output-directory, and debugger requirements are documented in
the [MCP guide](../../../electron/mcp/README.md). Run these individually, following
that guide; they are not included in the self-launching command.

On macOS, agents must launch Electron outside the command sandbox as described in
[AGENTS.md](../../../AGENTS.md). Never connect these tests to the normal user profile.
