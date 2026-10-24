import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  initializeAccessPolicy,
  readAccessPolicy,
  requireAgentAccess,
  setAccessEnabled,
} from './access';

describe('internal agent credentials', () => {
  it('generates private credentials once, including concurrent first launches', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-access-'));
    try {
      const file = path.join(directory, 'credentials.json');
      const [first, second] = await Promise.all([
        initializeAccessPolicy(file),
        initializeAccessPolicy(file),
      ]);
      expect(first).toEqual(second);
      expect(first.enabled).toBe(false);
      await expect(requireAgentAccess(file)).rejects.toThrow(
        'AGENT_ACCESS_DISABLED',
      );
      expect(first.token.length).toBeGreaterThanOrEqual(32);
      expect(await initializeAccessPolicy(file)).toEqual(first);
      expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(first);
      if (process.platform !== 'win32') {
        expect((await stat(file)).mode & 0o777).toBe(0o600);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('honors explicit legacy consent while ignoring retired folder and generation fields', async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), 'neanes-access-legacy-'),
    );
    try {
      const file = path.join(directory, 'credentials.json');
      await writeFile(
        file,
        JSON.stringify({
          enabled: false,
          token: 'a'.repeat(32),
          roots: ['/missing/former-root'],
          generation: 'legacy',
        }),
      );
      expect(await readAccessPolicy(file)).toEqual({
        token: 'a'.repeat(32),
        enabled: false,
      });
      await writeFile(
        file,
        JSON.stringify({ token: 'a'.repeat(32), enabled: true, roots: [] }),
      );
      expect((await initializeAccessPolicy(file)).enabled).toBe(true);
      await writeFile(file, JSON.stringify({ token: 'a'.repeat(32) }));
      expect((await initializeAccessPolicy(file)).enabled).toBe(false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('persists consent and invalidates existing hosts across disable/re-enable cycles', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'neanes-consent-'));
    try {
      const file = path.join(directory, 'policy.json');
      const first = await setAccessEnabled(file, true);
      expect(await requireAgentAccess(file, first.token)).toEqual(first);
      expect(await setAccessEnabled(file, true)).toEqual(first);
      const disabled = await setAccessEnabled(file, false);
      expect(disabled.enabled).toBe(false);
      await expect(requireAgentAccess(file, first.token)).rejects.toThrow(
        'AGENT_ACCESS_DISABLED',
      );
      const second = await setAccessEnabled(file, true);
      expect(second.token).not.toBe(first.token);
      await expect(requireAgentAccess(file, first.token)).rejects.toThrow(
        'AGENT_ACCESS_DISABLED',
      );
      expect(await requireAgentAccess(file, second.token)).toEqual(second);
      if (process.platform !== 'win32') {
        expect((await stat(file)).mode & 0o777).toBe(0o600);
      }
      await writeFile(file, '{invalid');
      await expect(requireAgentAccess(file)).rejects.toThrow();
      await expect(setAccessEnabled(file, true)).rejects.toThrow();
      await rm(file);
      await expect(requireAgentAccess(file)).rejects.toThrow();
      await expect(stat(file)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
