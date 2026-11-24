import {
  type CommonInitialMartyriaWordingName,
  commonInitialMartyriaWordings,
} from '@/models/InitialMartyriaCommonWordings';
import {
  enumerateInitialMartyriaStructures,
  initialMartyriaNumeralStyles,
  relationalModeNamingSchemes,
} from '@/models/InitialMartyriaGrammar';
import { getInitialMartyriaLabel } from '@/models/InitialMartyriaLexicon';
import {
  getInitialMartyriaLabelPosition,
  getInitialMartyriaModeReading,
  getInitialMartyriaNumberForm,
  getInitialMartyriaWordingKey,
  getSupportedInitialMartyriaLettering,
} from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLabelVariant,
  type InitialMartyriaLanguageId,
  type InitialMartyriaLettering,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaStructure,
  isInitialMartyriaModeSignAloneStructure,
  isInitialMartyriaTextStructure,
} from '@/models/InitialMartyriaStyle';

/*
 * The wording picker's list: every wording a language allows, grouped by
 * how it identifies the mode, with the common wordings first in each group,
 * and the filters that narrow it. Everything here is derived from the
 * grammar and lexicon, so the picker only formats it.
 */

/** The choices above the list, as set on every wording it holds. */
export interface InitialMartyriaWordingAxes {
  languageId: InitialMartyriaLanguageId;
  labelVariant?: InitialMartyriaLabelVariant;
  transliterateNoteNames: boolean;
}

/**
 * The order of the groups of wordings that are not common, after the neume
 * font and common groups.
 */
export const initialMartyriaWordingGroupMethods: readonly InitialMartyriaModeIdentificationMethod[] =
  [
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone,
  ];

export const INITIAL_MARTYRIA_NEUME_FONT_GROUP = 'neume-font';
export const INITIAL_MARTYRIA_COMMON_GROUP = 'common';

export type InitialMartyriaWordingGroupKey =
  | typeof INITIAL_MARTYRIA_NEUME_FONT_GROUP
  | typeof INITIAL_MARTYRIA_COMMON_GROUP
  | InitialMartyriaModeIdentificationMethod;

/** The mode an example of a plagal mode is given in. */
export const PLAGAL_EXAMPLE_MODE = 5;

/*
 * The mode a number form is quoted in. Every naming numbers the first mode
 * alike, so the quote matches what each row prints; mode 5 would quote 5th
 * for a row that prints Plagal of 1st.
 */
const NUMBER_EXAMPLE_MODE = 1;

/**
 * One piece of a generated caption, in terms of what prints. The picker
 * turns each into words.
 */
export type InitialMartyriaCaptionPart =
  | { kind: 'number'; number: string }
  | { kind: 'plagal'; scheme: InitialMartyriaModeNamingScheme }
  | {
      kind: 'labelPosition';
      /** What the mode word is placed against: the number or the sign. */
      identifier: 'number' | 'sign';
      position: 'before' | 'after';
      label: string;
    }
  | { kind: 'noWords' };

type InitialMartyriaCandidateCaptionPart = Exclude<
  InitialMartyriaCaptionPart,
  { kind: 'noWords' }
>;

/** How a wording prints the number of a mode, as the Number filter offers. */
export interface InitialMartyriaNumberFacet {
  /** Equal for number words that differ only by place (Primer, primero). */
  key: string;
  label: string;
  /** Sorts the forms plainest first: 1, 1st, I, One, First. */
  order: number[];
}

export interface InitialMartyriaWordingRow {
  key: string;
  structure: InitialMartyriaStructure;
  lettering: InitialMartyriaLettering;
  /** The common wordings written this way, for their curated captions. */
  commonWordingNames: CommonInitialMartyriaWordingName[];
  /** What tells the row apart from the other rows of its group. */
  captionParts: InitialMartyriaCaptionPart[];
  /**
   * Whether the caption quotes the language's own number form or word for
   * the mode, and so is set in the language's text font.
   */
  captionQuotesLanguage: boolean;
  number: InitialMartyriaNumberFacet | null;
  plagal: InitialMartyriaModeNamingScheme | null;
}

export interface InitialMartyriaWordingGroup {
  key: InitialMartyriaWordingGroupKey;
  rows: InitialMartyriaWordingRow[];
}

