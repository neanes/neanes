# Neanes MCP implementation plan

Implementation handoff, updated 2026-10-16. Stages 1 and 2.5 are complete. Stage 2 now includes isolated document/session lifecycle alongside shared detached rendering. Element/range discovery and validated transactions are next; jobs and export transformations remain unimplemented. Implementation and handoff changes remain uncommitted in the working tree.

## Overview

Neanes hosts an opt-in MCP server while the Electron app is running. The goals are:

- Let development agents construct and inspect test scores without UI automation.
- Process folders of scores: change typography, save, and export PDFs with explicit output paths.
- Help users compose music and lyrics in the editor, including temporary export changes such as hiding ison indicators without changing the original score.

The intended architecture supports interactive workspaces and isolated automation documents. Electron main owns transport, filesystem access, and job coordination; validated IPC requests reach renderer-side document operations, layout, and rendering. UI and MCP share application behavior. The browser PWA does not host an MCP server.

Document tools default to interactive workspaces. With an explicit `sessionId`, clients can create/open, inspect, edit styles/metadata, save, export PDF, and close private documents without creating user tabs or recovery drafts. Both paths require the normal editor to be running; there is no headless startup mode.

## Settled architectural decisions

- **Shared operations, separate adapters.** `src/services/documents/` owns reusable lifecycle, metadata, style, and persistence behavior. `electron/main/files/ScoreFiles.ts` owns shared score file I/O. These were extracted from the editor, Electron entry point, and initial automation implementation. Automation folders contain transport, tool contracts, dispatch, revisions, and access policy. Shared services do not depend on MCP contracts. `TheEditor.vue` still supplies rendering, selection, focus, recovery, and layout hooks.
- **Local, explicitly enabled access.** Use the official MCP SDK and Streamable HTTP on authenticated IPv4 loopback. Require configured filesystem roots; enforce canonical-path boundaries, reject browser origins, and validate the Host header. The server is off by default. See the setup and contract guide in `scripts/mcp/README.md` for configuration.
- **Explicit documents and concurrency.** Tools address document IDs. Mutations, close, save, and export require the latest `expectedRevision`; clients reread after conflicts rather than automatically retrying stale writes. Edits are undoable and saving is explicit. All MCP requests share one serialized queue across clients and sessions; sessions provide ownership/isolation, not parallel execution. Serialized requests do not eliminate concurrent interactive edits.
- **Isolated session ownership and lifetime.** `create_session` returns a random UUID bearer capability under the existing server authentication; pass `sessionId` to document tools to restrict access to that session. Omitting it preserves interactive behavior. Up to 4 sessions may hold 16 documents each; leases expire after 15 idle minutes and discard private drafts. HTTP disconnects retain leases for inspection after uncertain requests. `close_session` validates every owned document before removal and requires explicit discard if any is dirty. Editor reload/process loss and app exit release private state. Closing the last isolated document creates no replacement; `selected` is false and `selectedDocumentId` is null.
- **Isolated documents reuse shared operations.** `IsolatedSessions` owns private, non-tab document collections served by `DocumentService` and per-session `McpDocumentAdapter` instances. Editor hooks load referenced fonts and reuse the text-box measurement queue without recovery writes; isolated command histories suppress global undo/redo notifications. PDF export uses the existing detached renderer. Failed initial settlement removes a newly introduced private document. Opening reads disk independently of interactive unsaved edits and other sessions, while canonical reuse stays within the owning session. Explicit saves may change a file open interactively, but never replace its live contents; existing source-conflict and overwrite rules apply.
- **Complete domain APIs.** Do not introduce temporary lyrics/settings shortcuts. Lyrics is a paragraph style. `get_paragraph_styles` returns complete writable live-model definitions and separately labeled resolved metadata. `edit_paragraph_styles` atomically creates, replaces, or deletes styles; replacement covers one complete definition, not the whole collection. Omitted styles remain unchanged, omitted overrides inherit, and supported nulls explicitly reset. Validate the final graph, permit forward parent references within a batch, protect built-ins, repair deleted-style references, and apply one undo step. The UI shares validation and repair behavior. Metadata uses complete `replace_document_properties` replacement. Dimensions use CSS pixels; line height is a multiplier.
- **Deliberate representations.** Writable styles use nested `overrides` and `fontStyle`; inspected score JSON retains the existing save-format contract. Do not duplicate that entire format in a second MCP schema. Tool inputs and outputs have schemas; structured success/error envelopes and stable error codes also survive IPC. Timeouts/disconnects can have an unknown outcome, requiring inspection before retry.
- **File identity differs from encoding.** Compare canonical identities to reuse open workspaces and enforce source conflicts, preserving unsaved content. Decode by the requested suffix and retain source format separately for same-source saves and recovery. Save As to another identity uses the destination suffix. Explicit-path writes use atomic commits, overwrite rules, and source checks based on modification time and size, including aliases. These checks do not lock out other applications.
- **Safe cleanup.** `open_document.created` distinguishes new workspaces from reused ones. Document close requires a revision and explicit discard for unsaved or recovered drafts, cleans interactive recovery state, and never saves implicitly or deletes score files. Closing the last interactive workspace creates a blank one so MCP remains available. Clients should close only documents they introduced unless instructed otherwise.
- **One snapshot renderer for Electron output.** Menu, command-line/silent, and MCP PDF exports, native printing, and PNG exports all use `electron/main/export/renderSnapshot.ts` (with a PDF-specific wrapper in `renderPdf.ts`) and the separate `export.html`/`src/export.ts` entry. A snapshot contains save-format score data, source/name/title metadata, language, system-font metadata, and overlay preferences. The disposable renderer creates no interactive workspace, recovery state, router, preferences persistence, or service worker. Dialogs, destination handling, and file-access policy stay outside it. Browser printing/PNG downloads and the existing SVG plumbing retain their previous paths.
- **Shared page structure, page-owned refs.** `ScorePageContent.vue` owns headers, footers, notation, lyrics, overlays, and child refs. The editor retains page DOM wrappers, visibility, selection, focus timing, mutation handlers, and editor-only badge slots. Its page-component refs expose `getElementRef`, `getLyricsRef`, `getAnnotationRef`, `getHeaderFooterRef`, and `getPageIndex`; header/footer instances are identified by page and region. There is no injected ref-setter or editor-wide child-ref registry. Print pages also use `whenReady` and `measureTextBoxes`.
- **Explicit rendering completion.** Load referenced fonts before canvas layout; await every rich-text variant (including both inline editors), annotations, and image decoding. Measure resolved page-specific token content and reconcile heights/pagination before readiness, with a 12-pass bound and explicit failure. Shared header/footer templates conservatively reserve their largest observed height across pages/passes to avoid chapter-movement cycles. Regenerate layout diagnostics for Print Overlays. Pass unrotated `pageWidthCustom`/`pageHeightCustom` to Electron; apply landscape exactly once. `electron/main/export/pageSize.ts` keeps PDF dimensions in inches and converts custom/half-sheet native print dimensions to microns; named sizes remain named.
- **Snapshot isolation and disposal.** PDF export leaves interactive tabs/input available. `exportedRevision` identifies the captured snapshot; the current `revision` can advance during export. Main validates renderer sender identity, removes listeners, and destroys the hidden window on success, failure, or cancellation. HTTP disconnects, editor disconnects, and request timeouts abort pending MCP rendering. PDF rendering has a 45-second deadline inside the 60-second MCP request limit; cancellation racing with an output commit can still have an unknown outcome. Native printing/PNG share `renderSnapshot` lifecycle handling in `renderSnapshot.ts`, including owner disconnect/reload cleanup. Native print dialogs are outside the rendering deadline. PNG conversion sends one page at a time through window-scoped IPC to main for writing; overwrite dialogs/writes pause the deadline, which restarts for the next page. Overwrite choices belong to each detached PNG job, and cancellation is checked before writing.
- **One text-box measurement lifecycle.** Style edits, style undo/redo, saves, recovery, and document settlement share the workspace-specific measurement queue. Explicit completion covers unchanged heights; global counters/polling and their temporary editor paths were removed. Foreground/background paragraph CSS stays scoped separately.

