import { ScoreElement } from '@/models/Element';
import type { Page } from '@/models/Page';

// Compares the editor's published layout with a fresh full layout of the same
// input. The expected side comes from `detachLayout`, so every expected
// element is the copy of an actual element. The comparison is generic: it
// walks every own enumerable field, so fields that layout writes in the
// future are covered without updating a list here.

export interface LayoutDifference {
  // Where the difference is, e.g. `pages[2].lines[0].elements[4]` or
  // `element 17.computedMeasureBarLeft`.
  path: string;
  // The id of the element the difference belongs to, if any.
  elementId: number | null;
  // The field that differs, relative to the element or page structure.
  field: string;
  actual: unknown;
  expected: unknown;
}

export interface LayoutVerificationState {
  checks: number;
  failures: number;
  firstDifference: LayoutDifference | null;
  lastDifference: LayoutDifference | null;
}

type ElementMap = ReadonlyMap<ScoreElement, ScoreElement>;

interface Context {
  copies: ElementMap;
  visited: Map<object, object>;
  elementId: number | null;
  elementPath: string | null;
  // Set when a number matched only within ROUNDING_TOLERANCE.
  rounded: boolean;
  report?: (result: LayoutDifference) => void;
}

// Numbers may differ by floating-point rounding: the same geometry computed
// from a different page origin can differ in the last bits (about 1e-13 px).
// Real layout differences are many orders of magnitude larger.
const ROUNDING_TOLERANCE = 1e-6;

function sameNumber(actual: number, expected: number, context: Context) {
  if (actual === expected || Object.is(actual, expected)) {
    return true;
  }
  if (Math.abs(actual - expected) <= ROUNDING_TOLERANCE) {
    context.rounded = true;
    return true;
  }
  return false;
}

function describe(value: unknown): unknown {
  if (value instanceof ScoreElement) {
    return `<${value.elementType} ${value.id ?? 'no id'}>`;
  }
  if (Array.isArray(value)) {
    return `<array length ${value.length}>`;
  }
  if (value !== null && typeof value === 'object') {
    return `<${value.constructor?.name ?? 'object'}>`;
  }
  return value;
}

function difference(
  context: Context,
  path: string,
  actual: unknown,
  expected: unknown,
): LayoutDifference | null {
  const field =
    context.elementPath !== null && path.startsWith(context.elementPath)
      ? path.slice(context.elementPath.length).replace(/^\./, '')
      : path;
  const result = {
    path,
    elementId: context.elementId,
    field,
    actual: describe(actual),
    expected: describe(expected),
  };
  if (context.report) {
    context.report(result);
    return null;
  }
  return result;
}

function compareValues(
  actual: unknown,
  expected: unknown,
  path: string,
  context: Context,
): LayoutDifference | null {
  if (actual instanceof ScoreElement) {
    // Elements are compared by identity here and field by field separately.
    const copy = context.copies.get(actual);
    return expected === (copy ?? actual)
      ? null
      : difference(context, path, actual, expected);
  }
  if (
    actual === null ||
    expected === null ||
    typeof actual !== 'object' ||
    typeof expected !== 'object'
  ) {
    const same =
      typeof actual === 'number' && typeof expected === 'number'
        ? sameNumber(actual, expected, context)
        : Object.is(actual, expected);
    return same ? null : difference(context, path, actual, expected);
  }
  if (actual === expected) {
    return null;
  }
  if (Object.getPrototypeOf(actual) !== Object.getPrototypeOf(expected)) {
    return difference(context, path, actual, expected);
  }
  // Cycles and shared objects: an object pair is compared only once.
  const seen = context.visited.get(actual);
  if (seen !== undefined) {
    return seen === expected
      ? null
      : difference(context, path, actual, expected);
  }
  context.visited.set(actual, expected);

  if (Array.isArray(actual)) {
    const other = expected as unknown[];
    if (actual.length !== other.length) {
      const result = difference(
        context,
        `${path}.length`,
        actual.length,
        other.length,
      );
      if (result !== null) {
        return result;
      }
    }
    for (
      let index = 0;
      index < Math.min(actual.length, other.length);
      index++
    ) {
      const result = compareValues(
        actual[index],
        other[index],
        `${path}[${index}]`,
        context,
      );
      if (result !== null) {
        return result;
      }
    }
    return null;
  }
  if (actual instanceof Map || actual instanceof Set) {
    const left = [...actual.entries()];
    const right = [...(expected as Map<unknown, unknown>).entries()];
    return compareValues(left, right, path, context);
  }
  return compareFields(
    actual as Record<string, unknown>,
    expected as Record<string, unknown>,
    path,
    context,
  );
}

