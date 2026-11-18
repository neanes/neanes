import { describe, expect, it } from 'vitest';

import { OperationQueue } from './OperationQueue';

describe('editor operation queue', () => {
  it('finishes an open dialog and result delivery before export and defers later opens', async () => {
    const queue = new OperationQueue();
    const openStarted = Promise.withResolvers<void>();
    const finishOpen = Promise.withResolvers<void>();
    const dialogAccepted = Promise.withResolvers<void>();
    const finishLoading = Promise.withResolvers<void>();
    const exportStarted = Promise.withResolvers<void>();
    const finishExport = Promise.withResolvers<void>();
    const events: string[] = [];

    const firstOpen = queue.run(async () => {
      events.push('open started');
      openStarted.resolve();
      await finishOpen.promise;
      events.push('dialog accepted');
      dialogAccepted.resolve();
      await finishLoading.promise;
      events.push('open dispatched');
    });
    const pdf = queue.run(async () => {
      events.push('export started');
      exportStarted.resolve();
      await finishExport.promise;
      events.push('export completed');
    });
    const nextOpen = queue.run(async () => {
      events.push('next open dispatched');
    });

    await openStarted.promise;
    expect(events).toEqual(['open started']);
    finishOpen.resolve();
    await dialogAccepted.promise;
    expect(events).toEqual(['open started', 'dialog accepted']);
    finishLoading.resolve();
    await exportStarted.promise;
    expect(events).toEqual([
      'open started',
      'dialog accepted',
      'open dispatched',
      'export started',
    ]);
    finishExport.resolve();
    await Promise.all([firstOpen, pdf, nextOpen]);
    expect(events).toEqual([
      'open started',
      'dialog accepted',
      'open dispatched',
      'export started',
      'export completed',
      'next open dispatched',
    ]);
  });

  it('continues queued opens after an export failure', async () => {
    const queue = new OperationQueue();
    const pdf = queue.run(async () => {
      throw new Error('export failed');
    });
    const nextOpen = queue.run(async () => 'opened');
    await expect(pdf).rejects.toThrow('export failed');
    await expect(nextOpen).resolves.toBe('opened');
  });
});
