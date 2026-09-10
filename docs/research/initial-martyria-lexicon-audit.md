# Initial Martyria Lexicon and Grammar Audit

## Scope and method

This audit evaluates the eight supported language lexicons: Greek, English,
Spanish, Church Slavonic, Russian, Arabic, Romanian, and Indonesian. English `Tone`,
Romanian `Eh/Ehul`, and Romanian plagal constructions are deliberately outside
scope.

Each candidate is tested at three levels:

1. morphology: can the language form and inflect the number correctly?
2. syntax: can that form occupy the proposed position relative to the mode noun?
3. domain semantics: does the result name or identify a musical mode, rather
   than count a quantity of modes?

CLDR is evidence for morphology and numbering systems, not by itself for syntax
or musical terminology. A construction is recommended without church
attestation only when ordinary grammar or comparable non-church musical usage
supports it and church usage does not contradict it.

## Executive recommendations

| Priority | Proposal                                                       | Confidence | Recommendation                                       |
| -------- | -------------------------------------------------------------- | ---------: | ---------------------------------------------------- |
| 1        | Romanian `Vu` rather than inherited English `Vou`              |        98% | Implemented                                          |
| 2        | Russian prenominal digit ordinals: `1-й глас`, ..., `8-й глас` |        95% | Implemented                                          |
| 3        | Indonesian mode-name lexicon                                   |        94% | Implemented                                          |
| 4        | Spanish `Modo` terminology family                              |        92% | Approve as an optional terminology variant           |
| 5        | Romanian `Mod` terminology family                              |        88% | Approve as an optional, modern musicological variant |
| 6        | Modern monotonic Greek word forms                              |        86% | Approve if contemporary typography is in scope       |
| 7        | Russian `Лад` terminology family                               |        78% | Consider as a clearly labeled musicological variant  |
| 8        | Greek decimal ordinal forms such as `1ος ήχος`                 |        65% | Defer pending direct Byzantine-score examples        |

No further number-form expansion is recommended for English, Arabic, or Church
Slavonic.

## Existing matrix

### Greek

The current use of ordinal words and Greek alphabetic numerals is internally
sound. Greek grammar distinguishes cardinal quantities from ordinal position,
and ordinal numerals behave as adjectives. The official school grammar gives
`πρώτος`, `δεύτερος`, `τρίτος`, and so on as the ordinary ordinal series.^1
Traditional Byzantine sources use alphabetic identifiers and relational
authentic/plagal names, so a general absolute 1-8 cardinal family would change
the system rather than merely broaden its spelling.^2

The current postnominal word construction is attested, but it is not the only
grammatical order in Modern Greek. Contemporary materials also use `Ήχος
Πρώτος`; this supports a monotonic typography variant, not a different naming
scheme.^3 Greek's official orthography has been monotonic since 1982.^4

Recommendation: preserve the current traditional polytonic built-in and add an
optional monotonic lexical variant (`Ήχος`, `πρώτος`, `δεύτερος`, etc.). Do not
replace the traditional forms.

Greek decimal ordinal notation (`1ος`, `2ος`) is grammatically regular and
common outside this domain.^1 `1ος ήχος` is attested in ordinary contemporary
Greek, but direct Byzantine score-heading evidence is not yet strong enough to
recommend adding it to the curated grammar.^5

### English

The present distinction is complete:

- prenominal ordinal: `First Mode`, `1st Mode`;
- postnominal identifier: `Mode One`, `Mode 1`, `Mode I`.

English ordinarily places attributive ordinals before the noun, while labels
and identifiers such as chapter or number designations occur after it.^6 The
matrix correctly rejects `Mode First`, `One Mode`, and `I Mode`. Roman `Mode I`
is already covered and should not be duplicated as an ordinal style merely to
give it the pronunciation `Mode First`.

Recommendation: no expansion.

### Spanish

