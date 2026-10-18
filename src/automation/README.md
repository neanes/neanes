# Automation code

This directory owns automation-only renderer behavior and contracts shared with
Electron main. Ordinary UI actions use `src/services/documents/` and the existing
model, history, lyric, layout, and rendering services.

- `contracts/`: tool inputs, outputs, errors, property schemas, published JSON
  schemas, and API guidance. These modules are also imported by Electron main.
- `documents/`: API discovery and references, revisions, read projections,
  sequential edit planning, and the MCP adapter to shared document operations.
- `sessions/`: private document ownership, capacity, expiry, and disposal.
- `renderer/`: the editor integration hook, request dispatch, readiness, session
  lifecycle, and explicit-path PDF dispatch.
- `ipc/`: the Electron-only client for automation file and export requests.

`electron/main/automation/` owns HTTP/MCP transport, authentication, file validation,
request coordination, and tool publication. Its entry point is `host.ts`.
The editor attaches `useEditorAutomation` with explicit application hooks; it
retains interactive selection, focus, dialogs, recovery, and rendering.

Shared application services must not import automation modules. ESLint enforces
this for services, models, utilities, composables, and Electron file/export code.
Automation prepares edit plans, waits for fonts, checks revisions, and commits
through `DocumentService.changeElements`. That shared callback supplies change
notifications without depending on API action types or element references.
Paragraph style graph validation and reference repair stay shared; API action
batches and read projections live here.

Score encoding and atomic writes remain in `electron/main/files/ScoreFiles.ts`.
Detached rendering remains in `electron/main/export/`, `ExportRenderer.vue`,
`ScorePrintPages.vue`, and `ScorePageContent.vue`; ordinary printing and exports
use that same code. File I/O types in `src/services/documents/fileTypes.ts` are
shared by both file paths, rather than being MCP tool contracts.

Tests live beside their owners. MCP lifecycle and transaction scripts live in
`scripts/mcp/`. Shared rendering regressions live in `scripts/rendering/`; they
currently use MCP and the Electron debugging endpoint as their test driver.

Future automation jobs and export transformations belong in this feature area
(and its Electron counterpart), reusing shared document and rendering behavior.
