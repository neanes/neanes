import type { ModeKeyElement } from '@/models/Element';
import type { Fthora, Neume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  TraditionalGreekV1: 'builtin:traditional-greek-v1',
  TraditionalGreekV2: 'builtin:traditional-greek-v2',
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

/** The authorable Stage 1 component kinds. */
export type InitialMartyriaComponentKind =
  | 'text'
  | 'stackedText'
  | 'ekhosGlyph'
  | 'plagalGlyph'
  | 'modeSignGlyph'
  | 'varysGlyph'
  | 'startingNoteCluster';

export type InitialMartyriaCanonicalNote =
  | ModeSign.Ni
  | ModeSign.Pa
  | ModeSign.Vou
  | ModeSign.Ga
  | ModeSign.Thi
  | ModeSign.Ke
  | ModeSign.Zo;
export type StartingNoteRendering = 'neume' | 'customText';

export interface InitialMartyriaStartingNoteText {
  names: Record<InitialMartyriaCanonicalNote, string>;
  languageTag?: string;
  direction?: 'ltr' | 'rtl';
  appearance: Pick<
    InitialMartyriaAppearance,
    | 'fontFamily'
    | 'fontStyle'
    | 'fontSize'
    | 'color'
    | 'strokeWidth'
    | 'strokeColor'
    | 'baselineShift'
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
}

export type InitialMartyriaTextAppearance = InitialMartyriaAppearance;

interface InitialMartyriaComponentBase {
  id: string;
  visibility: InitialMartyriaVisibility;
}

export type InitialMartyriaComponent =
  | (InitialMartyriaComponentBase & {
      kind: 'text';
      content: string;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
      appearance?: InitialMartyriaTextAppearance;
    })
  | (InitialMartyriaComponentBase & {
      kind: 'stackedText';
      top: string;
      bottom: string;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
      appearance?: InitialMartyriaTextAppearance;
    })
  | (InitialMartyriaComponentBase & {
      kind: 'ekhosGlyph' | 'plagalGlyph' | 'modeSignGlyph' | 'varysGlyph';
    })
  | (InitialMartyriaComponentBase & {
      kind: 'startingNoteCluster';
      rendering: StartingNoteRendering;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
      appearance?: InitialMartyriaTextAppearance;
    });

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  textParagraphStyleId?: string | null;
  flowDirection: 'page' | 'ltr' | 'rtl';
  textAppearance: InitialMartyriaAppearance;
  startingNoteText: InitialMartyriaStartingNoteText;
  components: InitialMartyriaComponent[];
}

type ResolvedInitialMartyriaTextContent =
  | { layout: 'inline'; text: string }
  | { layout: 'stacked'; lines: string[]; gap: number };

export const initialMartyriaSingletonKinds: InitialMartyriaComponentKind[] = [
  'stackedText',
  'ekhosGlyph',
  'plagalGlyph',
  'modeSignGlyph',
  'varysGlyph',
  'startingNoteCluster',
];

export function isInitialMartyriaComponentKind(
  kind: string,
): kind is InitialMartyriaComponentKind {
  return ['text', ...initialMartyriaSingletonKinds].includes(
    kind as InitialMartyriaComponentKind,
  );
}

function graphemeCount(value: string) {
  return [
    ...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
      value,
    ),
  ].length;
}

export interface InitialMartyriaPitchNote {
  note: InitialMartyriaCanonicalNote;
  fthoraAbove: Fthora | null;
  quantitativeNeumeAbove: ModeSign | null;
}

export interface InitialMartyriaPitchCluster {
  primary: InitialMartyriaPitchNote | null;
  secondary: InitialMartyriaPitchNote | null;
  trailingGlyphs: Neume[];
}

export interface InitialMartyriaContext {
  mode: ModeKeyMode;
  templateId: number | null;
  traditionalModeSign: Neume;
  pitchCluster: InitialMartyriaPitchCluster;
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
    pitchCluster: {
      primary: isInitialMartyriaCanonicalNote(element.note)
        ? {
            note: element.note,
            fthoraAbove: element.fthoraAboveNote,
            quantitativeNeumeAbove: element.quantitativeNeumeAboveNote,
          }
        : null,
      secondary: isInitialMartyriaCanonicalNote(element.note2)
        ? {
            note: element.note2,
            fthoraAbove: element.fthoraAboveNote2,
            quantitativeNeumeAbove: element.quantitativeNeumeAboveNote2,
          }
        : null,
      trailingGlyphs: [
        element.quantitativeNeumeRight,
        element.fthoraAboveQuantitativeNeumeRight,
      ].filter((neume) => neume != null) as Neume[],
    },
  };
}

