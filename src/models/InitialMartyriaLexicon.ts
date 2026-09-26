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

type InitialMartyriaModeTexts = Readonly<Record<ModeKeyMode, string>>;

type InitialMartyriaPronunciationOverrides = Partial<{
  label: string;
  ordinalWords: InitialMartyriaModeTexts;
  plagalWord: string;
  plagalCounterpartWord: string;
  plagalCounterpartOrdinalWords: Partial<Record<ModeKeyMode, string>>;
  graveWord: string;
}>;

interface InitialMartyriaLexiconBase {
  /** Reading direction of the language's mode-name phrases. */
  direction: 'ltr' | 'rtl';
  /** Words introducing the physical starting note in a spoken mode name. */
  startingNotePrefix: string;
  /** Spoken forms that differ from the text printed in the score. */
  pronunciationOverrides?: InitialMartyriaPronunciationOverrides;
  /** The word naming the concept of a mode (Mode, Tono, Glas). */
  label: string;
  /** Lowercase the label when an ordinal precedes it. */
  lowercaseTrailingLabel?: true;
  /** Label form used with an ordinal numeral (Romanian definite article). */
  labelWithOrdinal?: string;
  /** Ordinal words, in the form used after the label. */
  ordinalWords: InitialMartyriaModeTexts;
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
  /** Grave-mode word used inside a text phrase. */
  graveWord?: string;
  /** Treat the grave word as a postnominal identifier (Modus Berat). */
  graveWordAfterLabel?: boolean;
}

export type InitialMartyriaLexicon = InitialMartyriaLexiconBase &
  (
    | {
        /** Greek-script languages always use the original note names. */
        usesGreekScript: true;
        transliteratedNoteNames?: never;
      }
    | {
        usesGreekScript: false;
        /** Note names used when transliteration is enabled. */
        transliteratedNoteNames: InitialMartyriaNoteNames;
      }
  );

export const romanNumerals: InitialMartyriaModeTexts = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
};

export const arabicIndicDigits: InitialMartyriaModeTexts = {
  1: '١',
  2: '٢',
  3: '٣',
  4: '٤',
  5: '٥',
  6: '٦',
  7: '٧',
  8: '٨',
};

const englishOrdinalSuffixes: InitialMartyriaModeTexts = {
  1: 'st',
  2: 'nd',
  3: 'rd',
  4: 'th',
  5: 'th',
  6: 'th',
  7: 'th',
  8: 'th',
};

