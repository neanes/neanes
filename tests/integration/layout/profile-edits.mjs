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
  const { evaluate, send } = await app.debugger('renderer');
  await app.ready();
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const document = await eventually(async () => {
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
      return { elements: elements.length, page: note.page };
    })()`);
    assert.ok(result, 'Score has not opened');
    return result;
  });
  const samples = [];
  const paragraphSamples = [];
  if (cpuProfilePath) {
    await send('Profiler.enable');
    await send('Profiler.setSamplingInterval', { interval: 500 });
  }
  for (let attempt = 0; attempt < 14; attempt++) {
    if (attempt === 4 && cpuProfilePath) {
      await send('Profiler.start');
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
    const entries = await eventually(async () => {
      const sample = await evaluate(`({
        gorgon: window._editor.selectedElement.value.gorgonNeume,
        entries: window.__neanesLayoutProfile.filter((entry) => entry.start >= ${before.time}),
      })`);
      assert.notEqual(sample.gorgon, before.gorgon, 'Gorgon did not change');
      assert.ok(sample.entries.some(({ name }) => name === 'processPages'));
      return sample.entries;
    });
    const layout = entries.find(({ name }) => name === 'processPages');
    if (attempt >= 4) {
      samples.push(
        entries.filter(
          ({ start, name, parent }) =>
            start >= layout.start &&
            start <= layout.start + layout.duration &&
            (name === 'processPages' ||
              parent === 'processPages' ||
              parent === 'processPages.prepareContentLines'),
        ),
      );
      const editor = entries.find(({ name }) => name === 'editor.layout');
      paragraphSamples.push(editor?.detail ?? {});
    }
  }
  if (cpuProfilePath) {
    const { profile } = await send('Profiler.stop');
    await writeFile(cpuProfilePath, JSON.stringify(profile));
  }
  const phases = samples[0].map(({ name }) => name);
  console.log(document);
  function median(times) {
    const sorted = times.toSorted((a, b) => a - b);
    const mid = sorted.length / 2;
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  for (const phase of phases) {
    const times = samples.map(
      (sample) => sample.find(({ name }) => name === phase).duration,
    );
    console.log(`${phase} ${median(times).toFixed(1)} ms`);
  }
  for (const phase of ['breakParagraph', 'breakLines']) {
    const times = paragraphSamples.map((sample) => parseFloat(sample[phase]));
    if (times.every(Number.isFinite)) {
      console.log(`${phase} ${median(times).toFixed(1)} ms`);
    }
  }
} finally {
  await app.close();
}
