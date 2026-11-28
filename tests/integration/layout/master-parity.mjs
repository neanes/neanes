// Compare first full layouts from the same inputs, before on-page measurement.
import assert from 'node:assert/strict';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  copyFile,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';
import { gunzipSync } from 'node:zlib';

import { rolldown } from 'rolldown';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';
import { arabicRtlScore } from './arabicRtl.mjs';
import { readCorpus } from './corpus.mjs';

const { values } = parseArgs({
  options: {
    baseline: { type: 'string' },
    candidate: { type: 'string' },
    approved: { type: 'string' },
    book: { type: 'string' },
    corpus: { type: 'string' },
    'scroll-test': { type: 'string' },
    output: { type: 'string' },
    only: { type: 'string', multiple: true },
  },
});
assert.ok(
  values.baseline &&
    values.approved &&
    (values.corpus || values.book) &&
    values.output,
  'Usage: master-parity.mjs --baseline <master build> --approved <melisma-fixes build> (--corpus <manifest.json> | --book <score.byz>) --output <report.jsonl> [--scroll-test <score.byz>]',
);
const candidate = path.resolve(values.candidate ?? process.cwd());
const baseline = path.resolve(values.baseline);
const approved = path.resolve(values.approved);
const work = await mkdtemp(path.join(tmpdir(), 'neanes-layout-parity-'));

// These are the only approved behavior changes. The reference build isolates
// them so a geometry delta is allowed only if the approved fixes reproduce it.
const allowedChanges = [
  '021584fb (master equivalent 300d8048): end melismas at explicit page breaks',
  '2b6190f5 (master equivalent d40e4d55): end melismas at explicit line breaks',
  '2600a12e, a1d2841c, 3136c725 (master equivalent a0c2d585): end melismas at every paragraph break, keep drop cap continuations, run wrapping RTL tatweels to the line end',
  '002c7156, d7893a58 (master equivalent d28c4147): orphan continuations at every paragraph end, no joining tatweel across explicit breaks',
  '35e0d226 (master equivalent 789eca10): hide the lone tatweel of an orphaned Arabic continuation',
];

async function capture(build, fixture, target) {
  const app = await createSmokeApp('neanes-layout-parity-app-');
  try {
    app.start({
      appArgs: fixture.file ? [build, fixture.file] : [build],
      args: fixture.type ? ['--inspect=0'] : [],
    });
    await app.ready();
    const { evaluate } = await app.debugger();
    if (fixture.type) {
      // Seed the generator before invoking the real editor command.
      await evaluate(`(() => {
        let state = 1;
        Math.random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32);
        window.__neanesParityGenerated = true;
        delete window.__neanesParitySnapshot;
      })()`);
      const main = await app.debugger('main');
      await main.evaluate(`(() => {
        const { BrowserWindow } = process.getBuiltinModule('module')
          .createRequire(${JSON.stringify(path.join(build, 'package.json'))})('electron');
        BrowserWindow.getAllWindows()
          .find((window) => window.webContents.getURL().includes('index.html'))
          .webContents.send('GenerateTestFile', ${JSON.stringify(fixture.type)});
      })()`);
    }
    const count = await eventually(
      async () => {
        const count = await evaluate(
          'window.__neanesParitySnapshot?.records.length ?? 0',
        );
        assert.ok(
          count > 1,
          'No layout captured. Build with parity-build.mjs.',
        );
        return count;
      },
      { timeoutMs: 30_000 },
    );
    async function* chunks() {
      for (let i = 0; i < count; i += 1000) {
        const compressed = await evaluate(
          `(async () => {
            const records = window.__neanesParitySnapshot.records
              .slice(${i}, ${i + 1000}).join('\\n') + '\\n';
            const stream = new Blob([records]).stream()
              .pipeThrough(new CompressionStream('gzip'));
            return (await new Response(stream).bytes()).toBase64();
          })()`,
          { timeoutMs: 60_000 },
        );
        yield gunzipSync(Buffer.from(compressed, 'base64'));
      }
    }
    await pipeline(chunks(), createWriteStream(target));
  } finally {
    await app.close();
  }
}

async function* records(file) {
  const lines = createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    yield JSON.parse(line);
  }
}

const generated = [
  'Gorgon',
  'FthoraTop',
  'FthoraBottom',
  'Accidentals',
  'Measures',
  'Ison',
  'Random',
  'DropCaps',
].map((type) => ({ name: `generated-${type}`, type }));

