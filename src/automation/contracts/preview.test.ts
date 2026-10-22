import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import { automationTools } from '../../../electron/main/automation/tools';
import { PREVIEW_MAX_BYTES, previewImageSchema } from './preview';
import { parseAutomationRequest } from './protocol';
import { automationResultSchemas } from './results';

const args = { documentId: 'test', expectedRevision: 0, pageNumber: 1 };

describe('page preview contract', () => {
  it('requires a revision and physical page with bounded image dimensions', () => {
    expect(
      parseAutomationRequest({ tool: 'preview_page', arguments: args })
        .arguments,
    ).toEqual({ ...args, maxEdge: 1600 });
    for (const invalid of [
      { expectedRevision: undefined },
      { pageNumber: 0 },
      { pageNumber: 1.5 },
      { maxEdge: 255 },
      { maxEdge: 2049 },
      { maxEdge: Infinity },
      { expectedLayoutId: 'invalid' },
      { filePath: '/tmp/preview.png' },
    ]) {
      expect(() =>
        parseAutomationRequest({
          tool: 'preview_page',
          arguments: { ...args, ...invalid },
        }),
      ).toThrow();
    }
    const tool = automationTools().find(
      (tool) => tool.name === 'preview_page',
    )!;
    expect(tool.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
    });
    expect(
      new AjvJsonSchemaValidator().getValidator(tool.inputSchema)(args).valid,
    ).toBe(true);
  });

  it('bounds internal image delivery and keeps base64 out of metadata', () => {
    expect(
      previewImageSchema.safeParse({
        imageData: 'AAAA',
        width: 1600,
        height: 1200,
      }).success,
    ).toBe(true);
    for (const invalid of [
      { width: 2049 },
      { height: 0 },
      { imageData: 'not base64' },
      { imageData: 'A'.repeat(4 * Math.ceil(PREVIEW_MAX_BYTES / 3) + 4) },
    ]) {
      expect(
        previewImageSchema.safeParse({
          imageData: 'AAAA',
          width: 1600,
          height: 1200,
          ...invalid,
        }).success,
      ).toBe(false);
    }
    const result = {
      documentId: 'test',
      revision: 0,
      capturedRevision: 0,
      filePath: null,
      title: '',
      hasUnsavedChanges: true,
      selected: false,
      elementCount: 1,
      layoutId: 'a'.repeat(64),
      pageCount: 2,
      pageNumber: 1,
      mimeType: 'image/png',
      width: 1200,
      height: 1600,
    };
    expect(automationResultSchemas.preview_page.parse(result)).toEqual(result);
    expect(
      automationResultSchemas.preview_page.safeParse({
        ...result,
        imageData: 'AAAA',
      }).success,
    ).toBe(false);
  });
});
