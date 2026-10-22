import { describe, expect, it } from 'vitest';

import { Workspace } from '@/models/Workspace';

import { getParagraphStyles } from '../documents/paragraphStyleRead';
import { automationOutputSchema, automationResultSchemas } from './results';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

const workspace = new Workspace();
const summary = {
  documentId: workspace.id,
  revision: 0,
  filePath: null,
  title: '',
  hasUnsavedChanges: false,
  selected: true,
  elementCount: workspace.score.staff.elements.length,
};
describe('automation result contracts', () => {
  it.each([0, -1])(
    'accepts existing first page number %i in header/footer results',
    (firstPageNumber) => {
      const result = { ...summary, settings: { firstPageNumber } };
      expect(
        automationResultSchemas.get_header_footer_settings.parse(result),
      ).toEqual(result);
    },
  );

  it('publishes isolated session bounds and permits closing without a selected tab', () => {
    expect(
      automationResultSchemas.create_session.parse({
        sessionId: '00000000-0000-4000-8000-000000000001',
        idleTimeoutMs: 900000,
        maxDocuments: 16,
      }),
    ).toMatchObject({ maxDocuments: 16 });
    expect(
      automationResultSchemas.close_document.parse({
        documentId: workspace.id,
        selectedDocumentId: null,
      }),
    ).toEqual({ documentId: workspace.id, selectedDocumentId: null });
  });

  it('validates document properties and complete style definitions', () => {
    expect(
      automationResultSchemas.get_document_properties.parse({
        ...summary,
        properties: { title: '', author: '' },
      }).properties,
    ).toEqual({ title: '', author: '' });
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
