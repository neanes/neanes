import { readFile } from 'node:fs/promises';

import { Font } from 'lib-font';

// Load a bundled font file (src/assets/fonts) with lib-font, for tests that
// parse the real font binaries.
export async function loadBundledFont(fileName: string): Promise<Font> {
  const data = await readFile(
    new URL(`../assets/fonts/${fileName}`, import.meta.url),
  );
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  );
  const font = new Font(fileName, { skipStyleSheet: true });

  await font.fromDataBuffer(buffer, fileName);

  return font;
}