The current `Tono` matrix is unusually complete. RAE grammar supports ordinal
adjectives on either side of a noun, with the prenominal apocopated forms
`primer` and `tercer`. Roman numerals can likewise occur before or after the
noun, and cardinal numerals used as identifiers are necessarily postnominal.^7
Non-church musical and technical sources attest both `primer modo` and `modo
primero`, as well as identifier constructions such as `modo 1` and `modo
uno`.^8

The remaining gap is lexical rather than grammatical: Spanish music theory
uses both `tono` and `modo`, with `modo` often the less ambiguous term for a
modal system.^9

Recommendation: add an optional `Modo` terminology family and apply the same
validated absolute-number matrix already used by `Tono`:

- `Modo 1`, `Modo I`, `Modo uno`;
- `Modo primero`, `Modo 1.º`, `Modo I`;
- `Primer modo`, `1.er modo`, `I modo`.

This would not alter or deprecate `Tono`.

### Church Slavonic

The current matrix treats mode numbers as ordinal identifiers even when the
printed alphabetic sign is formally compatible with cardinal and ordinal
readings. That is the correct semantic distinction for an ordered Octoechos.
Gamanovich distinguishes cardinal from ordinal forms; ordinal words follow
adjectival inflection.^10 The existing postnominal digit/alphabetic forms and
the two possible positions for inflected word ordinals cover the defensible
space.

Cardinal word headings would read as quantities, Roman numerals would import a
foreign notation, and prenominal bare Arabic digits would import modern Russian
orthography without its required suffix.

Recommendation: no expansion.

### Russian

The current word and Roman-numeral coverage is sound. Russian ordinal
adjectives can precede or follow the noun, while Roman numerals take no written
case ending. The uncovered regular construction is a prenominal ordinal written
with Arabic digits and a letter suffix.

The Russian reference portal Gramota states that ordinal digits take a case
ending and gives `1-й вагон`, `5-й уровень`, and similar masculine nominative
examples. It separately explains that a postnominal identifier after a generic
noun may omit the ending.^11 Thus the existing `Глас 1.` and the proposed `1-й
глас` are not arbitrary inversions; they instantiate two different standard
constructions.

Recommendation: add digit ordinals for text-bearing structures in prenominal
position, formatted `1-й глас` through `8-й глас`, and read as `Первый глас`
through `Восьмой глас`. Do not enable a bare `1 глас` form.

Russian secular music theory also uses `лад` for musical mode, including
`первый лад`, `1-й лад`, and numbered theoretical systems.^12 It is not an exact
replacement for the ecclesiastical technical term `глас`, so it should only be
offered as an explicitly musicological terminology variant.

### Arabic

The current grammar is complete for Modern Standard Arabic mode headings.
Ordinals follow the noun and agree with it in gender, definiteness, and case;
because `لحن` is masculine and definite, `اللحن الأول` through `اللحن الثامن`
are the correct forms.^13 CLDR independently supplies the same masculine
ordinal series. Both Latin and Arabic-Indic digit repertoires are already
modeled.

Cardinal words are not a safe expansion. Arabic cardinal constructions have
different agreement and counted-noun behavior, and a digit identifier does not
license replacing it mechanically with a cardinal word.^14 Prenominal ordinals
would also cease to be the ordinary definite adjective construction.

Recommendation: no further expansion.

### Romanian

The current number morphology is broad and substantially correct. `întâi` and
`primul` cover the exceptional first ordinal; `al doilea` through `al optulea`
cover the masculine ordinal series. DOOM3 explicitly recognizes `al II-lea`
and `al 2-lea`.^15 Cardinal identifiers such as `modul 1` are ordinary
postnominal labels, while word ordinals can occur before or after the noun.

Romanian musicological sources use `modul 1`, `modul 2`, and more specifically
`Modul 1 autentic` and `Modul 1 plagal` when discussing modal systems.^16 This
supports an optional `Mod/Modul` terminology family independently of the
deferred `Eh/Ehul` question:

- cardinal identifier: `Modul 1`, `Modul I`, `Modul unu`;
- postnominal ordinal: `Modul întâi`, `Modul al II-lea`;
- prenominal ordinal: `Primul mod`, `Al II-lea mod`.

