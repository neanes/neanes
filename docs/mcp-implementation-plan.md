# Neanes MCP implementation plan

Implementation handoff, updated 2026-10-18. Stages 1 and 2.5 are complete. Stage 2 includes isolated lifecycle, typed element/range discovery, search, selection and settled-page reads, and validated element/lyric transactions. Headless launch, the stdio bridge, and persistent UI access settings are implemented. Bounded PNG page previews are implemented. Private copying of unsaved editor content is deferred: users can save first, then open saved content privately for temporary edits and exports. Folder jobs are deferred until deemed necessary; other composition assistance and musical contract/test follow-ups are backlog. Inspect the working tree before continuing.

## Agent access control

Preferences includes an immediate Allow agent access switch, off by default.
Explicit legacy consent is preserved; policies without an enabled field require
one-time opt-in. Editor, bridge, and worker startup and request execution honor
this policy. Disabling closes transports and discards private sessions while
preserving editor tabs and saved files. Private host records support confirmation
when drafts or a request may be lost. Workers and bridges observe changes within
one second, and credential rotation prevents stale hosts surviving an off/on cycle.
The `--headless-mcp` flag selects worker mode and does not grant access. See
`scripts/mcp/README.md` and `docs/guide/agent-access.md` for the current contract.
Older always-on verification below records the preceding implementation.

## Overview

When agent access is enabled, Neanes starts an authenticated local MCP server while the Electron app is running. The goals are:

- Let development agents construct and inspect test scores without UI automation.
- Process folders of scores: change typography, save, and export PDFs with explicit output paths.
- Help users compose music and lyrics in the editor, including temporary export changes such as hiding ison indicators without changing the original score.

The intended architecture supports interactive workspaces and isolated automation documents. Electron main owns transport and filesystem access; agents orchestrate folder processing with existing document tools; validated IPC requests reach renderer-side document operations, layout, and rendering. UI and MCP share application behavior. The browser PWA does not host an MCP server.

The standard bridge automatically connects to a running editor or launches a headless worker. Document tools default to private documents in both cases; agents explicitly request `scope: "editor"` to work with open tabs. Explicit sessions remain available. Direct HTTP retains its interactive default and requires explicit sessions in headless mode.

## Settled architectural decisions

