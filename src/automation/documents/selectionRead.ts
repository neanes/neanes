import type { Workspace } from '@/models/Workspace';

import type { SelectionResult } from '../contracts/selectionSchema';
import type { ElementDiscovery } from './elementDiscovery';

// Selection is UI state. It never participates in content revisions or history.
export function readSelection(
  workspace: Workspace,
  discovery: ElementDiscovery,
  selectedDocumentId: string | null,
): SelectionResult {
  if (selectedDocumentId === null) {
    return { status: 'unavailable', selection: null };
  }
  const status = workspace.id === selectedDocumentId ? 'active' : 'remembered';
  if (workspace.selectionRange !== null) {
    // UI endpoints are inclusive and directional. API ranges are half-open.
    const { start: anchor, end: focus } = workspace.selectionRange;
    const start = Math.min(anchor, focus);
    const end = Math.max(anchor, focus) + 1;
    const elements = workspace.score.staff.elements;
    if (
      !Number.isInteger(anchor) ||
      !Number.isInteger(focus) ||
      start < 0 ||
      end > elements.length
    ) {
      return { status, selection: null };
    }
    return {
      status,
      selection: {
        kind: 'range',
        collection: { kind: 'staff' },
        start,
        end,
        anchorRef: discovery.reference(elements[anchor]),
        focusRef: discovery.reference(elements[focus]),
      },
    };
  }
  // Nested selections retain their staff parent in selectedElement.
  const candidates = [
    ['annotation', workspace.selectedAnnotationElement],
    ['alternateLine', workspace.selectedAlternateLineElement],
    ['lyrics', workspace.selectedLyrics],
    ['headerFooter', workspace.selectedHeaderFooterElement],
    ['element', workspace.selectedElement],
  ] as const;
  for (const [kind, element] of candidates) {
    if (element === null) {
      continue;
    }
    const target = discovery.location(workspace.score, element);
    return { status, selection: target === null ? null : { kind, target } };
  }
  return { status, selection: null };
}
