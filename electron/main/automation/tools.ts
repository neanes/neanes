import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { compactJsonSchema } from '../../../src/automation/contracts/jsonSchema';
import {
  literalLyricsDescription,
  lyricParserDescription,
} from '../../../src/automation/contracts/lyricSyntax';
import {
  automationSchemas,
  type AutomationTool,
} from '../../../src/automation/contracts/protocol';
import { publishedAutomationOutputSchema } from '../../../src/automation/contracts/results';

const descriptions: Record<AutomationTool, string> = {
  create_session:
    'Create an isolated session. Its ID is a bearer capability; pass sessionId to document tools. Sessions expire after 15 idle minutes and discard unsaved drafts. At most 4 sessions and 16 documents per session. HTTP disconnect does not close a session.',
  close_session:
    'Close an isolated session atomically. Unsaved documents require explicit discardUnsavedChanges. Does not save or delete files.',
  get_capabilities:
    'Describe supported operations, font families, file formats, and style units. includeErrorCodes:true retrieves the stable error vocabulary. Requires the editor to be ready.',
  list_documents:
    'List interactive workspaces, or only documents owned by the supplied sessionId, with IDs and revisions. Does not open files.',
  get_element_catalog:
    'Get a small element-type inventory by default. Supply elementTypes and/or properties to retrieve focused property schemas; view selects read, edit, or both. includeProperties retrieves all schemas; includeNeumes includes the full enum vocabulary. Schemas use local $defs/$ref. tempoBpmDefaults maps each tempo sign to its creation/replacement default BPM; partial updates preserve omitted BPM. Dimensions are CSS pixels, lineHeight is a multiplier, and lineHeight:null explicitly resets to normal while omission inherits.',
  get_elements:
    'Read typed elements in a collection (staff by default). Ranges use zero-based start inclusive/end exclusive; offset is relative to that range. Follow nextOffset with expectedRevision to prevent mixed-revision pages. Child collections use a returned parentRef. References are opaque, scoped to one open document, and survive movement and undo restoration of the same object; removal makes them unavailable and reopen assigns new references. Element properties omit null and undefined values except lineHeight: null, which explicitly resets text-box or drop-cap line height to normal. Omitted lineHeight inherits the paragraph style; other missing properties are unset. False, zero and empty strings remain present. Includes the terminal Empty sentinel. Header/footer collections are stored templates, not resolved page instances. Use properties to select fields ([] returns identities/counts only); inapplicable fields are omitted. includeContent:false omits data, content/contentBottom/contentLeft/contentCenter/contentRight, and annotation text, even if selected. Defaults preserve the full view. Projected omissions may be unrequested; retrieve complete fields before replacement. Use get_element_catalog for detailed property constraints. Does not edit or save.',
  find_elements:
    'Search stored element fields across a document (default: staff and descendants, then stored header/footer variants, including disabled variants), or one collection with optional descendants. Filter elementTypes and combine where predicates with and/or; leaves use field and op:eq (value), in (values), isNull, isNotNull. isNull matches null/undefined; isNotNull includes false/0/empty strings. Inapplicable fields match neither. Equality is exact; eq:null matches only explicit null. No inherited typography or layout caches. At most 100 predicate nodes, depth 8, 100 in values. Returns matches in depth-first order, with collection/index locations. offset/nextOffset count matches; use expectedRevision across pages. Defaults to properties:[] and includeContent:false; filtering is independent of projection. Does not edit or save.',
  get_element:
    'Read an element by opaque elementRef, optionally with before/after neighbors (0-499 each) in the same collection. The window includes the anchor and counts actual elements, without filtering or crossing collection boundaries. Returns the current collection/indexes; removed or foreign references fail with ELEMENT_NOT_FOUND. Defaults to all readable properties excluding large content; select properties or includeContent:true explicitly. Optional expectedRevision rejects stale reads. Does not edit or save.',
  get_selection:
    'Read score selection for documentId. status:active means the selected interactive tab; remembered means a background tab; unavailable means an isolated document. selection:null means no reachable selection. Single targets return kind (element, lyrics, annotation, alternateLine, headerFooter), reference, type and collection/index; alternateLine identifies its container, headerFooter its stored template. Ranges return normalized half-open staff start/end plus directional anchorRef/focusRef, without expanding elements. Use get_element for details/context or get_elements for a range. No text highlights, caret positions, page instances or OS focus. Selection changes do not advance content revisions; expectedRevision checks content only. Snapshot only; later edits use returned references. Does not select, edit or save.',
  edit_elements:
    'Apply a validated element/lyric transaction in one undo step. Requires expectedRevision; never saves. Actions run in order on detached drafts before mutation. Insert typed elements, update properties (omitted fields unchanged, null clears nullable fields, lineHeight null resets to normal), reset named properties to constructor defaults, replace/remove by reference, remove half-open ranges, assign lyrics over a range using the shared lyric parser, or set the complete staff lyrics manager state (text and locked). Insert/replace definitions may declare clientId; later actions reference @clientId. Ranges/indexes refer to the draft after earlier actions. get_element_catalog.editProperties describes writable values. Collections follow get_elements; staff inserts default before the Empty sentinel, others append. Headers/footers must finish with exactly one TextBox or RichTextBox. Alternate lines contain only notes. Empty cannot be inserted, replaced, edited or removed. Only main-staff lyric assignments and direct note/drop-cap lyric edits are governed by the staff lyrics lock; alternate lines remain independent; set_staff_lyrics changes that complete state. Returns created references still present at completion. A settlement failure can occur after commit and reports details.editsApplied; inspect before retry. ' +
    lyricParserDescription +
    ' ' +
    literalLyricsDescription,
  get_document:
    'Read document metadata and a paginated serialized score. Optional sections selects documentProperties, pageSetup, paragraphStyles, headers, footers, staffElements, staffLyrics; [] returns only score version metadata. Omission returns all sections. Selected views are not complete loadable scores. Follow nextOffset with expectedRevision to avoid mixed revisions. Dimensions are CSS pixels. Use get_paragraph_styles for writable style definitions; serialized score styles use the save-format shape.',
  create_document:
    'Create an unsaved document using user defaults. With sessionId it belongs only to that isolated session; otherwise selects a new interactive tab.',
  open_document:
    'With sessionId, read saved contents independently of interactive unsaved edits; never reuse an interactive tab. Without sessionId, open and select a .byzx or .byz file within configured roots. Reuses an existing workspace and preserves unsaved edits. Returns created: true only when a new workspace was added.',
  close_document:
    'With sessionId, close only that session document; selectedDocumentId is null, no replacement document or recovery entry is created. Without sessionId, close a workspace without saving or deleting score files. Requires the last read revision, even when discarding. Unsaved or recovered documents require explicit discardUnsavedChanges: true; otherwise UNSAVED_CHANGES is returned. Removes recovery data. Closing the last workspace creates a blank workspace and keeps the server running. Return includes the closed ID and resulting selected ID. Close only workspaces you introduced unless the user requests otherwise; open_document.created distinguishes new workspaces from reused ones.',
  get_paragraph_styles:
    'Read complete writable style definitions, optionally filtered by ids. includeResolved:false omits read-only resolved values; default includes them. Missing IDs return STYLE_NOT_FOUND. Dimensions are CSS pixels; lineHeight is a multiplier. Built-in labels are read-only metadata.',
  edit_paragraph_styles:
    'Atomically create, replace, or delete paragraph styles in one undo step. Each create/replace supplies a complete definition; omitted overrides inherit, supported null values explicitly reset. IDs are immutable. Built-in styles cannot be created, deleted, or renamed. Custom null parents normalize to default-text. Action order is irrelevant: parents may be created in the same batch. One action per ID; the final graph must have existing parents and no cycles. Deleting styles reparents untouched children and content references to surviving ancestors or surface defaults. Explicitly referencing a deleted parent is rejected. Returns a document summary and affectedStyleIds (including deleted/reparented definitions); includeStyles:true adds the complete style state. Requires the last read revision. Does not save.',
  replace_document_properties:
    'Replace the complete document properties (title and author) in one undo step. Requires the last read revision. Does not save.',
  save_document:
    'Save a workspace to an explicit path, or its source path. Existing destinations require overwrite, except saving to the unchanged source. Requires the last read revision.',
  export_pdf:
    'Export a document to an explicit PDF path without a dialog. Does not save the score. Existing destinations require overwrite. Requires the last read revision.',
};

// The server and inventory budgets use this exact wire definition.
export function automationTools(): Tool[] {
  return (Object.keys(automationSchemas) as AutomationTool[]).map(
    (tool): Tool => ({
      name: tool,
      description: descriptions[tool],
      inputSchema: {
        ...compactJsonSchema(automationSchemas[tool], 'input'),
        type: 'object',
      } as Tool['inputSchema'],
      outputSchema: {
        ...compactJsonSchema(publishedAutomationOutputSchema(tool)),
        type: 'object',
      } as Tool['outputSchema'],
      annotations: {
        readOnlyHint: [
          'get_capabilities',
          'list_documents',
          'get_document',
          'get_element_catalog',
          'get_elements',
          'find_elements',
          'get_element',
          'get_selection',
          'get_paragraph_styles',
        ].includes(tool),
        destructiveHint: ![
          'get_capabilities',
          'list_documents',
          'get_document',
          'get_element_catalog',
          'get_elements',
          'find_elements',
          'get_element',
          'get_selection',
          'get_paragraph_styles',
          'create_session',
          'create_document',
          'open_document',
        ].includes(tool),
        openWorldHint: false,
      },
    }),
  );
}
