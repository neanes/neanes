# Neanes MCP implementation plan

Implementation handoff, updated 2026-10-15. Stage 1 is complete. This document records the agreed direction and current boundaries; exact contracts for later stages remain to be designed.

## Overview

Neanes hosts an opt-in MCP server while the Electron app is running. The goals are:

- Let development agents construct and inspect test scores without UI automation.
- Process folders of scores: change typography, save, and export PDFs with explicit output paths.
- Help users compose music and lyrics in the editor, including temporary export changes such as hiding ison indicators without changing the original score.

The intended architecture supports interactive workspaces and isolated automation documents. Electron main owns transport, filesystem access, and job coordination; validated IPC requests reach renderer-side document operations, layout, and rendering. UI and MCP share application behavior. The browser PWA does not host an MCP server.

Stage 1 uses interactive workspaces. It does not yet provide isolated sessions, folder jobs, musical element editing, or temporary export transformations. A client can already loop over known paths to edit styles, save, export, and close documents, but those documents appear in the editor.

## Settled architectural decisions

- **Shared operations, separate adapters.** `src/services/documents/` owns reusable lifecycle, metadata, style, and persistence behavior. `electron/main/files/ScoreFiles.ts` owns shared score file I/O. These were extracted from the editor, Electron entry point, and initial automation implementation. Automation folders contain transport, tool contracts, dispatch, revisions, and access policy. Shared services do not depend on MCP contracts. `TheEditor.vue` still supplies rendering, selection, focus, recovery, and layout hooks.
- **Local, explicitly enabled access.** Use the official MCP SDK and Streamable HTTP on authenticated IPv4 loopback. Require configured filesystem roots; enforce canonical-path boundaries, reject browser origins, and validate the Host header. The server is off by default. See the setup and contract guide in `scripts/mcp/README.md` for configuration.
- **Explicit documents and concurrency.** Tools address document IDs. Mutations, close, save, and export require the latest `expectedRevision`; clients reread after conflicts rather than automatically retrying stale writes. Edits are undoable and saving is explicit. Serialized requests do not eliminate concurrent interactive edits.
- **Complete domain APIs.** Do not introduce temporary lyrics/settings shortcuts. Lyrics is a paragraph style. `get_paragraph_styles` returns complete writable live-model definitions and separately labeled resolved metadata. `edit_paragraph_styles` atomically creates, replaces, or deletes styles; replacement covers one complete definition, not the whole collection. Omitted styles remain unchanged, omitted overrides inherit, and supported nulls explicitly reset. Validate the final graph, permit forward parent references within a batch, protect built-ins, repair deleted-style references, and apply one undo step. The UI shares validation and repair behavior. Metadata uses complete `replace_document_properties` replacement. Dimensions use CSS pixels; line height is a multiplier.
- **Deliberate representations.** Writable styles use nested `overrides` and `fontStyle`; inspected score JSON retains the existing save-format contract. Do not duplicate that entire format in a second MCP schema. Tool inputs and outputs have schemas; structured success/error envelopes and stable error codes also survive IPC. Timeouts/disconnects can have an unknown outcome, requiring inspection before retry.
- **File identity differs from encoding.** Compare canonical identities to reuse open workspaces and enforce source conflicts, preserving unsaved content. Decode by the requested suffix and retain source format separately for same-source saves and recovery. Save As to another identity uses the destination suffix. Explicit-path writes use atomic commits, overwrite rules, and source checks based on modification time and size, including aliases. These checks do not lock out other applications.
- **Safe cleanup.** `open_document.created` distinguishes new workspaces from reused ones. Close requires a revision and explicit discard for unsaved or recovered drafts, cleans recovery state, and never saves implicitly or deletes score files. Closing the last workspace creates a blank one so MCP remains available. Clients should close only documents they introduced unless instructed otherwise.
- **Stage 1 rendering correctness.** PDF export temporarily selects its document, blocks input/navigation/native menus, then restores selection. Native/external opens, including dialogs already in progress, share its operation queue. Target-specific offscreen text-box measurement waits for fonts/editors and completes before style edits settle, saves, or recovery snapshots. Foreground and background paragraph CSS are scoped separately. This measurement component is not an isolated export renderer.

## Implementation stages

### Stage 1: Foundation - complete

**Objective:** Validate an end-to-end MCP path using existing editor workspaces and shared application behavior.

