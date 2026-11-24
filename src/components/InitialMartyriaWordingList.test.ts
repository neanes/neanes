import { describe, expect, it } from 'vitest';

import { enumerateInitialMartyriaStructures } from '@/models/InitialMartyriaGrammar';
import { getInitialMartyriaLabelVariants } from '@/models/InitialMartyriaLexicon';
import { getInitialMartyriaWordingKey } from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  initialMartyriaLanguageIds,
} from '@/models/InitialMartyriaStyle';

import {
  buildInitialMartyriaWordingList,
  createInitialMartyriaWordingFilterSelection,
  filterInitialMartyriaWordingList,
  getInitialMartyriaWordingFilters,
  getInitialMartyriaWordingRows,
  INITIAL_MARTYRIA_COMMON_GROUP,
  INITIAL_MARTYRIA_NEUME_FONT_GROUP,
  type InitialMartyriaWordingAxes,
  type InitialMartyriaWordingGroupKey,
  initialMartyriaWordingGroupMethods,
} from './InitialMartyriaWordingList';

function getEveryAxes(): InitialMartyriaWordingAxes[] {
  return initialMartyriaLanguageIds.flatMap((languageId) =>
    [undefined, ...getInitialMartyriaLabelVariants(languageId)].flatMap(
      (labelVariant) =>
        [false, true].map((transliterateNoteNames) => ({
          languageId,
          labelVariant,
          transliterateNoteNames,
        })),
    ),
  );
}

const english: InitialMartyriaWordingAxes = {
  languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
  transliterateNoteNames: false,
};

describe('buildInitialMartyriaWordingList', () => {
  it('lists every enumerable wording exactly once', () => {
    for (const axes of getEveryAxes()) {
      const rows = getInitialMartyriaWordingRows(
        buildInitialMartyriaWordingList(axes),
      );
      const keys = rows.map((row) => row.key);
      expect(new Set(keys).size, JSON.stringify(axes)).toBe(keys.length);

      for (const method of initialMartyriaWordingGroupMethods) {
        for (const { structure } of enumerateInitialMartyriaStructures({
          ...axes,
          modeIdentificationMethod: method,
        })) {
          expect(keys, JSON.stringify(structure)).toContain(
            getInitialMartyriaWordingKey({
              structure,
              lettering: INITIAL_MARTYRIA_LETTERINGS.Text,
            }),
          );
        }
      }
    }
  });

  it('lists the common wordings and the sign alone in one group, once each', () => {
    for (const axes of getEveryAxes()) {
      const groups = buildInitialMartyriaWordingList(axes);
      const common = groups.find(
        (group) => group.key === INITIAL_MARTYRIA_COMMON_GROUP,
      )!;
      expect(
        common.rows.every(
          (row) =>
            row.commonWordingNames.length > 0 ||
            row.structure.modeIdentificationMethod ===
              INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone,
        ),
      ).toBe(true);
      const methods = common.rows.map((row) =>
        initialMartyriaWordingGroupMethods.indexOf(
          row.structure.modeIdentificationMethod,
        ),
      );
      expect(methods).toEqual([...methods].sort((a, b) => a - b));
      for (const group of groups) {
        if (group.key !== INITIAL_MARTYRIA_COMMON_GROUP) {
          expect(
            group.rows.some(
              (row) =>
                row.commonWordingNames.length > 0 &&
                row.lettering === INITIAL_MARTYRIA_LETTERINGS.Text,
            ),
            `${JSON.stringify(axes)} ${group.key}`,
          ).toBe(false);
        }
      }
    }
  });

  it('groups rows by how they identify the mode, in a fixed order', () => {
    for (const axes of getEveryAxes()) {
      const groups = buildInitialMartyriaWordingList(axes);
      const order: InitialMartyriaWordingGroupKey[] = [
        INITIAL_MARTYRIA_NEUME_FONT_GROUP,
        INITIAL_MARTYRIA_COMMON_GROUP,
        ...initialMartyriaWordingGroupMethods,
      ];
      const keys = groups.map((group) => group.key);
      expect(keys).toEqual(order.filter((key) => keys.includes(key)));
      for (const group of groups) {
        if (
          group.key !== INITIAL_MARTYRIA_NEUME_FONT_GROUP &&
          group.key !== INITIAL_MARTYRIA_COMMON_GROUP
        ) {
          expect(
            group.rows.every(
              (row) => row.structure.modeIdentificationMethod === group.key,
            ),
          ).toBe(true);
        }
      }
    }
  });

  it('opens Greek with the neume font group', () => {
    const groups = buildInitialMartyriaWordingList({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      transliterateNoteNames: false,
    });

    expect(groups[0].key).toBe(INITIAL_MARTYRIA_NEUME_FONT_GROUP);
    expect(
      groups[0].rows.map((row) => [
        row.structure.modeIdentificationMethod,
        row.lettering,
      ]),
    ).toEqual([
      [
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        INITIAL_MARTYRIA_LETTERINGS.MusicFont,
      ],
      [
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone,
        INITIAL_MARTYRIA_LETTERINGS.MusicFont,
      ],
    ]);
    expect(groups[0].rows[0].commonWordingNames).toEqual(['classic']);
    for (const axes of getEveryAxes()) {
      if (axes.languageId !== INITIAL_MARTYRIA_LANGUAGE_IDS.Greek) {
        expect(
          buildInitialMartyriaWordingList(axes).some(
            (group) => group.key === INITIAL_MARTYRIA_NEUME_FONT_GROUP,
          ),
        ).toBe(false);
      }
    }
  });

  it('describes every row with a caption distinct within its group', () => {
    for (const axes of getEveryAxes()) {
      for (const group of buildInitialMartyriaWordingList(axes)) {
        // Rows in one group may show the mode in different ways, which the
        // picker names beside the caption; common wordings show a curated
        // caption instead of the generated one.
        const captions = group.rows.map((row) =>
          JSON.stringify([
            row.structure.modeIdentificationMethod,
            row.commonWordingNames.length > 0
              ? row.commonWordingNames
              : row.captionParts,
          ]),
        );
        for (const row of group.rows) {
          expect(row.captionParts.length).toBeGreaterThan(0);
        }
        expect(
          new Set(captions).size,
          `${JSON.stringify(axes)} ${group.key}: ${captions.join(' / ')}`,
        ).toBe(captions.length);
      }
    }
  });

  it('names what sets English sign rows apart', () => {
    const signRows = buildInitialMartyriaWordingList(english).find(
      (group) =>
        group.key === INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    )!.rows;

    expect(
      signRows.map((row) =>
        row.captionParts.map((part) =>
          part.kind === 'plagal'
            ? part.scheme
            : part.kind === 'labelPosition'
              ? `${part.label} ${part.position} ${part.identifier}`
              : part.kind,
        ),
      ),
    ).toEqual([['Mode after sign'], ['Mode before sign']]);
  });
});

