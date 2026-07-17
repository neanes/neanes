import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  getInitialMartyriaContext,
  isInitialMartyriaComponentVisible,
  resolveInitialMartyriaStyle,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
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
});
