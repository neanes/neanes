// File-based images keep envelopes small. Allow headroom for large Unicode
// lyrics buffers and bulk edits while bounding stdio and editor HTTP bodies.
export const MAX_AUTOMATION_MESSAGE_BYTES = 8 * 1024 * 1024;
