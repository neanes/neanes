import { describe, expect, it } from 'vitest';

import { TextBoxElement } from '@/models/Element';
import { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { updatePageSetup } from '@/services/documents/pageSetup';

import { WorkerSettlement } from './workerSettlement';

describe('worker settlement reuse', () => {
  it('reuses successful settlement across reads, derived measurements and saves', () => {
    const workspace = new Workspace();
    const box = new TextBoxElement();
    workspace.score.staff.elements.unshift(box);
    const settlements = new WorkerSettlement();
    expect(settlements.has(workspace)).toBe(false);
    const complete = settlements.begin(workspace);
    box.height = 123;
    complete();
    expect(settlements.has(workspace)).toBe(true);
    workspace.markContentSaved(workspace.contentStateId);
    workspace.filePath = '/scores/saved.byzx';
    expect(settlements.has(workspace)).toBe(true);
    expect(settlements.has(workspace)).toBe(true);
  });

  it('invalidates on tracked settings edits and undo even when content returns', () => {
    const workspace = new Workspace();
    const settlements = new WorkerSettlement();
    settlements.begin(workspace)();
    updatePageSetup(workspace, { leftMargin: 80 }, 'page');
    expect(settlements.has(workspace)).toBe(false);
    workspace.commandService.undo();
    expect(settlements.has(workspace)).toBe(false);
    settlements.begin(workspace)();
    expect(settlements.has(workspace)).toBe(true);
    workspace.commandService.redo();
    expect(settlements.has(workspace)).toBe(false);
  });

  it('does not reuse another workspace or a replaced score', () => {
    const workspace = new Workspace();
    const settlements = new WorkerSettlement();
    settlements.begin(workspace)();
    const other = new Workspace();
    other.id = workspace.id;
    expect(settlements.has(other)).toBe(false);
    workspace.score = new Score();
    expect(settlements.has(workspace)).toBe(false);
  });

  it('does not cache incomplete or failed attempts and allows retry', () => {
    const workspace = new Workspace();
    const settlements = new WorkerSettlement();
    settlements.begin(workspace)();
    // A new attempt removes the previous success before any fallible work.
    settlements.begin(workspace);
    expect(settlements.has(workspace)).toBe(false);
    settlements.begin(workspace)();
    expect(settlements.has(workspace)).toBe(true);
  });

  it('rejects completion after an intervening edit or a newer attempt', () => {
    const workspace = new Workspace();
    const settlements = new WorkerSettlement();
    const edited = settlements.begin(workspace);
    workspace.updateStaffLyrics('Changed');
    edited();
    expect(settlements.has(workspace)).toBe(false);
    const superseded = settlements.begin(workspace);
    const complete = settlements.begin(workspace);
    superseded();
    expect(settlements.has(workspace)).toBe(false);
    complete();
    expect(settlements.has(workspace)).toBe(true);
  });

  it('invalidates every document on font changes, including pending settlement', () => {
    const first = new Workspace();
    const second = new Workspace();
    const settlements = new WorkerSettlement();
    settlements.begin(first)();
    const complete = settlements.begin(second);
    settlements.invalidate();
    complete();
    expect(settlements.has(first)).toBe(false);
    expect(settlements.has(second)).toBe(false);
    settlements.begin(second)();
    expect(settlements.has(second)).toBe(true);
  });

  it('disposes only the closed document and ignores its late completion', () => {
    const first = new Workspace();
    const second = new Workspace();
    const settlements = new WorkerSettlement();
    const complete = settlements.begin(first);
    settlements.begin(second)();
    settlements.dispose(first);
    complete();
    expect(settlements.has(first)).toBe(false);
    expect(settlements.has(second)).toBe(true);
    settlements.dispose(second);
    expect(settlements.has(second)).toBe(false);
  });
});
