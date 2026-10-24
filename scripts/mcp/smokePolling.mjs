import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

// Retry observations and assertions, never an entire scenario or a stale write.
export async function eventually(
  operation,
  { timeoutMs = 16_000, intervalMs = 100, retry = () => true } = {},
) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      return await operation();
    } catch (error) {
      if (!retry(error) || Date.now() >= deadline) {
        throw error;
      }
      await delay(intervalMs);
    }
  }
}

export async function settledDocument(call, args) {
  let previous;
  return eventually(
    async () => {
      const current = await call('get_document_properties', args);
      const stable = current.revision === previous?.revision;
      previous = current;
      assert.ok(stable, `Document ${args.documentId} did not settle.`);
      return current;
    },
    { timeoutMs: 5000, intervalMs: 50 },
  );
}
