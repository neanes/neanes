import { describe, expect, it } from 'vitest';

import { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import { getParagraphStyles } from '../documents/paragraphStyles';
import { automationOutputSchema, automationResultSchemas } from './results';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

const workspace = new Workspace();
const summary = {
  documentId: workspace.id,
  revision: 0,
  filePath: null,
  sourceFormat: null,
  title: '',
  hasUnsavedChanges: false,
  selected: true,
  elementCount: workspace.score.staff.elements.length,
};
describe('automation result contracts', () => {
  it('validates actual serialized scores and complete style definitions', () => {
    const score = JSON.parse(
      JSON.stringify(SaveService.SaveScoreToJson(new Score())),
    );
    expect(
      automationResultSchemas.get_document.parse({
        ...summary,
        score,
        offset: 0,
        nextOffset: null,
      }).score,
    ).toEqual(score);
    const styles = {
      ...summary,
      ...getParagraphStyles(workspace.score.paragraphStyles),
    };
    expect(automationResultSchemas.get_paragraph_styles.parse(styles)).toEqual(
      styles,
    );
  });
  it('validates success and failure envelopes and publishes both in JSON Schema', () => {
    const schema = automationOutputSchema('list_documents');
    const success = { success: true, result: [summary] };
    const failure = {
      success: false,
      error: { code: 'EDITOR_BUSY', message: 'Busy', details: {} },
    };
    expect(schema.parse(success)).toEqual(success);
    expect(schema.parse(failure)).toEqual(failure);
    expect(() => schema.parse({ success: true, result: failure })).toThrow();
    expect(() =>
      schema.parse({
        success: false,
        error: { code: 'UNKNOWN', message: '', details: {} },
      }),
    ).toThrow();
  });
  it('requires saved-snapshot metadata rather than conflating it with the current revision', () => {
    expect(() =>
      automationResultSchemas.save_document.parse(summary),
    ).toThrow();
    expect(
      automationResultSchemas.save_document.parse({
        ...summary,
        revision: 3,
        savedRevision: 2,
        savedContentUnchanged: false,
      }),
    ).toMatchObject({
      revision: 3,
      savedRevision: 2,
      savedContentUnchanged: false,
    });
  });
  it('identifies the exported revision independently of later interactive edits', () => {
    const result = {
      ...summary,
      revision: 4,
      exportedRevision: 2,
      outputFilePath: '/scores/export.pdf',
      format: 'pdf',
    };
    expect(automationResultSchemas.export_pdf.parse(result)).toEqual(result);
    const missingSnapshot = { ...result, exportedRevision: undefined };
    expect(
      automationResultSchemas.export_pdf.safeParse(missingSnapshot).success,
    ).toBe(false);
  });
});
