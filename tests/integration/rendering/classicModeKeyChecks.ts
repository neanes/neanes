import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { BrowserWindow } from 'electron';

import { renderSnapshot } from '../../../electron/main/export/renderSnapshot';
import {
  type CommonInitialMartyriaWordingName,
  createInitialMartyriaStyleFromWording,
  getCommonInitialMartyriaWording,
} from '../../../src/models/InitialMartyriaCommonWordings';
import { modeKeyTemplates } from '../../../src/models/ModeKeys';
import {
  EmptyElement,
  ModeKeyElement,
} from '../../../src/models/save/v1/Element';
import type { InitialMartyriaStyle } from '../../../src/models/save/v1/InitialMartyriaStyle';
import type { ScoreRenderSnapshot } from '../../../src/services/rendering/scoreRenderSnapshot';

/* A score style written in a common wording, in its saved form. */
function savedStyleFromWording(
  name: CommonInitialMartyriaWordingName,
  id: string,
): InitialMartyriaStyle {
  return createInitialMartyriaStyleFromWording(
    getCommonInitialMartyriaWording(name),
    id,
    id,
  );
}

export async function checkClassicModeKeys(options: {
  snapshot: ScoreRenderSnapshot;
  root: string;
  output: string;
  owner: BrowserWindow;
}) {
  const snapshot = structuredClone(options.snapshot);
  const styles = [
    savedStyleFromWording('classic', 'Classic'),
    savedStyleFromWording('greekTraditionalSign', 'Traditional Greek'),
  ];
  snapshot.score.initialMartyriaStyles = styles;
  snapshot.score.defaultInitialMartyriaStyleId = styles[0].id;
  snapshot.score.staff.elements = [];
  for (const template of modeKeyTemplates) {
    // JSON removes the catalog's description selector, just as a saved
    // document carries notation rather than functions.
    const { optionalFthoras, ...notation } = JSON.parse(
      JSON.stringify(template),
    );
    for (const style of styles) {
      snapshot.score.staff.elements.push(
        Object.assign(new ModeKeyElement(), notation, optionalFthoras, {
          templateId: template.id,
          initialMartyriaStyleId: style.id,
        }),
      );
    }
  }
  snapshot.score.staff.elements.push(new EmptyElement());
  await renderSnapshot({
    snapshot,
    parent: options.owner,
    preload: path.join(options.root, 'dist-electron/preload/index.js'),
    entry: path.join(options.root, 'dist/export.html'),
    signal: new AbortController().signal,
    async complete(window) {
      // Catch visibly displaced or overlapping marks. Production measures ink
      // at the rendered size; this probe measures at 1000px and scales down.
      // Allow for their different rounding and platform font metrics. Exact
      // centering is covered by InitialMartyriaPitchGeometry unit tests.
      const inkTolerance = 2;
      const marks: {
        key: number;
        horizontalError: number;
        verticalGap: number;
      }[] = await window.webContents.executeJavaScript(`(async () => {
        await document.fonts.ready;
        const context = document.createElement('canvas').getContext('2d');
        const ink = (element) => {
          const style = getComputedStyle(element);
          context.font = [style.fontStyle, style.fontWeight, '1000px', style.fontFamily].join(' ');
          const metrics = context.measureText(element.textContent);
          const rect = element.getBoundingClientRect();
          // Pitch marks have no advance, so scale by size rather than width.
          const scale = parseFloat(style.fontSize) / 1000;
          const baseline = rect.top + metrics.fontBoundingBoxAscent * scale;
          return {
            center: rect.left + ((metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2) * scale,
            top: baseline - metrics.actualBoundingBoxAscent * scale,
            bottom: baseline + metrics.actualBoundingBoxDescent * scale,
          };
        };
        const keys = [...document.querySelectorAll('.mode-key-container')];
        return keys.flatMap((key, index) =>
          [...key.querySelectorAll('.starting-pitch-note')].flatMap((cell) => {
            const note = ink(cell.querySelector(':scope > :not(.pitch-mark)'));
            return [...cell.querySelectorAll('.pitch-mark .neume')].map((mark) => {
              const markInk = ink(mark);
              return {
                key: index,
                horizontalError: Math.abs(markInk.center - note.center),
                verticalGap: note.top - markInk.bottom,
              };
            });
          }),
        );
      })()`);
      // Keys alternate Classic, Traditional Greek for each template.
      const styleOf = (key: number) =>
        key % 2 === 0 ? 'Classic' : 'Traditional Greek';
      assert(marks.length > 0, 'Expected pitch marks to check');
      for (const style of ['Classic', 'Traditional Greek']) {
        assert(
          marks.some((mark) => styleOf(mark.key) === style),
          `Expected ${style} pitch marks to check`,
        );
      }
      for (const mark of marks) {
        const template = modeKeyTemplates[Math.floor(mark.key / 2)];
        const style = styleOf(mark.key);
        assert(
          mark.horizontalError <= inkTolerance,
          `${style} pitch mark is off center by ${mark.horizontalError}px in template ${template.id}`,
        );
        assert(
          mark.verticalGap >= -inkTolerance,
          `${style} pitch mark overlaps its note by ${-mark.verticalGap}px in template ${template.id}`,
        );
      }
      const keys: {
        textRuns: number;
        glyphs: string;
        fonts: string[];
        finite: boolean;
      }[] = await window.webContents.executeJavaScript(`
          [...document.querySelectorAll('.mode-key-container')].map(key => {
            const signature = key.querySelector('.mode-key-signature');
            const runs = [...signature.querySelectorAll('.mode-key-run')];
            const rect = key.getBoundingClientRect();
            return {
              textRuns: runs.filter(run => !run.querySelector('.neume')).length,
              glyphs: [...signature.querySelectorAll('.neume')].map(glyph => glyph.textContent).join(''),
              fonts: runs.map(run => getComputedStyle(run).fontFamily),
              finite: [rect.width, rect.height, rect.top].every(Number.isFinite) && rect.height > 0,
            };
          })
        `);
      assert.equal(keys.length, modeKeyTemplates.length * 2);
      // Bare asserts would make Node describe the failure by re-parsing the
      // bundled source, which fails on the music font's private-use
      // characters and hides the real failure, so every check is described.
      for (let index = 0; index < keys.length; index += 2) {
        const template = modeKeyTemplates[index / 2].id;
        const classic = keys[index];
        const traditional = keys[index + 1];
        assert(
          classic.finite && traditional.finite,
          `Mode keys of template ${template} have no finite size`,
        );
        assert.equal(
          classic.textRuns,
          0,
          `Classic sets text in template ${template}`,
        );
        assert(
          classic.glyphs.startsWith('\ue2f1'),
          `Classic does not start with the echos glyph in template ${template}`,
        );
        assert(
          classic.fonts.every((font) => font.includes('Neanes')),
          `Classic uses a font other than Neanes in template ${template}`,
        );
        assert(
          traditional.textRuns > 0,
          `Traditional Greek sets no text in template ${template}`,
        );
        assert(
          traditional.fonts.some((font) => font.includes('GFS Didot')),
          `Traditional Greek does not use GFS Didot in template ${template}`,
        );
      }
      await writeFile(
        path.join(options.output, 'classic-mode-keys.pdf'),
        await window.webContents.printToPDF({
          pageSize: 'Letter',
          printBackground: true,
        }),
      );
      const firstPage = await window.webContents.executeJavaScript(`(() => {
        const rect = document.querySelector('.page').getBoundingClientRect();
        return {x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height)};
      })()`);
      await writeFile(
        path.join(options.output, 'classic-mode-keys.png'),
        (await window.webContents.capturePage(firstPage)).toPNG(),
      );
    },
  });
  console.log(
    'PASS: Classic glyphs and Traditional Greek text render every template through the shared renderer with centered pitch marks',
  );
}