- **Shared operations, separate adapters.** `src/services/documents/` owns reusable lifecycle, metadata, style validation/replacement, persistence, and change/settlement hooks. `src/automation/` owns reference-based element/lyric transaction planning, API projections/contracts, revisions, sessions, and renderer/IPC dispatch. `electron/main/files/ScoreFiles.ts` owns shared score file I/O. These were extracted from the editor, Electron entry point, and initial automation implementation. Automation folders contain transport, tool contracts, dispatch, revisions, and access policy. Shared services do not depend on MCP contracts. `TheEditor.vue` still supplies rendering, selection, focus, recovery, and layout hooks.
- **Automatic local access.** Use the official MCP SDK and Streamable HTTP on authenticated IPv4 loopback. Use normal OS file permissions without MCP folder restrictions; preserve canonical file identity, overwrite/source checks, reject browser origins, and validate the Host header. One persisted access switch governs editor and worker startup; authentication and credential exchange stay internal. See the setup and contract guide in `scripts/mcp/README.md` for configuration.
- **Explicit documents and concurrency.** Tools address document IDs. Mutations, close, save, and export require the latest `expectedRevision`; clients reread after conflicts rather than automatically retrying stale writes. Edits are undoable and saving is explicit. All MCP requests share one serialized queue across clients and sessions; sessions provide ownership/isolation, not parallel execution. Serialized requests do not eliminate concurrent interactive edits.
- **Isolated session ownership and lifetime.** `create_session` returns a random UUID bearer capability under the existing server authentication; pass `sessionId` to document tools to restrict access to that session. Omitting it preserves interactive behavior. Up to 4 sessions may hold 16 documents each; leases expire after 15 idle minutes and discard private drafts. HTTP disconnects retain leases for inspection after uncertain requests. `close_session` validates every owned document before removal and requires explicit discard if any is dirty. Editor reload/process loss and app exit release private state. Closing the last isolated document creates no replacement; `selected` is false and `selectedDocumentId` is null.
- **Isolated documents reuse shared operations.** `IsolatedSessions` owns private, non-tab document collections served by `DocumentService` and per-session `McpDocumentAdapter` instances. Editor hooks load referenced fonts and reuse the text-box measurement queue without recovery writes; isolated command histories suppress global undo/redo notifications. PDF export uses the existing detached renderer. Failed initial settlement removes a newly introduced private document. Opening reads disk independently of interactive unsaved edits and other sessions, while canonical reuse stays within the owning session. Explicit saves may change a file open interactively, but never replace its live contents; existing source-conflict and overwrite rules apply.
- **Complete domain APIs.** Do not introduce temporary lyrics/settings shortcuts. Lyrics is a paragraph style. `get_paragraph_styles` returns complete writable live-model definitions and separately labeled resolved metadata. `edit_paragraph_styles` atomically creates, replaces, or deletes styles; replacement covers one complete definition, not the whole collection. Omitted styles remain unchanged, omitted overrides inherit, and supported nulls explicitly reset. Validate the final graph, permit forward parent references within a batch, protect built-ins, repair deleted-style references, and apply one undo step. The UI shares validation and repair behavior. Metadata uses complete `replace_document_properties` replacement. Dimensions use CSS pixels; line height is a multiplier.
- **Deliberate representations.** Writable styles use nested `overrides` and `fontStyle`; inspected score JSON retains the existing save-format contract. Do not duplicate that entire format in a second MCP schema. Tool inputs and outputs have schemas; structured success/error envelopes and stable error codes also survive IPC. Timeouts/disconnects can have an unknown outcome, requiring inspection before retry.
- **Live discovery and revisions.** `get_elements` reads half-open ranges with bounded pagination from staff, stored header/footer variants, annotations, and alternate-line collections. References are opaque, document-scoped live-object identities: movement and undo restoration preserve them; removal makes them unreachable and reopening creates new references. Revision snapshots cover discovery-visible properties, collection order/structure, and child identities as well as saved content; serialization alone misses blank children and identical-object swaps. Results omit unset null/undefined properties except text-box/drop-cap `lineHeight: null` (normal); omission inherits. False, zero, and empty strings remain present.
- **Atomic element transactions.** `edit_elements` supports insert, update/reset, replace, remove/range removal, `assign_lyrics`, and `set_staff_lyrics`, including batch-local `@clientId` references. Validate detached live-model drafts in action order before issuing one history batch; preserve existing object/collection identities, protect the terminal staff `Empty` sentinel, and validate final collection/musical constraints. Newly assigned fonts must exist and load before commit; recheck revisions after that await. Shared settlement measures content afterward. A settlement failure can occur after commit and reports `details.editsApplied`; inspect before retry. No tool implicitly saves or exposes arbitrary Vue/score-JSON mutation.
- **Explicit omissions and musical defaults.** Updates preserve omitted properties; `reset` restores constructor defaults and explicit null clears supported fields. Unchanged fthoras preserve omitted custom chromatic interpretations; creation or actual fthora changes default the interpretation like UI selection unless explicitly supplied. Creation/replacement of Tempo, Martyria, or ModeKey derives omitted BPM from the selected sign; partial updates preserve omitted BPM. The catalog exposes `tempoBpmDefaults` (Quick = 168). Martyria `tempo`/`tempoLeft`/`tempoRight` are mutually exclusive in the final batch state; clients must explicitly clear old signs. Model setters still normalize incompatible components in canonical property order.
- **Lyric parser versus literal properties.** Parser actions share `LyricService` and documented `_`/`-` syntax, including `acceptsLyrics`, Greek vowel/final-consonant redistribution, and `disableGreekMelismata`. Direct note text updates are literal and require explicit melisma/hyphen flags. Range assignment rejects boundaries cutting existing tied/melismatic/hyphenated groups and rejects unconsumed input, including nonempty text for empty ranges, with actionable `INVALID_ELEMENT_RANGE` errors and no committed changes. Clients must include the complete group or use explicit note updates. Locked staff-manager text may retain excess lyrics for future notes; its lock governs only main-staff note/drop-cap lyrics, not alternate lines.
- **Focused schemas, full runtime validation.** `get_element_catalog` defaults to a small inventory and the tempo map. Filter by `elementTypes`/`properties`, choose read/edit/both schemas, or opt into all schemas and neume enums. Schemas use self-contained local `$defs`/`$ref`; `edit_elements` advertises a compact property map but retains complete element-specific runtime validation. Tool input schemas use `io: 'input'` so defaulted fields remain optional; response schemas retain output semantics. Detailed contracts and examples live in `scripts/mcp/README.md`.
- **File identity differs from encoding.** Compare canonical identities to reuse open workspaces and enforce source conflicts, preserving unsaved content. Decode by the requested suffix and retain source format separately for same-source saves and recovery. Save As to another identity uses the destination suffix. Explicit-path writes use atomic commits, overwrite rules, and source checks based on modification time and size, including aliases. These checks do not lock out other applications.
- **Safe cleanup.** `open_document.created` distinguishes new workspaces from reused ones. Document close requires a revision and explicit discard for unsaved or recovered drafts, cleans interactive recovery state, and never saves implicitly or deletes score files. Closing the last interactive workspace creates a blank one so MCP remains available. Clients should close only documents they introduced unless instructed otherwise.
- **One snapshot renderer for Electron output.** Menu, command-line/silent, and MCP PDF exports, native printing, and PNG exports all use `electron/main/export/renderSnapshot.ts` (with a PDF-specific wrapper in `renderPdf.ts`) and the separate `export.html`/`src/export.ts` entry. A snapshot contains save-format score data, source/name/title metadata, language, system-font metadata, and overlay preferences. The disposable renderer creates no interactive workspace, recovery state, router, preferences persistence, or service worker. Dialogs, destination handling, and file-access policy stay outside it. Browser printing/PNG downloads and the existing SVG plumbing retain their previous paths.
- **Shared page structure, page-owned refs.** `ScorePageContent.vue` owns headers, footers, notation, lyrics, overlays, and child refs. The editor retains page DOM wrappers, visibility, selection, focus timing, mutation handlers, and editor-only badge slots. Its page-component refs expose `getElementRef`, `getLyricsRef`, `getAnnotationRef`, `getHeaderFooterRef`, and `getPageIndex`; header/footer instances are identified by page and region. There is no injected ref-setter or editor-wide child-ref registry. Print pages also use `whenReady` and `measureTextBoxes`.
- **Explicit rendering completion.** Load referenced fonts before canvas layout; await every rich-text variant (including both inline editors), annotations, and image decoding. Measure resolved page-specific token content and reconcile heights/pagination before readiness, with a 12-pass bound and explicit failure. Shared header/footer templates conservatively reserve their largest observed height across pages/passes to avoid chapter-movement cycles. Regenerate layout diagnostics for Print Overlays. Pass unrotated `pageWidthCustom`/`pageHeightCustom` to Electron; apply landscape exactly once. `electron/main/export/pageSize.ts` keeps PDF dimensions in inches and converts custom/half-sheet native print dimensions to microns; named sizes remain named.
- **Snapshot isolation and disposal.** PDF export leaves interactive tabs/input available. `exportedRevision` identifies the captured snapshot; the current `revision` can advance during export. Main validates renderer sender identity, removes listeners, and destroys the hidden window on success, failure, or cancellation. HTTP disconnects, editor disconnects, and request timeouts abort pending MCP rendering. PDF rendering has a 45-second deadline inside the 60-second MCP request limit; cancellation racing with an output commit can still have an unknown outcome. Native printing/PNG share `renderSnapshot` lifecycle handling in `renderSnapshot.ts`, including owner disconnect/reload cleanup. Native print dialogs are outside the rendering deadline. PNG conversion sends one page at a time through window-scoped IPC to main for writing; overwrite dialogs/writes pause the deadline, which restarts for the next page. Overwrite choices belong to each detached PNG job, and cancellation is checked before writing.
- **One text-box measurement lifecycle.** Element/style edits, their undo/redo, saves, recovery, and document settlement share the workspace-specific measurement queue. Explicit completion covers unchanged heights; global counters/polling and their temporary editor paths were removed. Foreground/background paragraph CSS stays scoped separately.

