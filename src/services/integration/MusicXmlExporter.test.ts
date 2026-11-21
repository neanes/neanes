import { describe, expect, it } from 'vitest';

import { modeKeyHtml } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
} from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { QuantitativeNeume } from '@/models/Neumes';
import { Score } from '@/models/Score';

import { MusicXmlExporter, MusicXmlExporterOptions } from './MusicXmlExporter';

function exportWithModeKey(modeKeyElement: ModeKeyElement, embedded: boolean) {
  const score = new Score();
  const note = new NoteElement();
  note.quantitativeNeume = QuantitativeNeume.Ison;

  if (embedded) {
    const richTextBox = new RichTextBoxElement();
    richTextBox.content = `<p>${modeKeyHtml(modeKeyElement)}</p>`;
    score.staff.elements = [richTextBox, note];
  } else {
    score.staff.elements = [modeKeyElement, note];
  }

  return new MusicXmlExporter().export(score, new MusicXmlExporterOptions());
}

describe('MusicXmlExporter', () => {
  it('keys an embedded mode key by its template like a standalone one', () => {
    const template = modeKeyTemplates.find(({ id }) => id === 804)!;

    const standalone = exportWithModeKey(
      ModeKeyElement.createFromTemplate(template),
      false,
    );
    const embedded = exportWithModeKey(
      ModeKeyElement.createFromTemplate(template),
      true,
    );

    expect(standalone).toContain('<fifths>2</fifths>');
    expect(embedded).toContain('<fifths>2</fifths>');
  });
});
