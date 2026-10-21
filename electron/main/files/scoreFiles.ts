import { promises as fs } from 'node:fs';
import path from 'node:path';

import JSZip from 'jszip';

import type { Score } from '../../../src/models/save/v1/Score';

export async function writeScoreFile(filePath: string, score: Score) {
  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const zip = new JSZip();

    const unzippedFileName = `${path.basename(filePath, '.byz')}.byzx`;

    const data = JSON.stringify(score);

    zip.file(unzippedFileName, data);

    const file = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    await fs.writeFile(filePath, file);
  } else {
    // For uncompressed files, and white space and indentation
    // to make the file easier to read
    const data = JSON.stringify(score, null, 2);
    await fs.writeFile(filePath, data);
  }
}

export async function readScoreFile(filePath: string) {
  let data: string;

  // If using the compressed file format, zip first
  if (path.extname(filePath) === '.byz') {
    const file = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(file);
    data = await zip.file(/\.(byzx)$/)[0].async('text');
  } else if (path.extname(filePath) === '.byzx') {
    data = await fs.readFile(filePath, 'utf8');
  } else {
    throw `Unsupported file type: ${path.extname(filePath)}`;
  }

  return data;
}