function compareFields(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
  path: string,
  context: Context,
): LayoutDifference | null {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  // Report the changed field rather than the flag derived from it.
  if (keys.delete('updated')) {
    keys.add('updated');
  }
  for (const key of keys) {
    // `updated` records whether any field changed since the previous layout,
    // so rounding noise in either layout can flip it. Fields that differ by
    // more than the tolerance are reported before it is reached.
    if (key === 'updated' && context.rounded) {
      continue;
    }
    const result = compareValues(
      actual[key],
      expected[key],
      path === '' ? key : `${path}.${key}`,
      context,
    );
    if (result !== null) {
      return result;
    }
  }
  return null;
}

// Compare the element fields of each actual element with its copy.
export function compareElementFields(
  actual: ScoreElement,
  expected: ScoreElement,
  copies: ElementMap,
): LayoutDifference | null {
  const elementPath = `element ${actual.id ?? actual.index}`;
  const context: Context = {
    copies,
    visited: new Map([[actual, expected]]),
    elementId: actual.id ?? null,
    elementPath,
    rounded: false,
  };
  if (Object.getPrototypeOf(actual) !== Object.getPrototypeOf(expected)) {
    return difference(context, elementPath, actual, expected);
  }
  return compareFields(
    actual as unknown as Record<string, unknown>,
    expected as unknown as Record<string, unknown>,
    elementPath,
    context,
  );
}

// Compare page and line structure, page fields and footnote bodies. Elements
// inside lines are matched by identity through `copies`.
export function comparePages(
  actual: Page[],
  expected: Page[],
  copies: ElementMap,
): LayoutDifference | null {
  const context: Context = {
    copies,
    visited: new Map(),
    elementId: null,
    elementPath: null,
    rounded: false,
  };
  const result = compareValues(actual, expected, 'pages', context);
  if (result === null || !/\.elements\[\d+\]$/.test(result.path)) {
    return result;
  }
  // Name the element that is out of place.
  const element = valueAt(actual, result.path);
  return element instanceof ScoreElement
    ? { ...result, elementId: element.id ?? null }
    : result;
}

function valueAt(root: unknown, path: string): unknown {
  const parts = path
    .replace(/^pages/, '')
    .split(/\.|\[(\d+)\]/)
    .filter((part) => part !== undefined && part !== '');
  let value = root;
  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }
  return value;
}

// Compare a layout with the full layout of its detached copy. `elements` are
// the actual elements whose fields layout writes (all staves and header and
// footer templates).
export function compareLayouts(
  actualPages: Page[],
  expectedPages: Page[],
  elements: Iterable<ScoreElement>,
  copies: ElementMap,
): LayoutDifference | null {
  const structural = comparePages(actualPages, expectedPages, copies);
  if (structural !== null) {
    return structural;
  }
  for (const element of elements) {
    const copy = copies.get(element);
    if (copy === undefined) {
      return {
        path: `element ${element.id ?? element.index}`,
        elementId: element.id ?? null,
        field: '',
        actual: describe(element),
        expected: 'no detached copy',
      };
    }
    const result = compareElementFields(element, copy, copies);
    if (result !== null) {
      return result;
    }
  }
  return null;
}

// A cross-build snapshot contains plain data and stable element references.
export function reportSnapshotDifferences(
  actual: unknown,
  expected: unknown,
  path: string,
  elementId: number | null,
  report: (difference: LayoutDifference) => void,
) {
  compareValues(actual, expected, path, {
    copies: new Map(),
    visited: new Map(),
    elementId,
    elementPath: elementId === null ? null : path,
    rounded: false,
    report,
  });
}

export function recordLayoutVerification(
  state: LayoutVerificationState,
  result: LayoutDifference | null,
): LayoutVerificationState {
  return {
    checks: state.checks + 1,
    failures: state.failures + (result === null ? 0 : 1),
    firstDifference: state.firstDifference ?? result,
    lastDifference: result ?? state.lastDifference,
  };
}

export function createLayoutVerificationState(): LayoutVerificationState {
  return {
    checks: 0,
    failures: 0,
    firstDifference: null,
    lastDifference: null,
  };
}