## Implementation stages

### Stage 1: Foundation - complete

**Objective:** Validate an end-to-end MCP path using existing editor workspaces and shared application behavior.

**Delivered:** Authenticated scoped transport; capability discovery; document list/read/create/open/close; complete paragraph-style editing; metadata replacement; explicit save and PDF export; revisions, undo, structured outcomes, and file conflict protection. The original lyrics-only settings shortcut was removed before completing this stage.

**Acceptance:** A real MCP client can create/open, inspect, edit, save/reopen both score formats, export a PDF, and clean up its documents. Revisions, aliases, source-format preservation, filesystem boundaries, overwrite rules, and recovery cleanup behave correctly. Background style measurements match foreground results without changing the active document. Interactive and web behavior remain supported.

**Evidence:** 699 unit tests passed (6 skipped), lint and type checking passed, Electron/web production builds passed, and real-app MCP smoke tests covered the principal lifecycle and regression cases. The final CSS-isolation regression failed with the old global rules and passed with scoped rules. Regression scripts and execution instructions are in `scripts/mcp/`.

### Stage 2: Development and batch workflows - in progress

**Objective:** Add structured element editing and validated transactions, isolated sessions, folder jobs, and temporary export transformations.

**Rendering foundation completed previously:**

- [x] Dedicated snapshot PDF renderer, IPC handoff, readiness, errors, cancellation, and disposal.
- [x] Route all Electron PDF exports through it while preserving dialog and explicit-path output behavior.
- [x] Share page structure and overlay rendering with the editor; move child-ref ownership behind page methods.
- [x] Fix inline rich-text readiness, resolved-token measurement/repagination, style-history measurement lifecycle, Print Overlays, and custom landscape dimensions.
- [x] Add real-app regressions for background export during interactive edits, ref/focus/remount behavior, unchanged-height style undo/redo with tab switches, rendering failure/cancellation, all overlay options/gates, and custom portrait/landscape paper dimensions.

