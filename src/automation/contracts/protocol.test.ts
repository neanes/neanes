import { describe, expect, it } from 'vitest';

import { parseAutomationRequest } from './protocol';

const edit = (overrides: unknown) => ({
  tool: 'edit_paragraph_styles',
  arguments: {
    documentId: 'id',
    expectedRevision: 0,
    changes: [
      {
        action: 'replace',
        style: { id: 'lyrics', parentStyleId: 'default-text', overrides },
      },
    ],
  },
});

describe('automation protocol validation', () => {
  it('keeps created references by default and supports compact edit acknowledgments', () => {
    const args = {
      documentId: 'id',
      expectedRevision: 0,
      actions: [{ action: 'insert', elements: [{ elementType: 'Note' }] }],
    };
    for (const includeCreated of [undefined, false, true]) {
      expect(
        parseAutomationRequest({
          tool: 'edit_elements',
          arguments: {
            ...args,
            ...(includeCreated === undefined ? {} : { includeCreated }),
          },
        }).arguments,
      ).toMatchObject({ includeCreated: includeCreated ?? true });
    }
  });

  it('scopes document operations explicitly and rejects malformed session IDs', () => {
    const sessionId = '00000000-0000-4000-8000-000000000001';
    expect(
      parseAutomationRequest({
        tool: 'list_documents',
        arguments: { sessionId },
      }),
    ).toEqual({ tool: 'list_documents', arguments: { sessionId } });
    expect(
      parseAutomationRequest({
        tool: 'close_session',
        arguments: { sessionId },
      }),
    ).toEqual({
      tool: 'close_session',
      arguments: { sessionId, discardUnsavedChanges: false },
    });
    for (const sessionId of ['', 'not-a-session', null]) {
      expect(() =>
        parseAutomationRequest({
          tool: 'list_documents',
          arguments: { sessionId },
        }),
      ).toThrow();
    }
    expect(() =>
      parseAutomationRequest({ tool: 'close_session', arguments: {} }),
    ).toThrow();
  });

  it('validates typed discovery selectors, revisions and bounded pagination', () => {
    const read = (args: object) =>
      parseAutomationRequest({
        tool: 'get_elements',
        arguments: { documentId: 'id', ...args },
      });
    expect(read({}).arguments).toMatchObject({
      collection: { kind: 'staff' },
      start: 0,
      offset: 0,
      limit: 100,
    });
    for (const args of [
      { start: -1 },
      { end: 1.5 },
      { offset: -1 },
      { limit: 1001 },
      { expectedRevision: -1 },
      { collection: { kind: 'headers' } },
      { collection: { kind: 'staff', parentRef: 'unexpected' } },
      {
        collection: {
          kind: 'children',
          parentRef: 'not-a-ref',
          collection: 'annotations',
        },
      },
      { arbitrary: true },
      { properties: ['misspelled'] },
      { includeContent: 'false' },
    ]) {
      expect(() => read(args)).toThrow();
    }
    expect(
      read({
        expectedRevision: 0,
        collection: { kind: 'footers', variant: 'odd' },
      }).arguments,
    ).toMatchObject({
      expectedRevision: 0,
      collection: { kind: 'footers', variant: 'odd' },
    });
  });

  it.each([NaN, Infinity, -Infinity, 0, -1])(
    'rejects invalid font size %s',
    (fontSize) => {
      expect(() => parseAutomationRequest(edit({ fontSize }))).toThrow();
    },
  );

  it.each([
    { color: 'red;} body {display:none' },
    { fontVariantCaps: 'small-caps; color:red' },
    { fontFamily: '   ' },
    { lineHeight: -1 },
    { strokeWidth: -1 },
    { alignment: 'invalid' },
  ])('rejects malformed style values: %j', (overrides) => {
    expect(() => parseAutomationRequest(edit(overrides))).toThrow();
  });

  it('requires a revision for close and defaults to preserving unsaved changes', () => {
    expect(() =>
      parseAutomationRequest({
        tool: 'close_document',
        arguments: { documentId: 'id' },
      }),
    ).toThrow();
    expect(
      parseAutomationRequest({
        tool: 'close_document',
        arguments: { documentId: 'id', expectedRevision: 0 },
      }),
    ).toEqual({
      tool: 'close_document',
      arguments: {
        documentId: 'id',
        expectedRevision: 0,
        discardUnsavedChanges: false,
      },
    });
  });

  it('rejects unknown fields, empty batches, legacy shortcuts, and incomplete properties', () => {
    expect(() =>
      parseAutomationRequest(edit({ fontSize: 16, arbitrary: 1 })),
    ).toThrow();
    expect(() =>
      parseAutomationRequest({
        tool: 'edit_paragraph_styles',
        arguments: { documentId: 'id', expectedRevision: 0, changes: [] },
      }),
    ).toThrow();
    expect(() =>
      parseAutomationRequest({
        tool: 'update_document_settings',
        arguments: {
          documentId: 'id',
          expectedRevision: 0,
          settings: { lyrics: { fontSizePt: 12.5 } },
        },
      }),
    ).toThrow();
    expect(() =>
      parseAutomationRequest({
        tool: 'replace_document_properties',
        arguments: {
          documentId: 'id',
          expectedRevision: 0,
          properties: { title: 'Title' },
        },
      }),
    ).toThrow();
    expect(() =>
      parseAutomationRequest({
        tool: 'save_document',
        arguments: { documentId: 'id' },
      }),
    ).toThrow();
    expect(() =>
      parseAutomationRequest({
        tool: 'get_document',
        arguments: { documentId: 'id', limit: 1001 },
      }),
    ).toThrow();
  });
});
