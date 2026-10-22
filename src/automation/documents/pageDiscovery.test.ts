import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import {
  AlternateLineElement,
  AnnotationElement,
  NoteElement,
} from '@/models/Element';
import { Line, Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { cloneScoreForLayout } from '@/services/documents/layoutSnapshot';

import { automationTools } from '../../../electron/main/automation/tools';
import {
  automationSchemas,
  parseAutomationRequest,
} from '../contracts/protocol';
import {
  assertResultBudget,
  MAX_ELEMENT_PAGE_CHARACTERS,
} from '../contracts/responseBudget';
import { automationOutputSchema } from '../contracts/results';
import { ElementDiscovery } from './elementDiscovery';
import {
  discoverPages,
  fingerprintLayout,
  readPageElements,
  readPages,
} from './pageDiscovery';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
function fixture() {
  const source = new Score();
  source.pageSetup.showHeader = true;
  source.pageSetup.showFooter = true;
  source.pageSetup.firstPageNumber = 10;
  const first = new NoteElement();
  first.annotations.push(new AnnotationElement());
  const alternate = new AlternateLineElement();
  alternate.elements.push(new NoteElement());
  first.alternateLines.push(alternate);
  source.staff.elements.unshift(first, new NoteElement());
  const copy = cloneScoreForLayout(source);
  const pages = [new Page(), new Page()];
  pages.forEach((page, index) => {
    page.physicalPageNumber = index + 1;
    const line = new Line();
    line.elements = [copy.score.staff.elements[index]];
    page.lines.push(line);
  });
  const discovery = new ElementDiscovery();
  const build = () =>
    discoverPages(source, copy.score, pages, copy.sources, discovery);
  return { source, copy, discovery, pages, build };
}
const args = (overrides: object = {}) =>
  automationSchemas.get_page_elements.parse({
    documentId: 'id',
    pageNumber: 1,
    ...overrides,
  });

describe('settled page discovery', () => {
  it.each(['pages', 'occurrences'] as const)(
    'paginates large %s by serialized size without skipping or repeating entries',
    (kind) => {
      const source = new Score();
      source.pageSetup.showHeader = false;
      source.pageSetup.showFooter = false;
      source.staff.elements.unshift(
        ...Array.from({ length: 999 }, () => new NoteElement()),
      );
      const copy = cloneScoreForLayout(source);
      const pages = Array.from(
        { length: kind === 'pages' ? 1000 : 1 },
        (_, index) => {
          const page = new Page();
          page.physicalPageNumber = index + 1;
          const line = new Line();
          line.elements =
            kind === 'pages'
              ? [copy.score.staff.elements[index]]
              : copy.score.staff.elements;
          page.lines.push(line);
          return page;
        },
      );
      const discovery = new ElementDiscovery();
      const layout = discoverPages(
        source,
        copy.score,
        pages,
        copy.sources,
        discovery,
      );
      const seen: (string | number)[] = [];
      let offset: number | null = 0;
      let calls = 0;
      while (offset !== null) {
        const result:
          ReturnType<typeof readPages> | ReturnType<typeof readPageElements> =
          kind === 'pages'
            ? readPages(layout, { offset, limit: 1000 })
            : readPageElements(layout, args({ offset, limit: 1000 }));
        expect(JSON.stringify(result).length).toBeLessThan(
          MAX_ELEMENT_PAGE_CHARACTERS,
        );
        expect(() => assertResultBudget(result)).not.toThrow();
        const entries =
          'pages' in result
            ? result.pages.map((page) => page.pageNumber)
            : result.occurrences.map((entry) => entry.elementRef);
        expect(entries.length).toBeGreaterThan(0);
        seen.push(...entries);
        offset = result.nextOffset;
        calls++;
      }
      expect(calls).toBeGreaterThan(1);
      expect(seen).toEqual(
        kind === 'pages'
          ? pages.map((page) => page.physicalPageNumber)
          : source.staff.elements.map((element) =>
              discovery.reference(element),
            ),
      );
    },
  );

  it('maps repeated template occurrences and nested children to live references with physical and displayed numbering', () => {
    const { source, build, discovery } = fixture();
    const layout = build();
    expect(
      layout.pages.map((page) => [page.pageNumber, page.displayedPageNumber]),
    ).toEqual([
      [1, 10],
      [2, 11],
    ]);
    const first = readPageElements(layout, args());
    expect(first.occurrences.map((element) => element.elementType)).toEqual([
      'TextBox',
      'Note',
      'Annotation',
      'AlternateLine',
      'Note',
      'TextBox',
    ]);
    expect(first.occurrences[1]).toMatchObject({
      elementRef: discovery.reference(source.staff.elements[0]),
      region: 'staff',
      lineIndex: 0,
      collection: { kind: 'staff' },
      index: 0,
    });
    expect(first.occurrences[2]).toMatchObject({
      region: 'staff',
      collection: {
        kind: 'children',
        parentRef: first.occurrences[1].elementRef,
        collection: 'annotations',
      },
    });
    expect(first.occurrences[0].elementRef).toBe(
      layout.pages[1].occurrences[0].elementRef,
    );
    expect(readPages(layout, { offset: 0, limit: 1 })).toEqual({
      offset: 0,
      nextOffset: 1,
      pages: [
        {
          pageNumber: 1,
          displayedPageNumber: 10,
          lineCount: 1,
          occurrenceCount: 6,
        },
      ],
    });
  });

  it('resolves enabled variants using displayed parity, and omits disabled templates', () => {
    const { source, copy, build, discovery } = fixture();
    copy.score.pageSetup.headerDifferentOddEven = true;
    let layout = build();
    expect(layout.pages[0].occurrences[0]).toMatchObject({
      elementRef: discovery.reference(source.headers.even.elements[0]),
      collection: { kind: 'headers', variant: 'even' },
    });
    expect(layout.pages[1].occurrences[0].collection).toEqual({
      kind: 'headers',
      variant: 'odd',
    });
    copy.score.pageSetup.headerDifferentFirstPage = true;
    expect(build().pages[0].occurrences[0].collection).toEqual({
      kind: 'headers',
      variant: 'firstPage',
    });
    copy.score.pageSetup.showHeader = false;
    copy.score.pageSetup.showFooter = false;
    layout = build();
    expect(
      layout.pages.every((page) =>
        page.occurrences.every((element) => element.region === 'staff'),
      ),
    ).toBe(true);
  });

  it('filters stored properties and paginates matches with validated boundaries', () => {
    const { build } = fixture();
    const layout = build();
    const query = args({
      elementTypes: ['Note'],
      regions: ['staff'],
      where: { field: 'lyrics', op: 'eq', value: '' },
      limit: 1,
    });
    expect(readPageElements(layout, query).nextOffset).toBe(1);
    expect(
      readPageElements(layout, { ...query, offset: 1 }).occurrences[0]
        .collection.kind,
    ).toBe('children');
    expect(
      readPageElements(layout, { ...query, offset: 2 }).occurrences,
    ).toEqual([]);
    expect(() => readPageElements(layout, { ...query, offset: 3 })).toThrow(
      'INVALID_ELEMENT_RANGE',
    );
    expect(() => readPageElements(layout, { ...query, pageNumber: 3 })).toThrow(
      'INVALID_PAGE_NUMBER',
    );
    expect(readPages(layout, { offset: 2, limit: 1 }).pages).toEqual([]);
    expect(() => readPages(layout, { offset: 3, limit: 1 })).toThrow(
      'INVALID_ELEMENT_RANGE',
    );
    expect(
      readPages({ ...layout, pages: [] }, { offset: 0, limit: 1 }).pages,
    ).toEqual([]);
  });

  it('fingerprints membership, line placement, geometry and displayed numbering without content or clone identity', async () => {
    const { copy, pages, build } = fixture();
    const original = await fingerprintLayout(build());
    expect(await fingerprintLayout(build())).toBe(original);
    copy.score.staff.elements[0].x++;
    const moved = await fingerprintLayout(build());
    expect(moved).not.toBe(original);
    copy.score.pageSetup.firstPageNumber++;
    expect(await fingerprintLayout(build())).not.toBe(moved);
    const before = await fingerprintLayout(build());
    const line = new Line();
    pages[0].lines.push(line);
    expect(await fingerprintLayout(build())).not.toBe(before);
  });

  it('publishes bounded compact contracts and rejects malformed queries', async () => {
    const layout = fixture().build();
    const layoutId = await fingerprintLayout(layout);
    const summary = {
      documentId: 'id',
      revision: 0,
      filePath: null,
      title: '',
      hasUnsavedChanges: false,
      selected: false,
      elementCount: 3,
      layoutId,
      pageCount: 2,
    };
    const tools = automationTools();
    const validator = new AjvJsonSchemaValidator();
    for (const [name, input, data] of [
      [
        'get_pages',
        { documentId: 'id', expectedLayoutId: layoutId },
        readPages(layout, { offset: 0, limit: 100 }),
      ],
      [
        'get_page_elements',
        {
          documentId: 'id',
          pageNumber: 1,
          expectedLayoutId: layoutId,
          where: { field: 'lyrics', op: 'isNotNull' },
        },
        readPageElements(layout, args()),
      ],
    ] as const) {
      const tool = tools.find((tool) => tool.name === name)!;
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(validator.getValidator(tool.inputSchema)(input)).toMatchObject({
        valid: true,
      });
      expect(
        parseAutomationRequest({ tool: name, arguments: input }).tool,
      ).toBe(name);
      const outcome = { success: true, result: { ...summary, ...data } };
      expect(automationOutputSchema(name).parse(outcome)).toEqual(outcome);
      expect(validator.getValidator(tool.outputSchema!)(outcome)).toMatchObject(
        { valid: true },
      );
      expect(JSON.stringify(tool.outputSchema).length).toBeLessThan(4500);
      expect(JSON.stringify(data).length).toBeLessThan(2500);
    }
    for (const overrides of [
      { pageNumber: 0 },
      { pageNumber: 1.5 },
      { regions: [] },
      { limit: 1001 },
      { expectedLayoutId: 'invalid' },
      { where: { field: 'layoutCache', op: 'isNull' } },
    ]) {
      expect(() => args(overrides)).toThrow();
    }
  });
});
