# Neanes MCP implementation plan

Implementation handoff, updated 2026-10-15. Stage 1 is complete. Stage 2 is in progress: detached PDF rendering and shared page rendering are complete; isolated sessions, element editing, jobs, and export transformations remain unimplemented. Stage 2.5 (native printing and PNG migration) is the immediate next task, before isolated document lifecycle work. The session changes are uncommitted in the working tree.

## Overview

Neanes hosts an opt-in MCP server while the Electron app is running. The goals are:

- Let development agents construct and inspect test scores without UI automation.
- Process folders of scores: change typography, save, and export PDFs with explicit output paths.
- Help users compose music and lyrics in the editor, including temporary export changes such as hiding ison indicators without changing the original score.

The intended architecture supports interactive workspaces and isolated automation documents. Electron main owns transport, filesystem access, and job coordination; validated IPC requests reach renderer-side document operations, layout, and rendering. UI and MCP share application behavior. The browser PWA does not host an MCP server.

Document tools still use interactive workspaces. A client can loop over known paths to edit styles, save, export, and close documents, but those documents appear in the editor. PDF rendering alone is detached; this is not yet isolated document processing or a headless startup mode.

## Settled architectural decisions

- **Shared operations, separate adapters.** `src/services/documents/` owns reusable lifecycle, metadata, style, and persistence behavior. `electron/main/files/ScoreFiles.ts` owns shared score file I/O. These were extracted from the editor, Electron entry point, and initial automation implementation. Automation folders contain transport, tool contracts, dispatch, revisions, and access policy. Shared services do not depend on MCP contracts. `TheEditor.vue` still supplies rendering, selection, focus, recovery, and layout hooks.
- **Local, explicitly enabled access.** Use the official MCP SDK and Streamable HTTP on authenticated IPv4 loopback. Require configured filesystem roots; enforce canonical-path boundaries, reject browser origins, and validate the Host header. The server is off by default. See the setup and contract guide in `scripts/mcp/README.md` for configuration.
- **Explicit documents and concurrency.** Tools address document IDs. Mutations, close, save, and export require the latest `expectedRevision`; clients reread after conflicts rather than automatically retrying stale writes. Edits are undoable and saving is explicit. Serialized requests do not eliminate concurrent interactive edits.
- **Complete domain APIs.** Do not introduce temporary lyrics/settings shortcuts. Lyrics is a paragraph style. `get_paragraph_styles` returns complete writable live-model definitions and separately labeled resolved metadata. `edit_paragraph_styles` atomically creates, replaces, or deletes styles; replacement covers one complete definition, not the whole collection. Omitted styles remain unchanged, omitted overrides inherit, and supported nulls explicitly reset. Validate the final graph, permit forward parent references within a batch, protect built-ins, repair deleted-style references, and apply one undo step. The UI shares validation and repair behavior. Metadata uses complete `replace_document_properties` replacement. Dimensions use CSS pixels; line height is a multiplier.
- **Deliberate representations.** Writable styles use nested `overrides` and `fontStyle`; inspected score JSON retains the existing save-format contract. Do not duplicate that entire format in a second MCP schema. Tool inputs and outputs have schemas; structured success/error envelopes and stable error codes also survive IPC. Timeouts/disconnects can have an unknown outcome, requiring inspection before retry.
- **File identity differs from encoding.** Compare canonical identities to reuse open workspaces and enforce source conflicts, preserving unsaved content. Decode by the requested suffix and retain source format separately for same-source saves and recovery. Save As to another identity uses the destination suffix. Explicit-path writes use atomic commits, overwrite rules, and source checks based on modification time and size, including aliases. These checks do not lock out other applications.
- **Safe cleanup.** `open_document.created` distinguishes new workspaces from reused ones. Close requires a revision and explicit discard for unsaved or recovered drafts, cleans recovery state, and never saves implicitly or deletes score files. Closing the last workspace creates a blank one so MCP remains available. Clients should close only documents they introduced unless instructed otherwise.
- **One snapshot renderer for Electron PDFs.** Menu, command-line/silent, and MCP PDF exports all use `electron/main/export/renderPdf.ts` and the separate `export.html`/`src/export.ts` entry. A snapshot contains save-format score data, source/name/title metadata, language, system-font metadata, and overlay preferences. The disposable renderer creates no interactive workspace, recovery state, router, preferences persistence, or service worker. Dialogs, destination handling, and file-access policy stay outside it. Native printing and PNG export retain their existing editor paths.
- **Shared page structure, page-owned refs.** `ScorePageContent.vue` owns headers, footers, notation, lyrics, overlays, and child refs. The editor retains page DOM wrappers, visibility, selection, focus timing, mutation handlers, and editor-only badge slots. Its page-component refs expose `getElementRef`, `getLyricsRef`, `getAnnotationRef`, `getHeaderFooterRef`, and `getPageIndex`; header/footer instances are identified by page and region. There is no injected ref-setter or editor-wide child-ref registry. Print pages also use `whenReady` and `measureTextBoxes`.
- **Explicit rendering completion.** Load referenced fonts before canvas layout; await every rich-text variant (including both inline editors), annotations, and image decoding. Measure resolved page-specific token content and reconcile heights/pagination before readiness, with a 12-pass bound and explicit failure. Shared header/footer templates conservatively reserve their largest observed height across pages/passes to avoid chapter-movement cycles. Regenerate layout diagnostics for Print Overlays. Pass unrotated `pageWidthCustom`/`pageHeightCustom` to Electron; apply landscape exactly once.
- **Snapshot isolation and disposal.** PDF export leaves interactive tabs/input available. `exportedRevision` identifies the captured snapshot; the current `revision` can advance during export. Main validates renderer sender identity, removes listeners, and destroys the hidden window on success, failure, or cancellation. HTTP disconnects, editor disconnects, and request timeouts abort pending MCP rendering. Rendering has a 45-second deadline inside the 60-second MCP request limit; cancellation racing with an output commit can still have an unknown outcome.
- **One text-box measurement lifecycle.** Style edits, style undo/redo, saves, recovery, and document settlement share the workspace-specific measurement queue. Explicit completion covers unchanged heights; global counters/polling and their temporary editor paths were removed. Foreground/background paragraph CSS stays scoped separately.

