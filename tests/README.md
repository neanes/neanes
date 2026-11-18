# Tests

Fast Vitest tests stay beside their implementation in `src/` and `electron/`.
Run them with `npm test`; CI runs this suite on Linux, Windows, and macOS.
The MCP transports, scope publication, and unit tests live in `electron/main/automation/`.

Real Electron integration scenarios and their helpers live in `tests/integration/`:

- `mcp/`: stdio launch, editor socket access, and document-tool scenarios.
- `rendering/`: detached PDF, PNG, and native-print preparation checks.
- `saving/`: editor save, undo, and recovery revision checks.

These scenarios run separately from Vitest. CI runs them on Linux, Windows, and macOS.

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

## Local Linux tests with Docker

With Docker Desktop running, use the Linux runner from the repository root:

```sh
bash scripts/ci/linux-tests.sh
bash scripts/ci/linux-tests.sh mcp footnote-markers
bash scripts/ci/linux-tests.sh mcp
bash scripts/ci/linux-tests.sh rendering
bash scripts/ci/linux-tests.sh saving
```

The default runs unit tests, lint, type checking, a Vite build, and all three
integration suites. A selected integration suite still builds the app first.
The runner stops at the first failed check and returns its exit status.
The image uses Ubuntu 24.04, Node 24, the pinned npm version, and Xvfb at
1280x1024. It installs Linux dependencies from the lockfile and copies the current
working tree, including uncommitted changes. Dependencies are cached in an image
layer; subsequent source edits do not reinstall them. It does not mount the host
checkout, `node_modules`, build output, or normal Neanes profile.

Tests run as a non-root user with Electron's sandbox enabled. The runner uses
`--security-opt seccomp=unconfined` for the disposable container so Chromium can
create user namespaces inside Docker.
Containers are removed after each run, with logs and retained test artifacts
copied to `.test-files/linux/`. Set `NEANES_TEST_ARTIFACTS` to choose another
artifact directory.

The runner uses Docker's native Linux architecture by default, including ARM64
on Apple Silicon. To request the x64 architecture used by the Linux CI runner:

```sh
NEANES_TEST_PLATFORM=linux/amd64 bash scripts/ci/linux-tests.sh mcp footnote-markers
```

Docker Desktop can emulate x64 on Apple Silicon, but that is slower and Chromium
may encounter emulation limitations. Native ARM64 runs exercise Linux fonts,
windowing, and page virtualization; CI remains the check for the native x64
runner and the Windows/macOS platforms. The Docker runner does not package the app.

The score files and PDFs directly in `tests/` are existing manual/reference
fixtures; `tests/data/` contains fixtures consumed by unit tests.
