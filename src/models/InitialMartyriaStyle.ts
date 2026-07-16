import type { ModeKeyElement } from '@/models/Element';
import type { Fthora, QuantitativeNeume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import type { Scale, ScaleNote } from '@/models/Scales';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  TraditionalGreekV1: 'builtin:traditional-greek-v1',
} as const;

export type TerminologyField =
  | 'completeModeName'
  | 'modeWord'
  | 'plagalWord'
  | 'ordinal'
  | 'absoluteModeLabel'
  | 'fromWord';

export interface ModeTerminology {
  id: string;
  displayName: string;
  languageTag: string;
  direction: 'ltr' | 'rtl';
  numberingSystem?: string;
  values: Partial<
    Record<TerminologyField, Partial<Record<ModeKeyMode, string>>>
  >;
}

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

export interface ComponentBase {
  id: string;
  visibleForModes?: ModeKeyMode[];
  appearance?: InitialMartyriaAppearance;
}

export type InitialMartyriaComponent =
  | (ComponentBase & {
      kind: 'notationGlyph';
      source: 'modeWord' | 'plagalWord' | 'graveWord' | 'traditionalModeSign';
    })
  | (ComponentBase & { kind: 'terminology'; field: TerminologyField })
  | (ComponentBase & {
      kind: 'modeNumber';
      scheme: 'absolute' | 'familyOrdinal';
    })
  | (ComponentBase & { kind: 'startingPitchCluster' })
  | (ComponentBase & {
      kind: 'literal';
      text: string;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
    })
  | (ComponentBase & {
      kind: 'stackedText';
      upper: string;
      lower: string;
      gap: number;
    });

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  terminologyId: string | null;
  flowDirection: 'page' | 'terminology' | 'ltr' | 'rtl';
  textAppearance: InitialMartyriaAppearance;
  notationAppearance: InitialMartyriaAppearance;
  components: InitialMartyriaComponent[];
  modeOverrides?: Partial<
    Record<ModeKeyMode, { components: InitialMartyriaComponent[] }>
  >;
}

export interface InitialMartyriaStyleBundle {
  style: InitialMartyriaStyle;
  terminology?: ModeTerminology;
}

export interface InitialMartyriaContext {
  mode: ModeKeyMode;
  templateId: number | null;
  scale: Scale;
  scaleNote: ScaleNote;
  fthora: Fthora | null;
  traditionalModeSign: ModeSign;
  pitchCluster: {
    note: ModeSign | null;
    note2: ModeSign | null;
    fthoraAboveNote: Fthora | null;
    fthoraAboveNote2: Fthora | null;
    quantitativeNeumeAboveNote: ModeSign | null;
    quantitativeNeumeAboveNote2: ModeSign | null;
    quantitativeNeumeRight: QuantitativeNeume | null;
    fthoraAboveQuantitativeNeumeRight: Fthora | null;
  };
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
    scale: element.scale,
    scaleNote: element.scaleNote,
    fthora: element.fthora,
    traditionalModeSign: element.martyria,
    pitchCluster: {
      note: element.note,
      note2: element.note2,
      fthoraAboveNote: element.fthoraAboveNote,
      fthoraAboveNote2: element.fthoraAboveNote2,
      quantitativeNeumeAboveNote: element.quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2: element.quantitativeNeumeAboveNote2,
      quantitativeNeumeRight: element.quantitativeNeumeRight,
      fthoraAboveQuantitativeNeumeRight:
        element.fthoraAboveQuantitativeNeumeRight,
    },
  };
}

export const traditionalGreekInitialMartyriaStyle: InitialMartyriaStyle = {
  id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
  displayName: 'Traditional Greek',
  terminologyId: null,
  flowDirection: 'page',
  textAppearance: {},
  notationAppearance: {},
  components: [
    { id: 'mode-word', kind: 'notationGlyph', source: 'modeWord' },
    {
      id: 'plagal-word',
      kind: 'notationGlyph',
      source: 'plagalWord',
      visibleForModes: [5, 6, 8],
    },
    {
      id: 'grave-word',
      kind: 'notationGlyph',
      source: 'graveWord',
      visibleForModes: [7],
    },
    {
      id: 'traditional-mode-sign',
      kind: 'notationGlyph',
      source: 'traditionalModeSign',
    },
    { id: 'starting-pitch-cluster', kind: 'startingPitchCluster' },
  ],
};

export function isBuiltInInitialMartyriaStyleId(id: string) {
  return Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS).includes(
    id as (typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)[keyof typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS],
  );
}

export function getBuiltInInitialMartyriaStyle(id: string) {
  return id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1
    ? traditionalGreekInitialMartyriaStyle
    : null;
}

