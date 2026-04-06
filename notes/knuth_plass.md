# Optimal Line Breaking in Byzantine Notation

[Basil Crow](https://github.com/basil), March 2026

## Introduction

We present an approach to breaking Byzantine neume notation into lines using the box/glue/penalty algebra of Knuth & Plass.
From examples in classical 19th-century publications of Byzantine music, we derive a general set of line-breaking rules and implement them in that algebra.
Lyricless neumes can be modeled much like ordinary text, but lyrics introduce additional complexity.
We handle lyric collisions with the approach of Hegazy & Gourlay, as implemented in LilyPond.
Once the score has been encoded in box/glue/penalty form, we use the traditional dynamic-programming implementation of the Knuth-Plass algorithm to compute the optimal set of breakpoints.
The result is high-quality output that meets and, in many cases, exceeds the standard of the classical 19th-century publications.

## Background

### Breaking paragraphs into lines

One of the central problems in preparing text for print or display is breaking long paragraphs into lines of approximately equal length.
The traditional approach is to place as many words as possible on each line before moving to the next.
This greedy "first-fit" algorithm always uses the minimum number of lines, but it often produces undesirable large&nbsp;&nbsp;&nbsp;spaces &nbsp;&nbsp;&nbsp;between words in justified text.
It is the standard method of line breaking in word processors such as Microsoft Word and in web browsers such as Google Chrome.

In their seminal 1981 paper "[Breaking Paragraphs into Lines](https://gwern.net/doc/design/typography/tex/1981-knuth.pdf)" [^1], Knuth & Plass present a different approach that considers an entire paragraph's network of possible breakpoints rather than making one decision at a time.
This "optimum-fit" algorithm can choose an earlier breakpoint strategically in order to eliminate especially unattractive breakpoints later in the paragraph.
The result is not only fewer overly wide spaces, but also more even spacing and fewer abrupt changes between adjacent lines.
The Knuth-Plass approach is based on three simple primitives, _boxes,_ _glue,_ and _penalties,_
and scores candidate layouts using a function based on the squared lengths of the spaces at the ends of lines.
Its flagship implementation is in the $\TeX$ typesetting system, where the source code describes it as "probably the most interesting algorithm of $\TeX$."
Adobe InDesign includes a related approach called the [Adobe Paragraph Composer](https://helpx.adobe.com/indesign/using/text-composition.html).

A naive implementation of the optimum-fit algorithm would need to examine $2^n$ candidate solutions, where $n$ is the number of words.
The traditional implementation uses dynamic programming to achieve a quadratic time complexity of $O(\min(wn, n^2))$,
where $w$ is the maximum number of words on a line and $n$ is the number of words in the paragraph.
Since $w$ is fixed, the algorithm is linear for large $n$.
In a 1987 paper [^2], D. S. Hirschberg and L. L. Larmore show that this algorithm is a special case of the least-weight subsequence problem
and present both an improved $O(n \log n)$ algorithm and an $O(n)$ algorithm under additional assumptions.
In a 1999 paper [^3], Oege de Moor and Jeremy Gibbons present a Haskell implementation of the same $O(n)$ solution.
An efficient implementation of Knuth-Plass requires substantial bookkeeping,
but in practice the traditional dynamic-programming implementation in $\TeX$ is efficient enough for common use cases.
The algorithm is difficult to summarize briefly,
and readers are encouraged to study the original paper in full.

### Breaking music into lines

Breaking lines in musical scores is more complex than breaking lines of text.
For example, Western staff notation must align simultaneous voices vertically.
Both Western staff notation and Byzantine neume notation must also align the music vertically with the lyrics.

The origin of the Knuth-Plass approach lies in the typesetting of music.
As Knuth & Plass write:

> The idea of applying dynamic programming to line breaking first occurred to D. E. Knuth in 1976,
> when Professor Leland Smith of Stanford's music department raised a related question that arises in connection with the layout of music on a page (see [^4]).
> During a subsequent discussion with students in a problem-solving seminar,
> someone pointed out that essentially the same idea would apply to the texts of paragraphs as well as to music.

In their 1988 paper "Optimal line breaking in music" [^5], Wael A. Hegazy and John S. Gourlay present an approach for breaking Western staff notation into lines based on the box/glue algebra of Knuth & Plass.
In their formulation, a _force_ acts on glue elements to stretch or shrink a line to a given length,
while box elements ensure that noteheads and musical markup, such as accidentals, do not collide by pre-stretching the glue to a minimum extent.
A version of this algorithm is implemented in [LilyPond](https://lilypond.org/).

## Line-breaking rules

From many examples in classical 19th-century publications, we derive the following rules.

### Prohibited breaks

A line break is prohibited in the following cases:

1. Between a martyria and the preceding neume. We add a penalty of `MAX_COST`.
2. Between two neumes tied by a connecting heteron, connecting homalon, or yfen. We add a penalty of `MAX_COST`.

### Strongly discouraged breaks

A line break is strongly discouraged in the following cases:

1. Between two neumes when the first neume has a vareia. We add a penalty of 0.5 of `MAX_COST`, comparable to $\TeX$'s `\relpenalty`.
2. Between a kentimata, or kentimata beneath an oligon, and the preceding neume. The kentimata are the upbeat associated with the previous neume's downbeat, so it is awkward to place a break before them. We add a penalty of 0.5 of `MAX_COST`, comparable to $\TeX$'s `\relpenalty`.

### Discouraged breaks

In addition to the strongly discouraged cases, we identify several breaks that are permissible but undesirable:

1. A line that begins with a gorgon steals half a beat from the neume at the end of the previous line. Although this is not uncommon in the classical 19th-century publications, it requires the reader to look one line ahead. This is manageable within a page, but more annoying at a page boundary, so it is better to avoid such breaks when possible.
2. Between a running elaphron and the preceding neume. Like the gorgon, a running elaphron steals a beat from the preceding neume, so a break before it is awkward.
3. Immediately after a melisma start, before its first continuation neume, that is, between notes 0 and 1 of the melisma, 0-indexed. The melisma-start syllable extends to the right under subsequent neumes, and breaking here can isolate it on a line where the lyric may overflow. Long melismas may legitimately break later on, so only the break immediately after the start is discouraged. The penalty-width mechanism described below handles overflow at any breakpoint inside the melisma.
4. Between the second-to-last and last notes of a melisma, that is, between notes $n-2$ and $n-1$, 0-indexed. This is the converse of the previous rule: just as the melisma start should stay with its first continuation, the penultimate note should stay with the final note that closes the melisma. Breaking here would strand a single melisma note at the start of a line. Interior melisma breaks, between notes 1 and $n-2$, remain free.

We assign a penalty of 0.1 of `MAX_COST` to beat-stealing breaks, because these are awkward but not uncommon in the classical 19th-century publications.
For melisma-edge breaks, we use larger penalties:
0.2 of `MAX_COST` immediately after a melisma start, and 0.15 of `MAX_COST` between the penultimate and final melisma notes.
These cases are closer to $\TeX$'s `\clubpenalty` and `\widowpenalty`, because they orphan a single note at the start or end of a melisma;
the melisma-start case is weighted slightly more heavily because it can also isolate the syllable whose lyric extends rightward and may overflow.
The 19th-century publications, being typeset by hand, necessarily permit such undesirable breaks;
an optimum-fit algorithm can usually find a better solution in milliseconds.

We do not use the flagged-penalty mechanism that Knuth & Plass employ to avoid consecutive hyphenated lines.
In practice, the large stretchability of martyria glue is sufficient to keep neume spacing consistent across adjacent lines.

Penalties are additive: when multiple conditions apply at the same breakpoint, their costs are summed and then clamped to `MAX_COST`.
For example, a break after a vareia and before a beat-stealing neume incurs a total cost of 0.6 of `MAX_COST` ($0.5 + 0.1$),
while a break after a vareia and immediately after a melisma start incurs a total cost of 0.7 of `MAX_COST` ($0.5 + 0.2$).
A prohibited break remains prohibited, and some combinations of softer penalties, such as $0.5 + 0.5$, also saturate to `MAX_COST`, which bans the break altogether.
The three weaker penalties can stack only to 0.45 of `MAX_COST` ($0.2 + 0.15 + 0.1$), which remains below the strongly discouraged threshold.

### Summary of penalties

|               Cost | Break location                                         | $\TeX$ analogue |
| -----------------: | ------------------------------------------------------ | --------------- |
|         `MAX_COST` | Before a martyria                                      | none            |
|         `MAX_COST` | Across a tie (heteron, homalon, yfen)                  | none            |
|  0.5 of `MAX_COST` | After a vareia                                         | `\relpenalty`   |
|  0.5 of `MAX_COST` | Before a kentimata                                     | `\relpenalty`   |
|  0.1 of `MAX_COST` | Before beat-stealing neumes (gorgon, running elaphron) | none            |
|  0.2 of `MAX_COST` | Melisma start to first continuation (0 to 1)           | `\clubpenalty`  |
| 0.15 of `MAX_COST` | Penultimate to last melisma note ($n-2$ to $n-1$)      | `\widowpenalty` |
|                  0 | All other inter-note breaks                            | none            |

### Classical compression techniques

The 19th-century publications also use several techniques to improve the quality of first-fit output:

1. To compress a line, reduced-width versions of neumes such as the ison and oligon are sometimes used.
2. To compress a line, an ison followed by an apostrophos is sometimes written with the apostrophos beneath the ison rather than after it.
3. To compress a line, two apostrophoi are sometimes written with the second apostrophos beneath the first rather than after it.
4. When a line is too narrow, extra space is often added first to the martyriae and only then to the other neumes, so that the spacing of the ordinary neumes stays more consistent with the surrounding lines.

## Box/glue/penalty algebra

### Lyricless scores

Consider first a lyricless score of Byzantine music.
Each neume group, for example a simple oligon or an ison with kentimata over a supporting oligon, and each martyria can be modeled as a box whose width is simply the width of the notated group itself.
The space between ordinary neumes is modeled as glue with a user-configurable width that may stretch or shrink by up to one half of its preferred width.

Following several classical 19th-century publications, ordinary martyriae are given extra elasticity.
When a martyria sits between neighboring elements, the surrounding martyria glues together contribute an additional 2/5 em of stretch, that is, 1/5 em on each side, where 1 em is the neume font size.
This lets the martyria absorb extra line slack before the surrounding neumes do, which helps keep ordinary neume spacing more even from line to line.
After the martyria box, the code inserts a zero-width pre-break glue, then a zero-cost break penalty, and finally a single martyria glue whose preferred width is the ordinary martyria spacing plus the fixed trailing padding.
As a result, the full trailing spacing appears after the martyria only when it stays mid-line; if a break is taken there, that entire spacing becomes leading glue on the next line and is skipped.

When a martyria has a transferable measure bar and is followed by a note, the bar transfers to the next line's first note at a break.
To reserve space for this, the martyria's post-break glue is narrowed by the bar width, and an anonymous spacer box of the same width is inserted before the following note's box.
On the same line the reduced glue and the spacer cancel, leaving the note's own box position unchanged.
At a break the post-break glue vanishes; the spacer remains at the start of the next line and reserves leading space for the transferred bar.
In Phase 2, when the break is actually taken, the note element is shifted left by the bar width so that the rendered barline glyph occupies the space reserved by the spacer rather than adding extra width.

When a right-aligned martyria follows existing content, its leading glue is a separate case: the code uses effectively infinite stretch (`MAX_COST`) so that this glue absorbs all remaining line slack.
If a right-aligned martyria starts a paragraph, that leading glue is still encoded in the input stream, but `positionItems` skips it at line start, so Phase 2 places the martyria flush right explicitly.

As in Knuth & Plass, each paragraph ends with finishing glue, preceded by a maximum-cost penalty to forbid an earlier break and followed by a minimum-cost penalty to force the paragraph break.
When a paragraph does not end immediately after a note, the finishing glue has width 0.
If a paragraph does end immediately after a note, `endParagraph` first materializes that note's trailing reservation into the finishing glue before removing the trailing cancellation glue.
For non-justified endings the finishing glue uses effectively infinite stretch (`MAX_COST`); for justified endings it uses stretch 0. In all cases its shrink is 0.

### Lyrics

Lyrics introduce additional complexity because they can collide when they extend beyond the width of the neume.
We handle lyrics in the same way as Western staff notation in LilyPond, using the Hegazy-Gourlay approach.
LilyPond's `LyricSpace` and `LyricHyphen` grobs both call `ly:lyric-hyphen::set-spacing-rods` to create "an invisible object that prevents lyric words from being spaced too closely."
Here the term _rod_ is used for what Knuth & Plass call a _box._
This is an application of the Hegazy-Gourlay technique of pre-stretching glue to a minimum extent.

The paragraph encoding is easiest to understand one note boundary at a time.
For each boundary between note $i$ and note $i{+}1$, the code computes two quantities:

- $m_i$: the minimum width required when both notes remain on the same line.
- $w_i$: extra width that matters only if a line break is taken at that boundary.

The paragraph encoding itself is fixed.
Only $m_i$, $w_i$, and the break cost vary from one boundary to the next.

For each note, the code first computes the lyric geometry.
Let $W^n$ be the neume width, $W^\ell$ the lyric width, and $h$ the lyric horizontal offset.

For centered lyrics, the projections are

$$L_i = \max(0, (W^\ell_i - W^n_i - h_i)/2), \qquad R_i = \max(0, (W^\ell_i - W^n_i + h_i)/2).$$

For left-aligned melisma starts, the code uses

$$L_i = \max(0, -h_i), \qquad R_i = 0.$$

This means that the lyric may continue under later melisma neumes, so the full overhang is _not_ placed in $R_i$.
Instead, any part of the running melisma that still extends beyond the current neume is tracked separately in `melismaLyricsEndPx`.

### Paragraph encoding

Let $B_i$ be the neume width, $c_i$ the break cost, $w_i$ the break-only reservation at breakpoint $i$, and $m_i$ the minimum same-line width between notes $i$ and $i{+}1$.
Let $s_0$ be the default preferred spacing between successive notes, and let $s^+$ and $s^-$ be the standard stretch and shrink budgets for an inter-note gap.

Each note is encoded in the paragraph as

$$\text{penalty}(\infty) \quad \text{glue}(L_i, 0, 0) \quad \text{box}(B_i) \quad \text{penalty}(\infty) \quad \text{glue}(0, s^+, s^-) \quad \text{penalty}(c_i, w_i) \quad \text{glue}(m_i, 0, 0).$$

Here:

- $B_i$ is the neume width. When the preceding martyria has a transferable bar, an anonymous spacer box of the bar width is inserted before $B_i$ (see above); $B_i$ itself is unchanged.
- $L_i$ is the left projection, fixed and unbreakable, and omitted when zero.
- $s_0$ is the default preferred spacing between successive notes.
- $s^+$ and $s^-$ are the standard stretch and shrink budgets for an inter-note gap.
- $c_i$ is the break cost: 0 for a normal break, $\infty$ to prohibit a break, or an intermediate value to discourage one.
- $w_i$ is the penalty width, a conditional width counted only when a break occurs at this point. It reserves space for the current note's right projection, any melisma overhang that would extend past the right margin, and measure-bar transfers, when the next note's left measure bar moves to this note's right side at a line break.
- $m_i$ is the minimum same-line width required between notes $i$ and $i{+}1$.

On the same line, each inter-note gap contributes $m_i$ of width plus $s^+$ of stretch for distributed justification.
The stretch comes from the vanishing glue $\text{glue}(0, s^+, s^-)$; the cancellation glue $\text{glue}(m_i, 0, 0)$ contributes only the fixed minimum distance.
The current implementation allows negative values only in the width $m_i$, when tuck absorption exceeds the base spacing; stretch and shrink are never negative.
In other words, all stretchability lives in the first glue, while the second glue cancels width only.
The implementation does not use a second glue of the form $\text{glue}(m_i, -s^+, -s^-)$.

At a break, the cancellation glue becomes leading glue on the next line and is skipped by `positionItems`, so $m_i$ vanishes.
The vanishing stretch glue stays on the current line and contributes $s^+$ of stretch at line end.
The left projection $\text{glue}(L_{i+1}, 0, 0)$ of the next note protects the left edge of the new line.
The penalty width $w_i$ remains the break-only quantity: it cannot live in the cancellation glue, because that glue disappears at breaks.
Its job is to reserve space for the right projection, melisma lyric overhang, and measure-bar transfers that matter only at line end.

If a paragraph ends immediately after a note, `endParagraph` materializes that note's right-edge reservation, the larger of the right projection and the melisma overhang, into the finishing glue width.
It must do this because `removeGlue` strips the trailing cancellation glue, while the forced break itself contributes penalty width 0.

When a martyria follows a note, the martyria path replaces the note's trailing post-break glue with martyria glue: ordinary martyria glue in the usual case, or the infinite-stretch right-martyria glue when the martyria is right-aligned.
Ordinary note-to-martyria lyric collision is still handled by `addLyricReservation`.
However, if a melisma lyric overhang extends past the last neume, that remaining overhang is first materialized into the replacement martyria glue width so that it is not lost when the note's cancellation glue is removed.

### Computing the minimum same-line width

The code computes $m_i$ directly, rather than trying to force all lyric behavior into a single "reserve the full overshoot" rule.
Conceptually,

$$m_i = s_0 + \textit{sameLineReservation}_i.$$

The same-line reservation starts from the current note's right projection and is then adjusted in two ways.

First, some reservation can be _reclaimed_ when lyrics tuck under neighboring neumes:

- The next note's left projection can be absorbed into the cancellation glue, so on the same line we do not always need the full $L_{i+1}$.
- If the next neume is wider than its lyric, some of the current note's right projection can tuck under that neume.

Second, if the resulting lyric gap is still too small, a collision correction is added back.
So the code does not reserve lyric overshoot mechanically.
It reserves only the width that is actually needed on the same line after tuck opportunities have been taken into account.

In code, the same-line width is computed as

$$m_i = s_0 + R_i - T_i^\text{left} - T_i^\text{right} + \ell_i,$$

where:

- $T_i^\text{left}$ is the amount of the next note's left projection that can be absorbed on the same line.
- $T_i^\text{right}$ is the amount of the current note's right projection that can tuck under the next neume.
- $\ell_i$ is the collision correction needed to keep the actual visible lyric gap large enough on the same line: normally at least `lyricsMinimumSpacing`, but for a hyphenated melisma start at least $\texttt{lyricsMinimumSpacing} + \textit{hyphenWidth}$ when the hyphen is absorbed inside the current neume.

The collision check is geometry-based.
When both notes carry lyrics, the code computes the actual visual gap between them from the neume overhangs relative to their lyrics, then adds back only the missing amount.
This is what makes the two mirror-image cases behave correctly.
If the hyphen extends past the current neume, it appears in the carried melisma overhang and is handled by the melisma path below; the ordinary `lyricsMinimumSpacing` is then added by that collision rule.
If the hyphen fits entirely inside a wide current neume, there is no overhang to carry, so the ordinary same-line collision correction must reserve enough visible gap for the hyphen glyph plus the ordinary lyric spacing.
The same mechanism also handles melisma-to-non-melisma transitions: if a running melisma still extends past the current neume, the next syllable is pushed right only as much as necessary.

### Break-only reservation

The break-only reservation is simpler.
Let $\textit{melismaOverhang}_i$ be the distance by which the current syllable, tracked by `melismaLyricsEndPx`, still extends past the current neume, and let $\textit{measureBarTransfer}_i$ be the width that must be reserved when a left measure bar on the next note transfers to the right side of the current note at a break:

$$w_i = \max(R_i, \textit{melismaOverhang}_i) + \textit{measureBarTransfer}_i.$$

The melisma-overhang term is what protects line endings inside melismas.
Same-line melisma-to-syllable transitions are handled separately by the collision correction in $m_i$, not by $w_i$.
Because $w_i$ lives in the penalty item, it is counted only when a break is actually taken.

After all of the lyric geometry has been reduced to these quantities:

- $m_i$ answers "how much width is needed if the two notes stay on the same line?"
- $w_i$ answers "how much extra width is needed only if the line ends here?"

### Melismas

Melisma lyrics require special treatment.
When a melisma starts with a lyric wider than the neume, the lyric is left-aligned and extends to the right under subsequent melisma neumes.
Therefore the code does _not_ encode the entire excess width as a right projection on the start note.

Instead:

- the start note uses `alignLeft`, with $R_i = 0$;
- the running syllable's rightmost extent is tracked in `melismaLyricsEndPx`;
- same-line spacing to the next real syllable is handled by the ordinary collision correction in $m_i$, with the hyphen width and ordinary lyric spacing enforced there only when the hyphen is absorbed inside the current neume;
- line-end overflow inside the melisma is handled by the break-only reservation $w_i$.

This is slightly more involved than treating all melisma excess as an ordinary right projection, but it matches the visual result better: the lyric may legitimately run under later melisma neumes on the same line while still being protected at line endings.

### Maximum adjustment ratio

As Knuth & Plass note, pathological cases can arise in which no solution satisfies the stated constraints.
In such cases, they introduce a tolerance threshold that lets the search back off and retry with looser constraints.

The `knuth-plass-linebreak` library exposes this through `initialMaxAdjustmentRatio` and `maxAdjustmentRatio`.
We use those parameters, but not in the library's built-in "try one pass, then relax and accept the first feasible answer" style.
Since Byzantine notation has no analogue of hyphenation, the candidate note sequence is the same on every pass, so we can search over the ratio cap itself.

The optimization is therefore lexicographic:

1. Minimize the worst positive adjustment ratio in the paragraph.
2. Subject to that minimal cap, minimize the ordinary Knuth-Plass demerits.

In code, we first ask whether the paragraph can be broken with `r \le 1` by setting
`maxAdjustmentRatio = 1` and `initialMaxAdjustmentRatio = 1`.
If that fails, we search for the smallest finite cap $R > 1$ for which the paragraph becomes feasible.
We do this by doubling upward until a feasible cap is found and then binary-searching that interval.
Once the minimal feasible cap has been located, we round it up to the next small bucket before the final solve.
At present that bucket size is `0.05`, so a paragraph whose true minimum is, say, `1.12` is finally solved at cap `1.15`.
This deliberately gives the optimizer a small tolerance band in which breakpoint penalties can still break ties, rather than forcing it to spend a strong semantic penalty merely to shave a few hundredths off the worst line.

The important point is that, whenever a finite cap is in force, we set both ratio options to the same value.
This library takes the effective cap to be the minimum of `initialMaxAdjustmentRatio` and `maxAdjustmentRatio`, so leaving the initial pass at a different value would quietly impose a different threshold than the one we are searching for.
If the upward search fails to find any finite feasible cap before the hard ceiling (currently `4096`), the code falls back to an uncapped solve by using `maxAdjustmentRatio = null` and `initialMaxAdjustmentRatio = Infinity`.

This formulation cleanly separates the two use cases we care about:

- when all candidate lines can stay at or below $r = 1$, the solver fully uses the breakpoint penalties to choose among those tight and neutral layouts;
- once every solution requires some looseness, the primary objective becomes keeping the maximum ratio as small as possible, so a breakpoint that yields $r = 1.1$ can beat one that yields $r = 1.3$ even if the former is discouraged.

Within a fixed cap, the ordinary Knuth-Plass scoring still applies.
That means breakpoint penalties continue to matter as tie-breakers among layouts whose worst line is equally loose, and `adjacentLooseTightPenalty` still discourages abrupt fitness-class jumps between neighboring lines.
The `0.05` bucket makes this tie-breaking zone slightly wider on purpose.

This is also why we no longer need a custom `adjustmentRatioPenalty`.
Under unrestricted optimization, the base badness term $100|r|^3$ alone would let a legal line compete with a strong `0.5 * MAX_COST` penalty until about $r \approx 1.71$, which is later than we want.
The cap search solves that more directly:
instead of tuning an extra reward-function term to approximate "too loose", we search for the smallest cap that makes the paragraph feasible and then optimize normally inside that cap.

## Relaxing $\TeX$'s Restriction 1

The discussion above describes the paragraph encoding itself.
To make that encoding practical, we also had to revisit one of $\TeX$'s pruning assumptions.

### Motivation

The original Knuth-Plass pruning proof assumes what Knuth calls Restriction 1: all widths, stretches, and shrinks are non-negative.
Under that assumption, once a candidate line is overfull even after using all available shrink, no later breakpoint can rescue it, so the corresponding active node may be discarded immediately.

Our music-layout use case breaks that assumption in a natural way.
In Byzantine notation, some same-line reservations are most naturally expressed as negative widths.
For example, a cancellation term may become negative when one note's left projection is fully absorbed by the next note, or when a later breakpoint removes width that only seemed necessary at an earlier breakpoint.
These are not pathological inputs; they arise directly from the geometry of neumes and lyrics.

A blanket rule of "disable pruning whenever any value is negative" is safe, but too conservative.
For the music use cases that motivated this work, we really need to support three kinds of rescue:

1. A later ordinary breakpoint may be rescued by negative content that appears before that breakpoint, such as a negative glue width or a negative box width.
2. A later ordinary breakpoint may be rescued by a negative penalty width that is counted only when the break is actually taken.
3. The terminal forced break may be rescued by negative content that appears only at the end of the paragraph, either before the forced break or in the forced break's own penalty width.

These are all negative-width phenomena.
They do not require negative stretch or negative shrink.

### The idea

Instead of asking, "Are all values non-negative?", ask a more local question:
could any future breakpoint still rescue this line?

To answer that, it helps to track a line-width "floor."
At a breakpoint, the floor is the smallest width that the line could possibly have if we spent all available shrink up to that breakpoint.
If even that floor is still too large, the line is irrecoverably overfull.
If some later breakpoint has a low enough floor, we must keep the active node alive because that later breakpoint might still fit.

For a fixed active node at the start of the paragraph and line length 10, the idea looks like this:

| Quantity                 | $b_1$ |        $b_2$ |    $b_3$ |
| ------------------------ | ----: | -----------: | -------: |
| Current content          |    11 | $11 + 1 - 2$ |       20 |
| Floor $F(b)$             |    11 |           10 |       20 |
| Suffix minimum after $b$ |    10 |           20 | $\infty$ |

At $b_1$ the current line is overfull, but the suffix minimum to the right is 10, so a later breakpoint can still rescue it.
The node must remain active.

At $b_2$ the floor is exactly 10, so the later breakpoint fits.

At $b_3$ the suffix minimum is $\infty$ because there is no later breakpoint.
Nothing can rescue the line after $b_3$.

That is the entire relaxation.
$\TeX$'s original argument says that, under Restriction 1, the floor can only increase as we move rightward.
We replace that monotonicity claim with a direct check of the best floor that occurs anywhere to the right.

### The relaxation

Let:

- $W(b)$ be the prefix width up to breakpoint $b$, including the penalty width if $b$ is a penalty;
- $S(b)$ be the prefix shrink up to breakpoint $b$;
- $F(b) = W(b) - S(b)$ be the breakpoint floor.

Now fix an active node $a$ and line length $L$.
The line from $a$ to breakpoint $b$ has

$$W_a(b) = W(b) - a.\text{totalWidth}$$

and

$$S_a(b) = S(b) - a.\text{totalShrink}.$$

Its floor is therefore

$$F_a(b) = W_a(b) - S_a(b) = F(b) - a.\text{totalWidth} + a.\text{totalShrink}.$$

The line is irrecoverably overfull exactly when its floor exceeds the target line length:

$$F_a(b) > L.$$

Rearranging gives a threshold in prefix coordinates:

$$F(b) > L + a.\text{totalWidth} - a.\text{totalShrink}.$$

Here $r(a,b)$ denotes the adjustment ratio of the line from active node $a$ to breakpoint $b$.
The pruning rule becomes:

1. The current breakpoint $b$ must itself satisfy $r(a,b) < -1$.
2. The minimum floor over all strictly later breakpoints must still exceed

$$L + a.\text{totalWidth} - a.\text{totalShrink}.$$

If both conditions hold, no later breakpoint can rescue the line from $a$.

The proof is short.
Suppose there exists some later breakpoint $c > b$ with

$$F(c) \le L + a.\text{totalWidth} - a.\text{totalShrink}.$$

Then

$$F_a(c) = F(c) - a.\text{totalWidth} + a.\text{totalShrink} \le L,$$

so the line from $a$ to $c$ is not overfull after maximum shrink.
Therefore $a$ must remain active.
Conversely, if every later breakpoint $c > b$ satisfies

$$F(c) > L + a.\text{totalWidth} - a.\text{totalShrink},$$

then every later segment floor satisfies $F_a(c) > L$, so every such line remains overfull.
In that case no future breakpoint can rescue $a$, and pruning is safe.

This is exactly what the implementation computes: the suffix minimum of $F(b)$ over strictly later breakpoints, followed by a comparison with the node-dependent threshold.

### What can go wrong

This argument is tight.
It relies on the usual direction of adjustment:
shrink can only make a line narrower, and stretch can only make a line wider.
If either sign flips, the floor argument breaks.

#### Negative shrink

Take a line of target width 1 with actual width 2 and total shrink -5.
Then

$$F = \text{actual} - \text{shrink} = 2 - (-5) = 7,$$

which looks wildly overfull from the floor alone.
But the adjustment ratio computed by the algorithm is

$$r = \frac{1 - 2}{-5} = 0.2,$$

which lies in the feasible range.
The problem is that negative shrink no longer moves width downward.
Subtracting shrink makes the floor larger, not smaller, so the floor is no longer a lower bound on the final line width.
This is why the optimization is disabled whenever any glue has negative shrink.

#### Negative stretch

Now take a line of target width 10 with actual width 8 and total stretch -1.
The line is underfull, not overfull, but the adjustment ratio is

$$r = \frac{10 - 8}{-1} = -2.$$

So $r < -1$ can occur even though the line is short, not long.
Meanwhile the floor is just

$$F = 8,$$

which is below the target width 10.

This breaks the key equivalence used by $\TeX$'s pruning argument:
$r < -1$ no longer means "overfull even at maximum shrink."
Negative stretch makes the adjustment ratio itself change meaning, so the pruning test cannot even get started.
For that reason the implementation also disables the optimization whenever any glue has negative stretch.

### Implementation

The relaxation adds a small $O(n)$ precomputation ahead of the usual dynamic-programming pass:

1. A forward pass walks the paragraph once and records the floor

   $$F(b) = \text{sumWidth} + \text{penaltyWidth} - \text{sumShrink}$$

   at each feasible breakpoint.

2. A backward pass computes the suffix minimum of those floor values over strictly later breakpoints.

During the main search, the pruning rule becomes:

- keep the classic $\TeX$ check $r < -1$ for the current breakpoint;
- prune only if the suffix-minimum floor is still above the active node's overfull threshold;
- disable the optimization entirely if any glue has negative stretch or negative shrink.

This preserves the original asymptotic complexity.
The extra work is linear in the number of items and requires one additional array of size $O(n)$.

### Results

For the Byzantine music inputs that motivated this work, the relaxation preserves the useful $\TeX$ pruning behavior even when negative widths appear in the paragraph encoding.
The old "any negative value disables pruning" rule was safe, but it threw away pruning in exactly the cases where a later breakpoint could still rescue the line.
The new rule keeps those rescuing cases alive while still pruning nodes that are genuinely irrecoverable.

The asymptotic worst-case bound does not change.
With or without the relaxation, the dynamic-programming search is still worst-case $O(\min(wn, n^2))$.
What changes is the practical behavior on negative-width inputs.
Under the old rule, any negative value disabled pruning entirely, so those inputs were pushed much more often toward the unpruned quadratic search.
Under the new rule, the supported negative-width cases recover the same pruning logic used in the ordinary non-negative setting, so they avoid that needless loss of pruning.
In other words, the relaxation does not improve the formal worst-case bound; it prevents negative-width music inputs from suffering an avoidable practical degradation toward that worst case.

## Future work

The 19th-century publications use several compression techniques to fit content into narrow lines; see compression techniques #1, #2, and #3 above.
Knuth & Plass draw an analogy to biblical Hebrew, which is never hyphenated, and note that

> Hebrew fonts intended for sacred texts usually include wide variants of several letters,
> so that individual characters on a line can be replaced by their wider counterparts in order to avoid wide spaces between words.
> For example, there is a super-extended aleph in addition to the normal one.

Knuth & Plass acknowledge that "an extension would be needed to make the optimum-fit algorithm handle cases like [these]. ...
The badness function of a line would [...] depend not only on its natural width, stretchability, and shrinkability," but also on "the number of dual-width characters present."
The three line-compression techniques described above are not yet implemented, because they require just such an extension to the badness function.
Adding support for these dual-width characters remains an open problem for future work.

## References

[^1] Donald E. Knuth and Michael F. Plass. 1981. [Breaking paragraphs into lines](https://gwern.net/doc/design/typography/tex/1981-knuth.pdf). _Software Practice and Experience._ 11, 11 (1981), 1119-1184.

[^2] D. S. Hirschberg and L. L. Larmore. 1987. [The Least Weight Subsequence Problem](https://cse.hkust.edu.hk/mjg_lib/bibs/DPSu/DPSu.Files/0216043.pdf). _SIAM Journal on Computing._ 16, 4 (1987), 628-638.

[^3] Oege de Moor and Jeremy Gibbons. 1999. [Bridging the algorithm gap: A linear-time functional program for paragraph formatting](http://www.cs.ox.ac.uk/people/jeremy.gibbons/publications/bridging.ps.gz). _Science of Computer Programming._ 35, 1 (1999), 3-27.

[^4] Michael J. Clancy and Donald E. Knuth. 1977. [A programming and problem-solving seminar](http://infolab.stanford.edu/pub/cstr/reports/cs/tr/77/606/CS-TR-77-606.pdf). Computer Science Department Technical Report STAN-CS-77-606. Stanford University, 1977, 85-88.

[^5] Wael A. Hegazy and John S. Gourlay. 1988. Optimal line breaking in music. In _Proceedings of the International Conference on Electronic Publishing on Document manipulation and typography._ Cambridge University Press, USA, 157-169.