**Isolated lifecycle completed this session:**

- [x] Explicit session capabilities, scoped document access, capacity limits, idle expiry, and cleanup.
- [x] Shared create/open/read/style/metadata/save/PDF/close operations without user tabs, recovery drafts, or interactive history notifications.
- [x] Independent disk reads for files open interactively; canonical reuse within a session and existing write/conflict protections.
- [x] Real Electron regressions for ownership, capacity, lifecycle, exports, failure/cancellation, and interactive state/recovery preservation.

**Still required:**

- [ ] Typed element/range discovery and validated edit transactions.
- [ ] Folder discovery and job orchestration.
- [ ] Temporary export-copy transformations.

**Rendering evidence (previous):** 701 unit tests passed (6 skipped); type checking, lint, and Electron/web production builds passed. Real Electron MCP lifecycle, background typography, hidden-export, and Print Overlays smoke tests passed. Command-line/MCP PDFs from the same source had identical glyph positions. The custom-landscape regression failed before the fix (portrait paper, 2/3 text scale) and passed afterward (9 x 6-inch paper, full scale); portrait output also passed. Commands and disposable-profile requirements are in `scripts/mcp/README.md`.

**Isolation evidence (this session):** 707 unit tests passed (6 skipped); lint, type checking, and Electron/web production builds passed. `scripts/mcp/isolated-session-smoke.mjs` checks session/document ownership, reuse, capacity, revision/discard rules, save/reopen, file conflicts, PDF success/failure/cancellation, and unchanged interactive selection/content/history/undo controls/recovery. Existing interactive MCP, background typography, hidden-export, and PNG migration regressions passed. Additional real-app checks verified session/draft release and MCP reconnection after editor reload, plus MCP-disabled production startup. Development-instance focus/readiness failures were not reproduced in the final fresh production checks; the smoke script now preserves original errors during cleanup. Idle-expiry timing was not exercised end to end.

**Dependencies and sequence:** Stage 2.5 and isolated ownership/lifecycle are complete; resume Stage 2 with typed discovery and validated transactions. Design element references and transaction semantics before exposing editing tools; build folder orchestration and transformations on those operations. Stage 2 as a whole is not complete.

**Acceptance criteria:** Agents can construct representative scores without clicks; invalid edit batches leave no partial musical edits and successful batches form one undo step. Isolated processing does not alter user tabs, selection, unsaved content, or undo history. Folder jobs support discovery, progress, cancellation, per-file results, explicit overwrite behavior, and source conflicts. A lyrics-font batch preserves explicit element overrides. An export-only transformation, including failure/cancellation, leaves the original untouched.

### Stage 2.5: Finish the rendering migration - complete

**Objective:** Move Electron native printing and PNG export onto detached snapshot rendering before implementing isolated documents.

- [x] Inspect existing preparation, IPC, output dialogs, overwrite handling, and shared image/SVG paths.
- [x] Reuse the snapshot renderer's shared pages, fonts, rich-text/image readiness, token measurement/repagination, overlays, and cleanup; no second preparation implementation or live editor rendering for Electron output.
- [x] Migrate native printing with the system print dialog, options, cancellation, orientation, owner relationship, and correct native paper-size units.
- [x] Migrate PNG export with page ranges, DPI scaling, transparency, destination/folder handling, per-page output, and per-job overwrite choices. Browser and SVG paths remain unchanged.
- [x] Verify multi-page rich text, images, resolved tokens, overlays, source/revision/selection/undo preservation, rendering failure/interruption, native cancellation/success, and MCP-disabled UI behavior.

**Evidence:** 705 unit tests passed (6 skipped); type checking, lint, and Electron/web production builds passed. Existing hidden-PDF/editor regressions passed. `scripts/mcp/rendering-migration-smoke.mjs` checks two-page custom landscape PNGs at 96/192 DPI, page selection, alpha, overlays, stale snapshot heights, unchanged source state, empty selection, broken-image failure, and interrupted-window disposal. Its optional native modes exercise cancellation or system Save as PDF without physical printing. Normal menu-driven PNG export and native printing were also exercised with MCP disabled. Instructions are in `scripts/mcp/README.md`.

