import type { ModeKeyElement } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  TraditionalGreekV1: 'builtin:traditional-greek-v1',
  EnglishPlagalFirstV1: 'builtin:english-plagal-first-v1',
  EnglishSignFirstV1: 'builtin:english-sign-first-v1',
  EnglishModeBeforeSignV1: 'builtin:english-mode-before-sign-v1',
  EnglishFifthV1: 'builtin:english-fifth-v1',
  EnglishNumberV1: 'builtin:english-number-v1',
  EnglishPlagalOfSecondV1: 'builtin:english-plagal-of-second-v1',
  EnglishPlagalNumberV1: 'builtin:english-plagal-number-v1',
  EnglishOrdinalPlagalV1: 'builtin:english-ordinal-plagal-v1',
  RomanianGlasNumberV1: 'builtin:romanian-glas-number-v1',
  RomanianGlasV1: 'builtin:romanian-glas-v1',
} as const;

export interface InitialMartyriaVisibility {
  modes: ModeKeyMode[];
  variationOverrides: Array<{ templateId: number; visible: boolean }>;
}

export type InitialMartyriaTextContent =
  | { layout: 'inline'; text: string }
  | { layout: 'stacked'; lines: string[]; gap: number };

export type InitialMartyriaGlyphSource =
  | { type: 'fixed'; neume: Neume }
  | { type: 'derived'; value: 'modeSign' | 'startingPitchCluster' };

export interface InitialMartyriaAppearance {
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
  baselineShift?: number;
  offsetInline?: number;
  spacingBefore?: number;
  spacingAfter?: number;
}

interface InitialMartyriaComponentBase {
  id: string;
  visibility: InitialMartyriaVisibility;
  appearance?: InitialMartyriaAppearance;
}

export type InitialMartyriaComponent =
  | (InitialMartyriaComponentBase & {
      kind: 'text';
      content: InitialMartyriaTextContent;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
    })
  | (InitialMartyriaComponentBase & {
      kind: 'glyph';
      source: InitialMartyriaGlyphSource;
    });

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  textParagraphStyleId?: string | null;
  flowDirection: 'page' | 'ltr' | 'rtl';
  textAppearance: InitialMartyriaAppearance;
  glyphAppearance: InitialMartyriaAppearance;
  components: InitialMartyriaComponent[];
}

export interface InitialMartyriaContext {
  mode: ModeKeyMode;
  templateId: number | null;
  traditionalModeSign: Neume;
  pitchCluster: Neume[];
}

export function getInitialMartyriaContext(
  element: ModeKeyElement,
): InitialMartyriaContext {
  if (!isModeKeyMode(element.mode)) {
    throw new Error(`Invalid initial martyria mode: ${element.mode}`);
  }
  return {
    mode: element.mode,
    templateId: element.templateId,
    traditionalModeSign: element.martyria,
    pitchCluster: [
      element.note,
      element.fthoraAboveNote,
      element.quantitativeNeumeAboveNote,
      element.note2,
      element.fthoraAboveNote2,
      element.quantitativeNeumeAboveNote2,
      element.quantitativeNeumeRight,
      element.fthoraAboveQuantitativeNeumeRight,
    ].filter((neume) => neume != null) as Neume[],
  };
}

const allModes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];
const visibleFor = (modes: ModeKeyMode[]): InitialMartyriaVisibility => ({
  modes,
  variationOverrides: [],
});

export const traditionalGreekInitialMartyriaStyle: InitialMartyriaStyle = {
  id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
  displayName: 'Traditional Greek',
  flowDirection: 'page',
  textAppearance: {},
  glyphAppearance: {},
  components: [
    {
      id: 'mode-word',
      kind: 'glyph',
      source: { type: 'fixed', neume: ModeSign.Ekhos },
      visibility: visibleFor(allModes),
    },
    {
      id: 'plagal-word',
      kind: 'glyph',
      source: { type: 'fixed', neume: ModeSign.Plagal },
      visibility: visibleFor([5, 6, 8]),
    },
    {
      id: 'grave-word',
      kind: 'glyph',
      source: { type: 'fixed', neume: ModeSign.Varys },
      visibility: visibleFor([7]),
    },
    {
      id: 'traditional-mode-sign',
      kind: 'glyph',
      source: { type: 'derived', value: 'modeSign' },
      visibility: visibleFor(allModes),
    },
    {
      id: 'starting-pitch-cluster',
      kind: 'glyph',
      source: { type: 'derived', value: 'startingPitchCluster' },
      visibility: visibleFor(allModes),
    },
  ],
};

