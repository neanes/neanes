import type { AutomationTool } from './protocol';

const readOnlyTools = new Set<AutomationTool>([
  'get_capabilities',
  'list_documents',
  'get_document_properties',
  'get_page_setup',
  'get_header_footer_settings',
  'get_element_catalog',
  'get_elements',
  'find_elements',
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