export const initialMartyriaCanonicalNotes: InitialMartyriaCanonicalNote[] = [
  ModeSign.Ni,
  ModeSign.Pa,
  ModeSign.Vou,
  ModeSign.Ga,
  ModeSign.Thi,
  ModeSign.Ke,
  ModeSign.Zo,
];

export function createInitialMartyriaStartingNoteText(): InitialMartyriaStartingNoteText {
  return {
    names: {
      [ModeSign.Ni]: 'Νη',
      [ModeSign.Pa]: 'Πα',
      [ModeSign.Vou]: 'Βου',
      [ModeSign.Ga]: 'Γα',
      [ModeSign.Thi]: 'Δι',
      [ModeSign.Ke]: 'Κε',
      [ModeSign.Zo]: 'Ζο',
    },
    languageTag: 'el',
    direction: 'ltr',
    appearance: {},
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
  startingNoteText: createInitialMartyriaStartingNoteText(),
  components: [
    { id: 'mode-word', kind: 'ekhosGlyph', visibility: visibleFor(allModes) },
    {
      id: 'plagal-word',
      kind: 'plagalGlyph',
      visibility: visibleFor([5, 6, 8]),
    },
    { id: 'grave-word', kind: 'varysGlyph', visibility: visibleFor([7]) },
    {
      id: 'traditional-mode-sign',
      kind: 'modeSignGlyph',
      visibility: visibleFor(allModes),
    },
    {
      id: 'starting-pitch-cluster',
      kind: 'startingNoteCluster',
      rendering: 'neume',
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
    content: value,
    visibility: visibleFor(modes),
  };
}
function glyph(
  id: string,
  kind: 'ekhosGlyph' | 'plagalGlyph' | 'modeSignGlyph' | 'varysGlyph',
  modes: ModeKeyMode[] = allModes,
): InitialMartyriaComponent {
  return { id, kind, visibility: visibleFor(modes) };
}
function plagal() {
  return glyph('plagal', 'plagalGlyph', [5, 6, 8]);
}
function sign() {
  return glyph('mode-sign', 'modeSignGlyph');
}
function pitch(): InitialMartyriaComponent {
  return {
    id: 'pitch',
    kind: 'startingNoteCluster',
    rendering: 'neume',
    visibility: visibleFor(allModes),
  };
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
    startingNoteText: createInitialMartyriaStartingNoteText(),
    components,
  };
}

const traditionalGreekV2InitialMartyriaStyle: InitialMartyriaStyle = {
  id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV2,
  displayName: 'Traditional Greek V2',
  flowDirection: 'page',
  textAppearance: {},
  startingNoteText: createInitialMartyriaStartingNoteText(),
  components: [
    text('mode-word', 'Ἦχος'),
    {
      id: 'plagal-word',
      kind: 'stackedText',
      top: 'λ',
      bottom: 'π',
      visibility: visibleFor([5, 6, 8]),
    },
    text('grave-mode', 'Βαρύς', [7]),
    glyph('traditional-mode-sign', 'modeSignGlyph'),
    {
      id: 'starting-pitch-cluster',
      kind: 'startingNoteCluster',
      rendering: 'customText',
      visibility: visibleFor(allModes),
    },
  ],
};
export const builtInInitialMartyriaStyles: InitialMartyriaStyle[] = [
  traditionalGreekInitialMartyriaStyle,
  traditionalGreekV2InitialMartyriaStyle,
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
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishFifthV1,
    'English Ordinal',
    [
      text('first', 'First', [1]),
      text('second', 'Second', [2]),
      text('third', 'Third', [3]),
      text('fourth', 'Fourth', [4]),
      text('fifth', 'Fifth', [5]),
      text('sixth', 'Sixth', [6]),
      text('seventh', 'Grave', [7]),
      text('eigth', 'Eighth', [8]),
      text('mode', 'Mode'),
      plagal(),
      sign(),
      pitch(),
    ],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishNumberV1,
    'English Numbered',
    [
      text('mode', 'Mode'),
      text('number-1', '1', [1]),
      text('number-2', '2', [2]),
      text('number-3', '3', [3]),
      text('number-4', '4', [4]),
      text('number-5', '5', [5]),
      text('number-6', '6', [6]),
      text('number-7', '7', [7]),
      text('number-8', '8', [8]),
      plagal(),
      sign(),
      pitch(),
    ],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalOfSecondV1,
    'English Full Name',
    [
      text('plagal-word', 'Plagal of', [5, 6, 8]),
      text('first', 'First', [1]),
      text('second', 'Second', [2]),
      text('third', 'Third', [3]),
      text('fourth', 'Fourth', [4]),
      text('fifth', 'Fifth', [5]),
      text('sixth', 'Sixth', [6]),
      text('seventh', 'Grave', [7]),
      text('eigth', 'Eighth', [8]),
      text('mode', 'Mode'),
      plagal(),
      sign(),
      pitch(),
    ],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberV1,
    'English Plagal Number',
    [
      text('plagal', 'Plagal', [5, 6, 8]),
      text('grave', 'Grave', [7]),
      text('mode', 'Mode'),
      text('number-1', '1', [1, 5]),
      text('number-2', '2', [2, 6]),
      text('number-3', '3', [3]),
      text('number-4', '4', [4, 8]),
      plagal(),
      sign(),
      pitch(),
    ],
  ),
  builtIn(
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1,
    'Romanian Glas Number',
    [
      text('glas', 'Glas'),
      text('glas-one', '1', [1]),
      text('glas-two', '2', [2]),
      text('glas-three', '3', [3]),
      text('glas-four', '4', [4]),
      text('glas-five', '5', [5]),
      text('glas-six', '6', [6]),
      text('glas-seven', '7', [7]),
      text('glas-eight', '8', [8]),
      plagal(),
      sign(),
      pitch(),
    ],
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
    if (
      component.kind === 'text' ||
      component.kind === 'stackedText' ||
      component.kind === 'startingNoteCluster'
    ) {
      validateAppearance(component.appearance, errors);
    }
    if (component.kind === 'text') {
      const content = component.content;
      if (content === '') {
        errors.push(`Text component ${component.id} is empty.`);
      }
    } else if (component.kind === 'stackedText') {
      if (
        graphemeCount(component.top) !== 1 ||
        graphemeCount(component.bottom) !== 1
      ) {
        errors.push(
          `Stacked text component ${component.id} must contain two graphemes.`,
        );
      }
    }
  }
  for (const kind of initialMartyriaSingletonKinds) {
    if (
      style.components.filter((component) => component.kind === kind).length > 1
    ) {
      errors.push(`Only one ${kind} component is allowed.`);
    }
  }
  validateAppearance(style.textAppearance, errors);
  validateAppearance(style.startingNoteText.appearance, errors);
  const noteNames = style.startingNoteText.names;
  for (const note of initialMartyriaCanonicalNotes) {
    if (noteNames[note].trim() === '') {
      errors.push(`Starting note mapping ${note} is blank.`);
    }
  }
  if (style.startingNoteText.languageTag != null) {
    try {
      new Intl.Locale(style.startingNoteText.languageTag);
    } catch {
      errors.push('Starting note language tag is invalid.');
    }
  }
  if (
    style.startingNoteText.direction != null &&
    style.startingNoteText.direction !== 'ltr' &&
    style.startingNoteText.direction !== 'rtl'
  ) {
    errors.push('Starting note direction is invalid.');
  }
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
  if (
    appearance.fontSize != null &&
    (!Number.isFinite(appearance.fontSize) || appearance.fontSize <= 0)
  ) {
    errors.push('Component appearance contains an invalid font size.');
  }
  if (
    appearance.strokeWidth != null &&
    (!Number.isFinite(appearance.strokeWidth) || appearance.strokeWidth < 0)
  ) {
    errors.push('Component appearance contains an invalid stroke width.');
  }
  if (
    appearance.baselineShift != null &&
    !Number.isFinite(appearance.baselineShift)
  ) {
    errors.push('Component appearance contains an invalid baseline shift.');
  }
}
export function isModeKeyMode(value: number): value is ModeKeyMode {
  return Number.isInteger(value) && value >= 1 && value <= 8;
}
export function isInitialMartyriaCanonicalNote(
  value: ModeSign | null,
): value is InitialMartyriaCanonicalNote {
  return initialMartyriaCanonicalNotes.includes(
    value as InitialMartyriaCanonicalNote,
  );
}