## Implementation stages

### Stage 1: Foundation - complete

**Objective:** Validate an end-to-end MCP path using existing editor workspaces and shared application behavior.

**Delivered:** Authenticated scoped transport; capability discovery; document list/read/create/open/close; complete paragraph-style editing; metadata replacement; explicit save and PDF export; revisions, undo, structured outcomes, and file conflict protection. The original lyrics-only settings shortcut was removed before completing this stage.

**Acceptance:** A real MCP client can create/open, inspect, edit, save/reopen both score formats, export a PDF, and clean up its documents. Revisions, aliases, source-format preservation, filesystem boundaries, overwrite rules, and recovery cleanup behave correctly. Background style measurements match foreground results without changing the active document. Interactive and web behavior remain supported.

**Evidence:** 699 unit tests passed (6 skipped), lint and type checking passed, Electron/web production builds passed, and real-app MCP smoke tests covered the principal lifecycle and regression cases. The final CSS-isolation regression failed with the old global rules and passed with scoped rules. Regression scripts and execution instructions are in `scripts/mcp/`.

### Stage 2: Development and batch workflows - in progress

**Objective:** Add structured element editing and validated transactions, isolated sessions, folder jobs, and temporary export transformations.

**Completed this session:**

- [x] Dedicated snapshot PDF renderer, IPC handoff, readiness, errors, cancellation, and disposal.
- [x] Route all Electron PDF exports through it while preserving dialog and explicit-path output behavior.
- [x] Share page structure and overlay rendering with the editor; move child-ref ownership behind page methods.
- [x] Fix inline rich-text readiness, resolved-token measurement/repagination, style-history measurement lifecycle, Print Overlays, and custom landscape dimensions.
- [x] Add real-app regressions for background export during interactive edits, ref/focus/remount behavior, unchanged-height style undo/redo with tab switches, rendering failure/cancellation, all overlay options/gates, and custom portrait/landscape paper dimensions.

**Still required:**

- [ ] Isolated document/session ownership and lifecycle.
- [ ] Typed element/range discovery and validated edit transactions.
- [ ] Folder discovery and job orchestration.
- [ ] Temporary export-copy transformations.

**Evidence:** 701 unit tests passed (6 skipped); type checking, lint, and Electron/web production builds passed. Real Electron MCP lifecycle, background typography, hidden-export, and Print Overlays smoke tests passed. Command-line/MCP PDFs from the same source had identical glyph positions. The custom-landscape regression failed before the fix (portrait paper, 2/3 text scale) and passed afterward (9 x 6-inch paper, full scale); portrait output also passed. Commands and disposable-profile requirements are in `scripts/mcp/README.md`.

**Dependencies and sequence:** Complete the Stage 2.5 rendering prerequisite below, then resume Stage 2 with isolated ownership/lifecycle. Design element references and transaction semantics before exposing editing tools; build folder orchestration and transformations on those operations. Stage 2 as a whole is not complete.

**Acceptance criteria:** Agents can construct representative scores without clicks; invalid edit batches leave no partial musical edits and successful batches form one undo step. Isolated processing does not alter user tabs, selection, unsaved content, or undo history. Folder jobs support discovery, progress, cancellation, per-file results, explicit overwrite behavior, and source conflicts. A lyrics-font batch preserves explicit element overrides. An export-only transformation, including failure/cancellation, leaves the original untouched.

### Stage 2.5: Finish the rendering migration - next

This is a rendering prerequisite within the current Stage 2 work, not a task to postpone until all Stage 2 features are complete. PDF migration and shared page/ref/overlay rendering are already complete; the remaining routes still depend on the live editor.

**Objective:** Move Electron native printing and PNG export onto detached snapshot rendering before implementing isolated documents.

