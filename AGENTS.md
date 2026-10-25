# AGENTS.md

This file provides guidance to agents when working with code in this repository.

Neanes is a WYSIWYG scorewriter for notating Byzantine Chant.
It is an Electron desktop app (the primary target) that also builds as a reduced-functionality browser PWA, all from one Vue 3 + TypeScript codebase.

## Commands

Requires Node 22+.
Enable the pinned npm first with `corepack enable npm`.

- `npm install` - install deps. Any change to `package.json` must include the matching `package-lock.json` update from `npm install`.
- `npm run dev` - run the Electron app in dev mode with hot reload (Vite).
- `npm run web:dev` - run the browser (web) build in dev mode.
- `npm run build` - type-check (`vue-tsc --noEmit`), Vite build, then `electron-builder` package into `release/` (no publish).
- `npm run lint` - `eslint` plus `prettier --check`. `npm run lint:fix` autofixes both.
- `npm test` - run the full Vitest suite once. `npm run test:dev` watches.
- `npm run test:integration:mcp` - run self-launching Electron MCP scenarios after `npx vite build`; append `-- --list` to list scenarios.
- `npm run test:integration:rendering` - run real Electron PDF, PNG, and print-preparation checks after `npx vite build`.
- `npm run test:integration:saving` - run editor save/recovery checks with a disposable Vite/Electron instance (POSIX desktop session required).
- Integration test setup and fixtures are documented in `tests/README.md`.
- Single test file: `npx vitest run src/services/LayoutService.test.ts`
- Single test by name: `npx vitest run -t "part of the test title"`
- `npm run coverage` - Vitest with `istanbul` coverage.
- `npm run docs:dev` - VitePress docs site (`docs/`).

Useful development environment variables (put in `.env.local`, or `.env.web.local` for web): `FAKE_UPDATE_AVAILABLE=1` simulates the updater flow without publishing; `VITE_ENABLE_DEV_TOOLS=true` enables Vue Devtools; `VITE_PSEUDOLOCALIZATION=true` pseudolocalizes all strings; `VITE_AUDIO_SERVICE_LOGGING_ENABLED`, `VITE_PLAYBACK_SERVICE_LOGGING_ENABLED`, and `VITE_LAYOUT_SERVICE_LOGGING_ENABLED` enable audio/playback/layout logs.

### macOS: launch Electron outside the agent command sandbox

**Use unsandboxed execution on the first attempt for any command that launches Electron on macOS. Do not try a sandboxed launch first.** The agent command sandbox can block macOS Launch Services registration, causing Electron to abort with `SIGABRT` in `_RegisterApplication` before Neanes JavaScript runs. Each attempt can produce a macOS crash-report dialog.

- With `exec_command`, set `sandbox_permissions: "require_escalated"` and provide a justification explaining that the test launches disposable Electron processes and needs macOS application registration. Apply this to the entire launching command so its child processes inherit the correct execution context. Follow the environment's approval policy; if unsandboxed execution is unavailable or denied, report the limitation instead of launching inside the sandbox.
- This includes `npm run dev`, direct Electron executable invocations, smoke tests under `tests/integration/mcp/`, `tests/integration/rendering/`, and `tests/integration/saving/` that spawn Electron, and custom test harnesses. MCP bridge tests can launch Electron indirectly; private/headless workers and hidden windows still require native application registration.
- For example, run `node tests/integration/mcp/text-search-smoke.mjs` with `sandbox_permissions: "require_escalated"` from the outset. The same applies to `headless-launch-smoke.mjs`, `agent-access-smoke.mjs`, `preview-smoke.mjs`, and `rich-text-update-smoke.mjs`.
- Use the documented disposable profiles and output directories. Run tests against a disposable app, preserving the user's normal Neanes instance and documents. See `electron/mcp/README.md`, `tests/integration/rendering/README.md`, and `tests/integration/saving/README.md` for setup.
- If a launch still fails, inspect the child exit signal and logs before retrying. A startup `SIGABRT` with `_RegisterApplication` indicates the launch environment; do not repeatedly retry it or change application code to work around it. A missing MCP endpoint or readiness timeout alone does not establish an application bug.
- This concerns the agent command sandbox. Do not add Electron's `--no-sandbox` flag or disable renderer security. Pure unit tests, linting, type-checking, and build-only commands can run in the normal agent sandbox; clients that only connect to an existing disposable app do not need this GUI-launch exception.

### Unix socket tests and the agent command sandbox

- Tests that create real Unix socket listeners, including `electron/main/automation/editorConnection.test.ts`, need unsandboxed execution in this environment even though they do not launch Electron. Use `sandbox_permissions: "require_escalated"` on the first attempt and explain that the test creates disposable Unix socket listeners.
- A `listen EPERM: operation not permitted` error for a temporary socket path indicates a sandbox restriction. Do not change application code to work around it; rerun outside the sandbox. If execution is unavailable or denied, report the limitation.

## Architecture

### One codebase, two runtime targets

