import { Parser } from 'htmlparser2';

import type { Score } from '@/models/save/v1/Score';

const anchorTag = /<a[\s>/]/i;

// Strips what the URL parser strips: leading and trailing C0 controls and
// spaces, then ASCII tabs and newlines anywhere.
function normalizeHref(href: string) {
  let start = 0;
  let end = href.length;
  while (start < end && href.charCodeAt(start) <= 0x20) {
    start++;
  }
  while (end > start && href.charCodeAt(end - 1) <= 0x20) {
    end--;
  }
  return href.slice(start, end).replace(/[\t\n\r]/g, '');
}

// Returns the IDs a same-document link can point to, in lookup order, or null
// for any other link. As in the HTML spec, the fragment is tried as written
// (after URL parsing) before its percent-decoded form.
function fragmentIds(href: string) {
  const normalized = normalizeHref(href);
  if (!normalized.startsWith('#')) {
    return null;
  }
  // Let the URL parser percent-encode the fragment as Chromium does.
  const fragment = new URL(normalized, 'https://neanes.invalid/').hash.slice(1);
  if (fragment === '') {
    return null;
  }
  try {
    const decoded = decodeURIComponent(fragment);
    return decoded === fragment ? [fragment] : [fragment, decoded];
  } catch {
    return [fragment];
  }
}

export function collectPdfElementLinkTargets(score: Score) {
  const targets = new Set<string>();
  const parser = new Parser({
    onopentag(name, { href }) {
      const ids = name === 'a' && href !== undefined ? fragmentIds(href) : null;
      for (const id of ids ?? []) {
        targets.add(id);
      }
    },
  });
  function visit(value: unknown) {
    // Match on parsed attributes: an href may encode its fragment as entities.
    if (typeof value === 'string' && anchorTag.test(value)) {
      parser.reset();
      parser.end(value);
    } else if (value != null && typeof value === 'object') {
      for (const child of Object.values(value)) {
        visit(child);
      }
    }
  }
  visit(score);
  return targets;
}

// Chromium can emit a web link without its target in the DOM. Mark source
// links and destination positions so main can join them across print batches.
export function preparePdfElementLinks(
  pages: HTMLElement[],
  targets: Iterable<string>,
  baseUrl: string,
) {
  for (const page of pages) {
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const ids = fragmentIds(link.getAttribute('href')!);
      if (ids !== null) {
        // Main picks the first candidate that has a destination in any batch.
        link.href = `${baseUrl}source/${ids.map(encodeURIComponent).join('/')}`;
      }
    }
  }
  for (const id of targets) {
    const target = document.getElementById(id);
    const page = pages.find((candidate) => candidate.contains(target));
    if (target === null || page === undefined) {
      continue;
    }
    // Place the marker on the page, not inside the target: targets can be
    // spans owned by a rich-text editor, which would re-render them.
    const targetBox = target.getBoundingClientRect();
    const pageBox = page.getBoundingClientRect();
    const marker = document.createElement('a');
    marker.href = `${baseUrl}target/${encodeURIComponent(id)}`;
    Object.assign(marker.style, {
      display: 'block',
      position: 'absolute',
      top: `${targetBox.top - pageBox.top}px`,
      left: `${targetBox.left - pageBox.left}px`,
      width: '1px',
      height: '1px',
    });
    page.append(marker);
  }
}