**Delivered:** Authenticated scoped transport; capability discovery; document list/read/create/open/close; complete paragraph-style editing; metadata replacement; explicit save and PDF export; revisions, undo, structured outcomes, and file conflict protection. The original lyrics-only settings shortcut was removed before completing this stage.

**Acceptance:** A real MCP client can create/open, inspect, edit, save/reopen both score formats, export a PDF, and clean up its documents. Revisions, aliases, source-format preservation, filesystem boundaries, overwrite rules, and recovery cleanup behave correctly. Background style measurements match foreground results without changing the active document. Interactive and web behavior remain supported.

**Evidence:** 699 unit tests passed (6 skipped), lint and type checking passed, Electron/web production builds passed, and real-app MCP smoke tests covered the principal lifecycle and regression cases. The final CSS-isolation regression failed with the old global rules and passed with scoped rules. Regression scripts and execution instructions are in `scripts/mcp/`.

### Stage 2: Development and batch workflows - next

**Objective:** Add structured element editing and validated transactions, isolated sessions, folder jobs, and temporary export transformations.

**Dependencies and sequence:** Build on Stage 1's document services and safety contracts. Start by separating export rendering from the interactive editor, then establish isolated document ownership/lifecycle. Design element references and transaction semantics before exposing editing tools; build folder orchestration on those operations.

**Acceptance criteria:** Agents can construct representative scores without clicks; invalid edit batches leave no partial musical edits and successful batches form one undo step. Isolated processing does not alter user tabs, selection, unsaved content, or undo history. Folder jobs support discovery, progress, cancellation, per-file results, explicit overwrite behavior, and source conflicts. A lyrics-font batch preserves explicit element overrides. An export-only transformation, including failure/cancellation, leaves the original untouched.

### Stage 3: Composition assistance - planned

**Objective:** Add richer passage and lyric operations, musical diagnostics, and previews that let an agent assess its work alongside a user.

**Dependencies:** Stage 2's typed element/range editing, transactions, and rendering infrastructure.

**Acceptance criteria:** A user and agent can compose and revise passages/lyrics with coherent undo and revision protection, inspect useful musical/layout diagnostics, and review rendered results. Exact tools, diagnostic coverage, and preview formats remain open.

## Remaining work and open design questions

- **Hidden export renderer:** The recommended first Stage 2 change was discussed and deferred as a separate architectural task. Extract rendering with font/layout readiness; loading another full editor unchanged would run unwanted workspace/recovery/persistence behavior. Define snapshot handoff, errors, cancellation, and disposal. A snapshot-based hidden renderer is the proposed approach, not an implemented contract.
- **Isolated sessions:** Decide session ownership, IDs, lifetime, cleanup, resource limits, and how isolation interacts with a file already open with unsaved edits. A startup mode without the normal editor was proposed but is not committed functionality.
- **Editing:** Define stable element references, range queries, complete supported element/neume/property discovery, lyric operations, and transaction validation/failure semantics. Do not expose arbitrary Vue access or an unvalidated score-JSON mutation escape hatch.
- **Jobs and transformations:** Design folder discovery, dry-run/change previews, per-file reports, progress/cancellation, and export-copy transformations. Separate multi-file job outcomes from a single document's atomic edit transaction.
- **Known limitations:** Export still occupies the visible renderer; isolated/headless processing is absent. External conflict checks use time/size rather than filesystem locking. A timed-out operation may have completed. Newly mounted rich-text editors can normalize imported content asynchronously and advance revisions; clients must use fresh reads. Stage 1 review findings concerning alias handling, export interruptions, modifier cleanup, source encoding, background heights, and CSS leakage were fixed, not deferred.
- Continue pure unit coverage and real Electron smoke tests; repository policy prohibits mocks, spies, fakes, and DOM emulation. Recheck normal UI behavior with MCP disabled and the web build when changing shared operations.

## Next stage entry point

Begin Stage 2 with a scoped design for a dedicated hidden export renderer. Identify the page-rendering extraction from `TheEditor.vue`, snapshot and readiness protocol, and failure cleanup before implementing it. Prove that export remains correct while the user changes tabs or edits, and that it has no workspace/recovery side effects. Then extend that foundation to isolated sessions and deliberate element-editing/job contracts.

For current behavior and verification commands, use the MCP guide in `scripts/mcp/README.md`. Start code exploration at `DocumentService`, `McpDocumentAdapter`, the main-process automation host, `ScoreFiles`, and the editor's integration hooks; detailed tool schemas and algorithms belong in those sources rather than this plan.
