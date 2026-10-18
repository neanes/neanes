import { type PageSetup, pageSizes } from '@/models/PageSetup';
import type { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';

import {
  type HeaderFooterChanges,
  headerFooterChangesSchema,
  headerFooterSettingsSchema,
  type PageSetupChanges,
  pageSetupChangesSchema,
  pageSetupSchema,
} from './pageSetupSchema';

export function readPageSetup(setup: PageSetup) {
  return pageSetupSchema.parse(
    Object.fromEntries(
      Object.keys(pageSetupSchema.shape).map((key) => [
        key,
        Reflect.get(setup, key),
      ]),
    ),
  );
}

export function readHeaderFooterSettings(setup: PageSetup) {
  return headerFooterSettingsSchema.parse(
    Object.fromEntries(
      Object.keys(headerFooterSettingsSchema.shape).map((key) => [
        key,
        Reflect.get(setup, key),
      ]),
    ),
  );
}

// Both settings tools update the same live PageSetup object in one undo step.
// Template content is managed separately through element transactions.
export function updatePageSetup(
  workspace: Workspace,
  input: PageSetupChanges | HeaderFooterChanges,
  kind: 'page' | 'headerFooter',
) {
  const changes =
    kind === 'page'
      ? pageSetupChangesSchema.parse(input)
      : headerFooterChangesSchema.parse(input);
  const setup = workspace.score.pageSetup;
  const next = { ...setup, ...changes };
  const values: Partial<PageSetup> = { ...changes };
  if (kind === 'page') {
    if (
      ['pageSize', 'landscape', 'pageWidthCustom', 'pageHeightCustom'].some(
        (key) => Object.hasOwn(changes, key),
      )
    ) {
      const size = pageSizes.find((size) => size.name === next.pageSize)!;
      const width =
        next.pageSize === 'Custom' ? next.pageWidthCustom : size.width;
      const height =
        next.pageSize === 'Custom' ? next.pageHeightCustom : size.height;
      values.pageWidth = next.landscape ? height : width;
      values.pageHeight = next.landscape ? width : height;
    }
    const pageWidth = values.pageWidth ?? setup.pageWidth;
    const pageHeight = values.pageHeight ?? setup.pageHeight;
    if (
      next.leftMargin + next.rightMargin >= pageWidth ||
      next.topMargin + next.bottomMargin >= pageHeight
    ) {
      throw new Error(
        'INVALID_PAGE_SETUP: Margins must leave a positive content area.',
      );
    }
  }
  if (
    Object.entries(values).every(
      ([key, value]) => Reflect.get(setup, key) === value,
    )
  ) {
    return false;
  }
  workspace.commandService.executeAsBatch([
    new CommandFactory<PageSetup>().create('update-properties', {
      target: setup,
      newValues: values,
    }),
  ]);
  workspace.hasUnsavedChanges = true;
  return true;
}
