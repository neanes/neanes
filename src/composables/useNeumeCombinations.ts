import { computed, ref } from 'vue';

import { NoteElement } from '@/models/Element';
import {
  hydrateNeumeCombinationNote,
  type NeumeCombination,
  type NeumeCombinationNotePayload,
  NeumeCommonCombinations,
  serializeNeumeCombinationNote,
} from '@/models/NeumeCommonCombinations';

import {
  loadNeumeCombinationOrderIds,
  reorderNeumeCombinationOrderIds,
  resolveNeumeCombinationOrderIds,
  saveNeumeCombinationOrderIds,
} from './neumeCombinationOrder';

const USER_NEUME_COMBINATIONS_STORAGE_KEY = 'neanes.userNeumeCombinations.v1';

interface StoredUserNeumeCombination {
  id: string;
  elements: NeumeCombinationNotePayload[];
}

const builtInNeumeCombinations: NeumeCombination[] = [
  NeumeCommonCombinations.ending1,
  NeumeCommonCombinations.ending2,
  NeumeCommonCombinations.ornament1,
  NeumeCommonCombinations.ornament1Alt,
];

function isNoteElement(value: unknown): value is NoteElement {
  return value instanceof NoteElement;
}

function hydrateUserCombination(
  combination: StoredUserNeumeCombination,
): NeumeCombination {
  return {
    id: combination.id,
    source: 'user',
    elements: combination.elements.map(
      (element) => hydrateNeumeCombinationNote(element) as NoteElement,
    ),
  };
}

function loadUserNeumeCombinations(): NeumeCombination[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const savedCombinations = localStorage.getItem(
    USER_NEUME_COMBINATIONS_STORAGE_KEY,
  );

  if (savedCombinations == null) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      savedCombinations,
    ) as StoredUserNeumeCombination[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (combo): combo is StoredUserNeumeCombination =>
          typeof combo?.id === 'string' && Array.isArray(combo.elements),
      )
      .map(hydrateUserCombination);
  } catch {
    return [];
  }
}

function saveUserNeumeCombinations(combinations: NeumeCombination[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const stored: StoredUserNeumeCombination[] = combinations
    .filter((combination) => combination.source === 'user')
    .map((combination) => ({
      id: combination.id,
      elements: combination.elements.map(serializeNeumeCombinationNote),
    }));

  localStorage.setItem(
    USER_NEUME_COMBINATIONS_STORAGE_KEY,
    JSON.stringify(stored),
  );
}

const userNeumeCombinations = ref<NeumeCombination[]>(
  loadUserNeumeCombinations() as NeumeCombination[],
);
const userNeumeCombinationOrder = ref<string[]>(loadNeumeCombinationOrderIds());

export function useNeumeCombinations() {
  const orderedNeumeCombinationIds = computed(() =>
    resolveNeumeCombinationOrderIds({
      builtInIds: builtInNeumeCombinations.map((combination) => combination.id),
      userIds: userNeumeCombinations.value.map((combination) => combination.id),
      storedOrder: userNeumeCombinationOrder.value,
    }),
  );

  const allNeumeCombinations = computed(() => {
    const combinationsById = new Map(
      [...builtInNeumeCombinations, ...userNeumeCombinations.value].map(
        (combination) => [combination.id, combination] as const,
      ),
    );

    return orderedNeumeCombinationIds.value
      .map((id) => combinationsById.get(id))
      .filter(
        (combination): combination is NeumeCombination => combination != null,
      );
  });

  function addUserNeumeCombination(elements: NoteElement[]) {
    const noteElements = elements.filter(isNoteElement);

    if (noteElements.length < 2) {
      return;
    }

    userNeumeCombinations.value = [
      ...userNeumeCombinations.value,
      {
        id: crypto.randomUUID?.() ?? `user-${Date.now()}`,
        source: 'user',
        elements: noteElements.map(
          (note) =>
            hydrateNeumeCombinationNote(
              serializeNeumeCombinationNote(note),
            ) as NoteElement,
        ),
      },
    ];

    saveUserNeumeCombinations(
      userNeumeCombinations.value as NeumeCombination[],
    );
  }

  function reorderNeumeCombination(
    draggedId: string,
    targetId: string,
    placement: 'before' | 'after',
  ) {
    const currentOrder = orderedNeumeCombinationIds.value;
    const nextOrder = reorderNeumeCombinationOrderIds(
      currentOrder,
      draggedId,
      targetId,
      placement,
    );

    if (nextOrder === currentOrder) {
      return;
    }

    userNeumeCombinationOrder.value = nextOrder;
    saveNeumeCombinationOrderIds(userNeumeCombinationOrder.value);
  }

  function deleteUserNeumeCombination(id: string) {
    userNeumeCombinations.value = userNeumeCombinations.value.filter(
      (combination) => combination.id !== id,
    );
    userNeumeCombinationOrder.value = userNeumeCombinationOrder.value.filter(
      (combinationId) => combinationId !== id,
    );

    saveUserNeumeCombinations(
      userNeumeCombinations.value as NeumeCombination[],
    );
    saveNeumeCombinationOrderIds(userNeumeCombinationOrder.value);
  }

  return {
    allNeumeCombinations,
    addUserNeumeCombination,
    builtInNeumeCombinations,
    deleteUserNeumeCombination,
    reorderNeumeCombination,
    userNeumeCombinations,
  };
}
