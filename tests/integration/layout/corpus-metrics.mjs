// Compare interactive edit costs on the same frozen scores, one app at a time.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { arch, cpus, release } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseArgs } from 'node:util';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';
import { readCorpus } from './corpus.mjs';

const { values } = parseArgs({
  options: {
    corpus: { type: 'string' },
    output: { type: 'string' },
    previous: { type: 'string' },
    only: { type: 'string', multiple: true },
  },
});
assert.ok(
  values.corpus && values.output,
  'Usage: corpus-metrics.mjs --corpus <manifest.json> --output <metrics.json> [--previous <metrics.json>] [--only <score name>]',
);
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const warmup = 4;
const sampleCount = 20;

function pickTargets(editor, score) {
  if (editor?.selectedWorkspace.value.filePath !== score) {
    return null;
  }
  if (!editor.layoutProfile?.setGorgon || !editor.layoutProfile?.updateLyrics) {
    throw new Error(
      'Build with VITE_LAYOUT_PROFILING_ENABLED=true and corpus metrics hooks',
    );
  }
  if (window.__neanesLayoutVerify) {
    throw new Error('Disable the oracle during timing');
  }
  const elements = editor.elements.value;
  const middle = Math.floor(elements.length / 2);
  const nearMiddle = (predicate) => {
    const index = elements.findIndex(
      (item, i) => i >= middle && predicate(item),
    );
    return index < 0 ? elements.findIndex(predicate) : index;
  };
  const isNote = (item) => item?.elementType === 'Note';
  return {
    elements: elements.length,
    lyricsLocked: editor.selectedWorkspace.value.activeStaff.lyrics.locked,
    targets: {
      gorgon: nearMiddle(
        (item) =>
          isNote(item) &&
          ['Ison', 'Oligon', 'Apostrophos'].includes(item.quantitativeNeume) &&
          (item.gorgonNeume == null || item.gorgonNeume === 'Gorgon_Top'),
      ),
      lyric: nearMiddle(
        (item) =>
          isNote(item) &&
          /\p{L}/u.test(item.lyrics) &&
          !item.isMelisma &&
          !item.isMelismaStart,
      ),
      break: elements.findIndex(
        (item, i) =>
          isNote(item) &&
          !item.lineBreak &&
          !item.pageBreak &&
          isNote(elements[i - 1]) &&
          isNote(elements[i + 1]) &&
          elements[i - 1].line === item.line &&
          elements[i + 1].line === item.line,
      ),
    },
  };
}

function selectTarget(editor, index) {
  const element = editor.elements.value[index];
  editor.selectedElement.value = element;
  document
    .querySelectorAll('.page')
    [element.page - 1]?.scrollIntoView({ block: 'center' });
  return element.id;
}

async function edit(editor, { kind, index, lyric }) {
  const note = editor.elements.value[index];
  const field = { gorgon: 'gorgonNeume', lyric: 'lyrics', break: 'lineBreak' }[
    kind
  ];
  const before = note[field];
  const profile = editor.layoutProfile;
  const layouts = editor.layoutDiagnostics?.results;
  if (layouts) {
    layouts.length = 0;
  }
  const start = performance.now();
  switch (kind) {
    case 'gorgon':
      profile.setGorgon(note, 'Gorgon_Top');
      break;
    case 'lyric':
      profile.updateLyrics(note, lyric);
      break;
    case 'break':
      profile.toggleLineBreak(null);
      break;
  }
  await profile.flushRender();
  const updateMs = performance.now() - start;
  const spans = window.__neanesLayoutProfile.filter(
    (entry) => entry.name === 'processPages' && entry.start >= start,
  );
  if (!spans.length || note[field] === before) {
    throw new Error(
      `${kind} must change the note and run interactive layout; got ${spans.length} layouts`,
    );
  }
  return {
    value: note[field],
    layoutMs: spans.reduce((sum, span) => sum + span.duration, 0),
    updateMs,
    statuses: layouts?.map(({ status }) => status) ?? spans.map(() => null),
    boundaryParagraphs: layouts?.map((layout) => layout.boundaryParagraphs),
    shiftedLines: layouts?.map((layout) => layout.shiftedLines),
  };
}

