import { describe, expect, it } from 'vitest';

import { serializeModeKeyAttributes } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import { RichTextBoxElement } from '@/models/Element';

import {
  getEmbeddedModeKeys,
  getLastEmbeddedModeKey,
} from './richTextModeKeys';

function marker(templateId: number) {
  return `<span class="neanes-ck-mode-key" data-neanes-mode-key="${serializeModeKeyAttributes({ templateId })}"></span>`;
}

describe('rich text mode keys', () => {
  it('uses the last key in normal rich text content order', () => {
    const element = new RichTextBoxElement();
    element.index = 17;
    element.content = `${marker(1)} text ${marker(2)}`;
    element.contentBottom = marker(3);

    expect(getEmbeddedModeKeys(element).map((x) => x.templateId)).toEqual([
      1, 2, 3,
    ]);
    expect(getLastEmbeddedModeKey(element)?.templateId).toBe(3);
    expect(getLastEmbeddedModeKey(element)?.index).toBe(17);
  });

  it('uses left, center, right order for multipanel content', () => {
    const element = new RichTextBoxElement();
    element.multipanel = true;
    element.content = marker(99);
    element.contentLeft = marker(1);
    element.contentCenter = marker(2);
    element.contentRight = marker(3);

    expect(getEmbeddedModeKeys(element).map((x) => x.templateId)).toEqual([
      1, 2, 3,
    ]);
    expect(getLastEmbeddedModeKey(element)?.templateId).toBe(3);
  });

  it('returns null when no valid key is present', () => {
    const element = new RichTextBoxElement();
    element.content = '<p data-neanes-mode-key="invalid">text</p>';

    expect(getLastEmbeddedModeKey(element)).toBeNull();
  });
});