## UI/MCP musical behavior audit - 2026-10-16

The source audit found three existing UI-only policies that need explicit
contract guidance and focused regression coverage. These are not regressions
introduced by the element-editing refactor, and this audit does not authorize
changing API partial-update semantics to imitate UI actions.

| Policy and source                                                                                                                                     | Current UI behavior                                                                                                                                       | Current MCP behavior and impact                                                                                                                                            | Recommended follow-up                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contextual psifiston selection: `TheEditor.vue`, `updateNoteExpression`                                                                               | Selecting `Psifiston` immediately after a staff note with `HeteronConnectingLong` substitutes `PsifistonSlanted`.                                         | Direct expression assignment does not inspect the preceding element, so the same nominal selection can produce different notation.                                         | Document and test exact API expression selection. If contextual selection is later exposed through MCP, extract a pure helper with explicit previous-element context; preserve the ability to request an exact expression.                                                                   |
| Removing a martyria's attached neume: `TheEditor.vue`, `setMartyriaQuantitativeNeume`                                                                 | Toggling the neume off clears `quantitativeNeume`, `quantitativeNeumeFthora`, `quantitativeNeumeChromaticFthoraNote`, and `quantitativeNeumeFthoraCarry`. | Setting `quantitativeNeume: null` preserves omitted properties. Reattaching a neume can reveal retained fthora state.                                                      | Document and test preservation and the writable fields clients must explicitly clear. Carry is internal state, not a writable API property. Do not introduce unconditional model-setter cleanup: UI alignment changes also clear only the neume, making the broader cleanup action-specific. |
| Manual martyria pitch/scale: `TheEditor.vue`, `addAutoMartyria` and keyboard handlers; `PropertiesMartyria.vue`; `LayoutService` martyria calculation | Manual-selection actions disable `auto`, or controls are exposed only after automatic calculation is disabled.                                            | `note`, `scale`, and `auto` are independent properties. Layout recalculates note and scale while `auto` remains enabled, potentially overwriting a client's manual values. | Document that manual note/scale values require `auto: false`, and test through layout settlement. Root-sign customization uses `rootSignOverride`. Do not implicitly change omitted `auto`.                                                                                                  |