`isElectron()` (`src/utils/isElectron.ts`, keyed off `VITE_IS_ELECTRON`) selects behavior.
Platform-specific work sits behind interfaces implemented twice: `IIpcService` (`IpcService` vs `BrowserIpcService`) and `IPlatformService` (`PlatformService` vs `BrowserPlatformService`).
`src/main.ts` provides the correct pair via Vue `provide`/`inject` at startup; components pull them through the `useEditorServices()` composable and the keys in `src/injectionKeys.ts`.
Inject these services rather than instantiating them in a component, so the web build stays functional.

### Electron process split

- `electron/main/index.ts` (large) is the main process: native menus, open/save dialogs, the recent-files store, PDF export via `BrowserWindow.printToPDF`, PNG/HTML/LaTeX/MusicXML export orchestration, and the `electron-updater` flow.
- `electron/preload/index.ts` uses `contextBridge` to expose `window.ipcRenderer` (`send`/`on`/`invoke`, each validated against the channel enums) and `window.platform`.
- IPC channel names live in `src/ipc/ipcChannels.ts`: `IpcMainChannels` are main-to-renderer, `IpcRendererChannels` are renderer-to-main. Renderer listeners are wired in `src/ipc/ipcListeners.ts` (Electron) and `src/ipc/browserIpcListeners.ts` (web).

### Workspace = one open document

`src/models/Workspace.ts` bundles the score, file path, unsaved-changes flag, current selection, zoom, and its own `CommandService`. `src/components/TheEditor.vue` is the very large central editor component that ties model, layout, and UI together.
Score mutations that should be undoable go through the per-workspace `CommandService` / `CommandFactory` in `src/services/history/`, which supports a fixed command set: `update-properties`, `add-to-collection`, `replace-element-in-collection`, `remove-from-collection`.

### Layout engine

`src/services/LayoutService.ts` is large. `LayoutService.processPages(workspace)` is the heart of the app: it computes line and page breaks (Knuth-Plass optimal line breaking via `tex-linebreak`), positions every element, calculates martyria, aligns melismas/lyrics and ison indicators, and more.
`TheEditor`'s `save()` calls `LayoutService.processPages(toRaw(selectedWorkspace.value))`, so all layout writes land on raw, non-reactive objects.

### Save format

`.byzx` is the raw JSON score; `.byz` is a zip containing a `.byzx`; the zip/unzip happens in Electron main's `readScoreFile`/`writeScoreFile`.
`SaveService.SaveScoreToJson` / `SaveService.LoadScoreFromJson` are the (de)serializers, and the on-disk shapes live under `save/v1/`.
Load is content-detected (the version string must start with `"1."`), not version-gated.
The format is backward-compatible only: the loader folds every legacy shape on read, but the writer emits only current fields, does not preserve legacy ones, and the score version is deliberately not bumped.
Forward compatibility (an older app opening a newer file) is explicitly out of scope; do not add version gates or forward-compat handling.

### UI stack

Vue 3 (`script setup` / Composition API), Tailwind CSS v4, `shadcn-vue` components (vendored under `src/components/ui/`), `reka-ui` primitives, `dockview` for the pane layout, and CKEditor 5 for rich text (custom plugins in `src/ckeditor-plugins/`: `insertneume`, `fontstyle`, `alignmentoverride`, `opentype`, `richtextselection`).
`i18n` is `i18next` with locales under `src/i18n/` (`en`, `el`, `ro`, `id`, `ru`), managed via Crowdin.

## Conventions

- **Do not modify `src/components/ui/`.** These are vendored/generated `shadcn-vue` components, regenerated upstream; local edits get clobbered and break the vendoring contract. When a UI component lacks something a consumer needs, add it at the call site, not in the component. This is enforced strictly.
- **Switch vs Checkbox.** Use `Switch` (`@/components/ui/switch`) for a boolean toggle that takes effect immediately. Use `Checkbox` (`@/components/ui/checkbox`) when the choice stays pending until the user clicks a confirm action (Export / Update / OK / Save).
- **Tests: no spies, mocks, stubs, fakes, or DOM emulation.** Pure unit tests are welcome. Do not use spies or mocks; do not add `jsdom`, DOM stubs, handwritten stubs, or fakes to make tests pass.
- **No pointless defensive null checks.** Check for null when a value can genuinely be null; do not sprinkle defensive null checks everywhere. Tighten these before committing.
- **Plain ASCII in content that is not user-visible.** Prefer plain ASCII in code comments and internal documentation; avoid Unicode punctuation and symbols (e.g., em-dashes, smart quotes, arrows).
- **Imports.** `eslint` enforces `simple-import-sort` ordering and `consistent-type-imports` (use `import type` for type-only imports); `@` aliases to `src/`. Run `npm run lint:fix` rather than hand-sorting.
- **Internationalization (i18n).** Never hard-code user-visible strings. Add all UI text (labels, buttons, dialogs, tooltips, placeholders, validation messages, notifications, etc.) to the locale JSON files under `src/i18n/` and reference them via i18next. New keys must be added to every supported locale, translating them instead of copying the English text.
