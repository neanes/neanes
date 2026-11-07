import type { Page } from '@/models/Page';

export function assertVisualExportFits(pages: readonly Page[]) {
  if (pages.some((page) => page.footnoteOverflow)) {
    throw new Error('FOOTNOTE_TOO_LARGE');
  }
}
