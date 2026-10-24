# Tests

Fast Vitest tests stay beside their implementation in `src/` and `electron/`.
Run them with `npm test`; CI runs this suite on Linux, Windows, and macOS.
The production MCP bridge and its protocol unit test live in `electron/mcp/`.

Real Electron integration scenarios and their helpers live in `tests/integration/`:

- `mcp/`: bridge, agent access, and document-tool scenarios.
- `rendering/`: detached PDF, PNG, and native-print preparation checks.
- `saving/`: editor save, undo, and recovery revision checks.

These scenarios run separately from Vitest and are not currently run in CI.
They use real Electron processes without mocks or DOM emulation. Use disposable
profiles, never the normal Neanes profile. On macOS, agents must launch them
outside the command sandbox as required by [AGENTS.md](../AGENTS.md).

Build the Electron target with `npx vite build`, then run:

```sh
npm run test:integration:mcp
npm run test:integration:rendering
npm run test:integration:saving
```

The MCP command runs the self-launching scenarios sequentially and stops on the
first failure. List or select scenarios with:

```sh
npm run test:integration:mcp -- --list
npm run test:integration:mcp -- headless-launch text-search
```

Other MCP scenarios require an already-running disposable editor and explicit
environment variables or output paths. See [MCP integration setup](integration/mcp/README.md).
Rendering and saving accept an optional absolute output directory after `--`;
otherwise they report temporary artifact directories. See the
[rendering](integration/rendering/README.md) and
[saving](integration/saving/README.md) instructions for details and manual checks.
Saving starts its own Vite development server and requires a POSIX desktop session.

The score files and PDFs directly in `tests/` are existing manual/reference
fixtures; `tests/data/` contains fixtures consumed by unit tests.
