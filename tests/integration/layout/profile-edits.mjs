import assert from 'node:assert/strict';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';

const source = path.resolve(process.argv[2]);
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
  for (let attempt = 0; attempt < 14; attempt++) {
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
            (name === 'processPages' || parent === 'processPages'),
        ),
      );
    }
  }
  const phases = samples[0].map(({ name }) => name);
  console.log(document);
  for (const phase of phases) {
    const times = samples
      .map((sample) => sample.find(({ name }) => name === phase).duration)
      .sort((a, b) => a - b);
    const mid = times.length / 2;
    console.log(
      `${phase} ${((times[mid - 1] + times[mid]) / 2).toFixed(1)} ms`,
    );
  }
} finally {
  await app.close();
}