async function measure(fixture, previous) {
  const app = await createSmokeApp('neanes-layout-metrics-');
  try {
    const score = path.join(app.directory, path.basename(fixture.file));
    await copyFile(fixture.file, score);
    app.start({ appArgs: [process.cwd(), score] });
    await app.ready();
    const { evaluate } = await app.debugger();
    const run = (fn, args) =>
      evaluate(`(${fn})(window._editor, ${JSON.stringify(args)})`, {
        timeoutMs: 30_000,
      });
    const { elements, lyricsLocked, targets } = await eventually(async () => {
      const opened = await run(pickTargets, score);
      assert.ok(opened, 'Score has not opened');
      return opened;
    });
    const workloads = [];
    for (const [kind, picked] of Object.entries(targets)) {
      if (kind === 'lyric' && lyricsLocked) {
        continue;
      }
      const index =
        previous?.workloads.find((workload) => workload.kind === kind)?.index ??
        picked;
      assert.ok(index >= 0, `No ${kind} target for ${fixture.name}`);
      const id = await run(selectTarget, index);
      await eventually(async () => {
        assert.ok(
          await evaluate(
            `Boolean(document.getElementById(${JSON.stringify(`element-${id}`)}))`,
          ),
          'Target page is not mounted',
        );
      });
      // Let the viewport's first-mount measurements run before warmup.
      await delay(350);
      const target = await evaluate(`(() => {
        const editor = window._editor;
        const note = editor.elements.value[${index}];
        return {
          page: note.page,
          original: note.lyrics,
          rtl: editor.score.value.pageSetup.melkiteRtl,
        };
      })()`);
      const suffix = target.rtl
        ? '\u0645'
        : /\p{Script=Greek}/u.test(target.original)
          ? '\u03bc'
          : 'm';
      const alternate = target.original + suffix;
      const samples = [];
      for (let i = 0; i < warmup + sampleCount; i++) {
        const lyric = i % 2 === 0 ? alternate : target.original;
        const sample = await run(edit, { kind, index, lyric });
        if (kind === 'lyric') {
          // Arabic layout can retain a joining tatweel from the previous note.
          const normalize = (text) =>
            target.rtl ? text.replaceAll('\u0640', '') : text;
          assert.equal(
            normalize(sample.value),
            normalize(lyric),
            `Lyric toggle did not round-trip on ${fixture.name}`,
          );
        }
        if (i >= warmup) {
          const {
            layoutMs,
            updateMs,
            statuses,
            boundaryParagraphs,
            shiftedLines,
          } = sample;
          samples.push({
            layoutMs,
            updateMs,
            statuses,
            boundaryParagraphs,
            shiftedLines,
          });
        }
        await evaluate(
          'new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)))',
        );
      }
      workloads.push({ kind, index, page: target.page, samples });
    }
    return {
      name: fixture.name,
      sha256: fixture.sha256,
      elements,
      lyricsLocked,
      pages: await evaluate("document.querySelectorAll('.page').length"),
      workloads,
    };
  } finally {
    await app.close();
  }
}

function stats(samples, field) {
  const values = samples.map((sample) => sample[field]).sort((a, b) => a - b);
  const middle = values.length / 2;
  return {
    median: (values[middle - 1] + values[middle]) / 2,
    p95: values[Math.ceil(values.length * 0.95) - 1],
  };
}

function summarize(score, previous) {
  if (score.lyricsLocked) {
    console.log(
      `| ${score.name} | ${score.pages} | lyric | n/a | n/a | n/a | locked lyrics |`,
    );
  }
  for (const workload of score.workloads) {
    const old = previous?.workloads.find(({ kind }) => kind === workload.kind);
    let flagged = false;
    const display = (field) => {
      const current = stats(workload.samples, field);
      const ref = old && stats(old.samples, field);
      const fmt = ({ median, p95 }) =>
        `${median.toFixed(2)} / ${p95.toFixed(2)}`;
      if (!ref) {
        return fmt(current);
      }
      // Flag changes above both a relative and an absolute noise threshold.
      const floor = field === 'layoutMs' ? 0.5 : 2;
      flagged ||= Object.keys(current).some(
        (stat) =>
          current[stat] - ref[stat] >= Math.max(floor, 0.15 * ref[stat]),
      );
      return `${fmt(ref)} -> ${fmt(current)}`;
    };
    const layout = display('layoutMs');
    const update = display('updateMs');
    const reused = workload.samples.filter(({ statuses }) =>
      statuses.every((status) => status === 'reused'),
    ).length;
    const share = workload.samples.every(({ statuses }) =>
      statuses.every((status) => status === null),
    )
      ? 'n/a'
      : `${Math.round((100 * reused) / workload.samples.length)}%`;
    console.log(
      `| ${score.name} | ${score.pages} | ${workload.kind} | ${layout} | ${update} | ${share} | ${flagged ? 'rerun' : ''} |`,
    );
  }
}

const machine = { arch: arch(), os: release(), cpu: cpus()[0].model };
const previous =
  values.previous && JSON.parse(await readFile(values.previous, 'utf8'));
if (previous) {
  assert.deepEqual(
    previous.machine,
    machine,
    'Use the same machine for timings',
  );
  assert.equal(previous.warmup, warmup);
  assert.equal(previous.sampleCount, sampleCount);
}
const fixtures = await readCorpus(values.corpus);
for (const name of values.only ?? []) {
  assert.ok(
    fixtures.some((fixture) => fixture.name === name),
    `Unknown score: ${name}`,
  );
}
const scores = [];
console.log(
  `Revision \`${revision}\`${previous ? `, compared with \`${previous.revision}\`` : ''}. ${sampleCount} edits after ${warmup} warmups per workload. Median / p95 in ms.\n`,
);
console.log(
  '| Score | Pages | Edit | Layout | Edit through Vue flush | Reused | Check |',
);
console.log('| --- | ---: | --- | ---: | ---: | ---: | --- |');
for (const fixture of fixtures.filter(
  ({ name }) => !values.only || values.only.includes(name),
)) {
  const old = previous?.scores.find(({ name }) => name === fixture.name);
  if (previous) {
    assert.equal(
      old?.sha256,
      fixture.sha256,
      `Previous report used a different input for ${fixture.name}`,
    );
  }
  const score = await measure(fixture, old);
  scores.push(score);
  summarize(score, old);
}
await writeFile(
  values.output,
  JSON.stringify({ revision, machine, warmup, sampleCount, scores }, null, 2) +
    '\n',
  { flag: 'wx' },
);
