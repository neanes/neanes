# Tests

Fast Vitest tests stay beside their implementation in `src/` and `electron/`.
Run them with `npm test`; CI runs this suite on Linux, Windows, and macOS.
The MCP transports, scope publication, and unit tests live in `electron/main/automation/`.

Real Electron integration scenarios and their helpers live in `tests/integration/`:

- `mcp/`: stdio launch, editor socket access, and document-tool scenarios.
- `rendering/`: detached PDF, PNG, and native-print preparation checks.
- `saving/`: editor save, undo, and recovery revision checks.
- `layout/`: interactive layout checked against a fresh full layout (local only, not in CI).

These scenarios run separately from Vitest. CI runs the MCP, rendering, and saving
scenarios on Linux, Windows, and macOS.

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

## Layout verification

`npm run test:integration:layout` checks that the editor's interactive layout
equals a full layout. It builds with `VITE_LAYOUT_VERIFY_ENABLED=true`, which
makes every interactive editor layout also lay out a detached copy of the same
pre-layout input and record the comparison on `window.__neanesLayoutVerify`
(`checks`, `failures`, `firstDifference`, `lastDifference`). The script then
opens each fixture in a disposable Electron instance and drives real input over
the DevTools protocol: gorgon toggles, neume insertion and deletion at the
start, middle, and end, lyric commits, line breaks, a martyria edit, Undo/Redo,
and a page setup change. It fails on the first edit whose layout differs.

Fixtures:

- `layout/fixtures/verify-layout.byzx`: drop caps, lyric paragraph-style and
  local overrides, Greek hyphen and underscore melismas across an explicit line
  break, and martyriae whose bars transfer at automatic breaks. The script also
  runs it with `melkiteRtl` enabled.
- Test files from `TestFileGenerator` (Gorgon, FthoraTop, FthoraBottom,
  Accidentals, Measures, Ison, Random, DropCaps), created through the
  Generate Test File menu channel.
- `scroll-test.byz` from the main checkout's root, copied to a temporary
  directory. Set `NEANES_LAYOUT_VERIFY_SCROLL_TEST` to use another path. It is
  skipped when missing.

```sh
npm run test:integration:layout
node tests/integration/layout/verify-edits.mjs --list
node tests/integration/layout/verify-edits.mjs --skip-build --only verify-layout
```

The check uses the dev-only oracle, so it is slow on long scores. With the
flag on, a difference is also logged in the renderer with `console.error`.

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
