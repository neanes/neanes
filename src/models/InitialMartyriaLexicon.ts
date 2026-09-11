import { ModeSign } from '@/models/Neumes';

import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaCanonicalNote,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaNoteNames,
  type InitialMartyriaNumeralQualifier,
  type InitialMartyriaNumeralStyle,
  type ModeKeyMode,
} from './InitialMartyriaStyle';

export const initialMartyriaCanonicalNotes: InitialMartyriaCanonicalNote[] = [
  ModeSign.Ni,
  ModeSign.Pa,
  ModeSign.Vou,
  ModeSign.Ga,
  ModeSign.Thi,
  ModeSign.Ke,
  ModeSign.Zo,
];

/* The same notes keyed by scale degree: degree 0 is Pa, wrapping to Ni. */
export const initialMartyriaCanonicalNotesByScaleDegree: InitialMartyriaCanonicalNote[] =
  [...initialMartyriaCanonicalNotes.slice(1), ModeSign.Ni];

/*
 * These note names are score content, deliberately kept independent of the
 * translator-editable UI locale files so that a locale edit can never change
 * rendered documents.
 */
export const originalGreekNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'Νη',
    [ModeSign.Pa]: 'Πα',
    [ModeSign.Vou]: 'Βου',
    [ModeSign.Ga]: 'Γα',
    [ModeSign.Thi]: 'Δι',
    [ModeSign.Ke]: 'Κε',
    [ModeSign.Zo]: 'Ζω',
  },
  direction: 'ltr',
  languageTag: 'el',
};

const transliteratedGreekNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'Ni',
    [ModeSign.Pa]: 'Pa',
    [ModeSign.Vou]: 'Vou',
    [ModeSign.Ga]: 'Ga',
    [ModeSign.Thi]: 'Di',
    [ModeSign.Ke]: 'Ke',
    [ModeSign.Zo]: 'Zo',
  },
  direction: 'ltr',
  languageTag: 'en',
};

const spanishTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'Ni',
    [ModeSign.Pa]: 'Pa',
    [ModeSign.Vou]: 'Vu',
    [ModeSign.Ga]: 'Ga',
    [ModeSign.Thi]: 'Di',
    [ModeSign.Ke]: 'Ke',
    [ModeSign.Zo]: 'Zo',
  },
  direction: 'ltr',
  languageTag: 'es',
};

const cyrillicTransliteratedNoteNames: InitialMartyriaNoteNames['names'] = {
  [ModeSign.Ni]: 'Ни',
  [ModeSign.Pa]: 'Па',
  [ModeSign.Vou]: 'Ву',
  [ModeSign.Ga]: 'Га',
  [ModeSign.Thi]: 'Ди',
  [ModeSign.Ke]: 'Ке',
  [ModeSign.Zo]: 'Зо',
};

const churchSlavonicTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: cyrillicTransliteratedNoteNames,
  direction: 'ltr',
  languageTag: 'cu',
};

const russianTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: cyrillicTransliteratedNoteNames,
  direction: 'ltr',
  languageTag: 'ru',
};

const romanianTransliteratedNoteNames: InitialMartyriaNoteNames = {
  // Romanian psaltic and academic sources consistently spell the note as Vu,
  // rather than the English transliteration Vou.
  // https://www.edituraunmb.ro/wp-content/uploads/2024/02/Cernatescu-Catalin-2023-ed.-Petru-Manuil-Efesiul-Antologhion-4.0.pdf
  // https://edumedia-depot.gei.de/server/api/core/bitstreams/11f769eb-6eed-40c3-a065-e9d46974cdce/content
  names: {
    ...transliteratedGreekNoteNames.names,
    [ModeSign.Vou]: 'Vu',
  },
  direction: 'ltr',
  languageTag: 'ro',
};

const indonesianTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: spanishTransliteratedNoteNames.names,
  direction: 'ltr',
  languageTag: 'id',
};

const arabicTransliteratedNoteNames: InitialMartyriaNoteNames = {
  // Arabic Byzantine-music teaching materials conventionally write the
  // solmization sequence Ni Pa Vou Ga Di Ke Zo as ني با فو غا ذي كه زو.
  // https://psaltika.com/lessons/lesson-01/
  // https://nicolasmalek.com/Lectures/byzantine-music-2
  names: {
    [ModeSign.Ni]: 'ني',
    [ModeSign.Pa]: 'با',
    [ModeSign.Vou]: 'فو',
    [ModeSign.Ga]: 'غا',
    [ModeSign.Thi]: 'ذي',
    [ModeSign.Ke]: 'كه',
    [ModeSign.Zo]: 'زو',
  },
  direction: 'rtl',
  languageTag: 'ar',
};