async function corpus() {
  const exampleDir = path.join(candidate, 'examples');
  const examples = (await readdir(exampleDir))
    .filter((name) => /\.byzx?$/.test(name))
    .sort()
    .map((name) => ({ name, file: path.join(exampleDir, name) }));
  const input = path.join(
    import.meta.dirname,
    'fixtures',
    'verify-layout.byzx',
  );
  const rtl = path.join(work, 'verify-layout-rtl.byzx');
  await writeFile(
    rtl,
    JSON.stringify(arabicRtlScore(JSON.parse(await readFile(input, 'utf8')))),
  );
  const book = path.join(work, 'long-doc-with-melisma.byz');
  await copyFile(values.book, book);
  return [
    ...examples,
    { name: 'verify-layout', file: input },
    { name: 'verify-layout-rtl', file: rtl },
    { name: 'long-doc-with-melisma', file: book },
  ];
}

try {
  // Bundle the existing oracle for Node, including the same numeric tolerance.
  const bundle = await rolldown({
    input: path.join(
      process.cwd(),
      'src/services/rendering/layoutVerification.ts',
    ),
    platform: 'node',
    resolve: { alias: { '@': path.join(process.cwd(), 'src') } },
  });
  const oracle = path.join(work, 'oracle.mjs');
  try {
    await bundle.write({ file: oracle, format: 'es' });
  } finally {
    await bundle.close();
  }
  const { reportSnapshotDifferences } = await import(oracle);

  async function* checkCorpus() {
    yield JSON.stringify({ allowedChanges }) + '\n';
    const frozen = values.corpus
      ? await readCorpus(values.corpus)
      : await corpus();
    const fixtures = [...frozen, ...generated];
    if (values['scroll-test']) {
      fixtures.push({
        name: 'scroll-test',
        file: path.resolve(values['scroll-test']),
      });
    }
    for (const name of values.only ?? []) {
      assert.ok(
        fixtures.some((fixture) => fixture.name === name),
        `Unknown fixture: ${name}`,
      );
    }
    for (const fixture of fixtures.filter(
      ({ name }) => !values.only || values.only.includes(name),
    )) {
      const snapshots = ['baseline', 'approved', 'candidate'].map((name) =>
        path.join(work, `${name}.jsonl`),
      );
      for (const [index, build] of [baseline, approved, candidate].entries()) {
        await capture(build, fixture, snapshots[index]);
      }
      const inputs = snapshots.map((file) => records(file));
      let allowed = 0;
      let unexpected = 0;
      let index = 0;
      let pageCounts;
      while (true) {
        const row = await Promise.all(inputs.map((input) => input.next()));
        if (row.every(({ done }) => done)) {
          break;
        }
        const [master, reference, current] = row.map(({ value }) => value);
        // Display fields added by an approved change are absent from master,
        // where they always had their default.
        if (index > 0 && master?.elementType === 'Note') {
          master.hidesOrphanedTatweel ??= false;
        }
        if (index === 0) {
          pageCounts = {
            master: master.length,
            approved: reference.length,
            candidate: current.length,
          };
        }
        const elementId =
          index === 0
            ? null
            : (current?.id ?? reference?.id ?? master?.id ?? null);
        const location =
          index === 0 ? 'pages' : `element ${elementId ?? index - 1}`;
        const approvedPaths = new Set();
        reportSnapshotDifferences(
          reference,
          master,
          location,
          elementId,
          ({ path }) => approvedPaths.add(path),
        );
        const changes = new Map();
        reportSnapshotDifferences(
          current,
          reference,
          location,
          elementId,
          (difference) =>
            changes.set(difference.path, {
              status: 'unexpected',
              ...difference,
            }),
        );
        reportSnapshotDifferences(
          current,
          master,
          location,
          elementId,
          (difference) => {
            if (!changes.has(difference.path)) {
              changes.set(difference.path, {
                status: approvedPaths.has(difference.path)
                  ? 'approved-melisma-fixes'
                  : 'unexpected',
                ...difference,
              });
            }
          },
        );
        for (const change of changes.values()) {
          if (change.status === 'unexpected') {
            unexpected++;
          } else {
            allowed++;
          }
          yield JSON.stringify({ score: fixture.name, ...change }) + '\n';
        }
        index++;
      }
      yield (
        JSON.stringify({
          score: fixture.name,
          pageCounts,
          elements: index - 1,
          allowed,
          unexpected,
        }) + '\n'
      );
      console.log(
        `${unexpected ? 'FAIL' : 'PASS'} ${fixture.name}: ${pageCounts.candidate} pages, ${index - 1} elements, ${allowed} approved and ${unexpected} unexpected differences`,
      );
      if (unexpected) {
        process.exitCode = 1;
      }
    }
  }

  await pipeline(checkCorpus(), createWriteStream(values.output));
} finally {
  await rm(work, { recursive: true, force: true });
}
