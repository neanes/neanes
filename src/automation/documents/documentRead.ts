import type { Score } from '@/models/save/v1/Score';

export const documentReadSections = [
  'documentProperties',
  'pageSetup',
  'paragraphStyles',
  'headers',
  'footers',
  'staffElements',
  'staffLyrics',
] as const;

// A selected view is a read projection, not a complete loadable score.
export function readDocumentSections(
  data: Score,
  query: {
    sections?: (typeof documentReadSections)[number][];
    offset: number;
    limit: number;
  },
) {
  const includes = (section: (typeof documentReadSections)[number]) =>
    query.sections === undefined || query.sections.includes(section);
  const elements = includes('staffElements');
  const lyrics = includes('staffLyrics');
  return {
    score: {
      version: data.version,
      appVersion: data.appVersion,
      ...Object.fromEntries(
        documentReadSections
          .filter(
            (section) =>
              section !== 'staffElements' &&
              section !== 'staffLyrics' &&
              includes(section),
          )
          .map((section) => [section, Reflect.get(data, section)]),
      ),
      ...(elements || lyrics
        ? {
            staff: {
              ...(elements
                ? {
                    elements: data.staff.elements.slice(
                      query.offset,
                      query.offset + query.limit,
                    ),
                  }
                : {}),
              ...(lyrics ? { lyrics: data.staff.lyrics } : {}),
            },
          }
        : {}),
    },
    offset: query.offset,
    nextOffset:
      elements && query.offset + query.limit < data.staff.elements.length
        ? query.offset + query.limit
        : null,
  };
}