function formatEnglishOrdinal(
  base: string,
  numeralStyle: InitialMartyriaNumeralStyle,
) {
  return numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
    ? `${base}${englishOrdinalSuffixes[Number(base) as ModeKeyMode]}`
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
    startingNotePrefix: 'εκ του',
    pronunciationOverrides: {
      label: 'Ήχος',
      ordinalWords: {
        1: 'Πρώτος',
        2: 'Δεύτερος',
        3: 'Τρίτος',
        4: 'Τέταρτος',
        5: 'Πέμπτος',
        6: 'Έκτος',
        7: 'Έβδομος',
        8: 'Όγδοος',
      },
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
    ordinalWords: {
      1: 'πρῶτος',
      2: 'δεύτερος',
      3: 'τρίτος',
      4: 'τέταρτος',
      5: 'πέμπτος',
      6: 'ἕκτος',
      7: 'ἕβδομος',
      8: 'ὄγδοος',
    },
    alphabeticNumerals: {
      1: 'αʹ',
      2: 'βʹ',
      3: 'γʹ',
      4: 'δʹ',
      5: 'εʹ',
      6: 'ϛʹ',
      7: 'ζʹ',
      8: 'ηʹ',
    },
    plagalWord: 'πλάγιος',
    plagalCounterpartWord: 'πλάγιος τοῦ',
    plagalCounterpartOrdinalWords: {
      5: 'πρώτου',
      6: 'δευτέρου',
      8: 'τετάρτου',
    },
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    graveWord: 'βαρύς',
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
    startingNotePrefix: 'from',
    label: 'Mode',
    ordinalWords: {
      1: 'First',
      2: 'Second',
      3: 'Third',
      4: 'Fourth',
      5: 'Fifth',
      6: 'Sixth',
      7: 'Seventh',
      8: 'Eighth',
    },
    cardinalWords: {
      1: 'One',
      2: 'Two',
      3: 'Three',
      4: 'Four',
      5: 'Five',
      6: 'Six',
      7: 'Seven',
      8: 'Eight',
    },
    formatOrdinal: formatEnglishOrdinal,
    plagalWord: 'Plagal',
    plagalCounterpartWord: 'Plagal of',
    graveWord: 'Grave',
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
    startingNotePrefix: 'desde',
    label: 'Tono',
    lowercaseTrailingLabel: true,
    ordinalWords: {
      1: 'primero',
      2: 'segundo',
      3: 'tercero',
      4: 'cuarto',
      5: 'quinto',
      6: 'sexto',
      7: 'séptimo',
      8: 'octavo',
    },
    ordinalWordsPrenominal: {
      1: 'Primer',
      2: 'Segundo',
      3: 'Tercer',
      4: 'Cuarto',
      5: 'Quinto',
      6: 'Sexto',
      7: 'Séptimo',
      8: 'Octavo',
    },
    cardinalWords: {
      1: 'uno',
      2: 'dos',
      3: 'tres',
      4: 'cuatro',
      5: 'cinco',
      6: 'seis',
      7: 'siete',
      8: 'ocho',
    },
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
    startingNotePrefix: 'ѿ',
    label: 'Гла́съ',
    lowercaseTrailingLabel: true,
    ordinalWords: {
      1: 'пе́рвый',
      2: 'вторы́й',
      3: 'тре́тїй',
      4: 'четве́ртый',
      5: 'пѧ́тый',
      6: 'шесты́й',
      7: 'седмы́й',
      8: 'ѻ҆сьмы́й',
    },
    ordinalWordsPrenominal: {
      1: 'Пе́рвый',
      2: 'Вторы́й',
      3: 'Тре́тїй',
      4: 'Четве́ртый',
      5: 'Пѧ́тый',
      6: 'Шесты́й',
      7: 'Седмы́й',
      8: 'Ѻ҆сьмы́й',
    },
    cardinalWords: {
      1: 'є҆ди́нъ',
      2: 'два̀',
      3: 'трѝ',
      4: 'четы́ре',
      5: 'пѧ́ть',
      6: 'ше́сть',
      7: 'се́дмь',
      8: 'ѻ҆́смь',
    },
    alphabeticNumerals: {
      1: 'а҃',
      2: 'в҃',
      3: 'г҃',
      4: 'д҃',
      5: 'є҃',
      6: 'ѕ҃',
      7: 'з҃',
      8: 'и҃',
    },
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
    startingNotePrefix: 'от',
    label: 'Глас',
    lowercaseTrailingLabel: true,
    ordinalWords: {
      1: 'первый',
      2: 'второй',
      3: 'третий',
      4: 'четвёртый',
      5: 'пятый',
      6: 'шестой',
      7: 'седьмой',
      8: 'восьмой',
    },
    ordinalWordsPrenominal: {
      1: 'Первый',
      2: 'Второй',
      3: 'Третий',
      4: 'Четвёртый',
      5: 'Пятый',
      6: 'Шестой',
      7: 'Седьмой',
      8: 'Восьмой',
    },
    cardinalWords: {
      1: 'один',
      2: 'два',
      3: 'три',
      4: 'четыре',
      5: 'пять',
      6: 'шесть',
      7: 'семь',
      8: 'восемь',
    },
    formatOrdinal: (base, numeralStyle, numeralQualifier) =>
      numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits &&
      numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
        ? `${base}-й`
        : base,
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
    startingNotePrefix: 'من',
    label: 'اللحن',
    ordinalWords: {
      1: 'الأول',
      2: 'الثاني',
      3: 'الثالث',
      4: 'الرابع',
      5: 'الخامس',
      6: 'السادس',
      7: 'السابع',
      8: 'الثامن',
    },
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
    startingNotePrefix: 'de la',
    label: 'Glas',
    lowercaseTrailingLabel: true,
    labelWithOrdinal: 'Glasul',
    ordinalWords: {
      1: 'întâi',
      2: 'al doilea',
      3: 'al treilea',
      4: 'al patrulea',
      5: 'al cincilea',
      6: 'al șaselea',
      7: 'al șaptelea',
      8: 'al optulea',
    },
    ordinalWordsPrenominal: {
      1: 'Primul',
      2: 'Al doilea',
      3: 'Al treilea',
      4: 'Al patrulea',
      5: 'Al cincilea',
      6: 'Al șaselea',
      7: 'Al șaptelea',
      8: 'Al optulea',
    },
    cardinalWords: {
      1: 'unu',
      2: 'doi',
      3: 'trei',
      4: 'patru',
      5: 'cinci',
      6: 'șase',
      7: 'șapte',
      8: 'opt',
    },
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
    startingNotePrefix: 'dari',
    label: 'Modus',
    ordinalWords: {
      1: 'Pertama',
      2: 'Kedua',
      3: 'Ketiga',
      4: 'Keempat',
      5: 'Kelima',
      6: 'Keenam',
      7: 'Ketujuh',
      8: 'Kedelapan',
    },
    cardinalWords: {
      1: 'Satu',
      2: 'Dua',
      3: 'Tiga',
      4: 'Empat',
      5: 'Lima',
      6: 'Enam',
      7: 'Tujuh',
      8: 'Delapan',
    },
    formatOrdinal: (base) => `ke-${base}`,
    plagalCounterpartWord: 'Plagal dari',
    graveWord: 'Berat',
    graveWordAfterLabel: true,
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
