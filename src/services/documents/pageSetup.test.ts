import { describe, expect, it } from 'vitest';

import { PageSetup } from '@/models/PageSetup';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import {
  readHeaderFooterSettings,
  readPageSetup,
  updatePageSetup,
} from './pageSetup';
import {
  headerFooterSettingsSchema,
  pageSetupSchema,
  projectSettings,
} from './pageSetupSchema';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('focused page and header/footer settings', () => {
  it('covers every persisted setting exactly once and excludes content, getters and transient settings', () => {
    const setup = new PageSetup();
    const page = readPageSetup(setup);
    const headerFooter = readHeaderFooterSettings(setup);
    expect(Object.keys(page).filter((key) => key in headerFooter)).toEqual([]);
    const persisted = { ...setup } as Partial<PageSetup>;
    delete persisted.lyricsMelismaSpacing;
    delete persisted.lyricsMelismaThickness;
    expect({ ...page, ...headerFooter }).toEqual(persisted);
    expect(projectSettings(page, ['pageSize', 'topMargin'])).toEqual({
      pageSize: 'Letter',
      topMargin: 96,
    });
    expect(projectSettings(headerFooter, [])).toEqual({});
    expect(Object.keys(page)).toEqual(Object.keys(pageSetupSchema.shape));
    expect(Object.keys(headerFooter)).toEqual(
      Object.keys(headerFooterSettingsSchema.shape),
    );
  });

  it('applies partial updates with derived custom geometry in a single undo step', () => {
    const workspace = new Workspace(false);
    const setup = workspace.score.pageSetup;
    const original = { ...setup };
    updatePageSetup(
      workspace,
      {
        pageSize: 'Custom',
        landscape: true,
        pageWidthCustom: 576,
        pageHeightCustom: 864,
        topMargin: 50,
      },
      'page',
    );
    expect(setup.pageWidth).toBe(864);
    expect(setup.pageHeight).toBe(576);
    expect(setup.topMargin).toBe(50);
    expect(setup.bottomMargin).toBe(original.bottomMargin);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    expect({ ...setup }).toEqual(original);
    workspace.commandService.redo();
    expect(setup.pageWidth).toBe(864);
    expect(setup.topMargin).toBe(50);
    updatePageSetup(workspace, { pageSize: 'A4', landscape: false }, 'page');
    expect(setup.pageWidth).toBeCloseTo(793.700787);
    expect(setup.pageHeight).toBeCloseTo(1122.519685);
  });

  it('validates before mutation and rejects derived fields, cross-tool fields, nulls and invalid geometry', () => {
    for (const changes of [
      { pageWidth: 1 },
      { showHeader: true },
      { topMargin: -1 },
      { lineHeight: 0 },
      { pageWidthCustom: null },
      { direction: 'invalid' },
      { topMargin: Number.POSITIVE_INFINITY },
      { leftMargin: 10000 },
    ]) {
      const workspace = new Workspace(false);
      const before = { ...workspace.score.pageSetup };
      expect(() => updatePageSetup(workspace, changes, 'page')).toThrow();
      expect({ ...workspace.score.pageSetup }).toEqual(before);
      expect(workspace.hasUnsavedChanges).toBe(false);
    }
    const workspace = new Workspace(false);
    expect(() =>
      updatePageSetup(workspace, { firstPageNumber: 0 }, 'headerFooter'),
    ).toThrow();
    expect(() =>
      updatePageSetup(workspace, { landscape: true }, 'headerFooter'),
    ).toThrow();
  });

  it('preserves all header/footer template identities and content across settings edits and undo', () => {
    const workspace = new Workspace(false);
    const elements = [...workspace.score.headersAndFooters];
    const original = readHeaderFooterSettings(workspace.score.pageSetup);
    updatePageSetup(
      workspace,
      {
        showHeader: true,
        richHeaderFooter: true,
        headerDifferentOddEven: true,
        firstPageNumber: 12,
      },
      'headerFooter',
    );
    expect(workspace.score.pageSetup.showHeader).toBe(true);
    for (const [
      index,
      element,
    ] of workspace.score.headersAndFooters.entries()) {
      expect(element).toBe(elements[index]);
    }
    workspace.commandService.undo();
    expect(readHeaderFooterSettings(workspace.score.pageSetup)).toEqual(
      original,
    );
    workspace.commandService.redo();
    expect(workspace.score.pageSetup.firstPageNumber).toBe(12);
  });

  it('does not record no-op updates and persists both kinds of settings through save/load', () => {
    const workspace = new Workspace(false);
    expect(updatePageSetup(workspace, {}, 'page')).toBe(false);
    expect(
      updatePageSetup(workspace, { showHeader: false }, 'headerFooter'),
    ).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(false);
    updatePageSetup(
      workspace,
      { pageSize: 'A5', landscape: true, topMargin: 20 },
      'page',
    );
    updatePageSetup(
      workspace,
      {
        showHeader: true,
        headerMargin: 15,
        numerals: 'easternArabic',
        firstPageNumber: 3,
      },
      'headerFooter',
    );
    const loaded = SaveService.LoadScoreFromJson(
      JSON.parse(JSON.stringify(SaveService.SaveScoreToJson(workspace.score))),
    );
    expect(readPageSetup(loaded.pageSetup)).toEqual(
      readPageSetup(workspace.score.pageSetup),
    );
    expect(readHeaderFooterSettings(loaded.pageSetup)).toEqual(
      readHeaderFooterSettings(workspace.score.pageSetup),
    );
  });
});