function compareOrder(a: number[], b: number[]) {
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) {
      return a[index] - b[index];
    }
  }
  return 0;
}

function getNumberFacet(
  structure: InitialMartyriaStructure,
): InitialMartyriaNumberFacet | null {
  if (!isInitialMartyriaTextStructure(structure)) {
    return null;
  }
  const label = getInitialMartyriaNumberForm(structure, NUMBER_EXAMPLE_MODE);
  // A number word changes with its place (Primer tono, Tono primero) but is
  // the same number form, so words go by their form after the mode word.
  const keyForm =
    structure.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Words
      ? getInitialMartyriaNumberForm(
          {
            ...structure,
            numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
          },
          NUMBER_EXAMPLE_MODE,
        )
      : label;
  return {
    key: keyForm.toLocaleLowerCase(structure.languageId),
    label,
    order: [
      initialMartyriaNumeralStyles.indexOf(structure.numeralStyle),
      structure.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal ? 0 : 1,
      structure.numberingSystem == null ? 0 : 1,
      structure.numeralQualifier ===
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal
        ? 0
        : 1,
    ],
  };
}

type RowDraft = Omit<
  InitialMartyriaWordingRow,
  'captionParts' | 'captionQuotesLanguage'
>;

function createRow(
  structure: InitialMartyriaStructure,
  lettering: InitialMartyriaLettering,
  commonWordingNames: CommonInitialMartyriaWordingName[],
): RowDraft {
  const wording = {
    structure,
    lettering: getSupportedInitialMartyriaLettering(lettering, structure),
  };
  return {
    key: getInitialMartyriaWordingKey(wording),
    ...wording,
    commonWordingNames,
    number: getNumberFacet(structure),
    plagal: isInitialMartyriaModeSignAloneStructure(structure)
      ? null
      : structure.modeNamingScheme,
  };
}

/** Every part a caption could name for a row, in the order it names them. */
function getCandidateCaptionParts(
  row: RowDraft,
): InitialMartyriaCandidateCaptionPart[] {
  const structure = row.structure;
  if (isInitialMartyriaModeSignAloneStructure(structure)) {
    return [];
  }
  const parts: InitialMartyriaCandidateCaptionPart[] = [];
  if (row.number != null) {
    parts.push({ kind: 'number', number: row.number.label });
  }
  parts.push({ kind: 'plagal', scheme: structure.modeNamingScheme });
  parts.push({
    kind: 'labelPosition',
    identifier: isInitialMartyriaTextStructure(structure) ? 'number' : 'sign',
    position: getInitialMartyriaLabelPosition(structure),
    label: getInitialMartyriaLabel(structure),
  });
  return parts;
}

function getCaptionPartValue(
  parts: InitialMartyriaCaptionPart[],
  kind: InitialMartyriaCaptionPart['kind'],
) {
  return JSON.stringify(parts.find((part) => part.kind === kind) ?? null);
}

/**
 * The parts of each row's caption that set it apart within its group: the
 * kinds of part whose value varies there. A row with nothing to set it
 * apart is still described, by its first part.
 */
function withCaptionParts(rows: RowDraft[]): InitialMartyriaWordingRow[] {
  const candidates = rows.map(getCandidateCaptionParts);
  const kinds = (['number', 'plagal', 'labelPosition'] as const).filter(
    (kind) =>
      new Set(candidates.map((parts) => getCaptionPartValue(parts, kind)))
        .size > 1,
  );
  return rows.map((row, index) => {
    const parts = candidates[index];
    const distinguishing = parts.filter((part) => kinds.includes(part.kind));
    const captionParts: InitialMartyriaCaptionPart[] =
      distinguishing.length > 0
        ? distinguishing
        : parts.length > 0
          ? [parts[0]]
          : [{ kind: 'noWords' }];
    return {
      ...row,
      captionParts,
      // A common wording keeps its curated caption, which quotes nothing.
      captionQuotesLanguage:
        row.commonWordingNames.length === 0 &&
        captionParts.some(
          (part) => part.kind === 'number' || part.kind === 'labelPosition',
        ),
    };
  });
}