type InitialMartyriaModeTexts = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

type InitialMartyriaPronunciationOverrides = Partial<
  Pick<
    InitialMartyriaLexicon,
    | 'label'
    | 'ordinalWords'
    | 'plagalWord'
    | 'plagalCounterpartWord'
    | 'plagalCounterpartOrdinalWords'
    | 'graveWord'
  >
>;

export interface InitialMartyriaLexicon {
  /** Reading direction of the language's mode-name phrases. */
  direction: 'ltr' | 'rtl';
  /**
   * The language is written in Greek script, so greek-role text needs no
   * separate font and note names are never transliterated.
   */
  usesGreekScript: boolean;
  /** Note names rendered when a style transliterates them. */
  transliteratedNoteNames: InitialMartyriaNoteNames;
  /** Whether curated styles in this language transliterate note names. */
  transliterateNoteNames: boolean;
  /** Words introducing the physical starting note in a spoken mode name. */
  startingNotePrefix: string;
  /** Spoken forms that differ from the text printed in the score. */
  pronunciationOverrides?: InitialMartyriaPronunciationOverrides;
  /** The word naming the concept of a mode (Mode, Tono, Glas). */
  label?: string;
  /** Label form used when it trails the mode name (Spanish lowercase). */
  labelMedial?: string;
  /** Label form used with an ordinal numeral (Romanian definite article). */
  labelWithOrdinal?: string;
  /** Ordinal words, in the form used after the label. */
  ordinalWords?: InitialMartyriaModeTexts;
  /** Ordinal words in the form used before the label (Spanish apocope). */
  ordinalWordsPrenominal?: InitialMartyriaModeTexts;
  cardinalWords?: InitialMartyriaModeTexts;
  alphabeticNumerals?: InitialMartyriaModeTexts;
  /** Spells an ordinal from a digit or Roman numeral (1o, al 1-lea). */
  formatOrdinal?: (
    base: string,
    numeralStyle: InitialMartyriaNumeralStyle,
    numeralQualifier: InitialMartyriaNumeralQualifier,
  ) => string;
  /** Standalone plagal word (Plagal, laturas). */
  plagalWord?: string;
  /** Word form that identifies an authentic mode's plagal counterpart. */
  plagalCounterpartWord?: string;
  /** Ordinal forms read after the plagal-counterpart word (Greek genitive). */
  plagalCounterpartOrdinalWords?: Partial<Record<ModeKeyMode, string>>;
  /** Where a plagal-counterpart marker sits inside the mode-name phrase. */
  plagalCounterpartMarkerPosition?: 'phraseStart' | 'beforeNumeral';
  /** Number styles whose text phrases use the stacked Greek abbreviation. */
  plagalAbbreviationNumeralStyles?: readonly InitialMartyriaNumeralStyle[];
  /** Grave-mode word used inside a text phrase. */
  graveWord?: string;
  /** Treat the grave word as a postnominal identifier (Modus Berat). */
  graveWordAfterLabel?: boolean;
  /** Grave-mode word used as a standalone title next to the mode sign. */
  graveWordTitle?: string;
  /** Whether the language ends the mode-name phrase with a period. */
  usesTerminalPeriod: boolean;
  /**
   * The traditional sign group trails the whole key, after the starting
   * pitch (Arabic).
   */
  modeSignGroupTrailing: boolean;
}

export const romanNumerals: InitialMartyriaModeTexts = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
];

export const arabicIndicDigits: InitialMartyriaModeTexts = [
  '١',
  '٢',
  '٣',
  '٤',
  '٥',
  '٦',
  '٧',
  '٨',
];

const englishOrdinalSuffixes: InitialMartyriaModeTexts = [
  'st',
  'nd',
  'rd',
  'th',
  'th',
  'th',
  'th',
  'th',
];

function formatEnglishOrdinal(
  base: string,
  numeralStyle: InitialMartyriaNumeralStyle,
) {
  return numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
    ? `${base}${englishOrdinalSuffixes[Number(base) - 1]}`
    : base;
}

