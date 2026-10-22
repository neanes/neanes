import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import {
  AlternateLineElement,
  AnnotationElement,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { Workspace } from '@/models/Workspace';
import { snapshotDocument } from '@/services/documents/documentPersistence';

import { automationTools } from '../../../electron/main/automation/tools';
import { parseAutomationRequest } from '../contracts/protocol';
import { automationOutputSchema } from '../contracts/results';
import { ElementDiscovery } from './elementDiscovery';
import { readSelection } from './selectionRead';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
function fixture() {
  const workspace = new Workspace(false);
  const note = new NoteElement();
  const annotation = new AnnotationElement();
  const alternate = new AlternateLineElement();
  alternate.elements.push(new NoteElement());
  note.annotations.push(annotation);
  note.alternateLines.push(alternate);
  workspace.score.staff.elements.unshift(note, new TextBoxElement());
  const discovery = new ElementDiscovery();
  const read = () => readSelection(workspace, discovery, workspace.id);
  return { workspace, note, annotation, alternate, discovery, read };
}

describe('selection discovery', () => {
  it('distinguishes active, remembered, empty and unavailable selection without returning private UI state', () => {
    const { workspace, note, discovery, read } = fixture();
    expect(read()).toEqual({ status: 'active', selection: null });
    workspace.selectedElement = note;
    expect(read().selection).toMatchObject({
      kind: 'element',
      target: {
        elementRef: discovery.reference(note),
        index: 0,
        collection: { kind: 'staff' },
      },
    });
    expect(readSelection(workspace, discovery, 'another-document')).toEqual({
      ...read(),
      status: 'remembered',
    });
    expect(readSelection(workspace, discovery, null)).toEqual({
      status: 'unavailable',
      selection: null,
    });
  });

  it('resolves nested selections before their staff parent, and distinguishes lyrics and stored header/footer templates', () => {
    const { workspace, note, annotation, alternate, discovery, read } =
      fixture();
    workspace.selectedElement = note;
    workspace.selectedAnnotationElement = reactive(annotation);
    expect(read().selection).toMatchObject({
      kind: 'annotation',
      target: {
        elementRef: discovery.reference(annotation),
        collection: {
          kind: 'children',
          parentRef: discovery.reference(note),
          collection: 'annotations',
        },
      },
    });
    workspace.selectedAnnotationElement = null;
    workspace.selectedAlternateLineElement = alternate;
    expect(read().selection).toMatchObject({
      kind: 'alternateLine',
      target: { elementRef: discovery.reference(alternate) },
    });
    workspace.selectedAlternateLineElement = null;
    workspace.selectedElement = null;
    workspace.selectedLyrics = note;
    expect(read().selection).toMatchObject({
      kind: 'lyrics',
      target: { elementRef: discovery.reference(note) },
    });
    workspace.selectedLyrics = null;
    for (const kind of ['headers', 'footers'] as const) {
      workspace.selectedHeaderFooterElement =
        workspace.score[kind].odd.elements[0];
      expect(read().selection).toMatchObject({
        kind: 'headerFooter',
        target: { collection: { kind, variant: 'odd' } },
      });
    }
  });

  it('returns normalized half-open ranges with directional references and bounded output', () => {
    const { workspace, discovery, read } = fixture();
    workspace.score.staff.elements.unshift(
      ...Array.from({ length: 2000 }, () => new NoteElement()),
    );
    workspace.selectionRange = { start: 1999, end: 0 };
    const result = read();
    expect(result.selection).toEqual({
      kind: 'range',
      collection: { kind: 'staff' },
      start: 0,
      end: 2000,
      anchorRef: discovery.reference(workspace.score.staff.elements[1999]),
      focusRef: discovery.reference(workspace.score.staff.elements[0]),
    });
    expect(JSON.stringify(result).length).toBeLessThan(300);
    workspace.selectionRange = { start: 1, end: 1 };
    expect(read().selection).toMatchObject({ kind: 'range', start: 1, end: 2 });
    for (const range of [
      { start: -1, end: 2 },
      { start: 0, end: 5000 },
      { start: 0.5, end: 1 },
    ]) {
      workspace.selectionRange = range;
      expect(read().selection).toBeNull();
    }
  });

  it('omits stale or foreign selections and preserves references at current locations', () => {
    const { workspace, note, annotation, discovery, read } = fixture();
    workspace.selectedElement = note;
    const ref = discovery.reference(note);
    workspace.score.staff.elements.splice(0, 1);
    expect(read().selection).toBeNull();
    workspace.score.staff.elements.splice(1, 0, note);
    expect(read().selection).toMatchObject({
      target: { elementRef: ref, index: 1 },
    });
    workspace.selectedAnnotationElement = annotation;
    note.annotations.pop();
    expect(read().selection).toBeNull();
    workspace.selectedAnnotationElement = null;
    workspace.selectedElement = new NoteElement();
    expect(read().selection).toBeNull();
  });

  it('does not change content snapshots, dirty state or selection', () => {
    const { workspace, note, discovery, read } = fixture();
    const saved = snapshotDocument(workspace);
    const live = discovery.snapshot(workspace.score);
    workspace.selectedElement = note;
    read();
    workspace.selectedElement = null;
    workspace.selectedLyrics = note;
    read();
    expect(snapshotDocument(workspace)).toBe(saved);
    expect(discovery.snapshot(workspace.score)).toBe(live);
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(workspace.selectedLyrics).toBe(note);
  });

  it('publishes compact validated contracts with optional content revision checks', () => {
    const { workspace, note, read } = fixture();
    const tool = automationTools().find(
      (tool) => tool.name === 'get_selection',
    )!;
    const validator = new AjvJsonSchemaValidator();
    const args = { documentId: workspace.id, expectedRevision: 0 };
    expect(
      parseAutomationRequest({ tool: 'get_selection', arguments: args })
        .arguments,
    ).toEqual(args);
    expect(validator.getValidator(tool.inputSchema)(args)).toMatchObject({
      valid: true,
    });
    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(tool.annotations?.destructiveHint).toBe(false);
    const summary = {
      documentId: workspace.id,
      revision: 0,
      filePath: null,
      title: '',
      hasUnsavedChanges: false,
      selected: true,
      elementCount: workspace.score.staff.elements.length,
    };
    for (const setup of [
      () => {},
      () => {
        workspace.selectedElement = note;
      },
      () => {
        workspace.selectionRange = { start: 0, end: 1 };
      },
    ]) {
      setup();
      const outcome = { success: true, result: { ...summary, ...read() } };
      expect(automationOutputSchema('get_selection').parse(outcome)).toEqual(
        outcome,
      );
      expect(validator.getValidator(tool.outputSchema!)(outcome)).toMatchObject(
        { valid: true },
      );
    }
    expect(JSON.stringify(tool.outputSchema).length).toBeLessThan(4000);
    expect(() =>
      parseAutomationRequest({
        tool: 'get_selection',
        arguments: { ...args, expectedRevision: -1 },
      }),
    ).toThrow();
  });
});
