// Freeze local inputs for parity and performance runs. Use a new output
// directory whenever intentionally changing the corpus.
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual, parseArgs } from 'node:util';

import JSZip from 'jszip';

import { arabicRtlScore } from './arabicRtl.mjs';
import { digest } from './corpus.mjs';

const { values } = parseArgs({
  options: {
    basil: { type: 'string' },
    book: { type: 'string' },
    output: { type: 'string' },
  },
});
assert.ok(
  values.basil && values.book && values.output,
  'Usage: build-corpus.mjs --basil <byzantine-music> --book <score.byz> --output <new directory>',
);

const root = path.resolve(values.basil);
const canonsDir = 'Supplicatory Canons/Mother of God';
const antiphonsDir = 'Divine Liturgy/Antiphons';

async function scoreFiles(directory, recursive = false) {
  const entries = await readdir(directory, { withFileTypes: true, recursive });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.byzx'))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

function useSourceSerif(key, value) {
  if (typeof value !== 'string') {
    return value;
  }
  if (/fontFamily$/i.test(key) && value && value !== 'Neanes') {
    return 'Source Serif';
  }
  if (value.includes('<') && value.includes('font-family')) {
    return value.replace(
      /font-family\s*:\s*((?:&quot;|&#34;|&#39;|&apos;|[^;"])+)/gi,
      (_, families) =>
        /\bNeanes\b/.test(families)
          ? "font-family:'Source Serif', Neanes"
          : "font-family:'Source Serif'",
    );
  }
  return value;
}

function unlockLyrics(key, value) {
  if (key === 'lyrics' && value?.locked === true) {
    delete value.locked;
  }
  return value;
}

function unlockScore(bytes) {
  let changed = false;
  const score = JSON.parse(bytes, (key, value) => {
    if (key === 'lyrics' && value?.locked === true) {
      changed = true;
    }
    return unlockLyrics(key, value);
  });
  return changed ? Buffer.from(JSON.stringify(score)) : bytes;
}

async function unlockBook(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const files = zip.file(/\.byzx$/);
  assert.equal(files.length, 1, 'Expected one score in the book archive');
  const [file] = files;
  const content = await file.async('nodebuffer');
  const unlocked = unlockScore(content);
  if (unlocked === content) {
    return bytes;
  }
  zip.file(file.name, unlocked, { date: file.date });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const sources = [];
for (const file of await scoreFiles(root, true)) {
  const relative = path.relative(root, file);
  if (path.dirname(relative) === '.') {
    continue; // Top-level template.
  }
  const bytes = await readFile(file);
  sources.push({
    file: relative,
    sha256: digest(bytes),
    score: JSON.parse(bytes, (key, value) =>
      useSourceSerif(key, unlockLyrics(key, value)),
    ),
  });
}

const canons = sources.filter(({ file }) => path.dirname(file) === canonsDir);
const antiphons = sources.filter(
  ({ file }) => path.dirname(file) === antiphonsDir,
);
assert.ok(canons.length && antiphons.length, 'Missing Basil source folders');
const template = canons[0].score;

// Avoid changing notation or layout settings just to include another chant.
function compatible({ score }) {
  return (
    score.version === template.version &&
    isDeepStrictEqual(score.pageSetup, template.pageSetup) &&
    isDeepStrictEqual(score.paragraphStyles, template.paragraphStyles) &&
    isDeepStrictEqual(score.headers, template.headers) &&
    !score.staff.lyrics.locked &&
    !score.footnotes?.length &&
    !score.staves
  );
}
const anthology = sources.filter(compatible);

function combine(group) {
  const elements = [];
  for (const source of group) {
    assert.ok(compatible(source), `Different score settings: ${source.file}`);
    const body = source.score.staff.elements.slice(0, -1);
    assert.equal(
      source.score.staff.elements.at(-1)?.elementType,
      'Empty',
      source.file,
    );
    assert.ok(
      body.length && body.every((item) => item.elementType !== 'Empty'),
      source.file,
    );
    if (elements.length) {
      // Start each chant on a fresh page and keep one end-of-staff sentinel.
      Object.assign(elements.at(-1), {
        pageBreak: true,
        lineBreak: false,
        lineBreakType: null,
      });
    }
    for (const element of body) {
      elements.push({ ...element, id: elements.length + 1 });
    }
  }
  elements.push({ elementType: 'Empty' });

  // Source footers have piece-specific credits. Use the template's page number
  // footer throughout and retain the exact source files in the local manifest.
  return {
    ...template,
    footers: {
      ...template.footers,
      default: template.footers.odd,
      firstPage: template.footers.odd,
    },
    staff: {
      elements,
      lyrics: {
        text: group.map(({ score }) => score.staff.lyrics.text).join('\n\n'),
      },
    },
  };
}

const output = path.resolve(values.output);
await mkdir(output);
const scores = [];

async function freeze(file, bytes, metadata = {}) {
  await writeFile(path.join(output, file), bytes, { flag: 'wx' });
  scores.push({
    name: path.parse(file).name,
    file,
    sha256: digest(bytes),
    ...metadata,
  });
}

for (const file of await scoreFiles(
  path.resolve(import.meta.dirname, '../../../examples'),
)) {
  const name = path.basename(file);
  await freeze(name, unlockScore(await readFile(file)));
}
const fixture = unlockScore(
  await readFile(new URL('./fixtures/verify-layout.byzx', import.meta.url)),
);
await freeze('verify-layout.byzx', fixture);
await freeze(
  'verify-layout-rtl.byzx',
  JSON.stringify(arabicRtlScore(JSON.parse(fixture))),
);
await freeze(
  'long-doc-with-melisma.byz',
  await unlockBook(await readFile(values.book)),
);

// Prefix lengths calibrated against full layout with bundled Source Serif.
const volumes = [
  [100, 70],
  [200, 132],
  [300, 198],
  [500, 277],
];
assert.ok(
  anthology.length >= volumes.at(-1)[1],
  'Too few chants for the intermediate volumes',
);
for (const [name, group] of [
  ['basil-antiphons', antiphons],
  ['basil-mother-of-god', canons],
  ...volumes.map(([pages, count]) => [
    `basil-about-${pages}-pages`,
    anthology.slice(0, count),
  ]),
  ['basil-anthology', anthology],
]) {
  const score = combine(group);
  await freeze(`${name}.byzx`, JSON.stringify(score), {
    elements: score.staff.elements.length,
    sources: group.map(({ file, sha256 }) => ({ file, sha256 })),
  });
  console.log(
    `${name}: ${group.length} chants, ${score.staff.elements.length} elements`,
  );
}
const excluded = sources
  .filter((source) => !compatible(source))
  .map(({ file }) => file);
await writeFile(
  path.join(output, 'manifest.json'),
  JSON.stringify({ version: 1, scores, excluded }, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(`Frozen ${scores.length} scores in ${output}`);
