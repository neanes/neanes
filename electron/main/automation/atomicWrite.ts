import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';

// For private metadata and installed bridge files, not in-place score saves.
export async function atomicWrite(file: string, data: string | Buffer) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, data, { mode: 0o600, flag: 'wx' });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
