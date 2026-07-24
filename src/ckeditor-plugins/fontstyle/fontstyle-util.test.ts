import { describe, expect, it } from 'vitest';

import { normalizeFamilyListForSplitFace } from '@/ckeditor-plugins/fontstyle/fontstyle-util';
import { fontCatalog } from '@/services/FontCatalog';
import { applyLegacyStyle } from '@/utils/fontStyle';

// The real bundled Source Serif style set (Regular, Semibold, Light, Bold,
// Bold Italic, Caption, Caption Semibold, ...).
const sourceSerif = fontCatalog.getStyles('Source Serif');

describe('applyLegacyStyle', () => {
  it('recovers a named non-bold weight from font-weight (Semibold/Light)', () => {
    // Regression: these used to fold to Regular on reload because font-weight:600
    // was collapsed to a false bold marker.
    expect(applyLegacyStyle('Regular', { weight: '600' }, sourceSerif)).toBe(
      'Semibold',
    );
    expect(applyLegacyStyle('Regular', { weight: '300' }, sourceSerif)).toBe(
      'Light',
    );
  });

  it('combines a named weight with italic', () => {
    expect(
      applyLegacyStyle('Regular', { weight: '600', italic: true }, sourceSerif),
    ).toBe('Semibold Italic');
  });

  it('treats 700 and the bold marker as the bold axis', () => {
    expect(applyLegacyStyle('Regular', { weight: '700' }, sourceSerif)).toBe(
      'Bold',
    );
    expect(applyLegacyStyle('Regular', { weight: 'bold' }, sourceSerif)).toBe(
      'Bold',
    );
    expect(applyLegacyStyle('Regular', { bold: true }, sourceSerif)).toBe(
      'Bold',
    );
    expect(
      applyLegacyStyle('Regular', { bold: true, italic: true }, sourceSerif),
    ).toBe('Bold Italic');
  });

  it('keeps heavier numeric weights as named styles', () => {
    expect(applyLegacyStyle('Regular', { weight: '900' }, sourceSerif)).toBe(
      'Black',
    );
    expect(
      applyLegacyStyle('Regular', { weight: '900', italic: true }, sourceSerif),
    ).toBe('Black Italic');
  });

  it('does not collapse a named weight to Bold when a bold marker co-occurs', () => {
    // Regression: a <strong>/<b> wrapper (or an old bold boolean) on a run that
    // also has a more specific numeric font-weight must keep the named weight,
    // not emit an impossible "Semibold Bold"/"Extra Bold Bold" that collapses the
    // weight to 700. The numeric weight is more specific and wins.
    expect(
      applyLegacyStyle('Regular', { bold: true, weight: '600' }, sourceSerif),
    ).toBe('Semibold');
    expect(
      applyLegacyStyle('Regular', { bold: true, weight: '900' }, sourceSerif),
    ).toBe('Black');
  });

  it('keeps a face-name weight when a bold marker co-occurs', () => {
    // e.g. a run whose family was "Minion Pro Semibold" (base style "Semibold")
    // that also carried a <strong> wrapper or a legacy bold boolean.
    expect(applyLegacyStyle('Semibold', { bold: true }, sourceSerif)).toBe(
      'Semibold',
    );
    expect(
      applyLegacyStyle('Caption Semibold', { bold: true }, sourceSerif),
    ).toBe('Caption Semibold');
  });

  it('merges an optical face token with the recovered weight', () => {
    expect(applyLegacyStyle('Caption', { weight: '600' }, sourceSerif)).toBe(
      'Caption Semibold',
    );
  });

  it('does not double the weight when the face name already carries it', () => {
    // System optical faces (e.g. "Minion Pro Caption Semibold") encode the weight
    // in both the family token and font-weight; the result must not become
    // "Caption Semibold Semibold".
    expect(
      applyLegacyStyle('Caption Semibold', { weight: '600' }, sourceSerif),
    ).toBe('Caption Semibold');
  });

  it('keeps Regular when there is no weight or marker', () => {
    expect(applyLegacyStyle('Regular', {}, sourceSerif)).toBe('Regular');
    expect(applyLegacyStyle('Regular', { weight: '400' }, sourceSerif)).toBe(
      'Regular',
    );
  });

  it('falls back to the composed name when the family lacks the face', () => {
    // A family that only offers Regular cannot represent Semibold; keep the name.
    expect(applyLegacyStyle('Regular', { weight: '600' }, ['Regular'])).toBe(
      'Semibold',
    );
  });
});

describe('normalizeFamilyListForSplitFace', () => {
  it('strips a derived alias followed by its base family', () => {
    expect(
      normalizeFamilyListForSplitFace(
        "'Minion Pro Semibold', Minion Pro, Neanes",
        { family: 'Minion Pro', style: 'Semibold' },
      ),
    ).toBe('Minion Pro,Neanes');
  });

  it('strips a Regular alias despite the default-style early return', () => {
    // Regression guard: the duplicated-base check must run before the default
    // style early return, or Regular aliases stick as the model family.
    expect(
      normalizeFamilyListForSplitFace(
        "'Minion Pro Regular', Minion Pro, Neanes",
        { family: 'Minion Pro', style: 'Regular' },
      ),
    ).toBe('Minion Pro,Neanes');
  });

  it('keeps a plain default-style list unchanged', () => {
    expect(
      normalizeFamilyListForSplitFace('Minion Pro,Neanes', {
        family: 'Minion Pro',
        style: 'Regular',
      }),
    ).toBe('Minion Pro,Neanes');
  });

  it('substitutes the split family for a bare face name', () => {
    expect(
      normalizeFamilyListForSplitFace('Minion Pro Semibold, Neanes', {
        family: 'Minion Pro',
        style: 'Semibold',
      }),
    ).toBe('Minion Pro,Neanes');
  });

  it('does not strip a family merely named like a face', () => {
    // Stripping requires the base family as the next token; a real family
    // whose name ends in a style word stays intact.
    expect(
      normalizeFamilyListForSplitFace('Foo Regular, Neanes', {
        family: 'Foo',
        style: 'Regular',
      }),
    ).toBe('Foo Regular, Neanes');
  });
});
