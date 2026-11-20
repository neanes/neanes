import { describe, expect, it } from 'vitest';

import { modeKeyHtml } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  ModeKeyElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { Score } from '@/models/Score';

import {
  getModeKeyStyleReferenceChanges,
  getModeKeyStyleReferences,
  getScoreModeKeyHosts,
} from './modeKeyStyleReferences';

function modeKey(styleId: string | null) {
  const element = new ModeKeyElement();
  element.initialMartyriaStyleId = styleId;
  return element;
}

function embedded(...styleIds: (string | null)[]) {
  return `<p>${styleIds.map((styleId) => modeKeyHtml(modeKey(styleId))).join(' ')}</p>`;
}

const renameParish = (styleId: string) =>
  styleId === 'parish' ? 'renamed' : styleId;

describe('mode key style references', () => {
  it('reads standalone keys and keys embedded in every rich text panel', () => {
    const richTextBox = new RichTextBoxElement();
    richTextBox.content = embedded('parish', null);
    // A stored panel that is not shown still holds keys.
    richTextBox.contentRight = embedded('other');

    expect(getModeKeyStyleReferences(modeKey('parish'))).toEqual(['parish']);
    expect(getModeKeyStyleReferences(modeKey(null))).toEqual([null]);
    expect(getModeKeyStyleReferences(richTextBox)).toEqual([
      'parish',
      null,
      'other',
    ]);
    expect(getModeKeyStyleReferences(new TextBoxElement())).toEqual([]);
  });

  it('lists the staves of the main score and footnotes, and headers and footers', () => {
    const score = new Score();
    const header = new RichTextBoxElement();
    score.headers.default.elements = [header];

    const hosts = getScoreModeKeyHosts(score);

    expect(hosts).toEqual(expect.arrayContaining(score.staff.elements));
    expect(hosts).toContain(header);
  });

  it('rewrites a standalone key, leaving keys that follow the default alone', () => {
    expect(
      getModeKeyStyleReferenceChanges(modeKey('parish'), renameParish),
    ).toEqual({ initialMartyriaStyleId: 'renamed' });
    expect(
      getModeKeyStyleReferenceChanges(modeKey('parish'), () => null),
    ).toEqual({ initialMartyriaStyleId: null });
    expect(
      getModeKeyStyleReferenceChanges(modeKey('other'), renameParish),
    ).toBeNull();
    expect(
      getModeKeyStyleReferenceChanges(modeKey(null), () => 'renamed'),
    ).toBeNull();
  });

  it('rewrites embedded keys in only the panels that change', () => {
    const richTextBox = new RichTextBoxElement();
    richTextBox.content = embedded('parish', null);
    richTextBox.contentLeft = embedded('other');
    richTextBox.contentRight = embedded('parish');

    const changes = getModeKeyStyleReferenceChanges(richTextBox, renameParish);

    expect(Object.keys(changes!).sort()).toEqual(['content', 'contentRight']);
    expect(
      getModeKeyStyleReferences(Object.assign(richTextBox, changes)),
    ).toEqual(['renamed', null, 'other', 'renamed']);
    expect(
      getModeKeyStyleReferenceChanges(richTextBox, renameParish),
    ).toBeNull();
  });
});
