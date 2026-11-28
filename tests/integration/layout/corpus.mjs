import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function readCorpus(manifest) {
  const { version, scores } = JSON.parse(await readFile(manifest, 'utf8'));
  assert.equal(version, 1, 'Unsupported layout corpus manifest');
  assert.ok(scores.length, 'The layout corpus is empty');
  assert.equal(new Set(scores.map(({ name }) => name)).size, scores.length);
  const directory = path.dirname(path.resolve(manifest));
  const fixtures = [];
  for (const score of scores) {
    const file = path.join(directory, score.file);
    assert.equal(
      digest(await readFile(file)),
      score.sha256,
      `Corpus changed: ${file}`,
    );
    fixtures.push({ ...score, file });
  }
  return fixtures;
}
