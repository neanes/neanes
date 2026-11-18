import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import { automationTools } from '../../../electron/main/automation/tools';
import { parseAutomationRequest } from './protocol';
import { automationResultSchemas } from './results';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('file discovery publication', () => {
  it('publishes a read-only host tool with paginated results and no document scope', () => {
    const tool = automationTools().find(
      (tool) => tool.name === 'discover_score_files',
    )!;
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(tool.inputSchema.properties).not.toHaveProperty('sessionId');
    const validate = new AjvJsonSchemaValidator();
    for (const args of [
      { folderPath: '/scores' },
      { folderPath: '/scores', recursive: true, offset: 100, limit: 50 },
    ]) {
      expect(validate.getValidator(tool.inputSchema)(args)).toMatchObject({
        valid: true,
      });
      expect(
        parseAutomationRequest({ tool: tool.name, arguments: args }),
      ).toMatchObject({ arguments: args });
    }
    for (const args of [
      { folderPath: '' },
      { folderPath: '/scores', recursive: 'true' },
      { folderPath: '/scores', limit: 101 },
      { folderPath: '/scores', offset: -1 },
    ]) {
      expect(validate.getValidator(tool.inputSchema)(args)).toMatchObject({
        valid: false,
      });
      expect(() =>
        parseAutomationRequest({ tool: tool.name, arguments: args }),
      ).toThrow();
    }
    for (const result of [
      { files: ['/scores/a.byzx'], nextOffset: 1 },
      { files: [], nextOffset: null },
    ]) {
      expect(
        automationResultSchemas.discover_score_files.parse(result),
      ).toEqual(result);
      expect(
        validate.getValidator(tool.outputSchema!)({ success: true, result }),
      ).toMatchObject({ valid: true });
    }
  });
});
