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
