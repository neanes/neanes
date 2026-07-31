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

export interface BundledFontFace {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

// The name-table identity of a bundled face. This is where the generated
// artifact gets its PostScript names, and where the catalog tests get the
// family and style names to compare against.
export async function loadBundledFontFace(
  fileName: string,
): Promise<BundledFontFace> {
  const font = await loadBundledFont(fileName);

  const names = font.opentype.tables.name;
  const family = names.get(16) ?? names.get(1);
  const style = names.get(17) ?? names.get(2);
  const fullName = names.get(4);
  const postscriptName = names.get(6);

  if (
    family == null ||
    style == null ||
    fullName == null ||
    postscriptName == null
  ) {
    throw new Error(`Missing required name metadata in ${fileName}`);
  }

  return { family, fullName, postscriptName, style };
}
