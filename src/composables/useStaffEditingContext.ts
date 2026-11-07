import { computed, type Ref } from 'vue';

import type { ScoreElement } from '@/models/Element';
import type { Workspace } from '@/models/Workspace';

export function useStaffEditingContext(
  workspace: Ref<Workspace>,
  flushRichText: (workspace: Workspace) => void,
  flushLyrics: (workspace: Workspace) => void,
) {
  const activeStaff = computed(() => workspace.value.activeStaff);
  const activeElements = computed(() => activeStaff.value.elements);
  const allElements = computed(() =>
    workspace.value.score.staves.flatMap((staff) => staff.elements),
  );
  const isMainStaff = computed(
    () => activeStaff.value === workspace.value.score.staff,
  );
  function staffForElement(element: ScoreElement) {
    return workspace.value.score.getStaffForElement(element);
  }
  function activateContent(element: ScoreElement) {
    const current = workspace.value;
    const staff = staffForElement(element);
    if (staff !== undefined && staff !== current.activeStaff) {
      flushRichText(current);
      flushLyrics(current);
      current.selectionRange = null;
      current.selectedElement = null;
      current.selectedLyrics = null;
      current.selectContentForElement(element);
    }
  }

  return {
    activeStaff,
    activeElements,
    allElements,
    isMainStaff,
    staffForElement,
    activateContent,
  };
}