All three are low-priority contract/test backlog items, not established universal
normalization defects. No files were changed and no additional tests were run
as part of the source audit. The follow-ups below remain unimplemented:

- [ ] Add focused property-schema guidance for these three distinctions.
- [ ] Add pure API regression coverage for exact expression selection and retained martyria state, plus a layout regression for manual versus automatic martyria values.
- [ ] Decide whether contextual expression selection merits a separate composition operation before adding shared behavior.

The remaining boundaries are intentional:

- Model setters already share incompatible-neume cleanup and glyph replacements.
  API final-state validation has a separate role and must remain transactional.
- `LyricService` shares parsing and musical interpretation. Literal API note
  updates preserve omitted flags; interactive lyric input can interpret suffix
  syntax. Staff locking and independent alternate lines retain their contracts.
- `elementEditing.ts` shares fthora/default-interpretation pairing and martyria
  alignment cleanup. UI fthora selection chooses defaults; unchanged API fthoras
  preserve omitted custom interpretations. Alignment changes clear the neume in
  both paths, but API patches may explicitly supply one.
- `TempoElement.getDefaultBpm` shares sign defaults. UI tempo selection also uses
  preferences and resets BPM; API creation/replacement derives omitted BPM from
  the sign, while partial updates preserve omitted BPM. UI martyria tempo actions
  clear other positions; API clients explicitly clear conflicting signs.
- Replacement shares `copyBreakStateFrom`. Cycling, toggling, insertion-time
  lyric-flag inheritance, and empty-content removal remain UI action semantics.

Backlog recommendation: finish the focused contract/test follow-up without expanding
into a generic editing framework. Universal musical rules belong in model
setters or small shared functions; Vue owns interaction, and automation `elementEdits.ts`
retains reference resolution, sequential draft actions, validation, and planning.
Measure-bar cycling and repeated UI tempo-selection code are separate UI cleanup
opportunities, not missing shared API rules. These follow-ups do not block the preview work below; private copying is deferred.

## Client connection and startup - 2026-10-17

When enabled, the server starts automatically with Neanes. Settings provide
the access switch, connection status, Copy configuration, endpoint details, and
Retry connection on failure. There are no folder permissions, connection-mode
selectors, or user-facing credential controls. Tokens remain internal and are absent from
renderer settings responses and copied configurations.

- **Automatic connection:** The dependency-free Node.js 22+ bridge authenticates
  against the running editor's ready endpoint. If the editor is closed or its server is unavailable, it launches
  a private headless Electron worker/profile/random port and awaits readiness on a
  private pipe. A task stays on its original host; no automatic mutation retries
  or draft migration occur when the editor opens/closes. A bridge owns only the
  worker it launched, and never closes a user-owned editor.
- **Private defaults, explicit live work:** The bridge supplies an automatic
  private session for document tools with omitted scope/sessionId. It advertises
  `scope: "editor"` for discovery and work on live tabs. A bridge initially using
  a worker can discover an editor opened later through this explicit scope.
  Explicit session IDs continue to address the original host. Graceful shutdown
  discards only the bridge's automatic session; explicit sessions keep their
  existing leases. Unexpected HTTP disconnects preserve inspection semantics.
- **Normal file access:** MCP-specific filesystem roots and folder permissions are
  removed, including configuration requirements. Existing saved root lists are
  ignored on read and omitted on write. File I/O retains absolute-path and suffix
  validation, canonical identity, symlink-output rules, overwrite/source conflicts,
  and atomic commits. Folder job source/output selection remains future work.
- **Internal authentication:** The normal profile's private agent-access.json
  stores a generated token and explicit enabled state. Obsolete root/generation
  fields are ignored. Missing credentials are created disabled by editor startup;
  workers cannot create consent. Private
  workers use their own random bearer tokens. Normal clients require no credential
  setup. Explicit port/token environment overrides remain developer controls.
- **Nonfatal startup:** Server errors are caught and shown in settings while the
  editor opens normally. Retry restarts the transport without changing credentials.
  Private tasks can fall back to a worker; explicit editor requests report the
  editor error. A worker whose server cannot start exits, and the bridge reports
  the failure. No failed request is automatically replayed.
- **Runtime and distribution:** The hidden renderer shares documents, sessions,
  fonts, rich-text measurement, layout, and PDF output without mounting the editor,
  recovery, router, or service worker. The two bridge modules ship as external
  resources and are installed into a stable profile location; AppImage executable
  configuration uses its original APPIMAGE path. Diagnostics stay on stderr and
  stdout carries only MCP JSON-RPC. Bridge crashes leave a 60-second orphan grace
  period; private drafts are not recovered. Display-server-free deployment is not
  established.
