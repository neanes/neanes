import { AutomationError, type AutomationErrorData } from './errors';
import type { AutomationTool } from './protocol';
import { isReadOnlyAutomationTool } from './toolBehavior';

// JSON character budgets bound model-visible text independently of element count.
export const MAX_RESULT_CHARACTERS = 64_000;
export const MAX_ELEMENT_PAGE_CHARACTERS = 24_000;
const MAX_CATALOG_CHARACTERS = 128_000;

export function assertResultBudget(result: unknown, tool: AutomationTool) {
  // A completed write must retain its success acknowledgment and reference maps.
  if (!isReadOnlyAutomationTool(tool)) {
    return;
  }
  const maxCharacters =
    tool === 'get_element_catalog'
      ? MAX_CATALOG_CHARACTERS
      : MAX_RESULT_CHARACTERS;
  if (JSON.stringify(result).length > maxCharacters) {
    const details: AutomationErrorData['details'] = {
      maxCharacters,
    };
    // This guard runs before result validation, so inspect unknown fields first.
    if (typeof result === 'object' && result !== null) {
      const documentId: unknown = Reflect.get(result, 'documentId');
      const revision: unknown = Reflect.get(result, 'revision');
      if (typeof documentId === 'string') {
        details.documentId = documentId;
      }
      if (typeof revision === 'number') {
        details.revision = revision;
      }
    }
    throw new AutomationError({
      code: 'RESPONSE_TOO_LARGE',
      message:
        'The read result exceeds the JSON response budget. Select fewer properties, lower limit or neighbor counts, or exclude content. Use get_element_content for element content or get_staff_lyrics for lyrics manager text chunks.',
      details,
    });
  }
}

export function elementPageEntrySize(
  element: { elementRef: string },
  characters: number,
  count: number,
) {
  const size = JSON.stringify(element).length + 1;
  if (characters + size <= MAX_ELEMENT_PAGE_CHARACTERS) {
    return size;
  }
  if (count > 0) {
    return null;
  }
  throw new AutomationError({
    code: 'RESPONSE_TOO_LARGE',
    message:
      'One element exceeds the page budget. Select fewer properties or exclude content. Use get_element_content for exact content chunks.',
    details: {
      elementRef: element.elementRef,
      maxCharacters: MAX_ELEMENT_PAGE_CHARACTERS,
    },
  });
}
