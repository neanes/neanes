// Image edits carry base64 data and can exceed the SDK's default 10 MiB buffer.
// Keep stdio and editor socket envelopes within the same bounded budget.
export const MAX_AUTOMATION_MESSAGE_BYTES = 32 * 1024 * 1024;