export type ResolvedInitialMartyriaRun =
  | {
      kind: 'glyph';
      componentId: string;
      semantic?: 'ekhos' | 'plagal' | 'modeSign' | 'varys';
      appearance: InitialMartyriaAppearance;
      direction: 'ltr' | 'rtl';
      glyphs: Neume[];
      pitchCluster?: InitialMartyriaPitchCluster;
    }
  | {
      kind: 'text';
      componentId: string;
      appearance: InitialMartyriaAppearance;
      direction: 'ltr' | 'rtl';
      languageTag?: string;
      usesComponentAppearance?: boolean;
      content: ResolvedInitialMartyriaTextContent;
    }
  | {
      kind: 'startingPitch';
      componentId: string;
      appearance: InitialMartyriaAppearance;
      noteText: InitialMartyriaStartingNoteText;
      direction: 'ltr' | 'rtl';
      cluster: InitialMartyriaPitchCluster;
    };

export interface InitialMartyriaStyleResolution {
  style: InitialMartyriaStyle;
  runs: ResolvedInitialMartyriaRun[];
  flowDirection: 'ltr' | 'rtl';
  missingStyleId: string | null;
}

export function resolveInitialMartyriaBaseTextAppearance(
  style: InitialMartyriaStyle,
  paragraphStyles: ParagraphStyle[] | undefined,
): InitialMartyriaAppearance {
  return {
    ...(paragraphStyles == null
      ? {}
      : resolveParagraphStyle(paragraphStyles, style.textParagraphStyleId)),
    ...style.textAppearance,
  };
}

