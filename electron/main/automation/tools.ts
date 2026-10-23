import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { publishedBatchQuerySchema } from '../../../src/automation/contracts/batch';
import { compactJsonSchema } from '../../../src/automation/contracts/jsonSchema';
import {
  type AutomationMode,
  automationSchemas,
  type AutomationTool,
  isToolAvailable,
} from '../../../src/automation/contracts/protocol';
import { publishedAutomationOutputSchema } from '../../../src/automation/contracts/results';
import { isReadOnlyAutomationTool } from '../../../src/automation/contracts/toolBehavior';

const descriptions: Record<AutomationTool, string> = {
  discover_score_files:
    'List saved .byz/.byzx paths without opening or validating scores. Optional recursion; symlink entries are skipped. Deterministic depth-first order, files before child folders. Page with nextOffset until null; keep folder/options unchanged and the tree stable. Stops with an error above 10000 scanned entries; narrow the folder. For batch_update_files, convert chosen paths to files:paths.map(filePath=>({filePath})); entries must be objects, not strings.',
  batch_update_files:
    'Process saved scores privately; files:[{filePath:"/scores/example.byzx"}]. Shared edits precede per-file edits. Constraints: paragraphStyles uses edit_paragraph_styles.changes; pageSetup uses update_page_setup.changes; headerFooter uses update_header_footer_settings.changes; documentProperties is sparse {title?,author?}. Default text font: edits:{paragraphStyles:[{action:"update",id:"default-text",changes:{overrides:{fontFamily:"Arial"}}}]}. Per-file commits may precede errors. Inspect results and stopReason before resuming the identical manifest with startIndex:nextIndex. nextIndex skips attempted files, including failures. Retry failures explicitly; complete means all files were attempted.',

  create_session:
    'Create an isolated session. Its ID is a bearer capability; pass sessionId to document tools. Sessions expire after 15 idle minutes and discard unsaved drafts. At most 4 sessions and 16 documents per session. HTTP disconnect does not close a session.',
  close_session:
    'Close an isolated session atomically. Unsaved documents require explicit discardUnsavedChanges. Does not save or delete files.',
  get_capabilities:
    'Formats, style units, session limits. includeFonts:true adds local fonts; includeErrorCodes:true adds errors.',
  list_documents:
    'List interactive workspaces, or only documents owned by the supplied sessionId, with IDs and revisions. Does not open files.',
  get_rich_text_format:
    'CKEditor HTML: basics+inline by default; topics:["inline"] for selection CSS or ["opentype"] for font-variant values. No document/session.',
  get_mode_key_templates:
    'List mode-key template summaries using existing English descriptions, internal scale and starting note, and optional-diatonic-fthora support. Filter by mode (1-4 authentic, 5 plagal first, 6 plagal second, 7 grave, 8 plagal fourth) and/or templateIds; filters combine with AND. Omit filters for all templates. No document or session required. Use templateId and an explicit useOptionalDiatonicFthoras boolean in edit_elements to apply a template.',
  get_element_catalog:
    'Get a small element-type inventory by default. Use view:names for propertyNames only, optionally filtered by elementTypes/properties; Empty is read-only. Supply elementTypes and/or properties to retrieve focused property schemas; other views select read, edit, or both. includeProperties retrieves all schemas unless view:names; includeNeumes includes the full enum vocabulary. RichTextBox and Annotation HTML authoring: get_rich_text_format. Full opt-in catalogs use a separate 128000-character budget and are not paginated. Schemas use local $defs/$ref. tempoBpmDefaults maps each tempo sign to its creation/replacement default BPM; partial updates preserve omitted BPM. Dimensions are CSS pixels, lineHeight is a multiplier, and lineHeight:null explicitly resets to normal while omission inherits.',
  get_elements:
    'Read a known contiguous range of typed elements in a collection (staff by default). To locate elements by type or property, use find_elements first. Ranges use zero-based start inclusive/end exclusive; offset is relative to that range. Follow nextOffset with expectedRevision to prevent mixed-revision pages. Child collections use a returned parentRef. References are opaque, scoped to one open document, and survive movement and undo restoration of the same object; removal makes them unavailable and reopen assigns new references. Element properties omit null and undefined values except lineHeight: null, which explicitly resets text-box or drop-cap line height to normal. Omitted lineHeight inherits the paragraph style; other missing properties are unset. False, zero and empty strings remain present. Includes the terminal Empty sentinel. Header/footer collections are stored templates, not resolved page instances. Use properties to select fields ([] returns identities/counts only); inapplicable fields are omitted. includeContent:false omits image data and text-box content/panel fields, even if selected. Annotation text and drop-cap content are included when projected, unless over budget; omittedContent identifies such omitted fields. Large content is excluded by default; request includeContent:true explicitly. Pages may end before limit to fit the JSON budget; follow nextOffset. Projected omissions may be unrequested; retrieve complete fields before replacement. Use get_element_content for exact oversized content; get_element_catalog for property constraints. Does not edit or save.',
  find_text:
    'Find literal text in lyrics, drop caps, annotations and plain/rich text-box panels. Rich HTML is searched as plain text. Case-insensitive by default; NFC Unicode normalization, tatweel ignored, diacritics retained. Whitespace collapses in text and is ignored in lyric runs, which may span notes/drop caps in one collection. fields optionally selects text fields. scope follows find_elements, including stored disabled header/footer templates. Matches are occurrences in depth-first anchor order; each carries all involved element references and a normalized snippet with UTF-16 matchStart/matchEnd offsets. offset/nextOffset count matches (limit default 100, max 1000); pages respect response budgets. Use expectedRevision across pages. Supports isolated sessions. Does not select, edit or save.',
  find_elements:
    'Use this first to locate mode keys, martyriae or elements matching properties; prefer it over scanning get_elements. For section boundaries, find all ModeKey elements with properties:["mode"], then read the staff range between adjacent matches with get_elements. Third Mode filter: elementTypes:["ModeKey"], where:{"field":"mode","op":"eq","value":3}. Modes: 1-4 authentic, 5 plagal first, 6 plagal second, 7 grave, 8 plagal fourth. Search catalog fields across a document (default: staff and descendants, then all stored header/footer variants), or one collection with optional descendants. Combine where predicates with and/or; leaves use bare field names ("mode", not "properties.mode") and op:eq (value), in (values), isNull, isNotNull. isNull matches null/undefined; isNotNull includes false/0/empty strings. Inapplicable fields match neither. Equality is exact; eq:null matches only explicit null. No inherited typography or arbitrary layout caches. Calculated scaleNotes/scaleNotesVirtual arrays support only isNull/isNotNull, not pitch matching. At most 100 predicate nodes, depth 8, 100 in values. Returns matches in depth-first order; each zero-based index is within its returned collection and can be used as get_elements start with that collection. offset/nextOffset count matches; use expectedRevision across pages. Defaults to properties:[] and includeContent:false; matching fields are not returned automatically: request them in properties. Does not edit or save.',
  get_element:
    'Read an element by opaque elementRef, optionally with before/after neighbors (0-499 each) in the same collection. The window includes the anchor and counts actual elements, without filtering or crossing collection boundaries. Returns the current collection/indexes; removed or foreign references fail with ELEMENT_NOT_FOUND. Defaults to readable properties excluding image/text-box content; small annotation/drop-cap text is included. omittedContent identifies over-budget annotation/drop-cap fields. Use get_element_content for exact chunks, or includeContent:true for small complete values. Optional expectedRevision rejects stale reads. Does not edit or save.',
  get_element_content:
    'Read exact chunks from a selected text-box/panel/drop-cap content field, annotation text, or image data URL. offset/limit use UTF-16 units (default/max limit:8000); chunks preserve surrogate pairs. Follow nextOffset with returned revision as expectedRevision. No text/HTML/base64 transformation. Does not edit or save.',
  get_staff_lyrics:
    'Read exact staff lyrics manager text and locked state in chunks (default/max limit:8000 UTF-16 units). Follow nextOffset with returned revision as expectedRevision. Chunks preserve surrogate pairs. Does not edit or save.',
  get_selection:
    'Read score selection for documentId. status:active means the selected interactive tab; remembered means a background tab; unavailable means an isolated document. selection:null means no reachable selection. Single targets return kind (element, lyrics, annotation, alternateLine, headerFooter), reference, type and collection/index; alternateLine identifies its container, headerFooter its stored template. Ranges return normalized half-open staff start/end plus directional anchorRef/focusRef, without expanding elements. Use get_element for details/context or get_elements for a range. No text highlights, caret positions, page instances or OS focus. Selection changes do not advance content revisions; expectedRevision checks content only. Snapshot only; later edits use returned references. Does not select, edit or save.',
  get_pages:
    'List settled page summaries (one-based physical pageNumber, separate displayedPageNumber) with pageCount and layoutId. Uses the same full-page font/text/image readiness and bounded reconciliation as export on a detached copy. Supports isolated sessions; never selects, edits or saves the document. offset/limit paginate pages (default 100, max 1000). Pages may end early to fit the JSON budget; follow nextOffset. Re-rendered on each call. Pass returned revision as expectedRevision and layoutId as expectedLayoutId across page queries; content changes yield REVISION_CONFLICT, changed layouts LAYOUT_CONFLICT, rendering failures LAYOUT_SETTLEMENT_FAILED. Empty trailing layout-only pages are excluded like export.',
  get_page_elements:
    'Read compact occurrences on a one-based physical pageNumber, from a settled detached layout. Each has elementRef/type, collection/index, region (staff/header/footer), and zero-based lineIndex for staff and its rendered descendants. Repeated headers/footers share their live template reference but occur on separate pages; disabled templates are excluded. Includes rendered annotation/alternate-line containers and notes. Filter regions, elementTypes or where with the find_elements stored-field predicate grammar. offset/limit count matching occurrences (default 100, max 1000). Pages may end early to fit the JSON budget; follow nextOffset. Use get_element for properties/content. Pass expectedRevision and expectedLayoutId across reads. Same settlement, isolation and error rules as get_pages. Does not edit or save.',
  edit_elements:
    'Apply a validated element/lyric transaction in one undo step. Requires expectedRevision; never saves. Actions run in order on detached drafts before mutation. Insert typed elements, update properties (omitted fields unchanged, null clears nullable fields, lineHeight null resets to normal), reset named properties to constructor defaults, replace/remove by reference, remove half-open ranges, assign lyrics over a range using the shared lyric parser, or set the complete staff lyrics manager state (text and locked). Insert/replace definitions may declare clientId; later actions reference @clientId. Ranges/indexes refer to the draft after earlier actions. get_element_catalog.editProperties describes writable values. RichTextBox content/panels and Annotation.text use styled CKEditor HTML: <p class="neanes-paragraph-style-default-text">Hello</p> (annotations: neanes-paragraph-style-annotation). Style every p; use adjacent p elements for new lines. TextBox is plain text. Word/selection overrides keep paragraph styles and use span CSS; see get_rich_text_format. ModeKey insertion/replacement requires templateId and useOptionalDiatonicFthoras; supplying either on update requires both and reapplies all template-owned fields, clearing absent fields while preserving unrelated settings. Do not combine template application with raw notation/scale edits. The boolean only adds optional diatonic fthoras; false preserves built-in fthoras and templates without optional fthoras ignore it. Use get_mode_key_templates for IDs. Collections follow get_elements; staff inserts default before the Empty sentinel, others append. Headers/footers must finish with exactly one TextBox or RichTextBox. Alternate lines contain only notes. Empty cannot be inserted, replaced, edited or removed. Only main-staff lyric assignments and direct note/drop-cap lyric edits are governed by the staff lyrics lock; alternate lines remain independent; set_staff_lyrics changes that complete state. Returns createdCount and created references still present at completion. Set includeCreated:false for a count-only acknowledgment. A settlement failure can occur after commit and reports details.editsApplied; inspect before retry. assign_lyrics/set_staff_lyrics parse spaces as syllable separators, - as hyphenation, and _ as extension. Direct lyrics updates store literal text and leave omitted melisma/hyphen flags unchanged.',
  get_document_properties:
    'Read title and author. Optional expectedRevision rejects stale reads. Does not edit or save.',
  get_page_setup:
    'Read page geometry, notation defaults, and layout settings. Optional properties selects fields ([] returns only document summary). Dimensions are CSS pixels. pageWidth/pageHeight are derived from pageSize, landscape, and custom dimensions. Header/footer configuration uses get_header_footer_settings; typography uses get_paragraph_styles. Does not edit or save.',
  update_page_setup:
    'Update supplied page/layout settings in one undo step; omitted fields stay unchanged. Dimensions are CSS pixels. pageSize and landscape determine pageWidth/pageHeight; Custom uses pageWidthCustom/pageHeightCustom before orientation. Margins must leave positive content area. Does not rewrite header/footer templates. Requires expectedRevision; never saves. Settlement errors may report details.editsApplied; inspect before retrying.',
  get_header_footer_settings:
    'Read header/footer visibility, template selection flags, margins, horizontal rules, page numbering and richHeaderFooter preference. Optional properties selects fields ([] returns only document summary). Dimensions are CSS pixels. Read template content with get_elements using headers/footers collections. Does not edit or save.',
  update_header_footer_settings:
    'Update supplied header/footer settings in one undo step; omitted fields stay unchanged. Dimensions are CSS pixels. Preserves all template content, including when richHeaderFooter changes (a generation preference); edit_elements replaces/edits templates explicitly. Requires expectedRevision; never saves. Settlement errors may report details.editsApplied; inspect before retrying.',
  create_document:
    'Create an unsaved document using user defaults. With sessionId it belongs only to that isolated session; otherwise selects a new interactive tab.',
  open_document:
    'With sessionId, read saved contents independently of interactive unsaved edits; never reuse an interactive tab. Without sessionId, open and select a .byzx or .byz file. Reuses an existing workspace and preserves unsaved edits. Returns created: true only when a new workspace was added.',
  close_document:
    'With sessionId, close only that session document; selectedDocumentId is null, no replacement document or recovery entry is created. Without sessionId, close a workspace without saving or deleting score files. Requires the last read revision, even when discarding. Unsaved or recovered documents require explicit discardUnsavedChanges: true; otherwise UNSAVED_CHANGES is returned. Removes recovery data. Closing the last workspace creates a blank workspace and keeps the server running. Return includes the closed ID and resulting selected ID. Close only workspaces you introduced unless the user requests otherwise; open_document.created distinguishes new workspaces from reused ones.',
  get_paragraph_styles:
    'Read definitions, or view:ids for styleIds only. Filter ids; missing IDs: STYLE_NOT_FOUND. includeResolved:false omits resolved values. CSS px; lineHeight multiplier.',
  edit_paragraph_styles:
    'Atomically create, replace, update, or delete paragraph styles in one undo step. Update uses id and sparse changes; overrides merge, omitted fields stay unchanged. resetOverrides removes named overrides to restore inheritance; cannot also set them. changes is optional. Word overrides: inline spans (get_rich_text_format). Each create/replace supplies a complete definition; omitted overrides inherit, supported null values explicitly reset. IDs are immutable. Built-in styles cannot be created, deleted, or renamed. Custom null parents normalize to default-text. Action order is irrelevant: parents may be created in the same batch. One action per ID; the final graph must have existing parents and no cycles. Deleting styles reparents untouched children and content references to surviving ancestors or surface defaults. Explicitly referencing a deleted parent is rejected. Returns a document summary and affectedStyleIds (including deleted/reparented definitions); includeStyles:true adds the complete style state. Requires the last read revision. Does not save.',
  replace_document_properties:
    'Replace the complete document properties (title and author) in one undo step. Requires the last read revision. Does not save.',
  save_document:
    'Save a workspace to an explicit path, or its source path. Existing destinations require overwrite, except saving to the unchanged source. Requires the last read revision.',
  preview_page:
    'Return one full-page opaque PNG as an MCP image content block, with metadata in text/structuredContent (no image data in JSON). Unsaved interactive and isolated documents are supported. Requires expectedRevision. Uses the detached image renderer without page discovery; pageCount comes from the rendered snapshot. One-based physical pageNumber. maxEdge defaults to 1600 pixels (256-2048); preserves aspect ratio, at most 4 MiB PNG. No score or output files are written. Captured revision identifies the inspected content; concurrent source edits reject with REVISION_CONFLICT. Does not select, edit or save. Rendering cancellation/failure disposes resources.',
  export_pdf:
    'Export a document to an explicit PDF path without a dialog. Does not save the score. Existing destinations require overwrite. Requires the last read revision.',
};

