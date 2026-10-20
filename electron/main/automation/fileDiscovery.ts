import { promises as fs } from 'node:fs';
import path from 'node:path';

import { AutomationError } from '../../../src/automation/contracts/errors';
import type {
  FileDiscoveryQuery,
  FileDiscoveryResult,
} from '../../../src/automation/contracts/fileDiscovery';

// Bound traversal as well as results; never silently omit unreadable subfolders.
const MAX_ENTRIES = 10000;
const MAX_PATH_CHARACTERS = 16000;

export async function discoverScoreFiles(
  query: FileDiscoveryQuery,
  signal: AbortSignal,
): Promise<FileDiscoveryResult> {
  signal.throwIfAborted();
  if (!path.isAbsolute(query.folderPath)) {
    throw new Error('ABSOLUTE_PATH_REQUIRED');
  }
  const root = await fs.realpath(query.folderPath);
  signal.throwIfAborted();
  const files: string[] = [];
  const folders = [root];
  let entriesSeen = 0;
  let matches = 0;
  let characters = 0;
  // Sorted depth-first traversal, with files before child folders in each folder.
  while (folders.length > 0) {
    signal.throwIfAborted();
    const folder = folders.pop()!;
    const entries = await fs.readdir(folder, { withFileTypes: true });
    signal.throwIfAborted();
    entriesSeen += entries.length;
    if (entriesSeen > MAX_ENTRIES) {
      throw new AutomationError({
        code: 'RESPONSE_TOO_LARGE',
        message:
          'Discovery exceeds 10000 directory entries. Search a narrower folder.',
        details: { maxEntries: MAX_ENTRIES },
      });
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const children: string[] = [];
    for (const entry of entries) {
      const filePath = path.join(folder, entry.name);
      // Dirent predicates intentionally skip symlinks, including directory links.
      if (entry.isDirectory() && query.recursive) {
        children.push(filePath);
      } else if (
        entry.isFile() &&
        ['.byz', '.byzx'].includes(path.extname(entry.name))
      ) {
        if (matches++ < query.offset) {
          continue;
        }
        const size = JSON.stringify(filePath).length + 1;
        if (
          files.length >= query.limit ||
          (files.length > 0 && characters + size > MAX_PATH_CHARACTERS)
        ) {
          return { files, nextOffset: query.offset + files.length };
        }
        files.push(filePath);
        characters += size;
      }
    }
    folders.push(...children.reverse());
  }
  return { files, nextOffset: null };
}