export type InitialMartyriaSeparator =
  'none' | 'wordSpace' | 'modeSign' | 'plagal' | 'varys' | 'startingNote';

export function getInitialMartyriaFixedSeparatorWidth(
  separator: InitialMartyriaSeparator,
) {
  switch (separator) {
    case 'varys':
      return 0.415;
    case 'modeSign':
    case 'plagal':
    case 'startingNote':
      return 0.43;
    default:
      return null;
  }
}

export function getInitialMartyriaPitchNoteGlyphCount(
  note: InitialMartyriaPitchNote | null,
) {
  return note == null
    ? 0
    : [note.note, note.fthoraAbove, note.quantitativeNeumeAbove].filter(
        (neume) => neume != null,
      ).length;
}

export function getInitialMartyriaPitchClusterPrimaryGlyphCount(
  cluster: InitialMartyriaPitchCluster,
) {
  return getInitialMartyriaPitchNoteGlyphCount(cluster.primary);
}

export function getInitialMartyriaPitchClusterGlyphCount(
  cluster: InitialMartyriaPitchCluster,
) {
  return [cluster.primary, cluster.secondary].reduce(
    (count, note) => count + getInitialMartyriaPitchNoteGlyphCount(note),
    0,
  );
}

/** Resolves spacing from the visible adjacent pair, so hidden components never add gaps. */
export function getInitialMartyriaSeparatorBefore(
  runs: ResolvedInitialMartyriaRun[],
  index: number,
): InitialMartyriaSeparator {
  if (index <= 0 || index >= runs.length) {
    return 'none';
  }
  const before = runs[index - 1];
  const after = runs[index];
  const isModeSign = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'glyph' && run.semantic === 'modeSign';
  const isPlagal = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'text'
      ? run.content.layout === 'stacked'
      : run.kind === 'glyph' && run.semantic === 'plagal';
  const isWordLike = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'text' ||
    run.kind === 'startingPitch' ||
    (run.kind === 'glyph' &&
      (run.semantic === 'ekhos' ||
        run.semantic === 'plagal' ||
        run.semantic === 'varys'));
  const isStartingNote = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'startingPitch' ||
    (run.kind === 'glyph' && run.pitchCluster != null);
  if (isStartingNote(after)) {
    return 'startingNote';
  }
  if (after.kind === 'glyph' && after.semantic === 'varys') {
    return 'varys';
  }
  if (isModeSign(before) || isModeSign(after)) {
    return 'modeSign';
  }
  if (isPlagal(before) || isPlagal(after)) {
    return 'plagal';
  }
  if (isWordLike(before) && isWordLike(after)) {
    return 'wordSpace';
  }
  return 'none';
}