// The server and inventory budgets use this exact wire definition.
export type { AutomationMode };

export function automationTools(mode: AutomationMode = 'interactive'): Tool[] {
  return Object.keys(automationSchemas)
    .filter((tool) => isToolAvailable(tool, mode))
    .map((tool) => automationTool(tool, mode));
}

export function automationTool(
  tool: AutomationTool,
  mode: AutomationMode = 'interactive',
): Tool {
  const definition: Tool = {
    name: tool,
    description: descriptions[tool],
    inputSchema: {
      // Some clients expose referenced input shapes as unknown. The compact
      // batch publication keeps its complete envelope inline for those clients.
      ...(tool === 'batch_update_files'
        ? z.toJSONSchema(publishedBatchQuerySchema, { io: 'input' })
        : compactJsonSchema(automationSchemas[tool], 'input')),
      type: 'object',
    } as Tool['inputSchema'],
    outputSchema: {
      ...compactJsonSchema(publishedAutomationOutputSchema(tool, mode)),
      type: 'object',
    } as Tool['outputSchema'],
    annotations: {
      readOnlyHint: isReadOnlyAutomationTool(tool),
      destructiveHint:
        !isReadOnlyAutomationTool(tool) &&
        !['create_session', 'create_document', 'open_document'].includes(tool),
      openWorldHint: false,
    },
  };
  if (mode === 'headless') {
    const properties = definition.inputSchema.properties;
    if (properties) {
      delete properties.sessionId;
    }
    const privateDescriptions: Partial<Record<AutomationTool, string>> = {
      get_capabilities:
        'Formats, style units, and private document limits. Worker documents last until disconnect, shutdown, or access revocation; no idle expiry. includeFonts:true adds local fonts; includeErrorCodes:true adds errors.',
      list_documents:
        "List this worker's private documents with IDs and revisions. Does not open files.",
      create_document:
        'Create an unsaved private document using built-in defaults. No editor tab, selection, or recovery entry is created.',
      open_document:
        "Open saved .byzx or .byz contents privately, independently of editor tabs. Reuses this worker's existing copy by canonical identity and preserves its edits. Returns created:true only for a newly added document.",
      close_document:
        'Close a private document without saving or deleting files. Requires the last read revision. Unsaved or recovered documents require discardUnsavedChanges:true. selectedDocumentId is null; no replacement document is created.',
    };
    definition.description =
      privateDescriptions[tool] ??
      definition.description?.replaceAll(
        'Supports isolated sessions',
        'Supports private documents',
      );
  }
  return definition;
}
