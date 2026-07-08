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
- Single test file: `npx vitest run src/services/LayoutService.test.ts`
- Single test by name: `npx vitest run -t "part of the test title"`
- `npm run coverage` - Vitest with `istanbul` coverage.
- `npm run docs:dev` - VitePress docs site (`docs/`).

Useful development environment variables (put in `.env.local`, or `.env.web.local` for web): `FAKE_UPDATE_AVAILABLE=1` simulates the updater flow without publishing; `VITE_ENABLE_DEV_TOOLS=true` enables Vue Devtools; `VITE_PSEUDOLOCALIZATION=true` pseudolocalizes all strings; `VITE_AUDIO_SERVICE_LOGGING_ENABLED` and `VITE_PLAYBACK_SERVICE_LOGGING_ENABLED` enable audio/playback logs.

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
`i18n` is `i18next` with locales under `src/i18n/` (`en`, `el`, `ro`, `id`), managed via Crowdin.

## Conventions

- **Do not modify `src/components/ui/`.** These are vendored/generated `shadcn-vue` components, regenerated upstream; local edits get clobbered and break the vendoring contract. When a UI component lacks something a consumer needs, add it at the call site, not in the component. This is enforced strictly.
- **Switch vs Checkbox.** Use `Switch` (`@/components/ui/switch`) for a boolean toggle that takes effect immediately. Use `Checkbox` (`@/components/ui/checkbox`) when the choice stays pending until the user clicks a confirm action (Export / Update / OK / Save).
- **Tests: no spies, mocks, stubs, fakes, or DOM emulation.** Pure unit tests are welcome. Do not use spies or mocks; do not add `jsdom`, DOM stubs, handwritten stubs, or fakes to make tests pass.
- **No pointless defensive null checks.** Check for null when a value can genuinely be null; do not sprinkle defensive null checks everywhere. Tighten these before committing.
- **Plain ASCII in content that is not user-visible.** Prefer plain ASCII in code comments and internal documentation; avoid Unicode punctuation and symbols (e.g., em-dashes, smart quotes, arrows).
- **Imports.** `eslint` enforces `simple-import-sort` ordering and `consistent-type-imports` (use `import type` for type-only imports); `@` aliases to `src/`. Run `npm run lint:fix` rather than hand-sorting.
- **Internationalization (i18n).** Never hard-code user-visible strings. Add all UI text (labels, buttons, dialogs, tooltips, placeholders, validation messages, notifications, etc.) to the locale JSON files under `src/i18n/` and reference them via i18next. New keys must be added to every supported locale, translating them instead of copying the English text.
