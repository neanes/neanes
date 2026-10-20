import type { AutomationTool } from './protocol';

export function canRunWhileEditorBusy(tool: AutomationTool) {
  return (
    tool === 'get_capabilities' ||
    tool === 'get_element_catalog' ||
    tool === 'get_mode_key_templates' ||
    tool === 'get_rich_text_format'
  );
}

const readOnlyTools = new Set<AutomationTool>([
  'discover_score_files',
  'get_capabilities',
  'list_documents',
  'get_document_properties',
  'get_page_setup',
  'get_header_footer_settings',
  'get_element_catalog',
  'get_mode_key_templates',
  'get_rich_text_format',
  'get_elements',
  'find_elements',
  'find_text',
  'get_element',
  'get_element_content',
  'get_staff_lyrics',
  'get_selection',
  'get_pages',
  'preview_page',
  'get_page_elements',
  'get_paragraph_styles',
]);

export function isReadOnlyAutomationTool(tool: AutomationTool) {
  return readOnlyTools.has(tool);
}
