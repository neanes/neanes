// Development-only timing for the editor's layout pipeline.
//
// Enable with VITE_LAYOUT_PROFILING_ENABLED=true (for example in .env.local).
// When disabled, every call is a cheap no-op.
//
// Each finished span is
// - recorded as a `performance.measure` entry (visible in the DevTools
//   Performance panel under "Timings"),
// - appended to `window.__neanesLayoutProfile` (capped), so that automation
//   can read the numbers, and
// - logged to the console if it is a root span (no enclosing span).
//
// Hot inner functions that run many times per layout use `accumulate`, which
// adds to a per-name total that is attached to the enclosing root span.

export interface LayoutProfileEntry {
  name: string;
  parent: string | null;
  start: number;
  duration: number;
  detail?: Record<string, number | string>;
}

interface Accumulated {
  duration: number;
  count: number;
}

interface OpenSpan {
  name: string;
  start: number;
}

const MAX_ENTRIES = 2000;

export const layoutProfilingEnabled =
  import.meta.env.VITE_LAYOUT_PROFILING_ENABLED === 'true';

const entries: LayoutProfileEntry[] = [];
const stack: OpenSpan[] = [];
const accumulated = new Map<string, Accumulated>();

if (layoutProfilingEnabled && typeof window !== 'undefined') {
  (
    window as unknown as { __neanesLayoutProfile: LayoutProfileEntry[] }
  ).__neanesLayoutProfile = entries;
}

function record(entry: LayoutProfileEntry) {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  try {
    performance.measure(entry.name, {
      start: entry.start,
      duration: entry.duration,
      detail: entry.detail,
    });
  } catch {
    // performance.measure with options is unavailable in some test runtimes.
  }
}

function logRoot(entry: LayoutProfileEntry) {
  // All synchronous descendants, which finished (and were recorded) before
  // the root ended.
  const children = entries
    .filter(
      (child) =>
        child !== entry &&
        child.parent !== null &&
        child.start >= entry.start &&
        child.start <= entry.start + entry.duration,
    )
    .map((child) => `${child.name}=${child.duration.toFixed(1)}`);
  const detail =
    entry.detail === undefined
      ? []
      : Object.entries(entry.detail).map(([key, value]) => `${key}=${value}`);
  console.debug(
    `[layout] ${entry.name} ${entry.duration.toFixed(1)}ms`,
    [...children, ...detail].join(' '),
  );
}

const noop = () => {};

/**
 * Start a synchronous span. Call the returned function when it ends. Spans
 * started while another synchronous span is open are its children.
 */
export function startSpan(name: string): () => void {
  if (!layoutProfilingEnabled) {
    return noop;
  }

  const span: OpenSpan = { name, start: performance.now() };
  const parent = stack.at(-1)?.name ?? null;
  stack.push(span);
  const accumulatedBefore =
    parent === null
      ? new Map([...accumulated].map(([key, value]) => [key, { ...value }]))
      : null;

  return () => {
    const index = stack.lastIndexOf(span);
    if (index >= 0) {
      stack.splice(index);
    }
    const entry: LayoutProfileEntry = {
      name,
      parent,
      start: span.start,
      duration: performance.now() - span.start,
    };
    if (accumulatedBefore !== null) {
      const detail: Record<string, number | string> = {};
      for (const [key, value] of accumulated) {
        const before = accumulatedBefore.get(key);
        const count = value.count - (before?.count ?? 0);
        if (count > 0) {
          detail[key] =
            `${(value.duration - (before?.duration ?? 0)).toFixed(1)}ms/${count}`;
        }
      }
      if (Object.keys(detail).length > 0) {
        entry.detail = detail;
      }
    }
    record(entry);
    if (parent === null) {
      logRoot(entry);
    }
  };
}

/** Run `fn` inside a synchronous span. */
export function profile<T>(name: string, fn: () => T): T {
  if (!layoutProfilingEnabled) {
    return fn();
  }
  const end = startSpan(name);
  try {
    return fn();
  } finally {
    end();
  }
}

/**
 * Record an asynchronous span that ran from `start` (a `performance.now()`
 * value) until now. It is not nested under synchronous spans.
 */
export function recordAsyncSpan(
  name: string,
  start: number,
  detail?: Record<string, number | string>,
) {
  if (!layoutProfilingEnabled) {
    return;
  }
  const entry: LayoutProfileEntry = {
    name,
    parent: null,
    start,
    duration: performance.now() - start,
    detail,
  };
  record(entry);
  logRoot(entry);
}

/** Add the time since `start` to a per-name total (for hot inner calls). */
export function accumulate(name: string, start: number) {
  if (!layoutProfilingEnabled) {
    return;
  }
  const value = accumulated.get(name) ?? { duration: 0, count: 0 };
  value.duration += performance.now() - start;
  value.count++;
  accumulated.set(name, value);
}

/** `performance.now()` when profiling, otherwise 0 (avoids the call). */
export function now() {
  return layoutProfilingEnabled ? performance.now() : 0;
}
