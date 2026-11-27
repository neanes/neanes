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
  runs an Arabic-lyrics variant with `melkiteRtl` enabled.
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
run the Electron command outside the agent command sandbox. Pass
`--incremental` to exercise paragraph reuse. Without it the harness builds
with `VITE_LAYOUT_FORCE_FULL=true` for a full-layout comparison. When reusing
a build with `--skip-build`, the build's force-full setting must match.

```sh
node tests/integration/layout/random-edits.mjs --incremental
node tests/integration/layout/random-edits.mjs --skip-build --incremental --steps 1000 --seed 1 --seed 20261126
node tests/integration/layout/random-edits.mjs --skip-build --incremental --facing --steps 1000 --seed 1 --seed 20261126
node tests/integration/layout/random-edits.mjs --skip-build --incremental --score /path/to/book.byz --steps 20
```

The defaults are 200 edits with seed 1 on each of the bundled LTR and Melkite RTL
fixtures. Incremental mode also runs a separate scripted case that verifies
paragraph reuse after an ison edit and layout after deleting the opening
block. Use `--facing` to exercise unequal inside and outside margins on the
bundled fixtures or on a supplied `.byzx` file. Repeat `--seed` and
`--score` to run a matrix. Supplied `.byz` and
`.byzx` scores are copied and used with their saved direction. The runner selects
targets both across the score and near the previous edit. It calls the same
editor handlers used for note, pitch (fthora), lyric, melisma, ison, bar, break,
martyria, mode key with ambitus, insertion, deletion, end-of-score entry, and
history changes. The handlers are exposed to the runner only in oracle builds.
Every edit must advance the content revision and run at least one synchronous
oracle comparison. The summary shows which edit types ran and how often, the
layout statuses, how many reused layouts added each number of boundary
paragraphs, and the most reused lines re-placed by one layout.

A failed sequence stops at its first error while the remaining score/seed pairs
continue. The failure directory contains a copy of the input and a JSON trace
with the seed, actions through the failing step, and the oracle difference with
edit and element locations when available. Replay that exact sequence using the
same build and fonts. The runner prints a ready-to-run command.

```sh
node tests/integration/layout/random-edits.mjs --skip-build --incremental --replay /path/to/failure.json
```

The oracle compares the synchronous layout, including placements and persisted
musical fields, with a numeric tolerance of 1e-6. Use the scripted UI checks
for input behavior and the settlement
checks for asynchronously measured rich text.

## Page-dependent measured inputs

`check-page-inputs.mjs` checks inputs that the DOM measures after layout and
that depend on placement: a scrollable rich-text box's height cap (its page
bottom minus its y), and header and footer templates whose token expansion
(chapter, page numbers) changes by page. The synchronous oracle cannot see
these. Each scenario runs twice in a disposable editor of an oracle build,
with paragraph reuse and with full layout forced at runtime. After every edit
it visits each page, waits until no layout or height write happens, and
compares element geometry, template heights and the rendered boxes'
rectangles and text. It also fails if a scrollable box's rendered cap does not
match its current y, if a step does not settle, if no edit reuses paragraphs,
or if the layout oracle reports a difference. The scrollable scenarios run in
LTR and Arabic RTL.

```sh
node tests/integration/layout/check-page-inputs.mjs
node tests/integration/layout/check-page-inputs.mjs --skip-build --only scrollable-cap
```

A repeated header or footer template has one height, taken from the page
that measured it last, so wrapping that differs by page never settles, with
either layout path. The header scenarios therefore use chapter titles that
wrap the same on every page.

## Full layout parity against master

Build each of the three Electron checkouts with the same test-only capture
plugin. Install the pinned dependencies in each checkout first. Use master
`af40dbce` as the baseline and `d40e4d55` as the reference for the two approved
explicit-break melisma fixes. The baseline and reference builds can be reused.

```sh
PARITY_BUILD=/path/to/c1/tests/integration/layout/parity-build.mjs
(cd /path/to/master-baseline && node "$PARITY_BUILD")
(cd /path/to/approved-fixes && node "$PARITY_BUILD")
node "$PARITY_BUILD" # from the C1 checkout

node tests/integration/layout/master-parity.mjs \
  --baseline /path/to/master-baseline --approved /path/to/approved-fixes \
  --book /path/to/long-doc-with-melisma.byz --output /tmp/layout-parity.jsonl
```

