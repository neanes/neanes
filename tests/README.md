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

## Randomized layout verification

Run `random-edits.mjs` from the repository root. It builds with the same layout
oracle and launches a disposable Electron editor per score and seed. On macOS,
run the Electron command outside the agent command sandbox.

```sh
node tests/integration/layout/random-edits.mjs
node tests/integration/layout/random-edits.mjs --skip-build --steps 1000 --seed 1 --seed 20261126
node tests/integration/layout/random-edits.mjs --skip-build --score /path/to/book.byz --steps 20
```

The defaults are 200 edits with seed 1 on each of the bundled LTR and Melkite RTL
fixtures. Repeat `--seed` and `--score` to run a matrix. Supplied `.byz` and
`.byzx` scores are copied and used with their saved direction. The runner selects
targets both across the score and near the previous edit. It calls the same
editor handlers used for note, pitch (fthora), lyric, melisma, ison, bar, break,
martyria, mode key with ambitus, insertion, deletion, end-of-score entry, and
history changes. The handlers are exposed to the runner only in oracle builds.
Every edit must advance the content revision and run at least one synchronous
oracle comparison. The summary shows which edit types ran and how often.

A failed sequence stops at its first error while the remaining score/seed pairs
continue. The failure directory contains a copy of the input and a JSON trace
with the seed, actions through the failing step, and the oracle difference with
edit and element locations when available. Replay that exact sequence using the
same build and fonts. The runner prints a ready-to-run command.

```sh
node tests/integration/layout/random-edits.mjs --skip-build --replay /path/to/failure.json
```

The oracle compares the synchronous layout, including placements and persisted
musical fields. Use the scripted UI checks for input behavior and the settlement
checks for asynchronously measured rich text.

## Layout profiling

Use a profiling build and run the benchmark from the repository root. On macOS,
run the Electron command outside the agent command sandbox.

```sh
VITE_LAYOUT_PROFILING_ENABLED=true npx vite build
node tests/integration/layout/profile-edits.mjs /path/to/long-doc-with-melisma.byz
```

The benchmark opens a temporary copy of the score in a disposable profile. It
scrolls to a note near the middle of the score and toggles its gorgon. It reports
median layout, publishing, Vue flush, and next-frame timings for ten edits after
four warm-up edits. The frame marker is a timer queued from an animation-frame
callback. When Chromium exposes Event Timing, the benchmark also reports the
keydown-to-next-paint duration and uses that paint timestamp to measure the gap
from layout to paint. Event Timing durations are rounded to 8 ms.

For a sampled renderer CPU profile of the timed edits, build with source maps
and pass a second path. Load the resulting file in Chromium DevTools and inspect
the `prepareContentLines` call tree.

```sh
VITE_LAYOUT_PROFILING_ENABLED=true npx vite build --sourcemap
node tests/integration/layout/profile-edits.mjs /path/to/score.byz /tmp/layout.cpuprofile
```

Run without the CPU profile path when measuring wall-clock timings.

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
