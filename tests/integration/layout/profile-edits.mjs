import assert from 'node:assert/strict';
import { copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';

const [scorePath, cpuProfilePath] = process.argv.slice(2);
assert.ok(scorePath, 'Usage: profile-edits.mjs score.byz [output.cpuprofile]');
const source = path.resolve(scorePath);
const app = await createSmokeApp('neanes-layout-profile-');
try {
  const score = path.join(app.directory, path.basename(source));
  await copyFile(source, score);
  app.start({ appArgs: [process.cwd(), score] });
  const { evaluate, send, on } = await app.debugger('renderer');
  const tracePath = process.env.NEANES_PROFILE_TRACE;
  const traceEvents = [];
  const traceComplete = new Promise((resolve) => {
    on('Tracing.dataCollected', ({ value }) => traceEvents.push(...value));
    on('Tracing.tracingComplete', resolve);
  });
  await app.ready();
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const target = await eventually(async () => {
    const result = await evaluate(`(() => {
      const e = window._editor;
      if (e?.selectedWorkspace.value.filePath !== ${JSON.stringify(score)}) {
        return null;
      }
      const elements = e.elements.value;
      const note = elements.slice(Math.floor(elements.length / 2)).find(
        (item) => ['Oligon', 'Ison', 'Apostrophos'].includes(item.quantitativeNeume),
      );
      e.selectedElement.value = note;
      document.querySelectorAll('.page')[note.page - 1]?.scrollIntoView({ block: 'center' });
      return { elements: elements.length, page: note.page, noteId: note.id };
    })()`);
    assert.ok(result, 'Score has not opened');
    return result;
  });
  await eventually(async () => {
    const visible = await evaluate(`(() => {
      const note = document.getElementById('element-${target.noteId}');
      if (!note) return false;
      const viewport = note.closest('.page-background').getBoundingClientRect();
      const bounds = note.getBoundingClientRect();
      if (bounds.top >= viewport.top && bounds.bottom <= viewport.bottom) {
        return true;
      }
      note.scrollIntoView({ block: 'center' });
      return false;
    })()`);
    assert.ok(visible, 'The note to edit is not visible');
  });
  const observeKeyPaint = await evaluate(`(() => {
    if (!PerformanceObserver.supportedEntryTypes.includes('event')) return false;
    const events = [];
    window.__neanesProfileKeyEvents = events;
    new PerformanceObserver((list) => {
      for (const event of list.getEntriesByName('keydown')) {
        events.push({
          start: event.startTime,
          end: event.startTime + event.duration,
          duration: event.duration,
          processingStart: event.processingStart,
          processingEnd: event.processingEnd,
        });
      }
    }).observe({ type: 'event', durationThreshold: 16 });
    return true;
  })()`);
  const samples = [];
  if (cpuProfilePath) {
    await send('Profiler.enable');
    await send('Profiler.setSamplingInterval', { interval: 500 });
  }
  for (let attempt = 0; attempt < 14; attempt++) {
    if (attempt === 4 && cpuProfilePath) {
      await send('Profiler.start');
    }
    if (attempt === 4 && tracePath) {
      await send('Tracing.start', {
        transferMode: 'ReportEvents',
        traceConfig: {
          includedCategories: [
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.frame',
            'blink',
            'cc',
            'gpu',
            'viz',
            'v8',
          ],
        },
      });
    }
    const before = await evaluate(`({
      time: performance.now(),
      gorgon: window._editor.selectedElement.value.gorgonNeume,
    })`);
    for (const type of ['rawKeyDown', 'keyUp']) {
      await send('Input.dispatchKeyEvent', {
        type,
        code: 'KeyG',
        key: 'g',
        windowsVirtualKeyCode: 71,
      });
    }
    const timing = await eventually(async () => {
      const sample = await evaluate(`({
        gorgon: window._editor.selectedElement.value.gorgonNeume,
        entries: window.__neanesLayoutProfile.filter((entry) => entry.start >= ${before.time}),
        keyEvents: window.__neanesProfileKeyEvents ?? [],
      })`);
      assert.notEqual(sample.gorgon, before.gorgon, 'Gorgon did not change');
      const { entries } = sample;
      const editor = entries.find(({ name }) => name === 'editor.layout');
      assert.ok(editor, 'The edit did not run an interactive layout');
      const layout = entries.find(
        ({ name, start }) => name === 'processPages' && start >= editor.start,
      );
      assert.ok(layout, 'The edit did not run processPages');
      const render = entries.find(
        ({ name, start }) =>
          name === 'editor.render' && start >= editor.start + editor.duration,
      );
      assert.ok(render, 'The updated view has not rendered');
      const frame = entries.find(
        ({ name, start }) => name === 'editor.frame' && start === render.start,
      );
      assert.ok(frame, 'The next frame has not completed');
      const keyPaint = sample.keyEvents.find(
        (event) =>
          event.start >= before.time &&
          event.processingStart <= editor.start &&
          event.processingEnd >= editor.start + editor.duration,
      );
      assert.ok(
        keyPaint || !observeKeyPaint,
        'No paint timing for the edited key',
      );
      return { entries, editor, layout, render, frame, keyPaint };
    });
    if (attempt >= 4) {
      samples.push(timing);
    }
  }
  if (tracePath) {
    await send('Tracing.end');
    await traceComplete;
    await writeFile(tracePath, JSON.stringify({ traceEvents }));
  }
  if (cpuProfilePath) {
    const { profile } = await send('Profiler.stop');
    await writeFile(cpuProfilePath, JSON.stringify(profile));
  }
  const layoutPhases = samples[0].entries
    .filter(
      ({ parent }) =>
        parent === 'processPages' ||
        parent === 'processPages.prepareContentLines',
    )
    .map(({ name }) => name);
  const editorPhases = [
    'processPages',
    'editor.publishLayout',
    'editor.liveLayoutRefresh',
    'editor.persistLayoutRecovery',
    'editor.layout',
    'editor.render',
    'editor.frame',
  ];
  console.log(target);
  function median(times) {
    const sorted = times.toSorted((a, b) => a - b);
    const mid = sorted.length / 2;
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  function report(name, times) {
    console.log(`${name} ${median(times).toFixed(1)} ms`);
  }
  for (const phase of [...layoutPhases, ...editorPhases]) {
    const times = samples.map(
      ({ entries }) => entries.find(({ name }) => name === phase)?.duration,
    );
    if (times.every(Number.isFinite)) {
      report(phase, times);
    }
  }
  for (const phase of ['breakParagraph', 'breakLines']) {
    const times = samples.map(({ editor }) =>
      parseFloat(editor.detail?.[phase]),
    );
    if (times.every(Number.isFinite)) {
      report(phase, times);
    }
  }
  const frameEnd = ({ frame }) => frame.start + frame.duration;
  report(
    'layout start to next frame',
    samples.map((sample) => frameEnd(sample) - sample.editor.start),
  );
  report(
    'processPages end to next frame',
    samples.map(
      (sample) =>
        frameEnd(sample) - sample.layout.start - sample.layout.duration,
    ),
  );
  report(
    'Vue patch to next frame',
    samples.map(({ render, frame }) => frame.duration - render.duration),
  );
  const shares = samples.map(
    (sample) =>
      (100 *
        (frameEnd(sample) - sample.layout.start - sample.layout.duration)) /
      (frameEnd(sample) - sample.editor.start),
  );
  console.log(`post-processPages share ${median(shares).toFixed(1)}%`);
  if (observeKeyPaint) {
    report(
      'keydown to next paint (Event Timing)',
      samples.map(({ keyPaint }) => keyPaint.duration),
    );
    report(
      'layout start to next paint (Event Timing)',
      samples.map(({ keyPaint, editor }) => keyPaint.end - editor.start),
    );
    report(
      'processPages end to next paint (Event Timing)',
      samples.map(
        ({ keyPaint, layout }) => keyPaint.end - layout.start - layout.duration,
      ),
    );
    report(
      'Vue patch to next paint (Event Timing)',
      samples.map(
        ({ keyPaint, render }) => keyPaint.end - render.start - render.duration,
      ),
    );
    report(
      'Vue patch to keydown processing end (Event Timing)',
      samples.map(
        ({ keyPaint, render }) =>
          keyPaint.processingEnd - render.start - render.duration,
      ),
    );
    report(
      'keydown processing end to next paint (Event Timing)',
      samples.map(({ keyPaint }) => keyPaint.end - keyPaint.processingEnd),
    );
    report(
      'keydown input delay (Event Timing)',
      samples.map(({ keyPaint }) => keyPaint.processingStart - keyPaint.start),
    );
    const paintShares = samples.map(
      ({ keyPaint, editor, layout }) =>
        (100 * (keyPaint.end - layout.start - layout.duration)) /
        (keyPaint.end - editor.start),
    );
    console.log(
      `post-processPages share (Event Timing) ${median(paintShares).toFixed(1)}%`,
    );
  }
} finally {
  await app.close();
}
