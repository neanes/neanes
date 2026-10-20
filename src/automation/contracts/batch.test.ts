import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import {
  headerFooterChangesSchema,
  pageSetupChangesSchema,
} from '@/services/documents/pageSetupSchema';

import { automationTools } from '../../../electron/main/automation/tools';
import { batchQuerySchema, batchResultSchema } from './batch';
import { parseAutomationRequest } from './protocol';

const files = [{ filePath: '/scores/a.byzx' }, { filePath: '/scores/b.byz' }];
const edits = {
  paragraphStyles: [
    {
      action: 'update',
      id: 'default-text',
      changes: { overrides: { fontFamily: 'Source Serif' } },
    },
  ],
};
describe('batch file contracts', () => {
  it('accepts shared and per-file plans without exposing document/session ownership', () => {
    const args = {
      files: [
        files[0],
        {
          ...files[1],
          edits: {
            pageSetup: { topMargin: 50 },
            documentProperties: { author: 'Author' },
          },
        },
      ],
      edits,
    };
    const request = parseAutomationRequest({
      tool: 'batch_update_files',
      arguments: args,
    });
    expect(request.arguments).toMatchObject({
      ...args,
      save: 'inPlace',
      startIndex: 0,
      dryRun: false,
      verifySaved: false,
      onError: 'stop',
    });
    const tool = automationTools().find(
      (tool) => tool.name === 'batch_update_files',
    )!;
    const validator = new AjvJsonSchemaValidator();
    expect(validator.getValidator(tool.inputSchema)(args)).toMatchObject({
      valid: true,
    });
    expect(tool.inputSchema.properties).not.toHaveProperty('sessionId');
    for (const invalid of [
      { files: [] },
      { files: Array.from({ length: 101 }, () => files[0]) },
      { files, startIndex: 2 },
      { files, startIndex: -1 },
      { files, save: 'copy' },
      { files: [{ ...files[0], outputFilePath: '/out/a.byzx' }] },
      { files, save: 'none', verifySaved: true },
      { files, sessionId: 'session' },
      { files, edits: { pageSetup: { unsupported: 1 } } },
      {
        files,
        edits: {
          paragraphStyles: [
            { action: 'update', id: 'lyrics', resetOverrides: ['unknown'] },
          ],
        },
      },
    ]) {
      expect(() => batchQuerySchema.parse(invalid)).toThrow();
    }
  });

  it('deduplicates shared/per-file edits and exposes exactly the writable setting names', () => {
    const tool = automationTools().find(
      (tool) => tool.name === 'batch_update_files',
    )!;
    type Schema = {
      $ref?: string;
      $defs?: Record<string, Schema>;
      properties?: Record<string, Schema>;
      items?: Schema;
      propertyNames?: Schema;
      enum?: string[];
    };
    const root = tool.inputSchema as Schema;
    const resolve = (schema: Schema): Schema =>
      schema.$ref
        ? resolve(root.$defs![schema.$ref.slice('#/$defs/'.length)])
        : schema;
    const shared = root.properties!.edits;
    const perFile = resolve(root.properties!.files.items!).properties!.edits;
    expect(shared.$ref).toMatch(/^#\/\$defs\//);
    expect(perFile.$ref).toBe(shared.$ref);
    const editProperties = resolve(shared).properties!;
    for (const [field, schema] of [
      ['pageSetup', pageSetupChangesSchema],
      ['headerFooter', headerFooterChangesSchema],
    ] as const) {
      const keys = resolve(resolve(editProperties[field]).propertyNames!).enum;
      expect(keys).toEqual(Object.keys(schema.shape));
      expect(keys).not.toContain('pageWidth');
      expect(keys).not.toContain('pageHeight');
    }
    const validate = new AjvJsonSchemaValidator().getValidator(
      tool.inputSchema,
    );
    for (const edits of [
      { pageSetup: {} },
      { headerFooter: {} },
      { pageSetup: { topMargin: 50 }, headerFooter: { showHeader: false } },
    ]) {
      expect(validate({ files, edits })).toMatchObject({ valid: true });
      expect(validate({ files: [{ ...files[0], edits }] })).toMatchObject({
        valid: true,
      });
    }
    for (const edits of [
      { pageSetup: { unsupported: 1 } },
      { pageSetup: { pageWidth: 500 } },
      { pageSetup: { showHeader: false } },
      { headerFooter: { topMargin: 50 } },
    ]) {
      expect(validate({ files, edits })).toMatchObject({ valid: false });
      expect(validate({ files: [{ ...files[0], edits }] })).toMatchObject({
        valid: false,
      });
    }
    expect(tool.description!.length).toBeLessThan(350);
    expect(tool.description).toContain('Inspect results and stopReason');
    expect(tool.description).toContain(
      'nextIndex skips attempted files, including failures',
    );
    expect(tool.description).toContain('Retry failures explicitly');
    expect(tool.description).toContain(
      'complete means all files were attempted',
    );
    const inputCharacters = JSON.stringify(tool.inputSchema).length;
    console.info('Batch publication characters', {
      description: tool.description!.length,
      input: inputCharacters,
    });
    expect(inputCharacters).toBeLessThan(8000);
  });

  it('validates copying, temporary exports, dry runs and continuations', () => {
    for (const args of [
      {
        files: [{ ...files[0], outputFilePath: '/out/a.byzx' }],
        save: 'copy',
        verifySaved: true,
      },
      {
        files: [{ ...files[0], pdfFilePath: '/out/a.pdf' }],
        save: 'none',
        edits,
      },
      { files, dryRun: true, edits, startIndex: 1, onError: 'continue' },
    ]) {
      expect(() => batchQuerySchema.parse(args)).not.toThrow();
    }
    const result = {
      results: [
        {
          index: 0,
          filePath: files[0].filePath,
          status: 'failed',
          savedFilePath: '/out/a.byzx',
          error: { code: 'FILE_EXISTS', message: 'PDF destination exists.' },
        },
      ],
      nextIndex: 1,
      stopReason: 'error',
    };
    expect(batchResultSchema.parse(result)).toEqual(result);
    const tool = automationTools().find(
      (tool) => tool.name === 'batch_update_files',
    )!;
    expect(
      new AjvJsonSchemaValidator().getValidator(tool.outputSchema!)({
        success: true,
        result,
      }),
    ).toMatchObject({ valid: true });
  });
});