On macOS, run the comparison outside the agent command sandbox. The runner
captures pages and element fields before on-page measurements on each score
in `examples/`, the scripted fixtures, and the book. Pass
`--scroll-test /path/to/scroll-test.byz` to include the optional local fixture.
The JSONL report includes each difference and its approval status. An approved
difference must also be reproduced by the reference build. Use `--only` to
rerun an individual score by its printed name.

## Phase C layout corpus and metrics

Create the corpus once, outside the worktree. The manifest records file
digests and the ordered source paths and digests for each combined score.
Both runners verify the corpus file digests. Lyrics are unlocked in the
corpus copies so each score can run the direct lyric edit. Keep the generated
scores local.

```sh
CORPUS=/path/to/local-layout-corpus
node tests/integration/layout/build-corpus.mjs \
  --basil /path/to/basil/byzantine-music \
  --book /path/to/long-doc-with-melisma.byz --output "$CORPUS"
```

The corpus includes the repository examples, the scripted LTR and Arabic RTL
fixtures, the repeated stress book, all Antiphons and Mother of God chants,
and a larger anthology of Basil scores with compatible page, paragraph, and
header settings. Four volumes use the first 70, 132, 198, and 277 chants of
the anthology to target 100, 200, 300, and 500 pages. The combined scores
use bundled Source Serif for text, including inline rich text, and retain
the Neanes notation font. Each chant starts a new page under the shared
page-number footer. The manifest
records source files excluded from the anthology for differing settings.

For each package, collect timings serially on an otherwise idle machine.
Build the previous package and candidate with the same profiling flags and
run each during the same session. Run the reference first without
`--previous`, then pass that report to the candidate run. Use a fresh output
name for each report. Rerun both revisions when a result may be noise.

```sh
VITE_LAYOUT_VERIFY_ENABLED=false VITE_LAYOUT_PROFILING_ENABLED=true npx vite build
node tests/integration/layout/corpus-metrics.mjs \
  --corpus "$CORPUS/manifest.json" --output /tmp/candidate-metrics.json \
  --previous /tmp/previous-metrics.json > /tmp/candidate-metrics.md
```

Omit `--previous` to collect the initial baseline. Each file gets a disposable
app profile. The runner alternates a middle gorgon, a middle lyric, and an
early explicit line break in separate workloads. Direct lyric edits apply to
scores with unlocked lyrics. Each workload runs 4 warmups and 20 measured
edits. Layout time is the sum of the edit's `processPages` spans. Editor update
time starts at the edit command and ends after the Vue patch. Reports retain
the sample data and staff indexes so comparisons use the same edit targets.
The table flags median or p95 increases of at least 15% and at least 0.5 ms
for layout or 2 ms for the editor update. Investigate repeatable increases at
each score size. Reuse share comes from the editor's layout diagnostics, which
also include the number of paragraphs prepared (including discarded attempts),
reused lines re-placed after moving, and layout duration. Use `--only` with a
score name from the table for a focused rerun.

Rebuild the candidate with the parity capture plugin and run the separate
layout comparison against pinned master and the approved-fixes reference.

```sh
VITE_LAYOUT_VERIFY_ENABLED=false VITE_LAYOUT_PROFILING_ENABLED=false \
  node tests/integration/layout/parity-build.mjs
node tests/integration/layout/master-parity.mjs \
  --baseline /path/to/master-baseline --approved /path/to/approved-fixes \
  --corpus "$CORPUS/manifest.json" --output /tmp/candidate-parity.jsonl
```

Parity includes the same frozen files plus the built-in generated test scores.
Its JSONL includes page and element counts per score and the approved and
unexpected differences. On macOS, run both Electron commands outside the
agent command sandbox. Include the metrics, parity results, and any regression
investigation in the package completion update.

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

The same profiling build supports the line-break and text-box measurements.
The line-break run also reports each layout's status, prepared paragraphs,
re-placed lines and the time spent positioning lines. The lyric focus check
also runs on an ordinary Electron build. It commits a long lyric twice: once
where later lines only move, and once where the next lyric's own line is
replaced. Lines that move within their page must keep their wrappers. It then
makes short edits until one replaces the edited lyric's control while the
edited and next notes stay on their line. In every case focus must move to the
next lyric, and typing must reach it.

```sh
node tests/integration/layout/profile-line-shifts.mjs /path/to/long-doc-with-melisma.byz
node tests/integration/layout/profile-text-box-heights.mjs /path/to/long-doc-with-melisma.byz
node tests/integration/layout/check-lyric-focus.mjs /path/to/long-doc-with-melisma.byz
```

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