The more immediate Romanian gap is in note names. The lexicon currently uses
the English transliteration `Vou`, but Romanian academic, educational, and
psaltic sources consistently give `Ni Pa Vu Ga Di Ke Zo`.^17

Recommendation: change only the Romanian transliterated note name from `Vou`
to `Vu`, backed by a dedicated Romanian note-name table rather than the shared
English one.

### Indonesian

Indonesian was the only Neanes interface language without a corresponding
initial-martyria lexicon. Its grammar supports a particularly small and clear
matrix. Rank numerals follow the noun: the Badan Bahasa study describes the
pattern as noun + `ke-` + numeral and gives examples such as `juara kedua` and
`jukung ketiga`.^18 CLDR agrees on `pertama`, `kedua`, ... `kedelapan` and the
digit forms `ke-1`, ... `ke-8`; it also supplies the cardinal series `satu`,
... `delapan`.^19

Indonesian music scholarship attests both `modus pertama` and the compact
heading `Modus ke-1`. Church-music scholarship independently describes eight
church modes divided into authentic and plagal classes.^20 These sources also
show that `modus`, not the English borrowing `mode`, is the established
Indonesian technical term. The existing locale's musical strings were therefore
regularized from `Mode` to `Modus`.

Recommendation implemented: postnominal absolute cardinal identifiers
(`Modus 1`, `Modus I`, `Modus Satu`), postnominal absolute ordinals (`Modus
ke-1`, `Modus Pertama`), and the project-local Byzantine counterpart names
(`Plagal dari Modus Pertama`, `Modus Berat`). Prenominal numerals and a separate
plagal-class naming family remain excluded because the available evidence does
not establish them as score-heading conventions.

## Proposals requiring approval

### Recommended implementation batch

1. Add a Romanian transliterated note-name table using `Vu`.
2. Add Russian prenominal digit ordinals with `-й`.
3. Add Spanish `Modo` as an optional terminology variant.
4. Add Romanian `Mod/Modul` as an optional terminology variant.

The first two are bounded corrections or grammar completion. The latter two
require a reusable terminology axis in the structure model; that axis should be
language-validated rather than a free-text label.

### Optional second batch

5. Add a modern monotonic Greek vocabulary variant.
6. Add Russian `Лад` only if the styles browser is intended to cover secular or
   comparative musicology as well as Byzantine score terminology.

### Deferred

7. Do not add Greek `1ος ήχος` until it is found in representative Byzantine
   scores or instructional headings. It is grammatically valid, but the current
   evidence does not establish it as a useful score convention.

## Sources