export function validateInitialMartyriaStyle(
  style: InitialMartyriaStyle,
  terminologies: ModeTerminology[] = [],
) {
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
  const componentSequences = [
    style.components,
    ...Object.entries(style.modeOverrides ?? {}).map(([mode, override]) => {
      if (override.components.length === 0) {
        errors.push(
          `Mode ${mode} override must contain at least one component.`,
        );
      }
      return override.components;
    }),
  ];
  if (
    style.terminologyId == null &&
    componentSequences.some(hasTerminologyComponent)
  ) {
    errors.push('Terminology components require a terminology pack.');
  }
  if (
    style.terminologyId != null &&
    !terminologies.some((terminology) => terminology.id === style.terminologyId)
  ) {
    errors.push(`Missing terminology pack: ${style.terminologyId}.`);
  }

  return errors;
}

export function validateModeTerminology(terminology: ModeTerminology) {
  const errors: string[] = [];

  if (terminology.id.trim() === '') {
    errors.push('A terminology id is required.');
  }
  if (terminology.displayName.trim() === '') {
    errors.push('A terminology display name is required.');
  }
  if (terminology.languageTag.trim() === '') {
    errors.push('A terminology language tag is required.');
  } else {
    try {
      Intl.getCanonicalLocales(terminology.languageTag);
      const numberFormat = new Intl.NumberFormat(
        terminology.languageTag,
        terminology.numberingSystem
          ? { numberingSystem: terminology.numberingSystem }
          : undefined,
      );
      if (
        terminology.numberingSystem != null &&
        numberFormat.resolvedOptions().numberingSystem !==
          terminology.numberingSystem
      ) {
        errors.push('The terminology locale or numbering system is invalid.');
      }
    } catch {
      errors.push('The terminology locale or numbering system is invalid.');
    }
  }
  for (const mode of [1, 2, 3, 4, 5, 6, 7, 8] as ModeKeyMode[]) {
    const completeName = terminology.values.completeModeName?.[mode]?.trim();
    if (completeName == null || completeName === '') {
      errors.push(`A complete mode name is required for mode ${mode}.`);
    }
  }

  return errors;
}

function hasTerminologyComponent(components: InitialMartyriaComponent[]) {
  return components.some((component) => component.kind === 'terminology');
}

export function isModeKeyMode(value: number): value is ModeKeyMode {
  return Number.isInteger(value) && value >= 1 && value <= 8;
}

export interface ResolvedInitialMartyriaRun {
  kind: 'notation' | 'pitchCluster' | 'text' | 'stackedText';
  componentId: string;
  appearance: InitialMartyriaAppearance;
  direction: 'ltr' | 'rtl';
  languageTag?: string;
  notation?: Array<ModeSign | Fthora | QuantitativeNeume>;
  text?: string;
  upper?: string;
  lower?: string;
  gap?: number;
}

export interface InitialMartyriaStyleResolution {
  style: InitialMartyriaStyle;
  missingStyleId: string | null;
  missingTerminologyId: string | null;
  flowDirection: 'ltr' | 'rtl';
  runs: ResolvedInitialMartyriaRun[];
}

export interface InitialMartyriaStyleResolverOptions {
  context: InitialMartyriaContext;
  activeStyleId?: string;
  styles?: InitialMartyriaStyle[];
  terminologies?: ModeTerminology[];
  pageSetup: Pick<
    PageSetup,
    | 'direction'
    | 'neumeDefaultFontFamily'
    | 'modeKeyDefaultColor'
    | 'modeKeyDefaultFontSize'
    | 'modeKeyDefaultStrokeWidth'
  >;
  element?: Pick<
    ModeKeyElement,
    'useDefaultStyle' | 'color' | 'fontSize' | 'strokeWidth'
  >;
  locale?: string;
}

export function resolveInitialMartyriaStyle(
  options: InitialMartyriaStyleResolverOptions,
): InitialMartyriaStyleResolution {
  const requestedId = options.activeStyleId;
  const style =
    (requestedId == null
      ? traditionalGreekInitialMartyriaStyle
      : (getBuiltInInitialMartyriaStyle(requestedId) ??
        options.styles?.find((candidate) => candidate.id === requestedId))) ??
    traditionalGreekInitialMartyriaStyle;
  const terminology = style.terminologyId
    ? options.terminologies?.find((item) => item.id === style.terminologyId)
    : undefined;
  const missingTerminologyId =
    style.terminologyId != null && terminology == null
      ? style.terminologyId
      : null;
  const resolvedStyle =
    missingTerminologyId == null ? style : traditionalGreekInitialMartyriaStyle;
  const components =
    resolvedStyle.modeOverrides?.[options.context.mode]?.components ??
    resolvedStyle.components;
  const flowDirection = getFlowDirection(
    resolvedStyle,
    terminology,
    options.pageSetup,
  );

  return {
    style: resolvedStyle,
    missingStyleId:
      requestedId != null && style.id !== requestedId ? requestedId : null,
    missingTerminologyId,
    flowDirection,
    runs: components.flatMap((component) =>
      resolveComponent(
        component,
        resolvedStyle,
        options,
        terminology,
        flowDirection,
      ),
    ),
  };
}

