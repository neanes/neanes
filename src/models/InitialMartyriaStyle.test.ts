import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  createInitialMartyriaStartingNoteText,
  getInitialMartyriaContext,
  isInitialMartyriaComponentVisible,
  resolveInitialMartyriaStyle,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
describe('InitialMartyriaStyleResolver', () => {
  it('resolves traditional glyphs for every template', () => {
    for (const template of modeKeyTemplates) {
      const resolution = resolveInitialMartyriaStyle({
        context: getInitialMartyriaContext(
          ModeKeyElement.createFromTemplate(template),
        ),
        pageSetup: new PageSetup(),
      });
      expect(resolution.runs.some((run) => run.kind === 'glyph')).toBe(true);
    }
  });
  it('gives exact variation overrides precedence', () => {
    expect(
      isInitialMartyriaComponentVisible(
        { modes: [], variationOverrides: [{ templateId: 10, visible: true }] },
        { mode: 1, templateId: 10 },
      ),
    ).toBe(true);
    expect(
      isInitialMartyriaComponentVisible(
        {
          modes: [1],
          variationOverrides: [{ templateId: 10, visible: false }],
        },
        { mode: 1, templateId: 10 },
      ),
    ).toBe(false);
  });
  it('falls back for a missing style', () => {
    expect(
      resolveInitialMartyriaStyle({
        activeStyleId: 'missing',
        context: getInitialMartyriaContext(new ModeKeyElement()),
        pageSetup: new PageSetup(),
      }).style,
    ).toBe(traditionalGreekInitialMartyriaStyle);
  });
  it('rejects an empty component collection', () => {
    expect(
      validateInitialMartyriaStyle({
        ...traditionalGreekInitialMartyriaStyle,
        id: 'custom',
        components: [],
      }),
    ).toContain('A style must contain at least one component.');
  });
  it('resolves custom starting-note text with associated pitch notes', () => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.id === 603)!,
    );
    const style = structuredClone(traditionalGreekInitialMartyriaStyle);
    style.id = 'custom-starting-notes';
    style.startingNoteText = createInitialMartyriaStartingNoteText();
    style.startingNoteText.names[ModeSign.Ni] = 'Ni';
    const component = style.components.find(
      (item) =>
        item.kind === 'glyph' &&
        item.source.type === 'derived' &&
        item.source.value === 'startingPitchCluster',
    );
    if (
      component?.kind === 'glyph' &&
      component.source.type === 'derived' &&
      component.source.value === 'startingPitchCluster'
    ) {
      component.source.noteRendering = 'customText';
    }

    const run = resolveInitialMartyriaStyle({
      activeStyleId: style.id,
      styles: [style],
      context: getInitialMartyriaContext(element),
      pageSetup: new PageSetup(),
    }).runs.find((item) => item.kind === 'startingPitch');

    expect(run?.kind).toBe('startingPitch');
    if (run?.kind === 'startingPitch') {
      expect(run.cluster.primary?.note).toBe(element.note);
      expect(run.cluster.secondary?.note).toBe(element.note2);
      expect(run.cluster.trailingGlyphs).toEqual(
        [
          element.quantitativeNeumeRight,
          element.fthoraAboveQuantitativeNeumeRight,
        ].filter((item) => item != null),
      );
    }
  });
});