- **Lifecycle and UI:** Renderer requests remain serialized across server
  restarts, and nested IPC is bound to request IDs. Preferences uses General,
  Appearance, Editing, Agent access (MCP), and Advanced sections with immediate
  changes and section-specific resets. Browser builds omit agent access. Every
  new UI label is translated in all supported locales.

Pure tests cover policy persistence/legacy roots, unrestricted file paths with
preserved file validation, and real tool-schema scope decoration/routing. Real
headless and editor smoke scripts cover automatic private defaults, both launch
orders, live editor reuse/discovery, save/reopen/PDF, policy refusal/revocation, startup failure/retry, worker crash, and preserved editor content/history.
Setup and test commands are in scripts/mcp/README.md; the user guide is
`docs/guide/agent-access.md`. Folder jobs are deferred; temporary exports of saved
scores already use private sessions and ordinary edits. Copying unsaved editor
content is deferred. macOS is the platform exercised for runtime/packaging; Windows/Linux
runtime parity and physical printing remain unverified.

Always-on verification: 825 unit tests passed (6 skipped); lint/type checking,
production Electron packaging, web production, and docs builds passed. Real
repository and packaged macOS smoke checks covered automatic startup with legacy
disabled settings, automatic credential creation, no token in renderer settings or
copied configuration, unauthenticated HTTP rejection, both launch orders, private
document defaults, live-tab access, and editor survival after bridge disconnect.
An actual occupied port verified nonfatal editor startup, private-worker fallback,
and Retry after releasing the port. Test apps were stopped.

## Implementation stages

### Stage 1: Foundation - complete

**Objective:** Validate an end-to-end MCP path using existing editor workspaces and shared application behavior.

**Delivered:** Authenticated scoped transport; capability discovery; document list/read/create/open/close; complete paragraph-style editing; metadata replacement; explicit save and PDF export; revisions, undo, structured outcomes, and file conflict protection. The original lyrics-only settings shortcut was removed before completing this stage.

**Acceptance:** A real MCP client can create/open, inspect, edit, save/reopen both score formats, export a PDF, and clean up its documents. Revisions, aliases, source-format preservation, filesystem boundaries, overwrite rules, and recovery cleanup behave correctly. Background style measurements match foreground results without changing the active document. Interactive and web behavior remain supported.

**Evidence:** Original acceptance passed unit tests, lint/type checking, Electron/web builds, and real MCP lifecycle regressions. Setup and regression commands are in `scripts/mcp/README.md`.

### Stage 2: Development and private export workflows - in progress

**Objective:** Add structured element editing and validated transactions, isolated sessions, and private export workflows that can include unsaved editor content. Folder orchestration remains with agents unless native jobs are later deemed necessary.

**Rendering foundation completed previously:**

- [x] Dedicated snapshot PDF renderer, IPC handoff, readiness, errors, cancellation, and disposal.
- [x] Route all Electron PDF exports through it while preserving dialog and explicit-path output behavior.
- [x] Share page structure and overlay rendering with the editor; move child-ref ownership behind page methods.
- [x] Fix inline rich-text readiness, resolved-token measurement/repagination, style-history measurement lifecycle, Print Overlays, and custom landscape dimensions.
- [x] Add real-app regressions for background export during interactive edits, ref/focus/remount behavior, unchanged-height style undo/redo with tab switches, rendering failure/cancellation, all overlay options/gates, and custom portrait/landscape paper dimensions.

**Isolated lifecycle completed previously:**

- [x] Explicit session capabilities, scoped document access, capacity limits, idle expiry, and cleanup.
- [x] Shared create/open/read/style/metadata/save/PDF/close operations without user tabs, recovery drafts, or interactive history notifications.
- [x] Independent disk reads for files open interactively; canonical reuse within a session and existing write/conflict protections.
- [x] Real Electron regressions for ownership, capacity, lifecycle, exports, failure/cancellation, and interactive state/recovery preservation.

**Element discovery and transactions completed:**

- [x] Typed catalog and revision-protected range discovery for interactive and isolated documents, including nested children and stored header/footer variants.
- [x] Discovery revisions include live child identities/structure/properties that save serialization can omit; sparse results preserve explicit normal line height.
- [x] Validated element/lyric action batches, local references, property reset/omission semantics, one-step undo/redo, no-op handling, and final graph constraints.
- [x] Shared font readiness and content measurement for foreground/background/isolated edits and history, with revision rechecks before commit and explicit post-commit settlement failure reporting.
- [x] Review fixes: unchanged chromatic interpretations, independent alternate-line lyrics under staff lock, parser/literal guidance, safe range boundaries and excess-input rejection, mutually exclusive martyria tempo signs, and sign-derived creation/replacement BPM.
- [x] Compact input/output schemas, focused catalog queries, correct input optionality, tempo mapping, and complete runtime validation.
- [x] Save/load normalization for omitted text-box content/heights and nullable image alignment; no save-format version change.
- [x] Pure regressions and real MCP transaction smoke coverage in both document modes, including save/reopen, PDF export, UI undo/redo, revision/validation failures, and unchanged unrelated interactive state.

