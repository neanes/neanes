import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  AutomationError,
  automationError,
  automationOutcome,
  unwrapAutomationOutcome,
} from './errors';

describe('structured automation errors', () => {
  it('preserves domain codes and details across serialized IPC boundaries', async () => {
    const error = {
      code: 'REVISION_CONFLICT' as const,
      message: 'Read again.',
      details: { documentId: 'one', expectedRevision: 1, actualRevision: 2 },
    };
    const outcome = await automationOutcome(() => {
      throw new AutomationError(error);
    });
    const transferred = JSON.parse(JSON.stringify(outcome));
    expect(transferred).toEqual({ success: false, error });
    try {
      unwrapAutomationOutcome(transferred);
    } catch (received) {
      expect(automationError(received)).toEqual(error);
    }
  });
  it('returns structured validation issues without requiring clients to parse prose', () => {
    const parsed = z
      .strictObject({ size: z.number().positive() })
      .safeParse({ size: -1 });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(automationError(parsed.error)).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: { issues: [{ path: ['size'] }] },
      });
    }
  });
  it.each([
    ['ENOENT', 'FILE_NOT_FOUND'],
    ['EEXIST', 'FILE_EXISTS'],
    ['EACCES', 'PERMISSION_DENIED'],
    ['EPERM', 'PERMISSION_DENIED'],
    ['ENOSPC', 'IO_ERROR'],
  ])('maps %s to stable %s', (systemCode, code) => {
    const error = Object.assign(new Error('Platform-specific prose'), {
      code: systemCode,
      path: '/score.byzx',
    });
    expect(automationError(error)).toMatchObject({
      code,
      details: { systemCode, path: '/score.byzx' },
    });
  });
  it('keeps named domain failures and normalizes unknown failures', () => {
    expect(automationError(new Error('FONT_NOT_FOUND: Example')).code).toBe(
      'FONT_NOT_FOUND',
    );
    expect(automationError(new SyntaxError('Unrelated failure')).code).toBe(
      'INTERNAL_ERROR',
    );
    expect(
      automationError(
        new Error('INVALID_SCORE', { cause: new SyntaxError('Bad JSON') }),
      ),
    ).toMatchObject({ code: 'INVALID_SCORE', details: { reason: 'Bad JSON' } });
    expect(automationError(new Error('Unexpected failure')).code).toBe(
      'INTERNAL_ERROR',
    );
  });
});
