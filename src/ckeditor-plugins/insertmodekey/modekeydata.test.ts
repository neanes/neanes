import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';

import {
  deserializeModeKeyAttributes,
  extractModeKeyElementsFromHtml,
  getModeKeyModelAttributes,
  getModeKeyReplacementAttributes,
  rewriteModeKeyAttributesInHtml,
  serializeModeKeyAttributes,
  toModeKeyEditorAttributes,
} from './modekeydata';

describe('embedded mode key data', () => {
  it('round-trips the complete editable payload', () => {
    const element = new ModeKeyElement();
    element.templateId = 42;
    element.fontSize = 18;
    element.color = '#123456';
    element.strokeWidth = 0.5;
    element.bpm = 96;
    element.initialMartyriaStyleId = 'custom-style';
    element.ignoreAttractions = true;
    element.permanentEnharmonicZo = true;

    const attributes = getModeKeyModelAttributes(element);
    const serialized = serializeModeKeyAttributes(attributes);

    expect(deserializeModeKeyAttributes(serialized)).toEqual(attributes);

    const extracted = extractModeKeyElementsFromHtml(
      `<p>before <span class="neanes-ck-mode-key" data-neanes-mode-key="${serialized}"></span> after</p>`,
    );

    expect(extracted).toHaveLength(1);
    expect(getModeKeyModelAttributes(extracted[0])).toEqual(attributes);
  });

  it('ignores malformed and unsupported payloads', () => {
    expect(deserializeModeKeyAttributes('%7Bbad')).toBeNull();
    expect(
      deserializeModeKeyAttributes(
        encodeURIComponent(JSON.stringify({ version: 2, attributes: {} })),
      ),
    ).toBeNull();
  });

  it('rewrites valid payloads without disturbing surrounding html', () => {
    const serialized = serializeModeKeyAttributes({
      initialMartyriaStyleId: 'deleted-style',
      fontSize: 14,
    });
    const html = `<p>x<span data-neanes-mode-key='${serialized}'></span>y</p>`;

    const rewritten = rewriteModeKeyAttributesInHtml(html, (attributes) => ({
      ...attributes,
      initialMartyriaStyleId: null,
    }));
    const [element] = extractModeKeyElementsFromHtml(rewritten);

    expect(rewritten).toMatch(/^<p>x<span data-neanes-mode-key='/u);
    expect(element.initialMartyriaStyleId).toBeNull();
    expect(element.fontSize).toBe(14);
  });

  it('converts CKEditor CSS sizes to finite pixel geometry', () => {
    const serialized = serializeModeKeyAttributes({ fontSize: '20pt' });
    const attributes = deserializeModeKeyAttributes(serialized);

    expect(attributes?.fontSize).toBeCloseTo(26.6667, 3);
    expect(
      getModeKeyModelAttributes(
        extractModeKeyElementsFromHtml(
          `<span data-neanes-mode-key="${serialized}"></span>`,
        )[0],
      ).fontSize,
    ).toBeCloseTo(26.6667, 3);
  });

  it('writes pixel CSS values into the CKEditor model', () => {
    expect(toModeKeyEditorAttributes({ fontSize: 24 })).toEqual({
      fontSize: '24px',
    });
    expect(toModeKeyEditorAttributes({ fontSize: null })).toEqual({
      fontSize: null,
    });
  });

  it('clears attributes omitted by a replacement mode key', () => {
    const element = new ModeKeyElement();
    element.note = null;
    element.fthoraAboveNote = null;

    const attributes = getModeKeyReplacementAttributes(element);

    expect(attributes.note).toBeNull();
    expect(attributes.fthoraAboveNote).toBeNull();
    expect(attributes.mode).toBe(element.mode);
  });
});