function text(
  id: string,
  value: string,
  modes: ModeKeyMode[] = allModes,
): InitialMartyriaComponent {
  return {
    id,
    kind: 'text',
    content: { layout: 'inline', text: value },
    visibility: visibleFor(modes),
  };
}
function glyph(
  id: string,
  source: InitialMartyriaGlyphSource,
  modes: ModeKeyMode[] = allModes,
): InitialMartyriaComponent {
  return { id, kind: 'glyph', source, visibility: visibleFor(modes) };
}
function plagal() {
  return glyph('plagal', { type: 'fixed', neume: ModeSign.Plagal }, [5, 6, 8]);
}
function sign() {
  return glyph('mode-sign', { type: 'derived', value: 'modeSign' });
}
function pitch() {
  return glyph('pitch', { type: 'derived', value: 'startingPitchCluster' });
}
function builtIn(
  id: string,
  displayName: string,
  components: InitialMartyriaComponent[],
): InitialMartyriaStyle {
  return {
    id,
    displayName,
    flowDirection: 'page',
    textAppearance: {},
    glyphAppearance: {},
    components,
  };
}
export const builtInInitialMartyriaStyles: InitialMartyriaStyle[] = [
  traditionalGreekInitialMartyriaStyle,
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalFirstV1,
    'English Plagal First',
    [plagal(), sign(), text('mode', 'Mode'), pitch()],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    'English Sign First',
    [sign(), plagal(), text('mode', 'Mode'), pitch()],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeBeforeSignV1,
    'English Mode Before Sign',
    [plagal(), text('mode', 'Mode'), sign(), pitch()],
  ),
  builtIn(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishFifthV1, 'English Fifth', [
    text('fifth', 'Fifth Mode', [5]),
    plagal(),
    sign(),
    pitch(),
  ]),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishNumberV1,
    'English Number',
    [text('number', 'Mode 5', [5]), plagal(), sign(), pitch()],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalOfSecondV1,
    'English Plagal of Second',
    [text('second', 'Plagal of Second Mode', [6]), plagal(), sign(), pitch()],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberV1,
    'English Plagal Number',
    [text('number', 'Plagal Mode 2', [6]), plagal(), sign(), pitch()],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalPlagalV1,
    'English Ordinal Plagal',
    [text('ordinal', '2nd Plagal Mode', [6]), plagal(), sign(), pitch()],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1,
    'Romanian Glas Number',
    [text('glas-five', 'Glas 5', [5]), plagal(), sign(), pitch()],
  ),
  builtIn(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasV1, 'Romanian Glas', [
    text('glas', 'Glas'),
    plagal(),
    sign(),
    pitch(),
  ]),
];

export function isBuiltInInitialMartyriaStyleId(id: string) {
  return Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS).includes(
    id as (typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)[keyof typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS],
  );
}

export function getBuiltInInitialMartyriaStyle(id: string) {
  return builtInInitialMartyriaStyles.find((style) => style.id === id) ?? null;
}

export function isInitialMartyriaComponentVisible(
  visibility: InitialMartyriaVisibility,
  context: Pick<InitialMartyriaContext, 'mode' | 'templateId'>,
) {
  const override =
    context.templateId == null
      ? undefined
      : visibility.variationOverrides.find(
          (item) => item.templateId === context.templateId,
        );
  return override?.visible ?? visibility.modes.includes(context.mode);
}

export function validateInitialMartyriaStyle(style: InitialMartyriaStyle) {
  const errors: string[] = [];
  if (style.id.trim() === '') {
    errors.push('A style id is required.');
  }
  if (isBuiltInInitialMartyriaStyleId(style.id)) {
    errors.push('Built-in initial martyria styles are immutable.');
  }
  if (style.displayName.trim() === '') {
    errors.push('A style display name is required.');
  }
  if (style.components.length === 0) {
    errors.push('A style must contain at least one component.');
  }
  const ids = new Set<string>();
  for (const component of style.components) {
    if (ids.has(component.id)) {
      errors.push(`Duplicate component id: ${component.id}.`);
    }
    ids.add(component.id);
    validateVisibility(component.visibility, errors);
    validateAppearance(component.appearance, errors);
    if (component.kind === 'text') {
      if (
        component.content.layout === 'inline' &&
        component.content.text === ''
      ) {
        errors.push(`Text component ${component.id} is empty.`);
      }
      if (
        component.content.layout === 'stacked' &&
        (component.content.lines.length < 2 ||
          component.content.lines.some((line) => line === '') ||
          !Number.isFinite(component.content.gap))
      ) {
        errors.push(`Stacked text component ${component.id} is invalid.`);
      }
    } else if (
      component.source.type === 'derived' &&
      component.source.value !== 'modeSign' &&
      component.source.value !== 'startingPitchCluster'
    ) {
      errors.push(`Unknown derived glyph source: ${component.source.value}.`);
    } else if (
      component.source.type === 'fixed' &&
      typeof component.source.neume !== 'string'
    ) {
      errors.push(`Fixed glyph component ${component.id} is invalid.`);
    }
  }
  validateAppearance(style.textAppearance, errors);
  validateAppearance(style.glyphAppearance, errors);
  return errors;
}

