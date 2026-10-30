import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { imageSize } from 'image-size';

const MAX_IMAGE_BYTES = 64 * 1024 * 1024;
const formats: Record<string, { mimeType: string; extension: string }> = {
  png: { mimeType: 'image/png', extension: 'png' },
  jpg: { mimeType: 'image/jpeg', extension: 'jpg' },
  gif: { mimeType: 'image/gif', extension: 'gif' },
  webp: { mimeType: 'image/webp', extension: 'webp' },
  svg: { mimeType: 'image/svg+xml', extension: 'svg' },
  bmp: { mimeType: 'image/bmp', extension: 'bmp' },
  ico: { mimeType: 'image/vnd.microsoft.icon', extension: 'ico' },
};
let directory: Promise<string> | undefined;

function inspect(data: Buffer) {
  try {
    const size = imageSize(data);
    const format = size.type ? formats[size.type] : undefined;
    if (format) {
      return { ...format, width: size.width, height: size.height };
    }
  } catch {
    // Report unsupported and malformed files through the automation contract.
  }
  throw new Error(
    'UNSUPPORTED_FILE_TYPE: Expected a PNG, JPEG, GIF, WebP, SVG, BMP or ICO image',
  );
}

export async function readImageFile(filePath: string) {
  if (!path.isAbsolute(filePath)) {
    throw new Error('ABSOLUTE_PATH_REQUIRED');
  }
  const file = await fs.open(filePath, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_IMAGE_BYTES) {
      throw new Error(
        'INVALID_ELEMENT_EDIT: Image must be a regular file of at most 64 MiB',
      );
    }
    const data = await file.readFile();
    if (data.length > MAX_IMAGE_BYTES) {
      throw new Error('INVALID_ELEMENT_EDIT: Image exceeds 64 MiB');
    }
    const { mimeType } = inspect(data);
    return `data:${mimeType};base64,${data.toString('base64')}`;
  } finally {
    await file.close();
  }
}

export async function writeTemporaryImage(dataUrl: string) {
  const match =
    /^data:image\/(?:png|jpeg|gif|webp|svg\+xml|bmp|x-ms-bmp|x-icon|vnd\.microsoft\.icon);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      dataUrl,
    );
  if (!match) {
    throw new Error('INVALID_ELEMENT_CONTENT: Expected an embedded image');
  }
  const data = Buffer.from(match[1], 'base64');
  const { extension, ...metadata } = inspect(data);
  directory ??= fs.mkdtemp(path.join(os.tmpdir(), 'neanes-images-'));
  const outputFilePath = path.join(
    await directory,
    `${randomUUID()}.${extension}`,
  );
  await fs.writeFile(outputFilePath, data, { mode: 0o600, flag: 'wx' });
  return { outputFilePath, ...metadata };
}

export async function cleanupTemporaryImages() {
  if (directory) {
    await fs.rm(await directory, { recursive: true, force: true });
    directory = undefined;
  }
}
