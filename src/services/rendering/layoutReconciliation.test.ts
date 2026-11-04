import { describe, expect, it } from 'vitest';

import { TextBoxElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';

import {
  LayoutReconciliation,
  WorkspaceLayoutSettlement,
} from './layoutReconciliation';
import { beginLayoutOperation } from './layoutReservations';

describe('detached layout reconciliation', () => {
  it('aggregates repeated template heights and retains their maximum across passes', () => {
    const workspace = new Workspace();
    const score = workspace.score;
    const header = score.headers.default.elements[0] as TextBoxElement;
    const body = new TextBoxElement();
    score.staff.elements.unshift(body);
    beginLayoutOperation(workspace);
    const state = new LayoutReconciliation();
    expect(
      state.apply(score, [
        { element: header, width: header.width, height: 60 },
        { element: header, width: header.width, height: 100 },
        { element: body, width: body.width, height: 80 },
      ]),
    ).toBe(true);
    expect(header.height).toBe(100);
    expect(body.height).toBe(80);
    expect(
      state.apply(score, [
        { element: header, width: header.width, height: 50 },
        { element: body, width: body.width, height: 80.001 },
      ]),
    ).toBe(false);
    expect(header.height).toBe(100);
    expect(
      state.apply(score, [
        { element: header, width: header.width, height: 110 },
        { element: body, width: body.width, height: 70 },
      ]),
    ).toBe(true);
    expect(body.height).toBe(70);
  });

  it('bounds oscillating layout passes and accepts convergence within the limit', () => {
    const workspace = new Workspace();
    const score = workspace.score;
    const body = new TextBoxElement();
    score.staff.elements.unshift(body);
    beginLayoutOperation(workspace);
    const state = new LayoutReconciliation();
    for (let i = 0; i < 11; i++) {
      expect(
        state.apply(score, [
          { element: body, width: body.width, height: 100 + i },
        ]),
      ).toBe(true);
    }
    expect(
      state.apply(score, [{ element: body, width: body.width, height: 110 }]),
    ).toBe(false);
    expect(() =>
      state.apply(score, [{ element: body, width: body.width, height: 111 }]),
    ).toThrow('LAYOUT_DID_NOT_SETTLE');
  });

  it('rejects delayed measurements at an obsolete width without poisoning current reservations', () => {
    const workspace = new Workspace();
    const body = new TextBoxElement();
    workspace.score.staff.elements.unshift(body);
    body.width = 300;
    body.height = 22;
    beginLayoutOperation(workspace);
    const state = new LayoutReconciliation();
    expect(
      state.apply(workspace.score, [
        { element: body, width: 200, height: 100 },
        { element: body, width: 300, height: 22 },
        { element: body, width: 400, height: 10 },
      ]),
    ).toBe(true);
    expect(body.height).toBe(22);
    expect(
      state.apply(workspace.score, [{ element: body, width: 300, height: 22 }]),
    ).toBe(false);
    body.width = 400;
    expect(
      state.apply(workspace.score, [
        { element: body, width: 400, height: 12 },
        { element: body, width: 300, height: 100 },
      ]),
    ).toBe(true);
    expect(body.height).toBe(12);
    expect(
      state.apply(workspace.score, [{ element: body, width: 400, height: 10 }]),
    ).toBe(true);
    expect(body.height).toBe(10);
  });

  it('preserves header and footer maxima across width changes without retaining body maxima', () => {
    const workspace = new Workspace();
    const score = workspace.score;
    const body = new TextBoxElement();
    const header = score.headers.default.elements[0] as TextBoxElement;
    const footer = score.footers.default.elements[0] as TextBoxElement;
    score.staff.elements.unshift(body);
    beginLayoutOperation(workspace);
    const state = new LayoutReconciliation();
    state.apply(score, [
      { element: header, width: header.width, height: 100 },
      { element: footer, width: footer.width, height: 90 },
      { element: body, width: body.width, height: 80 },
    ]);
    header.width += 20;
    footer.width += 20;
    state.apply(score, [
      { element: header, width: header.width, height: 50 },
      { element: footer, width: footer.width, height: 40 },
      { element: body, width: body.width, height: 30 },
    ]);
    expect(header.height).toBe(100);
    expect(footer.height).toBe(90);
    expect(body.height).toBe(30);
  });
});

describe('explicit workspace layout settlement', () => {
  it('shares pending-marker decisions and detects superseded operations', () => {
    const workspace = new Workspace();
    const settlement = new WorkspaceLayoutSettlement(workspace);
    const reservations = beginLayoutOperation(workspace);
    reservations.pending = true;
    expect(settlement.apply([])).toBe(true);
    reservations.pending = false;
    expect(settlement.apply([])).toBe(false);
    beginLayoutOperation(workspace, true);
    expect(() => settlement.apply([])).toThrow('LAYOUT_OPERATION_SUPERSEDED');
  });
});
