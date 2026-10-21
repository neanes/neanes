import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';

import { Workspace } from '@/models/Workspace';

import { queueDocumentSave } from './documentPersistence';

describe('document save queue', () => {
  it('orders writes and completion work for raw and reactive views of one workspace', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-save-queue-'));
    try {
      const workspace = reactive(new Workspace()) as Workspace;
      const filePath = path.join(directory, 'score.byzx');
      const cleanupGate = Promise.withResolvers<void>();
      const writeFinished = Promise.withResolvers<void>();
      const events: string[] = [];
      const first = queueDocumentSave(workspace, async () => {
        await writeFile(filePath, 'first');
        events.push('first written');
        writeFinished.resolve();
        await cleanupGate.promise;
        events.push('first cleanup finished');
        return 1;
      });
      const second = queueDocumentSave(toRaw(workspace), async () => {
        events.push('second started');
        await writeFile(filePath, 'second');
        return 2;
      });
      await writeFinished.promise;
      expect(events).toEqual(['first written']);
      expect(await readFile(filePath, 'utf8')).toBe('first');
      cleanupGate.resolve();
      expect(await first).toBe(1);
      expect(await second).toBe(2);
      expect(events).toEqual([
        'first written',
        'first cleanup finished',
        'second started',
      ]);
      expect(await readFile(filePath, 'utf8')).toBe('second');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('allows another workspace to save while one is waiting', async () => {
    const gate = Promise.withResolvers<void>();
    const first = queueDocumentSave(new Workspace(), () => gate.promise);
    try {
      const other = new Workspace();
      expect(await queueDocumentSave(other, async () => other.id)).toBe(
        other.id,
      );
    } finally {
      gate.resolve();
      await first;
    }
  });

  it('allows a subsequent save after a real filesystem failure', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-save-queue-'));
    try {
      const workspace = new Workspace();
      const first = queueDocumentSave(workspace, () =>
        writeFile(directory, 'cannot overwrite a directory'),
      );
      const filePath = path.join(directory, 'score.byzx');
      const second = queueDocumentSave(workspace, () =>
        writeFile(filePath, 'saved after failure'),
      );
      await expect(first).rejects.toThrow();
      await second;
      expect(await readFile(filePath, 'utf8')).toBe('saved after failure');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