function resolveComponent(
  component: InitialMartyriaComponent,
  style: InitialMartyriaStyle,
  options: InitialMartyriaStyleResolverOptions,
  terminology: ModeTerminology | undefined,
  flowDirection: 'ltr' | 'rtl',
): ResolvedInitialMartyriaRun[] {
  const { context, element, pageSetup, locale = 'en' } = options;
  if (
    component.visibleForModes != null &&
    !component.visibleForModes.includes(context.mode)
  ) {
    return [];
  }

  const notationDefaultAppearance: InitialMartyriaAppearance = {
    fontFamily: pageSetup.neumeDefaultFontFamily,
    color: pageSetup.modeKeyDefaultColor,
    fontSize: pageSetup.modeKeyDefaultFontSize,
    strokeWidth: pageSetup.modeKeyDefaultStrokeWidth,
  };
  const explicitAppearance =
    element?.useDefaultStyle === false
      ? {
          color: element.color,
          fontSize: element.fontSize,
          strokeWidth: element.strokeWidth,
        }
      : {};
  const textAppearance = {
    ...notationDefaultAppearance,
    fontFamily: 'Source Serif',
    ...style.textAppearance,
    ...component.appearance,
    ...explicitAppearance,
  };
  const notationAppearance = {
    ...notationDefaultAppearance,
    ...style.notationAppearance,
    ...component.appearance,
    ...explicitAppearance,
  };

  if (component.kind === 'notationGlyph') {
    const glyph = getNotationGlyph(component.source, context);
    return glyph == null
      ? []
      : [
          {
            kind: 'notation',
            componentId: component.id,
            appearance: notationAppearance,
            direction: pageSetup.direction,
            notation: [glyph],
          },
        ];
  }
  if (component.kind === 'startingPitchCluster') {
    const notation = getPitchCluster(context);
    return [
      {
        kind: 'pitchCluster',
        componentId: component.id,
        appearance: notationAppearance,
        direction: pageSetup.direction,
        notation,
      },
    ];
  }
  if (component.kind === 'terminology') {
    const text = terminology?.values[component.field]?.[context.mode];
    if (text == null || terminology == null) {
      return [];
    }
    return [
      {
        kind: 'text',
        componentId: component.id,
        appearance: textAppearance,
        direction: terminology.direction,
        languageTag: terminology.languageTag,
        text,
      },
    ];
  }
  if (component.kind === 'modeNumber') {
    const value =
      component.scheme === 'absolute'
        ? context.mode
        : getFamilyOrdinal(context.mode);
    if (value == null) {
      return [];
    }
    const text = new Intl.NumberFormat(
      terminology?.languageTag ?? locale,
      terminology?.numberingSystem
        ? { numberingSystem: terminology.numberingSystem }
        : undefined,
    ).format(value);
    return [
      {
        kind: 'text',
        componentId: component.id,
        appearance: textAppearance,
        direction: terminology?.direction ?? flowDirection,
        languageTag: terminology?.languageTag ?? locale,
        text,
      },
    ];
  }
  if (component.kind === 'literal') {
    return [
      {
        kind: 'text',
        componentId: component.id,
        appearance: textAppearance,
        direction: component.direction ?? flowDirection,
        languageTag: component.languageTag,
        text: component.text,
      },
    ];
  }
  return [
    {
      kind: 'stackedText',
      componentId: component.id,
      appearance: textAppearance,
      direction: flowDirection,
      upper: component.upper,
      lower: component.lower,
      gap: component.gap,
    },
  ];
}

function getNotationGlyph(
  source: Extract<
    InitialMartyriaComponent,
    { kind: 'notationGlyph' }
  >['source'],
  context: InitialMartyriaContext,
) {
  if (source === 'modeWord') {
    return ModeSign.Ekhos;
  }
  if (source === 'plagalWord') {
    return context.mode > 4 && context.mode !== 7 ? ModeSign.Plagal : null;
  }
  if (source === 'graveWord') {
    return context.mode === 7 ? ModeSign.Varys : null;
  }
  return context.traditionalModeSign;
}

function getPitchCluster(context: InitialMartyriaContext) {
  const cluster = context.pitchCluster;
  return [
    cluster.note,
    cluster.fthoraAboveNote,
    cluster.quantitativeNeumeAboveNote,
    cluster.note2,
    cluster.fthoraAboveNote2,
    cluster.quantitativeNeumeAboveNote2,
    cluster.quantitativeNeumeRight,
    cluster.fthoraAboveQuantitativeNeumeRight,
  ].filter(
    (neume): neume is ModeSign | Fthora | QuantitativeNeume => neume != null,
  );
}

function getFlowDirection(
  style: InitialMartyriaStyle,
  terminology: ModeTerminology | undefined,
  pageSetup: Pick<PageSetup, 'direction'>,
) {
  if (style.flowDirection === 'page') {
    return pageSetup.direction;
  }
  if (style.flowDirection === 'terminology') {
    return terminology?.direction ?? 'ltr';
  }
  return style.flowDirection;
}

function getFamilyOrdinal(mode: ModeKeyMode) {
  const familyOrdinals: Record<ModeKeyMode, number | null> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 1,
    6: 2,
    7: null,
    8: 4,
  };

  return familyOrdinals[mode];
}