**Additional discovery completed:**

- [x] Stored-field search (`find_elements`) and reference lookup with neighboring context (`get_element`).
- [x] Interactive selection inspection (`get_selection`), including remembered background-tab selection.
- [x] Settled page summaries and element occurrences (`get_pages`, `get_page_elements`) with revision/layout conflict checks.

**Deferred private-copy scope:**

- [ ] Copy current unsaved editor content into a private document without saving or changing the original, so agents can edit the copy, export, and discard it using existing tools.

Saved-score transformations already compose from existing APIs: create a fresh session, open the source from disk, find and edit matching elements (for example, clear note `ison` values), export PDF without saving, and discard the session. Clients orchestrate cleanup after success, failure, or cancellation; disconnected private drafts retain existing lease/expiry behavior. No dedicated transformation API or native folder job is required for this workflow.

**Prior rendering/isolation verification:** Real-app tests covered detached exports during interactive edits, overlays, custom portrait/landscape paper dimensions, session ownership/capacity, save/conflict/discard rules, export failure/cancellation, reload cleanup/reconnection, and unchanged interactive content/history/recovery. Existing regression scripts remain in `scripts/mcp/`. Idle-expiry timing was not exercised end to end.

**Element-transaction milestone verification (historical):** 779 unit tests passed (6 skipped); lint, type checking, and the production Electron build passed. `scripts/mcp/element-edit-smoke.mjs` validates successful requests against published input schemas and checks transactions, Quick BPM defaults, atomic lyric overflow rejection, locks, save/reopen, PDF, and optional UI undo/redo for interactive/isolated documents. `element-discovery-smoke.mjs` covers both document modes and stale revisions after save-identical child changes. Earlier checks in this session also passed the web production build, existing lifecycle/background-style/isolation/recovery/hidden-export regressions, and MCP-disabled startup. Test apps were stopped. Idle expiry and physical printing retain the limitations noted elsewhere.

**Dependencies and sequence:** Rendering, isolated ownership/lifecycle, discovery, and transactions are complete. Private copying of current editor content is deferred. Users can save first, open the saved file privately, and use ordinary edits and detached export. Native folder jobs are deferred and are not a Stage 2 completion requirement. Stage 2 remains open for the unsaved-content copy capability.

**Acceptance criteria:** Agents can construct representative scores without clicks; invalid edit batches leave no partial musical edits and successful batches form one undo step. Isolated processing does not alter user tabs, selection, unsaved content, or undo history. A private copy captures the current editor content under revision protection, including documents with no saved path, without changing the source document or writing a score file. Agents can edit, export, and discard that copy with existing tools. An export-only transformation, including failure/cancellation, leaves the original content, selection, unsaved state, history, and revision untouched. Existing output-conflict and private-session cleanup semantics apply.

### Stage 2.5: Finish the rendering migration - complete

**Objective:** Move Electron native printing and PNG export onto detached snapshot rendering before implementing isolated documents.

- [x] Inspect existing preparation, IPC, output dialogs, overwrite handling, and shared image/SVG paths.
- [x] Reuse the snapshot renderer's shared pages, fonts, rich-text/image readiness, token measurement/repagination, overlays, and cleanup; no second preparation implementation or live editor rendering for Electron output.
- [x] Migrate native printing with the system print dialog, options, cancellation, orientation, owner relationship, and correct native paper-size units.
- [x] Migrate PNG export with page ranges, DPI scaling, transparency, destination/folder handling, per-page output, and per-job overwrite choices. Browser and SVG paths remain unchanged.
- [x] Verify multi-page rich text, images, resolved tokens, overlays, source/revision/selection/undo preservation, rendering failure/interruption, native cancellation/success, and MCP-disabled UI behavior.

**Evidence:** Unit tests, lint/type checking, Electron/web builds, and real-app migration regressions passed. `scripts/rendering/rendering-migration-smoke.mjs` covers multi-page landscape PNGs, DPI, page selection, alpha/overlays, source preservation, failure/interruption cleanup, and optional native cancellation/system Save as PDF. Normal menu-driven output was also exercised with MCP disabled.

**Baseline and limitation:** An identical two-page Letter-landscape score prints two pages with the same paper dimensions on unchanged master and the migration build. Custom 6 x 9-inch landscape native output can insert interleaved blank sheets; this also reproduces on unchanged master when valid native dimensions are supplied at the IPC test boundary. Master's normal custom-paper UI fails earlier because it passes inches as microns; the migration corrects that unit conversion. No speculative page-height, margin, or pagination workarounds were retained. Treat the blank-sheet behavior as a separate pre-existing issue, not unfinished rendering migration; compare baselines before pursuing unrelated rendering fixes.

