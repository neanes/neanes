import { ModeKeyElement } from '@/models/Element';
import { createDefaultInitialMartyriaTypography } from '@/models/InitialMartyriaBuiltInStyles';
import {
  getInitialMartyriaContext,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
} from '@/models/InitialMartyriaResolver';
import type {
  InitialMartyriaStructure,
  InitialMartyriaStyle,
  ResolvedInitialMartyriaRun,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { PageSetup } from '@/models/PageSetup';
import { createDefaultParagraphStyles } from '@/models/ParagraphStyle';
export function encodeRun(run: ResolvedInitialMartyriaRun) {
  if (run.kind === 'glyph') {
    return '<modeSign>';
  }
  if (run.kind === 'startingPitch') {
    return '<pitch>';
  }
  const prefix = run.semantic === 'plagalAbbreviation' ? 'greek:' : '';
  return run.content.layout === 'inline'
    ? prefix + run.content.text
    : prefix + run.content.lines.join('/');
}

/** An unsaved style with the language's default typography. */
export function styleFor(
  structure: InitialMartyriaStructure,
): InitialMartyriaStyle {
  return {
    id: 'test',
    displayName: 'Test',
    basedOn: null,
    structure,
    ...createDefaultInitialMartyriaTypography(structure.languageId),
  };
}

export const paragraphStyles = createDefaultParagraphStyles();

export function elementForMode(mode: number) {
  return ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((template) => template.mode === mode)!,
  );
}

export function elementForTemplate(templateId: number) {
  return ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((template) => template.id === templateId)!,
  );
}

export const glyphFontSize = 20;

export function resolve(
  style: InitialMartyriaStyle,
  element: ModeKeyElement,
  neumeFontFamily = 'Neanes',
) {
  const pageSetup = new PageSetup();
  pageSetup.neumeDefaultFontFamily = neumeFontFamily;
  return resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(element),
    resolvedStyle: resolveInitialMartyriaStyleAppearances(
      style,
      paragraphStyles,
      neumeFontFamily,
    ),
    pageSetup,
    glyphFontSize,
  });
}

export function textOf(runs: ResolvedInitialMartyriaRun[]) {
  return runs.flatMap((run) => {
    if (run.kind !== 'text') {
      return [];
    }
    return run.content.layout === 'inline'
      ? [run.content.text]
      : run.content.lines;
  });
}
