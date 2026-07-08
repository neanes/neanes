const NEUME_COMBINATION_ORDER_STORAGE_KEY = 'neanes.neumeCombinationOrder.v1';

export type NeumeCombinationOrderPlacement = 'before' | 'after';

export interface ResolveNeumeCombinationOrderOptions {
  builtInIds: string[];
  userIds: string[];
  storedOrder: string[] | null | undefined;
}

export function resolveNeumeCombinationOrderIds({
  builtInIds,
  userIds,
  storedOrder,
}: ResolveNeumeCombinationOrderOptions): string[] {
  const knownIds = [...builtInIds, ...userIds];
  const knownIdSet = new Set(knownIds);
  const orderedIds: string[] = [];
  const seenIds = new Set<string>();
  const savedOrder = storedOrder ?? [];

  for (const id of savedOrder) {
    if (typeof id !== 'string' || !knownIdSet.has(id) || seenIds.has(id)) {
      continue;
    }

    orderedIds.push(id);
    seenIds.add(id);
  }

  for (const id of knownIds) {
    if (seenIds.has(id)) {
      continue;
    }

    orderedIds.push(id);
    seenIds.add(id);
  }

  return orderedIds;
}

export function reorderNeumeCombinationOrderIds(
  orderedIds: string[],
  draggedId: string,
  targetId: string,
  placement: NeumeCombinationOrderPlacement,
): string[] {
  if (draggedId === targetId) {
    return orderedIds;
  }

  const nextOrderedIds = orderedIds.filter((id) => id !== draggedId);
  const targetIndex = nextOrderedIds.indexOf(targetId);

  if (targetIndex < 0) {
    return orderedIds;
  }

  const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
  nextOrderedIds.splice(insertIndex, 0, draggedId);

  return nextOrderedIds;
}

export function loadNeumeCombinationOrderIds(): string[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const savedOrder = localStorage.getItem(NEUME_COMBINATION_ORDER_STORAGE_KEY);

  if (savedOrder == null) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedOrder) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function saveNeumeCombinationOrderIds(orderIds: string[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(
    NEUME_COMBINATION_ORDER_STORAGE_KEY,
    JSON.stringify(orderIds),
  );
}
