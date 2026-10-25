import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  cleanupTemporaryImages,
  readImageFile,
  writeTemporaryImage,
} from './imageFiles';

const data =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
afterEach(cleanupTemporaryImages);
describe('automation image files', () => {
  it.each([
    ['bmp', 'image/bmp', 'image/bmp'],
    ['bmp', 'image/x-ms-bmp', 'image/bmp'],
    ['ico', 'image/x-icon', 'image/vnd.microsoft.icon'],
    ['ico', 'image/vnd.microsoft.icon', 'image/vnd.microsoft.icon'],
  ])(
    'preserves %s images embedded as %s',
    async (extension, inputMimeType, mimeType) => {
      // Complete 1x1, 24-bit BMP, and a single-entry ICO containing the PNG above.
      const bytes =
        extension === 'bmp'
          ? Buffer.from(
              '424d3a00000000000000360000002800000001000000010000000100180000000000040000000000000000000000000000000000000000000000',
              'hex',
            )
          : Buffer.concat([
              Buffer.from(
                '00000100010001010000010020004400000016000000',
                'hex',
              ),
              Buffer.from(data.split(',')[1], 'base64'),
            ]);
      const image = await writeTemporaryImage(
        `data:${inputMimeType};base64,${bytes.toString('base64')}`,
      );
      expect(image).toMatchObject({ mimeType, width: 1, height: 1 });
      expect(path.extname(image.outputFilePath)).toBe(`.${extension}`);
      expect(await fs.readFile(image.outputFilePath)).toEqual(bytes);
      expect(await readImageFile(image.outputFilePath)).toBe(
        `data:${mimeType};base64,${bytes.toString('base64')}`,
      );
    },
  );
  it('exports private files, reads image content exactly and removes session files', async () => {
    const image = await writeTemporaryImage(data);
    expect(image).toMatchObject({ mimeType: 'image/png', width: 1, height: 1 });
    expect(path.isAbsolute(image.outputFilePath)).toBe(true);
    expect(await readImageFile(image.outputFilePath)).toBe(data);
    if (process.platform !== 'win32') {
      expect((await fs.stat(image.outputFilePath)).mode & 0o777).toBe(0o600);
      expect(
        (await fs.stat(path.dirname(image.outputFilePath))).mode & 0o777,
      ).toBe(0o700);
    }
    await cleanupTemporaryImages();
    await expect(fs.stat(image.outputFilePath)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
  it('rejects relative, missing, malformed and oversized image files', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-image-test-'));
    try {
      const file = path.join(root, 'input.png');
      await expect(readImageFile('relative.png')).rejects.toThrow(
        'ABSOLUTE_PATH_REQUIRED',
      );
      await expect(readImageFile(file)).rejects.toMatchObject({
        code: 'ENOENT',
      });
      await fs.writeFile(file, 'Not an image');
      await expect(readImageFile(file)).rejects.toThrow(
        'UNSUPPORTED_FILE_TYPE',
      );
      await fs.truncate(file, 64 * 1024 * 1024 + 1);
      await expect(readImageFile(file)).rejects.toThrow('64 MiB');
      await expect(writeTemporaryImage('not an image')).rejects.toThrow(
        'INVALID_ELEMENT_CONTENT',
      );
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
