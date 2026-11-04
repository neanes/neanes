import { describe, expect, it } from 'vitest';

import { RichTextBoxElement, type TextBoxElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';
import { SaveService } from '@/services/SaveService';

import { LayoutReconciliation } from './layoutReconciliation';
import {
  applyLiveTextBoxHeight,
  beginLayoutOperation,
  invalidateLayoutFonts,
  layoutReservations,
  reserveInlineWidth,
  reserveTextBoxHeight,
} from './layoutReservations';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('layout operation reservations', () => {
  function fixture() {
    const workspace = new Workspace();
    const box = new RichTextBoxElement();
    workspace.score.staff.elements.unshift(box);
    return { workspace, box };
  }

  it('retains fresh height and inline width maxima but excludes obsolete saved heights', () => {
    const { workspace, box } = fixture();
    box.height = 1000;
    const operation = beginLayoutOperation(workspace);
    const reconciliation = new LayoutReconciliation();
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 40 },
      ]),
    ).toBe(true);
    expect(box.height).toBe(40);
    expect(reserveInlineWidth(box, 90)).toBe(90);
    expect(beginLayoutOperation(workspace)).toBe(operation);
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 25 },
      ]),
    ).toBe(false);
    expect(box.height).toBe(40);
    expect(reserveInlineWidth(box, 50)).toBe(90);
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 60 },
      ]),
    ).toBe(true);
    expect(box.height).toBe(60);
  });

  it('resets for edits, undo, redo, settings, fonts, and a fresh detached operation', () => {
    const { workspace, box } = fixture();
    const reset = (change: () => void) => {
      const previous = beginLayoutOperation(workspace);
      previous.gutter = 200;
      reserveTextBoxHeight(box, 300);
      reserveInlineWidth(box, 400);
      change();
      const current = beginLayoutOperation(workspace);
      expect(current).not.toBe(previous);
      expect(current.gutter).toBe(0);
      expect(reserveTextBoxHeight(box, 20)).toBe(20);
      expect(reserveInlineWidth(box, 30)).toBe(30);
    };
    reset(() =>
      workspace.commandService.execute(
        new CommandFactory<RichTextBoxElement>().create('update-properties', {
          target: box,
          newValues: { content: '<p>edited</p>' },
        }),
      ),
    );
    reset(() => workspace.commandService.undo());
    reset(() => workspace.commandService.redo());
    reset(() => {
      workspace.score.pageSetup.firstFootnoteNumber = 99;
    });
    reset(invalidateLayoutFonts);
    reset(() => {
      beginLayoutOperation(workspace, true);
    });
  });

  it('releases settlement maxima for live editing without resetting unrelated reservations', () => {
    const { workspace, box } = fixture();
    const header = workspace.score.headers.default
      .elements[0] as TextBoxElement;
    beginLayoutOperation(workspace);
    const reconciliation = new LayoutReconciliation();
    reconciliation.apply(workspace.score, [
      { element: box, width: box.width, height: 600 },
      { element: header, width: header.width, height: 80 },
    ]);
    applyLiveTextBoxHeight(box, 22);
    expect(box.height).toBe(22);
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 22 },
        { element: header, width: header.width, height: 40 },
      ]),
    ).toBe(false);
    expect(box.height).toBe(22);
    expect(header.height).toBe(80);
  });

  it('replaces height maxima when width changes while retaining unrelated reservations', () => {
    const { workspace, box } = fixture();
    const header = workspace.score.headers.default
      .elements[0] as TextBoxElement;
    box.width = 200;
    beginLayoutOperation(workspace);
    const reconciliation = new LayoutReconciliation();
    reconciliation.apply(workspace.score, [
      { element: box, width: box.width, height: 60 },
      { element: header, width: header.width, height: 80 },
    ]);
    box.width = 300;
    reconciliation.apply(workspace.score, [
      { element: box, width: box.width, height: 44 },
      { element: header, width: header.width, height: 40 },
    ]);
    expect(box.height).toBe(44);
    expect(header.height).toBe(80);
    box.width = 400;
    reconciliation.apply(workspace.score, [
      { element: box, width: box.width, height: 22 },
    ]);
    expect(box.height).toBe(22);
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 20 },
      ]),
    ).toBe(false);
    expect(box.height).toBe(22);
    box.width = 200;
    reconciliation.apply(workspace.score, [
      { element: box, width: 200, height: 40 },
    ]);
    expect(box.height).toBe(40);
  });

  it('requests another pass for changed labels even with unchanged measured heights', () => {
    const { workspace, box } = fixture();
    const operation = beginLayoutOperation(workspace);
    const reconciliation = new LayoutReconciliation();
    reconciliation.apply(workspace.score, [
      { element: box, width: box.width, height: 20 },
    ]);
    operation.pending = true;
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 20 },
      ]),
    ).toBe(true);
    operation.pending = false;
    expect(
      reconciliation.apply(workspace.score, [
        { element: box, width: box.width, height: 20 },
      ]),
    ).toBe(false);
    expect(layoutReservations(workspace.score)).toBe(operation);
    expect(
      JSON.stringify(SaveService.SaveScoreToJson(workspace.score)),
    ).not.toContain('reservations');
  });
});
