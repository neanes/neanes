import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { FONT_STYLE_AXES, useFontStyleControls } from './useFontStyleControls';

describe('useFontStyleControls', () => {
  it('lists the chosen family styles and reacts to family changes', () => {
    const family = ref('Source Serif');
    const style = ref('Regular');
    const { fontStyleOptions } = useFontStyleControls(
      () => family.value,
      () => style.value,
    );

    expect(fontStyleOptions.value).toContain('Bold');
    expect(fontStyleOptions.value).toContain('Semibold');

    // A bundled music family only offers Regular.
    family.value = 'Neanes';
    expect(fontStyleOptions.value).toEqual(['Regular']);
  });

  it('derives the active bold/italic axes from the style', () => {
    const style = ref('Bold Italic');
    const { activeStyleAxisValues, isFontStyleAxisActive } =
      useFontStyleControls(
        () => 'Source Serif',
        () => style.value,
      );

    expect(activeStyleAxisValues.value).toEqual(['bold', 'italic']);
    expect(isFontStyleAxisActive('bold')).toBe(true);

    style.value = 'Regular';
    expect(activeStyleAxisValues.value).toEqual([]);
    expect(isFontStyleAxisActive('bold')).toBe(false);
  });

  it('enables an axis toggle only when the family offers the face', () => {
    const neanes = useFontStyleControls(
      () => 'Neanes', // only Regular
      () => 'Regular',
    );
    expect(neanes.isFontStyleAxisToggleEnabled('bold')).toBe(false);
    expect(neanes.isFontStyleAxisToggleEnabled('italic')).toBe(false);

    const serif = useFontStyleControls(
      () => 'Source Serif',
      () => 'Regular',
    );
    expect(serif.isFontStyleAxisToggleEnabled('bold')).toBe(true);
    expect(serif.isFontStyleAxisToggleEnabled('italic')).toBe(true);
  });

  it('applies only the axes that changed in the new selection', () => {
    const style = ref('Regular');
    const { applyStyleAxisToggles } = useFontStyleControls(
      () => 'Source Serif',
      () => style.value,
    );

    expect(applyStyleAxisToggles(['bold'])).toBe('Bold');
    expect(applyStyleAxisToggles(['bold', 'italic'])).toBe('Bold Italic');

    style.value = 'Bold Italic';
    expect(applyStyleAxisToggles(['bold'])).toBe('Bold'); // italic turned off
    expect(applyStyleAxisToggles([])).toBe('Regular'); // both turned off
  });

  it('keeps the style across families that share the face, else falls back', () => {
    const { remapStyleForFamily } = useFontStyleControls(
      () => 'Source Serif',
      () => 'Bold',
    );

    // Old Standard also has a Bold face.
    expect(remapStyleForFamily('Old Standard')).toBe('Bold');
    // Neanes only has Regular, so Bold cannot survive.
    expect(remapStyleForFamily('Neanes')).toBe('Regular');
  });

  it('exposes the bold and italic axes in display order', () => {
    expect(FONT_STYLE_AXES).toEqual(['bold', 'italic']);
  });
});
