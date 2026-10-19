import { describe, expect, it } from 'vitest';

import { editorBusyError, type EditorBusyState } from './editorBusy';
import { automationError, automationOutcome } from './errors';
import { automationSchemas, type AutomationTool } from './protocol';
import { canRunWhileEditorBusy } from './toolBehavior';

describe('editor busy policy', () => {
  it('exempts only capability and catalog queries, including among read-only tools', () => {
    const allowed = (Object.keys(automationSchemas) as AutomationTool[]).filter(
      canRunWhileEditorBusy,
    );
    expect(allowed.sort()).toEqual([
      'get_capabilities',
      'get_element_catalog',
      'get_mode_key_templates',
    ]);
  });

  it.each<EditorBusyState>([
    { reason: 'loading' },
    { reason: 'workspace_closing', documentIds: ['one', 'two'] },
    { reason: 'dialog_open', dialog: 'preferences' },
    { reason: 'dialog_open', dialog: 'recovery' },
    { reason: 'printing' },
    { reason: 'native_save' },
  ])(
    'preserves actionable busy details across IPC for $reason',
    async (state) => {
      const error = editorBusyError(state);
      const outcome = await automationOutcome(() => {
        throw error;
      });
      expect(JSON.parse(JSON.stringify(outcome))).toEqual({
        success: false,
        error: {
          code: 'EDITOR_BUSY',
          message: error.message,
          details: state,
        },
      });
      expect(automationError(error).message).not.toBe('EDITOR_BUSY');
      expect(error.message).toMatch(/before retrying/);
    },
  );
});