- [ ] Inspect existing native printing and image-export preparation, IPC, and output behavior before changing them.
- [ ] Reuse shared page rendering, font/editor/image readiness, token measurement/repagination, and renderer cleanup. Extend the snapshot protocol only where needed; avoid another editor instance or a second preparation implementation.
- [ ] Migrate native printing while preserving printer selection, print options, cancellation, orientation, overlays, and existing dialog ownership.
- [ ] Migrate PNG export while preserving page ranges, image dimensions/scale, transparency/background behavior, destination handling, and related image-format behavior. Inspect any shared SVG path and preserve it without broadening this stage unnecessarily.
- [ ] Verify output parity and cleanup after success, failure, and cancellation, including multi-page scores, rich text, images, tokens, overlays, and custom landscape paper. Confirm user tabs, selection, pending edits, undo, and recovery remain intact.

**Acceptance:** Native printing and PNG export no longer require mounting or printing the live editor's pages. All three rendering routes use the same completion guarantees, with route-specific dialogs and output handling outside score rendering. Existing PDF regressions, MCP-disabled UI behavior, and the web build remain supported.

**Scope:** Rendering migration only. Do not add isolated sessions, element-editing tools, folder jobs, or export transformations in this stage.

### Stage 3: Composition assistance - planned

**Objective:** Add richer passage and lyric operations, musical diagnostics, and previews that let an agent assess its work alongside a user.

**Dependencies:** Stage 2's typed element/range editing, transactions, and rendering infrastructure.

**Acceptance criteria:** A user and agent can compose and revise passages/lyrics with coherent undo and revision protection, inspect useful musical/layout diagnostics, and review rendered results. Exact tools, diagnostic coverage, and preview formats remain open.

## Remaining work and open design questions

- **Rendering migration first:** Stage 2.5 above is the immediate next task. Native printing and PNG export are not yet migrated; shared page rendering alone does not complete this stage.
- **Isolated sessions:** Define ownership, IDs, lifetime, cleanup, resource limits, and behavior when the same file is already open with unsaved edits. Reuse document/file services and the snapshot renderer without registering automation documents as user tabs or recovery drafts. A startup mode without the normal editor is not committed functionality.
- **Editing:** Define stable element references, range queries, complete supported element/neume/property discovery, lyric operations, and transaction validation/failure semantics. Invalid batches must leave no partial edits; successful interactive batches form one undo step. Do not expose arbitrary Vue access or unvalidated score-JSON mutation.
- **Jobs and transformations:** Define folder discovery, dry-run/change previews, per-file reports, progress/cancellation, and temporary export-copy transformations. Separate multi-file job outcomes from a document's atomic edit transaction.
- **Known limits:** Documents still belong to interactive workspaces. Native printing/PNG preparation is not unified with snapshot PDF readiness. Source conflict checks use time/size rather than filesystem locking; timeout/cancellation can have an uncertain outcome. Newly mounted rich-text editors can normalize imported content and advance revisions; clients must reread before writes. A pre-existing rich-text undo-after-tab-switch issue was observed before the page refactor (saving can reapply stale editor data); recheck separately rather than treating it as fixed by the measurement-queue change.
- **Verification:** Continue pure unit tests and real Electron smoke tests; no mocks, spies, fakes, or DOM emulation. Preserve the current focus, pending-input flush, repeated-header instance, overlay, token, and paper-size regressions. Recheck MCP-disabled UI and the web build when changing shared operations.

## Next two sessions

1. **Stage 2.5: Native printing and PNG export.** Inspect their current paths in `TheEditor.vue`, IPC services, and Electron main; migrate preparation to detached snapshot rendering and verify the acceptance criteria above. Reuse `renderPdf.ts` lifecycle patterns while preserving each route's behavior. Complete this boundary before starting isolation.
2. **Resume Stage 2: Isolated document lifecycle.** Inspect `DocumentService` and its editor hooks, then settle ownership, lifetime, resource limits, and the unsaved-file policy. Implement bounded isolated sessions using shared document/file/rendering services, with explicit cleanup and no tab, focus, undo, or recovery side effects. Verify success, failure, cancellation, and file conflicts. A detached rendering window is not itself an isolated document host.

**After those sessions:** Typed element/range discovery and validated transactions, then folder jobs and temporary export-copy transformations. These remain Stage 2 work; composition assistance remains Stage 3. If Stage 2.5 needs more than one session to meet its acceptance criteria, finish it before advancing to isolation.

For setup and verification commands, use `scripts/mcp/README.md`. Start code exploration at `DocumentService`, `McpDocumentAdapter`, the automation host, and `ScoreFiles`. Rendering entry points are `PdfSnapshot`, `renderPdf.ts`, `ExportRenderer.vue`, `ScorePrintPages.vue`, and `ScorePageContent.vue`; shared font/layout helpers live in `src/services/documents/` and `useScoreRendering.ts`. Detailed contracts belong in source and schemas rather than this plan.