/** Adds a row unless another prints alike, which takes its captions. */
function addRow(rows: RowDraft[], row: RowDraft) {
  const existing = rows.find((other) => other.key === row.key);
  if (existing == null) {
    rows.push(row);
  } else {
    existing.commonWordingNames.push(...row.commonWordingNames);
  }
}

/**
 * Every wording of a language and its word for the mode, once each: the
 * neume font group first where the font can letter the language, then the
 * common wordings and the sign alone, then every other wording in one group
 * per way of identifying the mode, in grammar order.
 */
export function buildInitialMartyriaWordingList(
  axes: InitialMartyriaWordingAxes,
): InitialMartyriaWordingGroup[] {
  const neumeFontRows: RowDraft[] = [];
  const commonRows: RowDraft[] = [];
  const methodRows = new Map(
    initialMartyriaWordingGroupMethods.map((method) => [
      method,
      [] as RowDraft[],
    ]),
  );

  for (const wording of commonInitialMartyriaWordings) {
    if (
      wording.structure.languageId !== axes.languageId ||
      wording.structure.labelVariant !== axes.labelVariant
    ) {
      continue;
    }
    const row = createRow(
      { ...wording.structure, ...axes },
      wording.lettering,
      [wording.name],
    );
    addRow(
      row.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont
        ? neumeFontRows
        : commonRows,
      row,
    );
  }

  for (const method of initialMartyriaWordingGroupMethods) {
    for (const { structure } of enumerateInitialMartyriaStructures({
      ...axes,
      modeIdentificationMethod: method,
    })) {
      const row = createRow(structure, INITIAL_MARTYRIA_LETTERINGS.Text, []);
      if (
        method === INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone
      ) {
        // The sign alone is common in every language, in either lettering.
        addRow(commonRows, row);
        const neumeFontRow = createRow(
          structure,
          INITIAL_MARTYRIA_LETTERINGS.MusicFont,
          [],
        );
        if (neumeFontRow.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont) {
          addRow(neumeFontRows, neumeFontRow);
        }
      } else if (!commonRows.some((common) => common.key === row.key)) {
        addRow(methodRows.get(method)!, row);
      }
    }
  }

  // Common wordings that show the mode alike sit together, in group order.
  const methodOrder = (row: RowDraft) =>
    initialMartyriaWordingGroupMethods.indexOf(
      row.structure.modeIdentificationMethod,
    );
  commonRows.sort((a, b) => methodOrder(a) - methodOrder(b));

  const groups: [InitialMartyriaWordingGroupKey, RowDraft[]][] = [
    [INITIAL_MARTYRIA_NEUME_FONT_GROUP, neumeFontRows],
    [INITIAL_MARTYRIA_COMMON_GROUP, commonRows],
    ...methodRows,
  ];
  return groups
    .map(([key, rows]) => ({ key, rows: withCaptionParts(rows) }))
    .filter((group) => group.rows.length > 0);
}

export function getInitialMartyriaWordingRows(
  groups: InitialMartyriaWordingGroup[],
) {
  return groups.flatMap((group) => group.rows);
}

/*
 * Filters. Each narrows the list by what prints; null shows every value.
 */

export interface InitialMartyriaWordingFilterSelection {
  number: string | null;
  plagal: InitialMartyriaModeNamingScheme | null;
  method: InitialMartyriaModeIdentificationMethod | null;
}

export type InitialMartyriaWordingFilterName =
  keyof InitialMartyriaWordingFilterSelection;

export function createInitialMartyriaWordingFilterSelection(): InitialMartyriaWordingFilterSelection {
  return { number: null, plagal: null, method: null };
}

function getRowFilterValue(
  row: InitialMartyriaWordingRow,
  filter: InitialMartyriaWordingFilterName,
) {
  switch (filter) {
    case 'number':
      return row.number?.key ?? null;
    case 'plagal':
      return row.plagal;
    case 'method':
      return row.structure.modeIdentificationMethod;
  }
}

const filterNames: InitialMartyriaWordingFilterName[] = [
  'number',
  'plagal',
  'method',
];

function rowMatches(
  row: InitialMartyriaWordingRow,
  selection: InitialMartyriaWordingFilterSelection,
) {
  return filterNames.every(
    (filter) =>
      selection[filter] == null ||
      getRowFilterValue(row, filter) === selection[filter],
  );
}

