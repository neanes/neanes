import { z } from 'zod';

export const automationErrorCodes = [
  'VALIDATION_ERROR',
  'RESPONSE_TOO_LARGE',
  'TOOL_NOT_FOUND',
  'INTERNAL_ERROR',
  'EDITOR_NOT_READY',
  'EDITOR_BUSY',
  'EDITOR_DISCONNECTED',
  'AUTOMATION_TIMEOUT',
  'AUTOMATION_REQUEST_REQUIRED',
  'DOCUMENT_NOT_FOUND',
  'ELEMENT_NOT_FOUND',
  'INVALID_PAGE_NUMBER',
  'INVALID_PAGE_SETUP',
  'LAYOUT_CONFLICT',
  'LAYOUT_SETTLEMENT_FAILED',
  'INVALID_ELEMENT_COLLECTION',
  'INVALID_ELEMENT_CONTENT',
  'INVALID_ELEMENT_RANGE',
  'INVALID_ELEMENT_EDIT',
  'ELEMENT_TYPE_MISMATCH',
  'DUPLICATE_ELEMENT_CLIENT_ID',
  'INVALID_NEUME_COMBINATION',
  'LYRICS_LOCKED',
  'DOCUMENT_LIMIT_REACHED',
  'UNSAVED_CHANGES',
  'RECOVERY_CLEANUP_FAILED',
  'REVISION_CONFLICT',
  'FILE_PATH_REQUIRED',
  'ABSOLUTE_PATH_REQUIRED',
  'UNSUPPORTED_FILE_TYPE',
  'SYMLINK_OUTPUT_NOT_ALLOWED',
  'SOURCE_FILE_CONFLICT',
  'FILE_NOT_FOUND',
  'FILE_EXISTS',
  'PERMISSION_DENIED',
  'IO_ERROR',
  'INVALID_SCORE',
  'INVALID_SCORE_ARCHIVE',
  'FONT_NOT_FOUND',
  'TEXT_BOX_MEASUREMENT_FAILED',
  'EXPORT_RENDER_FAILED',
  'EXPORT_CANCELLED',
  'BUILT_IN_STYLE_IMMUTABLE',
  'BUILT_IN_STYLE_REQUIRED',
  'DUPLICATE_STYLE_ID',
  'INVALID_STYLE_NAME',
  'STYLE_PARENT_NOT_FOUND',
  'STYLE_INHERITANCE_CYCLE',
  'STYLE_CHANGES_REQUIRED',
  'DUPLICATE_STYLE_ACTION',
  'STYLE_ALREADY_EXISTS',
  'STYLE_NOT_FOUND',
  'STYLE_NAME_REQUIRED',
  'STYLE_PARENT_DELETED',
] as const;

export const automationErrorSchema = z.strictObject({
  code: z.enum(automationErrorCodes),
  message: z.string(),
  details: z.record(z.string(), z.json()),
});
export type AutomationErrorData = z.infer<typeof automationErrorSchema>;

export class AutomationError extends Error {
  constructor(public readonly error: AutomationErrorData) {
    super(error.message);
    this.name = 'AutomationError';
  }
}

// Normalize at each process boundary, before Electron can wrap exception text.
export function automationError(error: unknown): AutomationErrorData {
  if (error instanceof AutomationError) {
    return error.error;
  }
  if (error instanceof z.ZodError) {
    const issues: { path: string[]; message: string; count: number }[] = [];
    const groups = new Map<string, (typeof issues)[number]>();
    let omittedIssueCount = 0;
    for (const issue of error.issues) {
      const message =
        issue.code === 'invalid_value'
          ? 'Invalid value. Consult the tool schema or focused element catalog for permitted values.'
          : issue.message.slice(0, 240);
      const parts = issue.path.slice(0, 8);
      const path = parts.map((part) => String(part).slice(0, 64));
      // Group repeated failures in batches while retaining the first location.
      const key = JSON.stringify([
        issue.code,
        parts.map((part) =>
          typeof part === 'number' ? '*' : String(part).slice(0, 64),
        ),
        message,
      ]);
      const group = groups.get(key);
      if (group) {
        group.count++;
      } else if (issues.length < 8) {
        const entry = { path, message, count: 1 };
        if (JSON.stringify([...issues, entry]).length <= 6000) {
          groups.set(key, entry);
          issues.push(entry);
        } else {
          omittedIssueCount++;
        }
      } else {
        omittedIssueCount++;
      }
    }
    return {
      code: 'VALIDATION_ERROR',
      message: 'The tool arguments are invalid.',
      details: {
        issues,
        issueCount: error.issues.length,
        omittedIssueCount,
      },
    };
  }
  const message =
    error instanceof Error ? error.message : 'The operation failed.';
  const system = error as {
    code?: string;
    path?: string;
    syscall?: string;
  } | null;
  if (system?.code != null) {
    const codes: Record<string, AutomationErrorData['code']> = {
      ENOENT: 'FILE_NOT_FOUND',
      EEXIST: 'FILE_EXISTS',
      EACCES: 'PERMISSION_DENIED',
      EPERM: 'PERMISSION_DENIED',
    };
    return {
      code: codes[system.code] ?? 'IO_ERROR',
      message,
      details: {
        systemCode: system.code,
        ...(system.path !== undefined ? { path: system.path } : {}),
        ...(system.syscall !== undefined ? { syscall: system.syscall } : {}),
      },
    };
  }
  // Shared application services use named domain errors, optionally followed by context.
  const code = message.split(':', 1)[0];
  if (automationErrorCodes.includes(code as AutomationErrorData['code'])) {
    return {
      code: code as AutomationErrorData['code'],
      message,
      details:
        error instanceof Error && error.cause instanceof Error
          ? { reason: error.cause.message }
          : {},
    };
  }
  return { code: 'INTERNAL_ERROR', message, details: {} };
}

export type AutomationOutcome<T> =
  { success: true; result: T } | { success: false; error: AutomationErrorData };

export async function automationOutcome<T>(
  operation: () => Promise<T> | T,
): Promise<AutomationOutcome<T>> {
  try {
    return { success: true, result: await operation() };
  } catch (error) {
    return { success: false, error: automationError(error) };
  }
}

export function unwrapAutomationOutcome<T>(outcome: AutomationOutcome<T>): T {
  if (!outcome.success) {
    throw new AutomationError(outcome.error);
  }
  return outcome.result;
}