**Acceptance:** All three Electron output routes share detached rendering completion and cleanup; dialogs, destination handling, and filesystem policy remain outside score rendering. This does not add isolated documents, editing tools, jobs, or transformations. Physical printer output was not tested; native success was verified through system Save as PDF.

### Stage 3: Visual previews - initial page scope complete

**Objective:** Let agents and users inspect rendered results through visual previews of a document page or passage. Search, selection, and settled-page discovery already exist; PDF export alone is not a dedicated image-preview API.

**Dependencies:** Existing detached rendering, settled page discovery, and document/revision contracts. Private copying of unsaved editor content supports previews of temporary edits; native folder jobs are not a prerequisite.

**Initial scope:** `preview_page` returns one full-page opaque PNG as an MCP image content block, with revision/layout/page metadata in the JSON response. Physical page numbers are one-based; optional expected layout IDs match page discovery. The maximum image edge defaults to 1600 pixels (256-2048), at up to 192 DPI and 4 MiB PNG. Concurrent source edits reject the result. Reuse existing settled page discovery and the detached PNG renderer, including cancellation and disposal. Passage crops and multi-page responses are deferred.

**Acceptance criteria:** An agent can obtain a bounded visual preview of interactive or isolated content, including unsaved content, tied to the captured revision and layout. Previewing preserves document content, selection, unsaved state, history, and revision, and disposes rendering resources on success, failure, and cancellation. Concurrent-edit and output/delivery behavior must be explicit. Richer composition operations and musical/layout diagnostics are backlog.

## Remaining work and open design questions

- **Deferred: private copies of unsaved editor content.** Define a revision-protected way to copy current live content into an isolated document, including never-saved scores. Resolve pending-input settlement, source/name metadata for export tokens, ownership, and returned document identity/revision. Preserve live content/selection/history/revisions and source files. Reuse existing element/style edits, PDF export, and session discard; a new transformation contract is not in the immediate scope.
- **Completed: bounded full-page PNG previews.** `preview_page` supports unsaved interactive/private content through the existing rendering and page-discovery infrastructure. Passage crops and multi-page responses remain deferred. Musical diagnostics and higher-level composition operations remain out of scope.
- **Deferred until deemed necessary: folder discovery/jobs.** Agents enumerate files and orchestrate existing private document/style/save/PDF tools. Reconsider native jobs only for a concrete need such as execution independent of the client connection, in-app progress/cancellation, or consistent batch behavior across clients. If resumed, define enumeration/recursion/symlink limits, source/output selection, dry runs, per-file outcomes, overwrite/source conflicts, lifetime, and responsive status/cancellation under the serialized request queue. Native jobs do not block the immediate plan.
- **Backlog: musical contract/test follow-ups.** Retain the three UI/MCP audit items above: focused property-schema guidance, exact expression and retained martyria state regressions, and manual versus automatic martyria layout coverage. Preserve partial-update semantics. Any contextual expression-selection operation needs a separate scope decision.
- **Backlog: canonical rich-text edits through CKEditor.** Keep whole-field HTML replacement in `edit_elements`, but normalize supplied rich-text fields through an isolated instance of Neanes' configured CKEditor and obtain canonical `getData()` output before committing. Flush pending interactive input and check revisions; finish normalization and whole-batch validation before mutation, then recheck revisions after asynchronous preparation. Commit canonical content as one application undo step and settle rendering through existing measurement. Omitted panels stay unchanged; an empty string clears a panel. Apply the same contract to rich-text annotations. Report normalized fields and optionally return canonical HTML. Normalization/validation failures leave the document unchanged; post-commit measurement failures retain `editsApplied` reporting. Verify edit/render/save/reopen/interactive-edit/undo round trips in foreground, background, and private documents. Selection-based formatting and text-range operations require a separate future design. This is backlog, not a release requirement.
- **Backlog: richer composition assistance.** Context-preserving edits inside tied/Greek melisma groups, musical diagnostics, layout diagnostics, and contextual composition operations remain candidates without committed APIs or sequence. Current range assignment intentionally rejects unsupported boundaries; do not describe this as transparent context-aware parsing. Only visual previews remain in the immediate Stage 3 scope.
- **Known limits:** Isolated sessions run in the editor or a private headless worker; each host retains its serialized MCP request queue. Workers use built-in document defaults and do not expose unsaved editor contents. macOS is the platform exercised for real startup/packaging; Windows/Linux parity and display-server-free deployment remain unverified. Native custom-paper blank sheets remain a separate baseline-reproduced issue (see Stage 2.5). Source conflict checks use time/size rather than filesystem locking; timeout/cancellation can have an uncertain outcome. Newly mounted rich-text editors can normalize imported content and advance revisions; clients must reread before writes. A pre-existing rich-text undo-after-tab-switch issue was observed before the page refactor (saving can reapply stale editor data); recheck separately rather than treating it as fixed by the measurement-queue change.
- **Verification:** Continue pure unit tests and real Electron smoke tests; no mocks, spies, fakes, or DOM emulation. Preserve the current focus, pending-input flush, repeated-header instance, overlay, token, and paper-size regressions. Recheck normal editor operation, nonfatal MCP startup failure/retry, and the web build when changing shared operations.