/** The list narrowed by the filters, in its order, without empty groups. */
export function filterInitialMartyriaWordingList(
  groups: InitialMartyriaWordingGroup[],
  selection: InitialMartyriaWordingFilterSelection,
): InitialMartyriaWordingGroup[] {
  return groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => rowMatches(row, selection)),
    }))
    .filter((group) => group.rows.length > 0);
}

export interface InitialMartyriaWordingFilterOption<T> {
  value: T;
  /** How many rows the option leaves, given the other filters. */
  count: number;
}

export interface InitialMartyriaNumberFilterOption extends InitialMartyriaWordingFilterOption<string> {
  label: string;
}

export interface InitialMartyriaPlagalFilterOption extends InitialMartyriaWordingFilterOption<InitialMartyriaModeNamingScheme> {
  /** How the scheme names the plagal of the first mode, read aloud. */
  label: string;
}

export interface InitialMartyriaWordingFilters {
  /** How many rows All leaves for each filter, given the others. */
  allCounts: Record<InitialMartyriaWordingFilterName, number>;
  /** Each filter's options, or null where the list offers one value or none. */
  number: InitialMartyriaNumberFilterOption[] | null;
  plagal: InitialMartyriaPlagalFilterOption[] | null;
  method:
    | InitialMartyriaWordingFilterOption<InitialMartyriaModeIdentificationMethod>[]
    | null;
}

const modeNamingSchemeOrder: InitialMartyriaModeNamingScheme[] = [
  ...relationalModeNamingSchemes,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
];

/**
 * The values each filter offers over the whole list, with how many rows
 * each would leave given the other filters. The values come from the full
 * list, so the options stay put while filtering; an option that would leave
 * nothing has a count of zero and is shown disabled.
 */
export function getInitialMartyriaWordingFilters(
  groups: InitialMartyriaWordingGroup[],
  selection: InitialMartyriaWordingFilterSelection,
): InitialMartyriaWordingFilters {
  const rows = getInitialMartyriaWordingRows(groups);
  const countWith = (
    filter: InitialMartyriaWordingFilterName,
    value: string | null,
  ) =>
    rows.filter((row) => rowMatches(row, { ...selection, [filter]: value }))
      .length;
  const optionsOf = <T extends string>(
    filter: InitialMartyriaWordingFilterName,
    values: T[],
  ) =>
    values.length > 1
      ? values.map((value) => ({ value, count: countWith(filter, value) }))
      : null;

  const numberFacets = new Map<string, InitialMartyriaNumberFacet>();
  for (const row of rows) {
    if (row.number == null) {
      continue;
    }
    const existing = numberFacets.get(row.number.key);
    if (
      existing == null ||
      compareOrder(row.number.order, existing.order) < 0
    ) {
      numberFacets.set(row.number.key, row.number);
    }
  }
  const numberKeys = [...numberFacets.values()]
    .sort((a, b) => compareOrder(a.order, b.order))
    .map((facet) => facet.key);

  const plagalExamples = new Map<InitialMartyriaModeNamingScheme, string>();
  for (const row of rows) {
    if (row.plagal != null && !plagalExamples.has(row.plagal)) {
      plagalExamples.set(
        row.plagal,
        getInitialMartyriaModeReading(row.structure, PLAGAL_EXAMPLE_MODE),
      );
    }
  }

  const methods = initialMartyriaWordingGroupMethods.filter((method) =>
    rows.some((row) => row.structure.modeIdentificationMethod === method),
  );

  return {
    allCounts: {
      number: countWith('number', null),
      plagal: countWith('plagal', null),
      method: countWith('method', null),
    },
    number:
      optionsOf('number', numberKeys)?.map((option) => ({
        ...option,
        label: numberFacets.get(option.value)!.label,
      })) ?? null,
    plagal:
      optionsOf(
        'plagal',
        modeNamingSchemeOrder.filter((scheme) => plagalExamples.has(scheme)),
      )?.map((option) => ({
        ...option,
        label: plagalExamples.get(option.value)!,
      })) ?? null,
    method: optionsOf('method', methods),
  };
}
