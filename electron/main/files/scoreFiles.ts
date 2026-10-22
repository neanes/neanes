import { promises as fs } from 'node:fs';
import path from 'node:path';

import JSZip from 'jszip';

import type { Score } from '../../../src/models/save/v1/Score';

export async function encodeScore(filePath: string, score: Score) {
  if (path.extname(filePath) === '.byz') {
    const zip = new JSZip();
    zip.file(`${path.basename(filePath, '.byz')}.byzx`, JSON.stringify(score));
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }
  return Buffer.from(JSON.stringify(score, null, 2));
}

export async function writeScoreFile(filePath: string, score: Score) {
  await fs.writeFile(filePath, await encodeScore(filePath, score));
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

export function scoreFileFormat(filePath: string): 'byz' | 'byzx' {
  const extension = path.extname(filePath);
  if (extension !== '.byz' && extension !== '.byzx') {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }
  return extension === '.byz' ? 'byz' : 'byzx';
}