export const initialMartyriaLexicons: Record<
  InitialMartyriaLanguageId,
  InitialMartyriaLexicon
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: {
    // Byzantine Greek uses label-first authentic/plagal names. Alphabetic
    // numerals use the abbreviation; word forms use an inflected full name.
    // The Greek Ministry grammar places alphabetic signs beside both cardinal
    // and ordinal words; liturgical headings supply the ordinal reading here.
    // https://lb1.ebooks.edu.gr/ebooks/d/8547/774/21-0058-02_Grammatiki-Neas-Ellinikis-Glossas_A-B-G-Gymnasiou.pdf
    // https://byzantine-music.apostoliki-diakonia.gr/Texts/texts.asp?main=Anastasimatarion.htm
    direction: 'ltr',
    usesGreekScript: true,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'εκ του',
    pronunciationOverrides: {
      label: 'Ήχος',
      ordinalWords: [
        'Πρώτος',
        'Δεύτερος',
        'Τρίτος',
        'Τέταρτος',
        'Πέμπτος',
        'Έκτος',
        'Έβδομος',
        'Όγδοος',
      ],
      plagalWord: 'Πλάγιος',
      plagalCounterpartWord: 'Πλάγιος του',
      plagalCounterpartOrdinalWords: {
        5: 'Πρώτου',
        6: 'Δευτέρου',
        8: 'Τετάρτου',
      },
      graveWord: 'Βαρύς',
    },
    label: 'Ἦχος',
    ordinalWords: [
      'πρῶτος',
      'δεύτερος',
      'τρίτος',
      'τέταρτος',
      'πέμπτος',
      'ἕκτος',
      'ἕβδομος',
      'ὄγδοος',
    ],
    alphabeticNumerals: ['αʹ', 'βʹ', 'γʹ', 'δʹ', 'εʹ', 'ϛʹ', 'ζʹ', 'ηʹ'],
    plagalWord: 'πλάγιος',
    plagalCounterpartWord: 'πλάγιος τοῦ',
    plagalCounterpartOrdinalWords: {
      5: 'πρώτου',
      6: 'δευτέρου',
      8: 'τετάρτου',
    },
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    plagalAbbreviationNumeralStyles: [
      INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    ],
    graveWord: 'βαρύς',
    graveWordTitle: 'Βαρύς',
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
    // English cardinals follow the noun and ordinals precede it. Roman
    // numerals represent the conventional postnominal cardinal construction.
    // A sign by itself encodes authentic/plagal relations, not absolute 1-8.
    // https://dictionary.cambridge.org/grammar/british-grammar/number
    // https://www.govinfo.gov/content/pkg/GPO-STYLEMANUAL-2016/pdf/GPO-STYLEMANUAL-2016-10.pdf
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'from',
    label: 'Mode',
    ordinalWords: [
      'First',
      'Second',
      'Third',
      'Fourth',
      'Fifth',
      'Sixth',
      'Seventh',
      'Eighth',
    ],
    cardinalWords: [
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
    ],
    formatOrdinal: formatEnglishOrdinal,
    plagalWord: 'Plagal',
    plagalCounterpartWord: 'Plagal of',
    graveWord: 'Grave',
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: {
    // Cardinals follow tono; ordinal adjectives can precede or follow it.
    // RAE says Roman numerals are ordinarily read as ordinals, but permits a
    // cardinal reading where both readings fit the construction. It also
    // illustrates ordinal Roman numerals on either side of a noun ("X
    // Congreso", "tomo VI"); musicological catalogues attest the corresponding
    // mode headings "II tono" and "VIII tono". Orthodox liturgical sources
    // attest both "Tono I" and explicit "Tono Primero".
    // https://www.rae.es/ortograf%C3%ADa/lectura-de-los-n%C3%BAmeros-romanos
    // https://www.rae.es/ortograf%C3%ADa/formaci%C3%B3n
    // https://diposit.ub.edu/dspace/bitstream/2445/183835/4/TESIS%20S.M.%20Leo%CC%81n%20%28Firmada%20-%20Digital%29.pdf
    // https://www.historicalsoundscapes.com/pdf/1541/jacaltenango
    // https://www.iglesiaortodoxa.cl/_files/ugd/aa7bfd_74510bb681824b4da936ab661d3b80cf.pdf
    // https://www.iglesiaortodoxa.cl/_files/ugd/aa7bfd_565aa2a8788643afbce34f404100332c.pdf
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'desde',
    label: 'Tono',
    labelMedial: 'tono',
    ordinalWords: [
      'primero',
      'segundo',
      'tercero',
      'cuarto',
      'quinto',
      'sexto',
      'séptimo',
      'octavo',
    ],
    ordinalWordsPrenominal: [
      'Primer',
      'Segundo',
      'Tercer',
      'Cuarto',
      'Quinto',
      'Sexto',
      'Séptimo',
      'Octavo',
    ],
    cardinalWords: [
      'uno',
      'dos',
      'tres',
      'cuatro',
      'cinco',
      'seis',
      'siete',
      'ocho',
    ],
    formatOrdinal: (base, numeralStyle, numeralQualifier) => {
      if (numeralStyle !== INITIAL_MARTYRIA_NUMERAL_STYLES.Digits) {
        return base;
      }
      return numeralQualifier ===
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal &&
        (base === '1' || base === '3')
        ? `${base}.ᵉʳ`
        : `${base}.º`;
    },
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: {
    // Gamanovich distinguishes quantity from order and lists the same
    // alphabetic numeral glyph beside both cardinal and ordinal word forms.
    // Liturgical context resolves the ambiguity: the 1995 Irmologion pairs
    // alphabetic mode headings with explicit ordinal mode names. Ponomar's
    // Octoechos navigation and a Moscow Patriarchate service book also attest
    // postnominal Arabic digits. Written numbers follow the noun, while an
    // inflected ordinal adjective can stand on either side.
    // https://www.ponomar.net/files/gama2/p061.htm
    // https://www.ponomar.net/files/gama2/p068app.htm
    // https://www.ponomar.net/maktabah/Irmologii1995/01glas.html
    // https://www.ponomar.net/maktabah/Irmologii1995/02glas.html
    // https://www.ponomar.net/maktabah/OctoechosPart1Edinovetsy/index.html
    // https://edinstvo.patriarchia.ru/uploads/Files/2026/Sretenie.pdf
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
    transliterateNoteNames: true,
    startingNotePrefix: 'ѿ',
    label: 'Гла́съ',
    labelMedial: 'гла́съ',
    ordinalWords: [
      'пе́рвый',
      'вторы́й',
      'тре́тїй',
      'четве́ртый',
      'пѧ́тый',
      'шесты́й',
      'седмы́й',
      'ѻ҆сьмы́й',
    ],
    ordinalWordsPrenominal: [
      'Пе́рвый',
      'Вторы́й',
      'Тре́тїй',
      'Четве́ртый',
      'Пѧ́тый',
      'Шесты́й',
      'Седмы́й',
      'Ѻ҆сьмы́й',
    ],
    cardinalWords: [
      'є҆ди́нъ',
      'два̀',
      'трѝ',
      'четы́ре',
      'пѧ́ть',
      'ше́сть',
      'се́дмь',
      'ѻ҆́смь',
    ],
    alphabeticNumerals: ['а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'],
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
    // General Russian orthography writes an Arabic ordinal with a suffix such
    // as 1-y, and Moscow Patriarchate directions use that form for modes. Its
    // service books also attest the compact rubrical form "Glas 1.". Both are
    // ordinal mode names. Inflected ordinal adjectives can stand on either
    // side of the noun. Roman numerals take no adjectival ending, and Russian
    // church scholarship also attests the prenominal heading "I glas"; thus
    // Roman-numeral ordinals can occupy either position without synthesizing
    // an unattested inflection. Prenominal Arabic digits take the standard
    // masculine nominative ordinal ending, as in "1-y glas".
    // https://orfo.ruslang.ru/rules/rule/1 (footnote 9)
    // https://patriarchia.ru/bu/2026-06-14
    // https://edinstvo.patriarchia.ru/uploads/Files/2026/Sretenie.pdf
    // https://www.azbyka.ru/otechnik/bogoslovie/dogmaticheskoe-bogoslovie-kastalskij/1_1_5
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: russianTransliteratedNoteNames,
    transliterateNoteNames: true,
    startingNotePrefix: 'от',
    label: 'Глас',
    labelMedial: 'глас',
    ordinalWords: [
      'первый',
      'второй',
      'третий',
      'четвёртый',
      'пятый',
      'шестой',
      'седьмой',
      'восьмой',
    ],
    ordinalWordsPrenominal: [
      'Первый',
      'Второй',
      'Третий',
      'Четвёртый',
      'Пятый',
      'Шестой',
      'Седьмой',
      'Восьмой',
    ],
    cardinalWords: [
      'один',
      'два',
      'три',
      'четыре',
      'пять',
      'шесть',
      'семь',
      'восемь',
    ],
    formatOrdinal: (base, numeralStyle, numeralQualifier) =>
      numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits &&
      numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
        ? `${base}-й`
        : base,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    // Arabic ordinals are adjectives: they follow the noun and agree with its
    // definiteness and gender. Antiochian Orthodox sources attest both the
    // word form (اللحن الأول) and postnominal digits in both the Latin and
    // Arabic-Indic numbering systems (اللحن 1 and اللحن ٥).
    // https://www.arabicacademy.gov.eg/ar/محرك-البحث/معجم/dic-19/نعت-معنى
    // https://antiochpatriarchate.org/ar/page/1662/
    // https://www.antiochpatriarchate.org/ar/page/909/
    // https://www.antiochpatriarchate.org/ar/print/page/1068/
    direction: 'rtl',
    usesGreekScript: false,
    transliteratedNoteNames: arabicTransliteratedNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'من',
    label: 'اللحن',
    ordinalWords: [
      'الأول',
      'الثاني',
      'الثالث',
      'الرابع',
      'الخامس',
      'السادس',
      'السابع',
      'الثامن',
    ],
    usesTerminalPeriod: false,
    modeSignGroupTrailing: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: {
    // Cardinals follow glas. Ordinals 2-8 use the al ... -lea construction;
    // first is the exceptional primul/intai, not *al unu-lea. DOOM3 attests
    // al II-lea/al 2-lea and cardinal identifiers such as pagina unu. Church
    // sources attest Glasul intai and Glasul al II-lea. The laturas vocabulary
    // is modeled only for its sign.
    // https://doom.lingv.ro/cautare/q/al%20doilea
    // https://doom.lingv.ro/cautare/q/%27i/?orderBy=%27i
    // https://arhiepiscopiabucurestilor.ro/stiri/evenimente-bisericesti/cantarile-sfintei-liturghii-glasurile-i-si-al-vii-lea
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: romanianTransliteratedNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'de la',
    label: 'Glas',
    labelMedial: 'glas',
    labelWithOrdinal: 'Glasul',
    ordinalWords: [
      'întâi',
      'al doilea',
      'al treilea',
      'al patrulea',
      'al cincilea',
      'al șaselea',
      'al șaptelea',
      'al optulea',
    ],
    ordinalWordsPrenominal: [
      'Primul',
      'Al doilea',
      'Al treilea',
      'Al patrulea',
      'Al cincilea',
      'Al șaselea',
      'Al șaptelea',
      'Al optulea',
    ],
    cardinalWords: [
      'unu',
      'doi',
      'trei',
      'patru',
      'cinci',
      'șase',
      'șapte',
      'opt',
    ],
    formatOrdinal: (base, _numeralStyle, numeralQualifier) => {
      if (base === '1' || base === 'I') {
        return numeralQualifier ===
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
          ? 'Primul'
          : 'întâi';
      }
      return `${
        numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
          ? 'Al'
          : 'al'
      } ${base}-lea`;
    },
    plagalWord: 'lăturaș',
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: {
    // Indonesian rank numerals follow the noun and use ke-: Modus Pertama,
    // Modus Kedua, or Modus ke-1. The local Neanes translation supplies the
    // complete Byzantine set, including Plagal dari Modus Pertama and Modus
    // Berat; Indonesian church-music literature independently attests eight
    // authentic/plagal modes. General music literature also uses modus, but
    // Modus is also the standard technical term in Indonesian music writing.
    // https://ojs.badanbahasa.kemdikbud.go.id/jurnal/index.php/jurnal_ranah/article/download/3563/1597
    // https://github.com/unicode-org/cldr/blob/main/common/rbnf/id.xml
    // https://journal.unj.ac.id/unj/index.php/pm/article/download/18941/10508/52742
    // https://download.garuda.kemdikbud.go.id/article.php?article=1050321&title=MELIHAT+KEMUNGKINAN+MODUS+GEREJA+SEBAGAI+DASAR+BAGI+PENYUSUNAN+MUSIK+UNTUK+HYMN&val=15733
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: indonesianTransliteratedNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'dari',
    label: 'Modus',
    ordinalWords: [
      'Pertama',
      'Kedua',
      'Ketiga',
      'Keempat',
      'Kelima',
      'Keenam',
      'Ketujuh',
      'Kedelapan',
    ],
    cardinalWords: [
      'Satu',
      'Dua',
      'Tiga',
      'Empat',
      'Lima',
      'Enam',
      'Tujuh',
      'Delapan',
    ],
    formatOrdinal: (base) => `ke-${base}`,
    plagalCounterpartWord: 'Plagal dari',
    graveWord: 'Berat',
    graveWordAfterLabel: true,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
};

/* Lexicons with the spoken forms folded in, for the pronunciation functions. */
export const initialMartyriaSpokenLexicons = Object.fromEntries(
  initialMartyriaLanguageIds.map((languageId) => [
    languageId,
    {
      ...initialMartyriaLexicons[languageId],
      ...initialMartyriaLexicons[languageId].pronunciationOverrides,
    },
  ]),
) as Record<InitialMartyriaLanguageId, InitialMartyriaLexicon>;

export function usesGreekScript(languageId: InitialMartyriaLanguageId) {
  return initialMartyriaLexicons[languageId].usesGreekScript;
}