describe('getInitialMartyriaWordingFilters', () => {
  it('offers a filter only where the language has more than one value', () => {
    const filtersFor = (axes: InitialMartyriaWordingAxes) =>
      getInitialMartyriaWordingFilters(
        buildInitialMartyriaWordingList(axes),
        createInitialMartyriaWordingFilterSelection(),
      );

    const englishFilters = filtersFor(english);
    expect(englishFilters.number?.map((option) => option.label)).toEqual([
      '1',
      '1st',
      'I',
      'One',
      'First',
    ]);
    expect(englishFilters.plagal?.map((option) => option.value)).toEqual([
      INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
      INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
      INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    ]);
    expect(englishFilters.plagal?.map((option) => option.label)).toEqual([
      'Plagal of First Mode',
      'First Plagal Mode',
      'Mode Five',
    ]);
    expect(englishFilters.method?.map((option) => option.value)).toEqual(
      initialMartyriaWordingGroupMethods,
    );

    expect(filtersFor({ ...english, labelVariant: 'tone' }).plagal).toBeNull();
    const greek = filtersFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      transliterateNoteNames: false,
    });
    expect(greek.plagal).toBeNull();
    expect(greek.number?.map((option) => option.label)).toEqual([
      'αʹ',
      'πρῶτος',
    ]);
    const romanian = filtersFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
      transliterateNoteNames: false,
    });
    expect(romanian.number).toBeNull();
    expect(romanian.plagal).toBeNull();
  });

  it('quotes number forms that every row prints, plagal or not', () => {
    const rows = getInitialMartyriaWordingRows(
      buildInitialMartyriaWordingList(english),
    );
    const plagalOfFirst = rows.find(
      (row) =>
        row.number?.label === '1st' &&
        row.plagal ===
          INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    );
    const numbered = rows.find(
      (row) =>
        row.number?.label === '1st' &&
        row.plagal === INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    );

    expect(plagalOfFirst).toBeDefined();
    expect(numbered).toBeDefined();
  });

  it('counts the rows each option leaves, given the other filters', () => {
    const groups = buildInitialMartyriaWordingList(english);
    const rows = getInitialMartyriaWordingRows(groups);
    const selection = {
      ...createInitialMartyriaWordingFilterSelection(),
      method: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    const filters = getInitialMartyriaWordingFilters(groups, selection);

    // Sign rows print no number, so every number option leaves none.
    expect(filters.allCounts.number).toBe(4);
    expect(filters.number?.every((option) => option.count === 0)).toBe(true);
    // The method filter counts as if it were All.
    expect(filters.allCounts.method).toBe(rows.length);
    expect(filters.method?.reduce((sum, option) => sum + option.count, 0)).toBe(
      rows.length,
    );
    for (const option of filters.plagal!) {
      expect(option.count).toBe(
        getInitialMartyriaWordingRows(
          filterInitialMartyriaWordingList(groups, {
            ...selection,
            plagal: option.value,
          }),
        ).length,
      );
    }
  });

  it('returns every row, in order, when every filter is All', () => {
    for (const axes of getEveryAxes()) {
      const groups = buildInitialMartyriaWordingList(axes);
      expect(
        filterInitialMartyriaWordingList(
          groups,
          createInitialMartyriaWordingFilterSelection(),
        ),
      ).toEqual(groups);
    }
  });

  it('keeps the list order and drops groups left empty', () => {
    const groups = buildInitialMartyriaWordingList(english);
    const filtered = filterInitialMartyriaWordingList(groups, {
      ...createInitialMartyriaWordingFilterSelection(),
      number: '1',
    });

    expect(filtered.map((group) => group.key)).toEqual([
      INITIAL_MARTYRIA_COMMON_GROUP,
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    ]);
    for (const group of filtered) {
      const original = groups.find((other) => other.key === group.key)!;
      expect(group.rows).toEqual(
        original.rows.filter((row) => row.number?.key === '1'),
      );
    }
  });
});