1. Centre for the Greek Language, [Greek school grammar: numerals](https://www.greek-language.gr/digitalResources/files/document/lex_first_grade/parartimataD-ST.pdf).
2. Apostoliki Diakonia, [The principal modes of Byzantine music](https://byzantine-music.apostoliki-diakonia.gr/ymnografoi/ymnografoi.asp?main=hxoi.htm).
3. SearchCulture.gr, [“ΗΧΟΣ ΠΡΩΤΟΣ - ΣΥΝΤΟΜΟΣ ΕΙΡΜΟΛΟΓΙΚΟΣ”](https://www.searchculture.gr/aggregator/edm/DigFaltaits/000182-1f58e775-f7e9-4b7f-8f10-d070a80b817a).
4. Centre for the Greek Language, Giorgos Papanastasiou, [Language and orthography](https://www.greek-language.gr/greekLang/studies/guide/thema_d10/index.html).
5. Athens Voice, [`1ος ήχος` in contemporary Greek usage](https://www.athensvoice.gr/files/issues/issue/2010/05/26/av_303.pdf).
6. Cambridge Dictionary, [Numbers in English grammar](https://dictionary.cambridge.org/grammar/british-grammar/number).
7. Real Academia Española, [Roman-numeral readings](https://www.rae.es/ortograf%C3%ADa/lectura-de-los-n%C3%BAmeros-romanos); [formation and position](https://www.rae.es/ortograf%C3%ADa/formaci%C3%B3n); [historical grammar evidence on postnominal identifier cardinals](https://www.rae.es/tdhle/adjetivo).
8. Mirabilia Journal, [Spanish translations using `primer modo` and `modo primero`](https://dialnet.unirioja.es/descarga/articulo/9039627.pdf); University of Valladolid, [`modo uno` and `modo 1` as identifiers](https://lpi.tel.uva.es/~nacho/docencia/ing_ond_1/trabajos_03_04/reprod_y_grab/paginas/elcdydvd.htm).
9. Warner Music Spain / Radio Clasica, [historical Spanish usage of `modos o tonos`](https://www.warnermusic.es/datos/Radio-Clasica/Libreto_EDICION_DIGITAL.pdf).
10. Alypy Gamanovich, [Grammar of the Church Slavonic Language](https://www.ponomar.net/files/gama2/toc.html); A. Gardiner, [Old Church Slavonic: An Elementary Grammar](https://theswissbay.ch/pdf/Books/Linguistics/Mega%20linguistics%20pack/Indo-European/Balto-Slavic/Old%20Church%20Slavonic%20-%20An%20Elementary%20Grammar%20%28Gardiner%29.pdf).
11. Gramota.ru, [When letter suffixes are required after digits](https://gramota.ru/biblioteka/spravochniki/pismovnik/kogda-nuzhny-bukvennye-narashcheniya-posle-tsifr).
12. Belcanto.ru, [Musical dictionary: `Лад`](https://www.belcanto.ru/lad.html); Music Theory, [Medieval modes](https://www.music-theory.ru/index.php?Itemid=240&id=48&lang=ru&option=com_content&view=article).
13. Faruk Abu-Chacra, [Arabic: An Essential Grammar, chapter 35](https://www.renessans-edu.uz/files/books/2024-11-30-07-18-19_133dc0097ebdb0581ae554cdb51e466e.pdf).
14. National Open University of Nigeria, [Arabic Grammar II](https://nou.edu.ng/coursewarecontent/ARA215%20Arabic%20Grammar%20II.pdf).
15. DOOM3, [Entry for `al doilea`](https://doom.lingv.ro/cautare/q/al%20doilea).
16. Romanian Music Review, [`modul 1` and `modul 2`](https://ucmr.org.ro/Texte/rm_2022_1_2_olupu_simfonia%202%20de%20a.iorgulescu.pdf); Romanian Music Review, [`Modul 1 autentic`](https://ucmr.org.ro/Texte/Revista-Muzica-4-2020-2-Notiunea%20de%20melodie%20din%20perspectiva%20etnomuz.pdf).
17. National University of Music Bucharest, [Petros Ephesios and Anton Pann scales: `Pa Vu Ga Di Ke Zo Ni`](https://www.edituraunmb.ro/wp-content/uploads/2024/02/Cernatescu-Catalin-2023-ed.-Petru-Manuil-Efesiul-Antologhion-4.0.pdf); Romanian Ministry of Education, [school text using `Ni, Pa, Vu, Ga, Di, Ke, Zo`](https://edumedia-depot.gei.de/server/api/core/bitstreams/11f769eb-6eed-40c3-a065-e9d46974cdce/content).
18. Badan Pengembangan dan Pembinaan Bahasa, [Indonesian rank-number construction](https://ojs.badanbahasa.kemdikbud.go.id/jurnal/index.php/jurnal_ranah/article/download/3563/1597).
19. Unicode CLDR, [Indonesian rule-based number formatting](https://github.com/unicode-org/cldr/blob/main/common/rbnf/id.xml).
20. Jurnal Penelitian Musik, [`modus pertama` and `Modus ke-1`](https://journal.unj.ac.id/unj/index.php/pm/article/download/18941/10508/52742); Tonika, [eight authentic and plagal church modes](https://download.garuda.kemdikbud.go.id/article.php?article=1050321&title=MELIHAT+KEMUNGKINAN+MODUS+GEREJA+SEBAGAI+DASAR+BAGI+PENYUSUNAN+MUSIK+UNTUK+HYMN&val=15733).
