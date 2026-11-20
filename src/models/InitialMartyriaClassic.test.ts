import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  builtInInitialMartyriaStyles,
  DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
  getBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';
import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  getInitialMartyriaSeparatorBefore,
  getSupportedInitialMartyriaLettering,
} from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LETTERINGS,
  type ResolvedInitialMartyriaRun,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { Fthora, ModeSign, type Neume } from '@/models/Neumes';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

import { resolve } from './InitialMartyriaStyle.testHelpers';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

const classic = getBuiltInInitialMartyriaStyle(
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic,
);
const traditional = getBuiltInInitialMartyriaStyle(
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
);

function getRunNeumes(run: ResolvedInitialMartyriaRun): Neume[] {
  if (run.kind === 'glyph') {
    return run.glyphs;
  }
  if (run.kind !== 'startingPitch') {
    return [];
  }
  const { primary, secondary, trailingGlyphs } = run.cluster;
  return [
    ...[primary, secondary].flatMap((note) =>
      note == null
        ? []
        : [note.note, note.fthoraAbove, note.quantitativeNeumeAbove].filter(
            (neume) => neume != null,
          ),
    ),
    ...trailingGlyphs,
  ];
}

describe('Classic initial martyria', () => {
  it('is the default and is Traditional Greek set in music-font lettering', () => {
    expect(DEFAULT_INITIAL_MARTYRIA_STYLE_ID).toBe(classic.id);
    expect(classic.structure).toEqual(traditional.structure);
    expect(classic.lettering).toBe(INITIAL_MARTYRIA_LETTERINGS.MusicFont);
    expect(traditional.lettering).toBe(INITIAL_MARTYRIA_LETTERINGS.Text);
    const element = ModeKeyElement.createFromTemplate(modeKeyTemplates[0]);
    expect(resolve(traditional, element).runs).toContainEqual(
      expect.objectContaining({
        kind: 'text',
        semantic: 'label',
        appearance: expect.objectContaining({ fontFamily: 'GFS Didot' }),
        content: { layout: 'inline', text: 'Ἦχος' },
      }),
    );
  });

  it('falls back to text lettering for structures the music font cannot letter', () => {
    const english = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign,
    );
    expect(
      createInitialMartyriaStyle({
        ...classic,
        displayName: 'English glyphs',
        structure: english.structure,
      }).lettering,
    ).toBe(INITIAL_MARTYRIA_LETTERINGS.Text);

    const score = new Score();
    score.initialMartyriaStyles = [
      createInitialMartyriaStyle({
        ...english,
        displayName: 'English',
      }),
    ];
    score.pageSetup.initialMartyriaStyleId = score.initialMartyriaStyles[0].id;
    const saved = SaveService.SaveScoreToJson(score);
    saved.initialMartyriaStyles![0].lettering =
      INITIAL_MARTYRIA_LETTERINGS.MusicFont;
    expect(
      SaveService.LoadScore_v1(saved).initialMartyriaStyles[0].lettering,
    ).toBe(INITIAL_MARTYRIA_LETTERINGS.Text);
  });

  it('preserves all template notation and optional marks as music-font glyphs', () => {
    for (const template of modeKeyTemplates) {
      for (const optional of [false, true]) {
        const element = ModeKeyElement.createFromTemplate(template, optional);
        const resolution = resolve(
          classic,
          element,
          undefined,
          'NeanesStathisSeries',
        );
        const expected = [ModeSign.Ekhos];
        if ([5, 6, 8].includes(element.mode)) {
          expected.push(ModeSign.Plagal);
        }
        if (element.mode === 7) {
          expected.push(ModeSign.Varys);
        }
        const notation = [
          ...expected,
          element.martyria,
          element.note,
          element.fthoraAboveNote,
          element.quantitativeNeumeAboveNote,
          element.note2,
          element.fthoraAboveNote2,
          element.quantitativeNeumeAboveNote2,
          element.quantitativeNeumeRight,
          element.fthoraAboveQuantitativeNeumeRight,
        ].filter((neume) => neume != null);
        expect(resolution.runs.flatMap(getRunNeumes)).toEqual(notation);
        expect(
          resolution.runs.every(
            (run) =>
              (run.kind === 'glyph' ||
                (run.kind === 'startingPitch' && run.noteText == null)) &&
              run.appearance.fontFamily === 'NeanesStathisSeries',
          ),
        ).toBe(true);
        expect(
          resolution.runs
            .slice(1)
            .map((_, index) =>
              getInitialMartyriaSeparatorBefore(resolution, index + 1),
            ),
        ).toEqual(Array(resolution.runs.length - 1).fill('fixed'));
      }
    }
  });

  it('keeps both pitch clusters and their marks together', () => {
    const element = ModeKeyElement.createFromTemplate(modeKeyTemplates[0]);
    element.fthoraAboveNote = Fthora.DiatonicPa_Top;
    element.quantitativeNeumeAboveNote = ModeSign.OligonPlusKentima;
    element.note2 = ModeSign.Ke;
    element.fthoraAboveNote2 = Fthora.DiatonicKe_Top;
    // One shared pitch run holds both notes, so the pitch geometry centers
    // each note's marks on its glyph.
    const pitches = resolve(classic, element).runs.filter(
      (run) => run.kind === 'startingPitch',
    );
    expect(pitches).toHaveLength(1);
    expect(pitches[0].noteText).toBeNull();
    expect(pitches[0].cluster).toMatchObject({
      primary: {
        note: ModeSign.Pa,
        fthoraAbove: Fthora.DiatonicPa_Top,
        quantitativeNeumeAbove: ModeSign.OligonPlusKentima,
      },
      secondary: {
        note: ModeSign.Ke,
        fthoraAbove: Fthora.DiatonicKe_Top,
        quantitativeNeumeAbove: null,
      },
    });
  });

  it('round-trips custom Classic styles', () => {
    const score = new Score();
    const custom = createInitialMartyriaStyle({
      ...classic,
      displayName: 'Parish classic',
    });
    score.initialMartyriaStyles = [custom];
    score.pageSetup.initialMartyriaStyleId = custom.id;
    const element = ModeKeyElement.createFromTemplate(modeKeyTemplates[0]);
    element.initialMartyriaStyleId = custom.id;
    score.staff.elements = [element];
    const loaded = SaveService.LoadScore_v1(SaveService.SaveScoreToJson(score));
    expect(loaded.pageSetup.initialMartyriaStyleId).toBe(custom.id);
    expect(loaded.initialMartyriaStyles).toEqual([custom]);
    expect(
      (loaded.staff.elements[0] as ModeKeyElement).initialMartyriaStyleId,
    ).toBe(custom.id);
    expect(
      resolve(
        loaded.initialMartyriaStyles[0],
        loaded.staff.elements[0] as ModeKeyElement,
      ).runs.every(
        (run) =>
          run.kind === 'glyph' ||
          (run.kind === 'startingPitch' && run.noteText == null),
      ),
    ).toBe(true);
  });

  it('sets the plagal abbreviation as a glyph with fixed gaps', () => {
    const template = modeKeyTemplates.find((t) => t.mode === 5)!;
    const resolution = resolve(
      classic,
      ModeKeyElement.createFromTemplate(template),
    );
    const plagalIndex = resolution.runs.findIndex(
      (run) => run.kind === 'glyph' && run.semantic === 'plagalAbbreviation',
    );
    expect(plagalIndex).toBeGreaterThan(0);
    expect(getInitialMartyriaSeparatorBefore(resolution, plagalIndex)).toBe(
      'fixed',
    );
    expect(getInitialMartyriaSeparatorBefore(resolution, plagalIndex + 1)).toBe(
      'fixed',
    );
  });

  it('pairs every built-in style with lettering its structure supports', () => {
    for (const style of builtInInitialMartyriaStyles) {
      expect(
        getSupportedInitialMartyriaLettering(style.lettering, style.structure),
      ).toBe(style.lettering);
    }
  });
});