function validateVisibility(
  visibility: InitialMartyriaVisibility,
  errors: string[],
) {
  const modes = new Set<ModeKeyMode>();
  for (const mode of visibility.modes) {
    if (!isModeKeyMode(mode) || modes.has(mode)) {
      errors.push('Component visibility modes are invalid.');
    }
    modes.add(mode);
  }
  const variations = new Set<number>();
  for (const override of visibility.variationOverrides) {
    if (
      !Number.isInteger(override.templateId) ||
      variations.has(override.templateId)
    ) {
      errors.push('Component variation overrides are invalid.');
    }
    variations.add(override.templateId);
  }
}
function validateAppearance(
  appearance: InitialMartyriaAppearance | undefined,
  errors: string[],
) {
  if (appearance == null) {
    return;
  }
  for (const value of [
    appearance.fontSize,
    appearance.strokeWidth,
    appearance.baselineShift,
    appearance.offsetInline,
    appearance.spacingBefore,
    appearance.spacingAfter,
  ]) {
    if (value != null && !Number.isFinite(value)) {
      errors.push('Component appearance contains an invalid number.');
    }
  }
}
export function isModeKeyMode(value: number): value is ModeKeyMode {
  return Number.isInteger(value) && value >= 1 && value <= 8;
}

export type ResolvedInitialMartyriaRun =
  | {
      kind: 'glyph';
      componentId: string;
      appearance: InitialMartyriaAppearance;
      direction: 'ltr' | 'rtl';
      glyphs: Neume[];
    }
  | {
      kind: 'text';
      componentId: string;
      appearance: InitialMartyriaAppearance;
      direction: 'ltr' | 'rtl';
      languageTag?: string;
      content: InitialMartyriaTextContent;
    };

export interface InitialMartyriaStyleResolution {
  style: InitialMartyriaStyle;
  runs: ResolvedInitialMartyriaRun[];
  flowDirection: 'ltr' | 'rtl';
  missingStyleId: string | null;
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  activeStyleId?: string;
  styles?: InitialMartyriaStyle[];
  paragraphStyles?: ParagraphStyle[];
  pageSetup: Pick<PageSetup, 'direction'>;
}): InitialMartyriaStyleResolution {
  const selected =
    options.activeStyleId == null
      ? traditionalGreekInitialMartyriaStyle
      : (getBuiltInInitialMartyriaStyle(options.activeStyleId) ??
        options.styles?.find((style) => style.id === options.activeStyleId));
  const style = selected ?? traditionalGreekInitialMartyriaStyle;
  const flowDirection =
    style.flowDirection === 'page'
      ? options.pageSetup.direction
      : style.flowDirection;
  return {
    style,
    flowDirection,
    missingStyleId:
      selected == null && options.activeStyleId != null
        ? options.activeStyleId
        : null,
    runs: style.components.flatMap((component) =>
      resolveComponent(
        component,
        style,
        options.context,
        flowDirection,
        options.paragraphStyles,
      ),
    ),
  };
}

function resolveComponent(
  component: InitialMartyriaComponent,
  style: InitialMartyriaStyle,
  context: InitialMartyriaContext,
  flowDirection: 'ltr' | 'rtl',
  paragraphStyles: ParagraphStyle[] | undefined,
): ResolvedInitialMartyriaRun[] {
  if (!isInitialMartyriaComponentVisible(component.visibility, context)) {
    return [];
  }
  if (component.kind === 'text') {
    return [
      {
        kind: 'text',
        componentId: component.id,
        appearance: {
          ...(paragraphStyles == null
            ? {}
            : resolveParagraphStyle(
                paragraphStyles,
                style.textParagraphStyleId,
              )),
          ...style.textAppearance,
          ...component.appearance,
        },
        direction: component.direction ?? flowDirection,
        languageTag: component.languageTag,
        content: component.content,
      },
    ];
  }
  const glyphs =
    component.source.type === 'fixed'
      ? [component.source.neume]
      : component.source.value === 'modeSign'
        ? [context.traditionalModeSign]
        : context.pitchCluster;
  return glyphs.length === 0
    ? []
    : [
        {
          kind: 'glyph',
          componentId: component.id,
          appearance: { ...style.glyphAppearance, ...component.appearance },
          direction: context.mode ? flowDirection : flowDirection,
          glyphs,
        },
      ];
}