## Token-efficiency checkpoint

The 2026-10-16 size audit prompted a pause before folder orchestration. The four
main reductions are implemented: property/content projection for `get_elements`,
compact published output schemas with typed runtime validation, focused style
reads and compact style-edit acknowledgements, and focused document-properties,
page-setup, and header/footer settings readers and partial settings writers with
revision checks. The serialized `get_document` reader has been removed. Style
edits now return summary/affected IDs unless full state is requested.
Detailed usage and compatibility notes are in `scripts/mcp/README.md`.

At the original checkpoint, the served tool-definition builder measured 66,677 minified JSON characters,
compared with 104,153 in the audit (36.0% smaller). Published output schemas total
37,933 characters; `get_elements` output is 4,032. A 100-note discovery page falls
from 47,404 to 18,904 characters when selecting neume/lyrics while preserving
references and child counts (60.1% smaller). These are character counts, not
model-specific tokens or a measurement of actual client context. Budget tests
cover the exact tool definitions and representative pure read results.

Text and structured responses are retained. Client context traces and focused
font discovery remain follow-ups; neither blocks the four main reductions.
Verification: 789 unit tests passed (6 skipped), lint and type checking passed,
and Electron production compilation/packaging, web production, and docs builds
passed. Real MCP transaction smoke passed in interactive/isolated documents,
including the new focused reads, compact style results, revision conflicts,
save/reopen, PDF export, and UI undo/redo. The existing lifecycle/style smoke
also passed with explicit full-state style results, including deletion/reparented
IDs. The disposable test app was stopped. Folder orchestration was the next
planned work at that checkpoint; it is now deferred until deemed necessary.

The 2026-10-17 status check passed 827 unit tests (6 skipped). The current core
tool inventory measures 96,167 minified JSON characters after the discovery
additions, with 55,609 output-schema characters; `get_elements` output remains
4,032. These figures supersede the inventory sizes above, not the historical
verification results. Electron smoke tests and builds were not rerun for that
status check.

## Current implementation status

The user prioritized PNG previews on 2026-10-18 and deferred live-document
copying. `preview_page` now exposes bounded full-page PNG inspection through the
existing detached renderer, with revision/layout checks, metadata-only JSON,
and one MCP image content block. PNG rendering must settle to the same geometry
as page discovery before the image is delivered.

Verification: 830 unit tests passed (6 skipped); lint, type checking, Electron
production compilation, web production, and docs builds passed. The disposable
Electron preview regression covered unsaved interactive/private documents,
multiple pages, pixel bounds and visible content, saved custom landscape scores
with rich text and embedded images, source-file preservation, stale revision and
layout errors, concurrent edits, cancellation, broken-image failure, and renderer
disposal. The headless bridge regression also obtained a PNG preview with matching
page-discovery metadata. Generated PNGs were visually inspected. Test apps and
workers were stopped.

Follow-up: preview geometry comparison excludes empty alternate lines and blank
annotations omitted by save snapshots. Save/load regressions and real Electron
previews cover affected and unrelated pages, preserve live children, and retain
geometry checks for populated children. Verification passed 832 unit tests
(6 skipped), lint/type checks, production compilation, and the preview smoke
regression. The smoke test uses an edited control tab to avoid pristine-startup
remount normalization; application lifecycle and settling behavior are unchanged.

Private copying remains the deferred Stage 2 item. Folder jobs, passage crops,
musical contract/test follow-ups, richer composition operations, and native
blank-sheet troubleshooting remain separate work.

For setup and verification commands, use `scripts/mcp/README.md`. For editing, start at `src/automation/documents/` (`elementDiscovery.ts`, `elementEdits.ts`) and `src/automation/contracts/` (`elementPropertySchemas.ts`, `elementEditSchema.ts`, `lyricSyntax.ts`, `elementSchemas.ts`, `jsonSchema.ts`), plus the shared `LyricService`. Automation organization and dependency rules are documented in `src/automation/README.md`. Lifecycle entry points are `DocumentService`, `src/automation/sessions/isolatedSessions.ts`, `McpDocumentAdapter`, the editor hooks in `TheEditor.vue`, the automation host, and `ScoreFiles`. Rendering entry points are `ScoreRenderSnapshot`/`SnapshotRenderRequest` in `scoreRenderSnapshot.ts`, `renderSnapshot.ts`, the PDF wrapper `renderPdf.ts`, `ExportRenderer.vue`, `ScorePrintPages.vue`, and `ScorePageContent.vue`; shared font/layout helpers live in `src/services/documents/` and `useScoreRendering.ts`. Detailed contracts belong in source and schemas rather than this plan.