export function getInitialMartyriaSeparatorAfter(
  runs: ResolvedInitialMartyriaRun[],
  index: number,
): InitialMartyriaSeparator {
  if (index < 0 || index >= runs.length) {
    return 'none';
  }
  return index === runs.length - 1
    ? runs[index].kind === 'text' && runs[index].content.layout === 'stacked'
      ? 'plagal'
      : 'none'
    : getInitialMartyriaSeparatorBefore(runs, index + 1);
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  activeStyleId?: string;
  fallbackStyleId?: string;
  styles?: InitialMartyriaStyle[];
  paragraphStyles?: ParagraphStyle[];
  pageSetup: Pick<PageSetup, 'direction'>;
}): InitialMartyriaStyleResolution {
  const selected =
    options.activeStyleId == null
      ? options.fallbackStyleId == null
        ? traditionalGreekInitialMartyriaStyle
        : (getBuiltInInitialMartyriaStyle(options.fallbackStyleId) ??
          options.styles?.find((style) => style.id === options.fallbackStyleId))
      : (getBuiltInInitialMartyriaStyle(options.activeStyleId) ??
        options.styles?.find((style) => style.id === options.activeStyleId) ??
        (options.fallbackStyleId == null
          ? undefined
          : (getBuiltInInitialMartyriaStyle(options.fallbackStyleId) ??
            options.styles?.find(
              (style) => style.id === options.fallbackStyleId,
            ))));
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
  if (component.kind === 'text' || component.kind === 'stackedText') {
    const content: ResolvedInitialMartyriaTextContent =
      component.kind === 'stackedText'
        ? {
            layout: 'stacked',
            lines: [component.top, component.bottom],
            gap: 0,
          }
        : { layout: 'inline', text: component.content };
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
        usesComponentAppearance: component.appearance != null,
        content,
      },
    ];
  }
  if (component.kind === 'startingNoteCluster') {
    return resolveStartingNoteComponent(
      component,
      style,
      context,
      flowDirection,
      paragraphStyles,
    );
  }
  const glyphs =
    component.kind === 'ekhosGlyph'
      ? [ModeSign.Ekhos]
      : component.kind === 'plagalGlyph'
        ? [ModeSign.Plagal]
        : component.kind === 'varysGlyph'
          ? [ModeSign.Varys]
          : [context.traditionalModeSign];
  return [
    {
      kind: 'glyph',
      componentId: component.id,
      semantic:
        component.kind === 'ekhosGlyph'
          ? 'ekhos'
          : component.kind === 'plagalGlyph'
            ? 'plagal'
            : component.kind === 'varysGlyph'
              ? 'varys'
              : 'modeSign',
      appearance: {},
      direction: flowDirection,
      glyphs,
    },
  ];
}

function resolveStartingNoteComponent(
  component: Extract<InitialMartyriaComponent, { kind: 'startingNoteCluster' }>,
  style: InitialMartyriaStyle,
  context: InitialMartyriaContext,
  flowDirection: 'ltr' | 'rtl',
  paragraphStyles: ParagraphStyle[] | undefined,
): ResolvedInitialMartyriaRun[] {
  const appearance = {
    ...(paragraphStyles == null
      ? {}
      : resolveParagraphStyle(paragraphStyles, style.textParagraphStyleId)),
    ...style.textAppearance,
    ...style.startingNoteText.appearance,
    ...component.appearance,
  };
  if (
    component.rendering === 'customText' &&
    hasCompleteStartingNoteText(style.startingNoteText, context.pitchCluster)
  ) {
    return [
      {
        kind: 'startingPitch',
        componentId: component.id,
        appearance: {},
        noteText: { ...style.startingNoteText, appearance },
        direction:
          component.direction ??
          style.startingNoteText.direction ??
          flowDirection,
        cluster: context.pitchCluster,
      },
    ];
  }
  const glyphs = flattenPitchCluster(context.pitchCluster);
  return glyphs.length === 0
    ? []
    : [
        {
          kind: 'glyph',
          componentId: component.id,
          appearance: {},
          direction: component.direction ?? flowDirection,
          glyphs,
          pitchCluster: context.pitchCluster,
        },
      ];
}

function hasCompleteStartingNoteText(
  noteText: InitialMartyriaStartingNoteText,
  cluster: InitialMartyriaPitchCluster,
) {
  return [cluster.primary, cluster.secondary]
    .filter((note): note is InitialMartyriaPitchNote => note != null)
    .every((note) => noteText.names[note.note].trim() !== '');
}

function flattenPitchCluster(cluster: InitialMartyriaPitchCluster) {
  return [
    cluster.primary?.note,
    cluster.primary?.fthoraAbove,
    cluster.primary?.quantitativeNeumeAbove,
    cluster.secondary?.note,
    cluster.secondary?.fthoraAbove,
    cluster.secondary?.quantitativeNeumeAbove,
    ...cluster.trailingGlyphs,
  ].filter((neume) => neume != null) as Neume[];
}