**Baseline and limitation:** An identical two-page Letter-landscape score prints two pages with the same paper dimensions on unchanged master and the migration build. Custom 6 x 9-inch landscape native output can insert interleaved blank sheets; this also reproduces on unchanged master when valid native dimensions are supplied at the IPC test boundary. Master's normal custom-paper UI fails earlier because it passes inches as microns; the migration corrects that unit conversion. No speculative page-height, margin, or pagination workarounds were retained. Treat the blank-sheet behavior as a separate pre-existing issue, not unfinished rendering migration; compare baselines before pursuing unrelated rendering fixes.

**Acceptance:** All three Electron output routes share detached rendering completion and cleanup; dialogs, destination handling, and filesystem policy remain outside score rendering. This does not add isolated documents, editing tools, jobs, or transformations. Physical printer output was not tested; native success was verified through system Save as PDF.

### Stage 3: Composition assistance - planned

**Objective:** Add richer passage and lyric operations, musical diagnostics, and previews that let an agent assess its work alongside a user.

**Dependencies:** Stage 2's typed element/range editing, transactions, and rendering infrastructure.

**Acceptance criteria:** A user and agent can compose and revise passages/lyrics with coherent undo and revision protection, inspect useful musical/layout diagnostics, and review rendered results. Exact tools, diagnostic coverage, and preview formats remain open.

## Remaining work and open design questions

- **Editing:** Define stable element references, range queries, complete supported element/neume/property discovery, lyric operations, and transaction validation/failure semantics. Invalid batches must leave no partial edits; successful interactive batches form one undo step. Do not expose arbitrary Vue access or unvalidated score-JSON mutation.
- **Jobs and transformations:** Define folder discovery, dry-run/change previews, per-file reports, progress/cancellation, and temporary export-copy transformations. Separate multi-file job outcomes from a document's atomic edit transaction.
- **Known limits:** Isolated sessions still depend on the normal editor and share the global MCP request queue. A headless startup mode is not committed functionality. Native custom-paper blank sheets remain a separate baseline-reproduced issue (see Stage 2.5). Source conflict checks use time/size rather than filesystem locking; timeout/cancellation can have an uncertain outcome. Newly mounted rich-text editors can normalize imported content and advance revisions; clients must reread before writes. A pre-existing rich-text undo-after-tab-switch issue was observed before the page refactor (saving can reapply stale editor data); recheck separately rather than treating it as fixed by the measurement-queue change.
- **Verification:** Continue pure unit tests and real Electron smoke tests; no mocks, spies, fakes, or DOM emulation. Preserve the current focus, pending-input flush, repeated-header instance, overlay, token, and paper-size regressions. Recheck MCP-disabled UI and the web build when changing shared operations.

## Next two sessions

1. **Typed element/range discovery.** Inspect live element models, save serialization, command/history behavior, and UI editing operations. Define stable element references, range semantics, and complete supported element/neume/property discovery before exposing editing tools. Implement the read-only discovery surface for interactive and isolated documents, retaining session scoping and revision semantics. Do not expose arbitrary Vue access or a second writable score-JSON API.
2. **Validated edit transactions.** Build on discovery and shared UI/domain behavior to implement a coherent element/lyric editing surface. Validate an entire batch before mutation; invalid batches leave no partial musical edits and successful interactive batches form one undo step. Verify references/ranges, style and element overrides, save/reopen, layout/export, and unchanged unrelated interactive state in both document modes. Complete remaining element/lyric coverage before folder orchestration.

**After those sessions:** Folder discovery/jobs and temporary export-copy transformations remain Stage 2 work; composition assistance remains Stage 3. Native blank-sheet troubleshooting is separate and should not displace this sequence unless explicitly requested.

For setup and verification commands, use `scripts/mcp/README.md`. Start code exploration at `DocumentService`, `src/services/automation/isolatedSessions.ts`, `McpDocumentAdapter`, the editor hooks in `TheEditor.vue`, the automation host, and `ScoreFiles`. Rendering entry points are `ScoreRenderSnapshot`/`SnapshotRenderRequest` in `scoreRenderSnapshot.ts`, `renderSnapshot.ts`, the PDF wrapper `renderPdf.ts`, `ExportRenderer.vue`, `ScorePrintPages.vue`, and `ScorePageContent.vue`; shared font/layout helpers live in `src/services/documents/` and `useScoreRendering.ts`. Detailed contracts belong in source and schemas rather than this plan.
