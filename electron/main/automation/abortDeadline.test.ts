import { setTimeout as delay } from 'node:timers/promises';

import { describe, expect, it } from 'vitest';

import { withAbortDeadline } from './abortDeadline';

const signal = new AbortController().signal;

describe('abortable operation deadline', () => {
  it('preserves successful results and operation errors', async () => {
    await expect(
      withAbortDeadline(() => delay(1, 'result'), signal),
    ).resolves.toBe('result');
    await expect(
      withAbortDeadline(async () => {
        await delay(1);
        throw new Error('FILE_NOT_FOUND');
      }, signal),
    ).rejects.toThrow('FILE_NOT_FOUND');
  });

  it.each(['timeout', 'cancel'] as const)(
    'releases a serial queue on %s while an uninterruptible operation is pending',
    async (reason) => {
      const controller = new AbortController();
      const pendingIo = delay(100, 'io completed');
      // A real delay keeps the operation pending after its caller stops.
      let traversal!: Promise<never>;
      const discovery = withAbortDeadline(
        (operationSignal) => {
          traversal = (async () => {
            await pendingIo;
            operationSignal.throwIfAborted();
            throw new Error('Traversal continued after cancellation');
          })();
          return traversal;
        },
        controller.signal,
        reason === 'timeout' ? 1 : 1000,
      );
      if (reason === 'cancel') {
        await delay(1);
        controller.abort();
      }
      const expected =
        reason === 'timeout' ? 'AUTOMATION_TIMEOUT' : 'EXPORT_CANCELLED';
      const nextCall = discovery
        .catch((error: Error) => error.message)
        .then((message) => `next:${message}`);
      expect(await Promise.race([nextCall, pendingIo])).toBe(
        `next:${expected}`,
      );
      // The abandoned operation must see the same abort when its I/O eventually returns.
      await pendingIo;
      await expect(traversal).rejects.toThrow(expected);
    },
  );

  it('rejects an already cancelled request before starting work', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      withAbortDeadline(() => delay(1, 'result'), controller.signal),
    ).rejects.toThrow('EXPORT_CANCELLED');
  });
});
