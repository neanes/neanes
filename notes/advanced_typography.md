# Advanced typography

## Scope

Neanes stores editable text typography as a type family plus a real face style.
A face such as `Minion Pro Semibold` belongs in document state as a base family
(`fontFamily: "Minion Pro"`) and a face style (`fontStyle: "Semibold"`), not as a
full face name saved in the family field, a raw CSS weight/slant pair, or toolbar
state.

The same boundary applies to every score surface that stores editable text:
CKEditor rich text, text annotations, plain text boxes, lyrics overrides, drop
caps, and page setup defaults all keep "the family the user picked" separate
from "the real face within that family."

"Advanced typography" here means real named faces -- optical sizes (Caption,
Display), named weights (Semibold, Light), and slants -- as document state. The
font catalog is the authority on which real faces a family has (section 2), the
Bold-means-700 axis model defines the Bold/Italic shortcuts (section 3), and the
shared face resolver gives layout, print, and export the same rendering answer
(section 6).

## Abstract

Neanes models a typeface as **family + style** everywhere the score
stores editable text. This is not only a CKEditor concern. CKEditor rich-text
HTML, text annotations, plain text boxes, lyrics overrides, drop caps, and the
page setup defaults all share the same rule:

> A family names the type family. A style names the real face within that
> family. Bold and Italic are shortcuts over that style, not independent saved
> state.

The contract keeps those ideas separate across the app: rich-text controls use
the same style identity as the structured score fields, and Bold/Italic toolbar
state is derived from saved face data instead of being stored as a separate face
representation.

The document model uses `fontStyle` as the document-level typography primitive:

- rich text keeps CKEditor's existing `fontFamily` attribute and uses a
  `fontStyle` text attribute;
- non-rich runtime state uses `fontStyle`, while score JSON writes explicit
  `fontSubfamily` fields for text boxes, lyrics, drop caps, and their page setup
  defaults;
- legacy booleans and weight/style pairs are folded into styles on load;
- layout and exporters resolve the same family+style pair before measuring or
  emitting CSS;
- UI controls, Bold/Italic shortcuts, and family remapping all use the same
  style-axis helpers.

**The Bold axis means the 700-weight face in document state and in rich-text
output.** Semibold, Light, Caption, Display, and the rest are styles chosen from
the style list, never evidence that the Bold shortcut is active. In rich text,
any explicit `fontStyle` value serializes as CSS that pins both axes. That means
`Regular` is a real override, not "clear the attribute", and `Bold`, `Italic`,
and `Bold Italic` all downcast to CSS spans as well. A missing `fontStyle`
attribute means the run inherits the active paragraph/text style. Semantic
`<strong>`/`<b>` and `<em>`/`<i>` are still accepted on import, but they are just
one input shape for the same explicit override path.

CKEditor is the most delicate integration point because its conversion pipeline
has strict previous/next attribute semantics, but it is only one adapter over the
same score typography contract.

Section 8 (Invariants) is the canonical list of the rules that must hold.

---

## 1. The document typography contract

### 1.1 Canonical shape

Every editable text surface that stores typography has the same logical
shape:

| Concept      | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `fontFamily` | The base family the user chose, such as `Source Serif` or `Minion Pro`  |
| `fontStyle`  | The real face within that family, such as `Regular`, `Bold`, `Semibold` |
| underline    | Independent text decoration, not a font face                            |
| size/color   | Existing scalar text properties, unaffected by the style model          |

The important boundary is between family and style. A face name such as
`Minion Pro Semibold` may be needed as generated CSS for rendering, but it is not
the canonical document family. The document model wants:

```yaml
fontFamily: 'Minion Pro'
fontStyle: 'Semibold'
```

not:

```yaml
fontFamily: 'Minion Pro Semibold'
fontWeight: '600'
```

The second form appears only at boundaries: as legacy input, or as generated
output when CSS cannot otherwise select the face.

### 1.2 Surfaces covered by the contract

The shared model covers all text whose typography is saved in the score:

| Surface                     | Runtime field(s)                                                       |
| --------------------------- | ---------------------------------------------------------------------- |
| rich text boxes/headers     | HTML in `RichTextBoxElement.content*`; CKEditor model uses `fontStyle` |
| text annotations            | HTML in `AnnotationElement.text`; CKEditor model uses `fontStyle`      |
| plain text boxes            | `TextBoxElement.fontFamily` + `fontStyle`                              |
| lyrics custom overrides     | `NoteElement.lyricsFontFamily` + `lyricsFontStyle`                     |
| drop caps                   | `DropCapElement.fontFamily` + `fontStyle`                              |
| page setup lyrics default   | `PageSetup.lyricsDefaultFontFamily` + `lyricsDefaultFontStyle`         |
| page setup drop-cap default | `PageSetup.dropCapDefaultFontFamily` + `dropCapDefaultFontStyle`       |
| page setup text-box default | `PageSetup.textBoxDefaultFontFamily` + `textBoxDefaultFontStyle`       |

Music fonts remain ordinary font families with only the `Regular` style. They
participate in the catalog so the controls can disable style and Bold/Italic
choices instead of inventing unavailable faces.

### 1.3 Why `fontStyle` is document state

Style is not a toolbar convenience. It affects:

- **layout** -- text metrics depend on Semibold, Caption, Bold Italic, etc.;
- **printing** -- the print DOM must render the chosen face without a live editor;
- **HTML export** -- byzhtml output needs CSS that selects the same face;
- **LaTeX export** -- non-rich text needs resolved weight/style where possible;
- **copy/clone/save** -- typography must move with the element, not with editor UI
  state.

That is why non-rich fields store `fontStyle` directly and why rich text
normalizes its HTML into the same concept on editor load. CKEditor may import
legacy semantic wrappers; normalized output uses stock semantic tags for basic
faces and CSS spans for explicit non-basic faces, so the browser renders the same
score typography model the rest of the app uses.

### 1.4 Regular, defaults, and inherited rich text

`Regular` is the virtual baseline style for "the family default face." It is
always legal, even when a font source fails to report an explicit Regular face,
because the document model needs a stable way to say "plain for this family."

The two storage formats use that baseline differently:

- **Non-rich score fields** store their face style explicitly (including
  `Regular`) because they are structured JSON fields whose value participates in
  clone, page setup, and UI state. Inheriting the page-setup default is a
  separate, explicit switch -- a `useDefaultStyle` / `lyricsUseDefaultStyle`
  boolean on the element (section 4.1) -- not the absence of a value.
- **CKEditor rich text** omits the `fontStyle` attribute when the run has no
  explicit face-style override. In that case the run inherits the active
  paragraph/text style's family and axes. A run with an explicit `fontFamily`
  but no `fontStyle` overrides only the family. A present `fontStyle` is always
  an explicit override and serializes as CSS that pins both axes, including
  `Regular`.

Unlike the non-rich surfaces, rich text does **not** inherit a non-regular
default face from the content root. The root may still supply the base family,
size, and color, but it is the active paragraph/text style that contributes the
default face axes when `fontStyle` is absent. Non-Regular page/text-box defaults
(`Source Serif Caption`, `Semibold`, ...) still apply to plain text boxes,
lyrics, and drop caps, which resolve straight to CSS; rich text deliberately
keeps inheritance in the paragraph/style layer instead of baking a separate root
face into the content.

Named non-basic styles, such as Caption, Display, or Condensed, still need a
concrete family to render. If the user chooses such a style while the rich-text
family control is "Default", the UI first materializes the current default family
as an explicit `fontFamily` value, then writes the style. Reset/remove-format
remains the way to clear `fontStyle` so the run falls back to inherited
paragraph/style axes.

---

## 2. Font catalog: the authority on real faces

`src/services/FontCatalog.ts` owns the list of families and styles. Everything
else asks the catalog instead of guessing from names. The catalog reports real
faces from bundled and system sources, plus the virtual `Regular` baseline when a
source does not explicitly report one. It is a module-level singleton rather than
a Vue composable because it is used from CKEditor conversion code, layout/export
helpers, and ordinary components.

### 2.1 What it answers

| Method                       | Answers                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `bundledFamilies()`          | bundled family names in picker order                                         |
| `systemFamilies()`           | installed system families, Electron only                                     |
| `getStyles(family)`          | that family's styles, ordered for controls and always including `Regular`    |
| `resolveFace(family, style)` | CSS family plus render hints: `{ cssFamily, cssFontWeight?, cssFontStyle? }` |
| `splitFace(faceName)`        | inverse of a face name: `Minion Pro Semibold` -> `Minion Pro` + `Semibold`   |
| `init()`                     | idempotently loads system fonts when the runtime can provide per-face data   |

`getStyles` and `splitFace` are a matched pair. The catalog is the single
authority on which styles a family has, including the virtual `Regular` baseline,
and how a stored or imported face name decomposes back into family + style.

### 2.2 Bundled and system sources

Bundled fonts are static registry entries matching the app's `@font-face` rules:
most bundled families are declared in `App.vue`, while Source Serif's
expanded face set lives in `src/assets/fonts/source-serif.css` and is imported
from `src/assets/main.css`.

The bundled catalog is not a single four-face shape:

- Source Serif provides regular text weights plus Caption, Display, SmText, and
  Subhead optical families across the available weights and slants.
- GFS Didot and Old Standard provide Regular/Bold/Italic/Bold Italic.
- Noto Naskh Arabic provides Regular/Bold.
- Music fonts provide Regular.

For bundled faces, `resolveFace` returns the CSS family declared by those
`@font-face` rules plus weight/style hints. Source Serif optical styles therefore
resolve to bundled CSS family names such as `Source Serif Caption`, while the
document stores `fontFamily: "Source Serif"` and
`fontStyle: "Caption Bold Italic"`. Those bundled optical CSS families are static
assets, not lazily injected rules. (How a compound style like
`Caption Bold Italic` decomposes into axes is section 3; system exact-face binding
is section 2.4.)

`TheEditor.vue` preloads every bundled face before opening documents. That
includes Source Serif's optical weight/slant faces, because layout and saved
rich-text box heights depend on correct font metrics from the first measurement
pass.

System fonts use `window.queryLocalFonts()` in Electron. Family-name-only
enumeration can fill a family picker but cannot answer "which styles does this
family have?"
`queryLocalFonts()` returns one `FontData` per face (`family`, `style`,
`fullName`, `postscriptName`), which is the data the document model needs.

The web build deliberately never calls `queryLocalFonts()`. It is
bundled-fonts-only, both for privacy and because the web app has no permission
path for local system fonts.

### 2.3 Ordering and the Regular guarantee

`getStyles` sorts with `compareFontStyles`:

1. Regular first.
2. Weight ladder from Thin through Black.
3. Upright before italic within a weight.
4. Optical/width/other tokens after the basic weight/slant identity.

It also guarantees the virtual `Regular` baseline is present, prepending it when
a family reports no default style. The rest of the subsystem depends on this: the
font style dropdown's default value, family remapping, Bold-off behavior, and
score defaults all assume Regular is always legal.

### 2.4 Exact-face CSS only when needed

Most styles can be rendered with the base family plus standard CSS:

```css
font-family: 'Minion Pro';
font-weight: 600;
font-style: normal;
```

Some system styles cannot. Caption, Display, Subhead, Condensed, and similar
non-weight tokens are not selected by CSS weight or slant alone. Bundled exact
families, such as Source Serif Caption, are known ahead of time, so they are
declared and preloaded as static assets for correct first-pass metrics. System
faces are discovered only at runtime through `queryLocalFonts()`, so for a system
face that needs an exact family name, `resolveFace` lazily injects a managed
`@font-face` rule into `document.head`:

```css
@font-face {
  font-family: 'Minion Pro Caption';
  src: local('MinionPro-Capt'), local('Minion Pro Caption');
}
```

The generated face-family is an output/rendering mechanism. It does not become
the document's canonical family.

---

## 3. Style axes: how Bold/Italic relate to styles

`src/utils/fontStyleAxes.ts` is the shared parser and matcher for font style
names. It is pure and dependency-free so CKEditor commands, Vue controls,
non-rich helpers, and tests all reason about style strings the same way.

### 3.1 Decomposition

`parseStyleAxes(style)` splits a style into:

- `bold` -- the standalone Bold axis, meaning weight 700;
- `italic` -- Italic or Oblique;
- `rest` -- every other token, preserved in order so a compound face name such
  as `Caption Bold Italic` round-trips without being reordered.

`Regular` and `Normal` are the empty identity. `Semibold`, `Light`, `Caption`,
`Display`, `Condensed`, and similar tokens live in `rest`.

### 3.2 Bold means 700, not "some heavier face"

This is the most important UI rule. The Bold button toggles the Bold axis, whose
document target is the 700-weight face. It must not treat Semibold, Medium,
Light, Extra Bold, or Black as active Bold, and it must not turn those faces into
Bold accidentally.

Three details enforce that:

- Spaced compound weights such as `Extra Bold` and `Semi Bold` are parsed as
  single `rest` tokens, not as the Bold axis.
- Numeric CSS weights fold through the weight ladder when imported as face
  styles: `600` becomes Semibold, `700` becomes Bold, `800` becomes Extra Bold,
  and `900` becomes Black. Only the `700` result is the Bold axis. Heavier named
  weights remain styles.
- Legacy semantic bold markers such as `<strong>`, `<b>`, or old boolean `bold`
  fields contribute the Bold axis only because they have no more specific named
  weight. When raw numeric `font-weight` is also available, it is carried as
  weight data so `800` and `900` do not collapse to Bold.

### 3.3 Matching and remapping

The helpers work with style identity rather than raw string order, so
`Bold Italic` and `Italic Bold` match the same face.

- `resolveAxisToggle(current, axis, available)` flips one axis and returns the
  matching available style, or `null` if the family has no such face. The UI uses
  `null` to disable the button.
- `matchStyle(style, available)` finds the available style with the same identity.
- `applyAxes(base, axes, available)` sets axes and returns a real available face
  when possible, falling back deterministically for legacy import.

Family changes use the same logic: exact style first, same Bold/Italic axes
second, then Regular. When the target family offers none of these -- no exact face
and no matching Bold/Italic axis -- the run falls all the way back to Regular, so
a weight or optical token the target family cannot honor is dropped rather than
silently approximated. No UI path invents a style string that the target family
does not actually provide, except for the virtual Regular baseline.

---

## 4. Structured score persistence

Non-rich text surfaces store typography directly in score JSON. This layer is as
central as the CKEditor plugin because it is what makes page setup,
lyrics, text boxes, and drop caps participate in the same document contract.

### 4.1 Saved fields

The runtime model stores:

- `TextBoxElement.fontStyle`
- `NoteElement.lyricsFontStyle`
- `DropCapElement.fontStyle`
- `PageSetup.lyricsDefaultFontStyle`
- `PageSetup.dropCapDefaultFontStyle`
- `PageSetup.textBoxDefaultFontStyle`

The score JSON save model writes those face styles to `fontSubfamily` field
names:

- `TextBoxElement_v1.fontSubfamily`
- `NoteElement_v1.lyricsFontSubfamily`
- `DropCapElement_v1.fontSubfamily`
- `PageSetup_v1.lyricsDefaultFontSubfamily`
- `PageSetup_v1.dropCapDefaultFontSubfamily`
- `PageSetup_v1.textBoxDefaultFontSubfamily`

The deserializer still recognizes the legacy fields and meanings that predate
`fontSubfamily`:

- text-box `bold` / `italic`
- lyrics `lyricsFontWeight`, plus CSS-slant values in `lyricsFontStyle`
- drop-cap `fontWeight`, plus CSS-slant values in `fontStyle`
- page setup `*DefaultFontWeight`, plus CSS-slant values in
  `*DefaultFontStyle`

The separate `fontSubfamily` name is deliberate. Internally, the concept is still
called `fontStyle` because it pairs with the runtime `fontFamily` field and with
CKEditor's `fontStyle` text attribute. In score JSON, however, old files already
used `fontStyle` for CSS slant values such as `normal`, `italic`, or `oblique`.
Score JSON therefore avoids overloading that legacy key. App score JSON does not
write a separate CSS slant field; CSS slant is derived from the face at runtime.

Each non-rich surface also has an inherit switch: a `useDefaultStyle` (text boxes,
drop caps) or `lyricsUseDefaultStyle` (custom lyrics) boolean. When set, the
element inherits the matching page-setup default family and style; when cleared,
it uses its own stored `fontFamily` + `fontStyle`. So "inherit the default" for
non-rich text is this boolean, not an absent value -- which is why the structured
fields can always store a concrete face, including `Regular`.

**Compatibility is backward-only.** Deserializing legacy files is fully supported
(the classifier and folding in section 4.2). The reverse is not: a file written
by this codebase contains `fontSubfamily` face names and omits the legacy
weight/slant fields, and the score version is deliberately not bumped for this
field set -- load is field-detected, not version-gated. The version stays put
because the loader disambiguates formats by field presence, so a version bump
would gate nothing on read; its only added effect would be to make older builds
hard-reject files they have no graceful mechanism to handle. Older app builds
that do not understand `fontSubfamily` ignore those fields and silently drop
non-Regular faces. This is an accepted limitation: Neanes guarantees backward
compatibility for score files, not forward compatibility. The loader folds legacy
shapes into the document model; the writer does not preserve those legacy fields.

### 4.2 Loading legacy score JSON

`SaveService` accepts both shipped shapes:

- current `fontSubfamily` fields are document face styles and win over legacy
  weight/slant fields;
- legacy lowercase `normal`, `italic`, and `oblique` values in `fontStyle`
  fields are CSS slant values;
- missing face/slant fields mean no stored style.

The old `fontStyle` key is not a current face-style field in structured score
JSON. It is read only as legacy CSS slant for lyrics, drop caps, and page setup.

When a current face-style value is absent, the legacy fields are folded:

- text-box `bold` / `italic` booleans -> `Regular`, `Bold`, `Italic`, or
  `Bold Italic`;
- weight/style pairs -> `fontStyleFromLegacyCssStyle`;
- numeric weights map to named styles on the weight ladder (`600` -> `Semibold`,
  `700` -> `Bold`, `800` -> `Extra Bold`, `900` -> `Black`, etc.). Only the
  exact Bold style is the Bold axis; heavier weights remain named styles;
- italic/oblique style sets the Italic axis.

Structured JSON also accepts the old "face name saved as family" shape. Before
loading a non-rich font field, `SaveService` treats the saved family as a
possible face name and runs it through `fontCatalog.splitFace`:

```yaml
fontFamily: 'Minion Pro Semibold'
```

loads as:

```yaml
fontFamily: 'Minion Pro'
fontStyle: 'Semibold'
```

That split applies to plain text boxes, custom lyrics, drop caps, and all page
setup typography defaults, including `lyricsDefaultFontFamily`. `splitFace` only
decomposes names it can attribute to a known family: a string that is itself a
recognized family is left intact, and otherwise the longest known family that
prefixes the name wins. Only when no known family matches does a trailing-style-word
heuristic apply, which can mis-split an unrecognized multi-word family whose final
token is a style word (`Light`, `Caption`, etc.) -- an accepted limitation for
fonts the catalog does not know. If a current face-style value is present, the
split normalizes the family but the explicit style wins. In score JSON, that
current value comes from `fontSubfamily`; otherwise the split face supplies the
base style, and legacy booleans or weight/style fields fold axes into that base
style.

The normalized runtime model always has a `fontStyle` value. Legacy
weight/slant fields are accepted only at the save-file boundary, where
`SaveService` folds them into document face styles. Runtime code that needs CSS
values resolves the stored family+style pair directly instead of reading legacy
weight/slant model properties.

### 4.3 Runtime resolution

`src/utils/fontStyle.ts` is the structured-score adapter:

- `normalizeFontStyle` handles empty/null values as Regular.
- `fontStyleFromLegacyCssStyle` maps legacy CSS weight/slant values, and
  `applyLegacyStyle` folds those values into an existing face style.
- `SaveService` folds legacy text-box `bold` / `italic` booleans through
  `applyAxes`.
- `getFontStyleOptions` asks the catalog for valid styles.
- `toggleFontStyleAxis` runs the shared axis toggle.
- `remapFontStyleForFamily` preserves the closest valid face across family
  changes.
- `resolveFontStyle` turns family+style into CSS-ready family/weight/style.

Layout, on-screen rendering, and exporters call `resolveFontStyle` instead of
reading or constructing weight/style fields directly.

---

## 5. Rich-text persistence and CKEditor normalization

Rich-text content is an HTML string in `RichTextBoxElement.content*`,
`AnnotationElement.text`, and related sub-editor fields. Rich text has no score
file-version bump because the save layer copies that HTML through without
interpreting it. The typography model is enforced inside CKEditor's model and
conversion pipeline.

### 5.1 CKEditor model attributes

Rich text uses two text attributes:

- `fontFamily` -- CKEditor's built-in attribute, kept in its existing model
  shape. The value is the raw CSS family-list string (`Source Serif,Neanes`,
  `Minion Pro,Neanes`, etc.). This is the rich-text adapter exception to the
  document contract's base-family field: catalog operations, remapping, and
  exact-face resolution extract the first/base family from the CSS list, while
  the full list is preserved for CKEditor round-trip and fallbacks.
- `fontStyle` -- the font style string. It is omitted when no explicit face
  style is stored. CKEditor treats the attribute as formatting and copies it on
  Enter.

`BoldEditing` and `ItalicEditing` are not part of the editor build. Bold and
Italic are represented as `fontStyle` axes, but they downcast to the same stock
`<strong>` and `<i>` markup those plugins would emit (section 5.2), so the model
is unified on `fontStyle` while the output stays conventional. `UnderlineEditing`
is part of the build because underline is decoration, not a font face.

### 5.2 Rich-text output

Rich text serializes every explicit `fontStyle` as CSS so both axes are pinned:

| Explicit style | Rich-text output                                   |
| -------------- | -------------------------------------------------- |
| `Regular`      | CSS span with `font-weight:400;font-style:normal;` |
| `Bold`         | CSS span with `font-weight:700;font-style:normal;` |
| `Italic`       | CSS span with `font-weight:400;font-style:italic;` |
| `Bold Italic`  | CSS span with `font-weight:700;font-style:italic;` |

The base family, when explicit, is a separate `<span style="font-family:...">`
emitted by CKEditor's built-in `FontFamilyEditing`; the rich-text adapter then
adds a nested style span for the explicit face. A bold run in `GFS Didot` thus
serializes as:

```html
<span style="font-family:GFS Didot,Neanes;"
  ><span style="font-weight:700;font-style:normal;">...</span></span
>
```

This is now faithful because explicit rich-text styles pin both axes via CSS
spans, even when the active paragraph/text style contributes italic or bold.
The content root may still set `font-family`, `font-size`, and `color`, but the
paragraph/style layer can contribute its own face axes. That is why every
explicit `fontStyle` downcast pins both `font-weight` and `font-style`: a bare
`<strong>` would only pin weight and could still inherit an italic paragraph,
which would misrender `Bold` as `Bold Italic`.

Non-basic faces still serialize as CSS through the resolved face:

- named-weight style (Semibold, Extra Bold, Black, ...) -> base-family span plus
  absolute `font-weight`;
- optical/non-weight style (Caption, Display, ...) -> exact face-family first,
  then the base family list, plus weight/slant hints the base list cannot select
  on its own.

```html
<span style="font-family:Minion Pro,Neanes;font-weight:600;font-style:normal;"
  >...</span
>
<span
  style="font-family:'Minion Pro Caption', Minion Pro,Neanes;font-weight:600;font-style:normal;"
  >...</span
>
```

Non-basic styles need a concrete family because CSS cannot express "Caption of
whatever family I inherit," so the UI materializes the current default family
before writing a familyless non-basic style. Explicit `Regular` is now retained
and serialized as CSS, while reset/remove-format clears `fontStyle` entirely so
the run falls back to the inherited paragraph/style axes.

### 5.3 Importing old rich HTML

Old rich HTML normalizes through the same path as paste/import:

1. CKEditor's built-in any-value font-family upcast stores the raw `font-family`
   value.
2. `FontStyleEditing` recognizes legacy `<strong>`, `<b>`, `<em>`, `<i>`,
   `font-weight`, and `font-style`, and records transient
   `neanesLegacyBold`, `neanesLegacyItalic`, and `neanesLegacyWeight` markers.
   The raw weight marker matters: `300`, `600`, `800`, and `900` must recover
   Light, Semibold, Extra Bold, and Black instead of collapsing to either "not
   bold" or the generic Bold axis.
3. The post-fixer splits a face-name first token into family + style when no
   style is already present.
4. The post-fixer folds legacy markers into `fontStyle` and removes the markers.
   Explicit `font-style: normal` is preserved as `Regular` instead of being
   treated as "no style".
5. Only inferred default cases compact by removing `fontStyle`; explicit
   `Regular` remains stored so it can downcast back to CSS and pin both axes.

This handles both common old shapes:

```html
<span style="font-family:GFS Didot,Neanes;"><strong>...</strong></span>
<span style="font-family:'Minion Pro Semibold', Minion Pro, Neanes;">...</span>
```

After normalization, a subsequent edit/save re-emits the output described in
section 5.2: explicit `fontStyle` values always serialize as CSS spans that pin
both axes. Imported markup is renormalized through `fontStyle` first, so the
exact element and attribute order are canonicalized even for the basic cases.

### 5.4 Lazy migration

Opening a file does not rewrite rich-text HTML in the score model immediately.
CKEditor normalizes the live editor model when that editor is created, but
`element.content` is only rewritten when the box is edited and flushed back
(usually on blur). Opening and saving without touching a rich-text box preserves
that box's bytes (the non-rich structured fields around it are still re-serialized
into the current shape on save). The first real edit may rewrite that box;
explicit rich-text styles serialize as CSS spans that pin both axes, and only
the exact-family non-basic cases need a derived family name.

### 5.5 The CKEditor downcast rule

Family and style are independent in the view: `FontFamilyEditing` emits its own
`<span style="font-family:...">`, and the `fontStyle` downcast emits a CSS span
for any explicit style. The style span does not need the family for basic faces,
but non-basic ones still need an exact face derived from the base family. That
converter reads the sibling `fontFamily` off the model node, which makes it
subject to the fragile rule:

> A downcast converter must compose the view element from its own converted
> value, reading only sibling attributes from the model node.

The same explicit CSS path now handles `Regular`, `Bold`, `Italic`, and
`Bold Italic`, so a paragraph-style italic base cannot leak through a basic
override.

CKEditor's attribute converter is called once for the previous value and once for
the next value, while the model node already holds the next state. A converter
that ignored its passed value and re-read its own attribute would compute the next
element for both unwrap and wrap, leaving stale formatting painted. The non-basic
`fontStyle` converter therefore uses its passed value and reads only the sibling
family.

User flows keep this safe by changing one attribute per transaction: a family
change writes `fontFamily`, then remaps `fontStyle` in a separate command, so the
exact-face span is recomposed. Remove-format can clear both attributes in one
batch; the converter detects the sibling change and unwraps the old exact-face
span using both old values.

---

## 6. Rendering, layout, and export

A selected style must render without a live CKEditor instance. The page view,
print, layout measurement, byzhtml export, and LaTeX export all need the same
resolved face.

### 6.1 Resolution path

All non-rich consumers resolve through:

```ts
resolveFontStyle(fontFamily, fontStyle);
```

which delegates to `fontCatalog.resolveFace` and returns a shape whose fields are
all CSS, not document, values:

```ts
{
  cssFontFamily: resolved.cssFamily,
  cssFontWeight: "400" | "600" | "700" | "800" | "900" | ...,
  cssFontStyle: "normal" | "italic"
}
```

Every field carries the `css` prefix on purpose. The two arguments
(`fontFamily`, `fontStyle`) are document concepts; the return value is the CSS a
renderer needs, and the prefix marks the boundary. It matters most for the family
field. The resolved family may be a base family (`Minion Pro`) or an exact
generated face family (`Minion Pro Caption`) when CSS cannot select the style
directly -- so a bare `fontFamily` here would be precisely the document-vs-face
overload the model keeps separate, a CSS selector masquerading as the
canonical family. Naming it `cssFontFamily` keeps it unambiguously a rendering
value. By the same rule the slant is `cssFontStyle`, never `fontStyle`, because
`fontStyle` always names a face in this subsystem; `cssFontWeight` follows for
symmetry.

### 6.2 On-screen and print layout

`PageSetup.lyricsFont` and `NoteElement.lyricsFont` resolve styles before
constructing CSS font strings. For text boxes and drop caps, `LayoutService`
resolves the stored family+style pair and writes computed CSS family, weight, and
slant fields before measurement and rendering. This matters because a Semibold
or Caption face can change width and line breaks; treating style as toolbar-only
state would make the printed score disagree with the editor.

### 6.3 Exporters

`ByzHtmlExporter` resolves page setup defaults and element-specific overrides
before writing CSS custom properties or inline styles. `LatexExporter` resolves
the same structured model for non-rich text. Rich-text HTML export is
browser-renderable: explicit rich-text styles use CSS spans that pin both axes,
and non-basic faces carry absolute weight/style CSS or exact face families.

The LaTeX JSON export has its own compatibility contract. Its schema remains at
version `2`: exported `fontStyle` fields are still CSS slant values
(`normal`/`italic`) and CSS weight stays in `fontWeight`. Exact document face
styles such as `Semibold`, `Caption`, and `Display` are projected onto those CSS
axes, so non-CSS face information may be lost. The exporter carries a TODO for a
future schema extension that can represent exact face/style labels without
breaking v2 consumers.

Export portability is limited by font availability. System fonts are not
embedded. The exported CSS names the intended face as precisely as the browser
platform allows.

---

## 7. UI behavior

### 7.1 Shared controls

`FontStyleSelect.vue` is the common font style dropdown. It is deliberately small:
style lists are short, and all filtering/search behavior belongs in the family
combobox, not the style selector.

The same user-facing semantics apply everywhere:

- family picker chooses a base family;
- font style dropdown lists only the styles the family actually has;
- Bold/Italic buttons toggle axes of the current style and disable when no
  matching face exists;
- underline is independent;
- changing family remaps the current style to an existing face in the target
  family.

### 7.2 Rich text toolbar and properties

`useRichTextStyleCommands.ts` adapts the document model to CKEditor commands:

- `fontStyleValue` exposes selection `fontStyle`. Missing `fontStyle` displays
  the inherited default style when the run is fully default; when the user chooses
  an explicit style, including Regular, the command writes `fontStyle` so output
  can pin the intended axes.
- `fontStyleOptions` comes from the explicit family or the effective default
  family when the control shows "Default".
- `fontStyleToggleBold` and `fontStyleToggleItalic` back the Bold/Italic
  buttons and keystrokes.
- selecting a non-basic style under "Default" materializes the current default
  family so the style can render.
- clearing the family back to "Default" keeps explicit basic styles familyless
  because their CSS axes can inherit the family safely. Non-basic faces need an
  explicit family to serialize faithfully; clearing the family either clears that
  explicit non-basic override back to full default inheritance or materializes the
  current default family if the user is still choosing that style.
- family changes remap the style after the `fontFamily` command, in a separate
  transaction for correct downcast behavior.
- remove-format clears both `fontFamily` and `fontStyle`; the toolbar clears
  `fontStyle` before running CKEditor's `removeFormat` command, and the plugin
  downcast also handles same-batch co-clears as a safety net.

The style control appears beside the family control in both
`RichTextToolbar.vue` and `PropertiesRichTextStyle.vue`.

### 7.3 Plain text, lyrics, drop caps, and page setup

The non-rich UI uses the same helpers:

- `PageSetupDialog.vue` exposes font style dropdowns for lyrics, drop-cap, and
  text-box defaults.
- `ToolbarTextBox.vue` / `PropertiesTextBox.vue` expose the style when a text
  box uses custom style.
- `ToolbarLyrics.vue` / `PropertiesLyrics.vue` expose styles for custom lyrics.
- `ToolbarDropCap.vue` / `PropertiesDropCap.vue` expose styles for drop caps.

These controls are not secondary to CKEditor. They are direct editors for the
same structured score fields described in section 4.

---

## 8. Invariants

This subsystem preserves these invariants:

- The canonical model is **family + style**. Generated exact face names are
  rendering artifacts, not saved base families.
- `fontStyle` represents explicit rich-text face overrides and explicit non-rich
  score state. Legacy bold/italic and weight/style fields are load-only
  compatibility.
- `Regular` is the virtual baseline style and is always legal even when a font
  source does not report a Regular face.
- The Bold axis is the document shortcut for the 700-weight face. In rich text it
  serializes as stock `<strong>`; in non-rich CSS resolution it is
  `font-weight:700`. Semibold, Light, Caption, Display, Extra Bold, and Black are
  styles; numeric `800` and `900` fold to those named styles rather than to the
  Bold axis.
- Style lists come from `fontCatalog.getStyles`; controls do not invent
  unavailable styles other than the virtual Regular baseline.
- Family remapping chooses exact style, then same Bold/Italic axes, then
  Regular.
- Rich text keeps CKEditor's existing `fontFamily` value shape as an adapter
  exception: the model stores the raw CSS family list, while typography helpers
  extract the base family for catalog operations.
- A rich-text run with no `fontStyle` inherits the active paragraph/text style
  axes. A run with an explicit `fontFamily` but no `fontStyle` overrides only the
  family.
- A present rich-text `fontStyle` serializes as CSS that pins both axes.
  `Regular`, `Bold`, `Italic`, and `Bold Italic` all use the same explicit CSS
  path; the base family, when explicit, is a separate `FontFamilyEditing` span.
- Familyless explicit basic styles are valid. Familyless explicit non-basic
  styles are not valid save output; the UI materializes the current default
  family before writing them.
- `Regular` is retained when it is explicit. Only inferred default cases compact
  to the absence of `fontStyle`.
- The non-basic `fontStyle` converter -- the only one that reads the sibling
  family -- uses its own passed converted value for previous/next diffing. Family
  and style are otherwise independent view elements.
- CKEditor legacy markers always consume matched weight/style and are stripped
  before save. Semantic `<b>`/`<em>` and CSS weight/slant are import syntax; the
  canonical output is explicit CSS for rich-text fontStyle and exact-face CSS for
  non-basic faces.
- CKEditor legacy `font-weight` must be carried as a raw marker so Light,
  Semibold, Extra Bold, Black, and other specific weights survive import instead
  of collapsing to generic Bold/not-Bold state.
- Structured score JSON writes `fontSubfamily` fields and accepts legacy
  `fontStyle` CSS-slant fields only on deserialize.
- Score files are backward-compatible only: the writer drops legacy weight/slant
  fields and the version is not bumped, so older app builds cannot faithfully read
  newer files. Forward compatibility is out of scope.
- Structured score JSON must treat serialized lowercase `normal`, `italic`, and
  `oblique` `fontStyle` values as legacy CSS slant, not as new face names.
  Current document style names serialize in `fontSubfamily`.
- Structured score JSON must also split legacy full face names saved in
  `fontFamily`, such as `Minion Pro Semibold`, into base family + style on
  deserialize.
- Layout and exporters resolve styles through the shared helper before
  measuring or writing CSS.
- LaTeX JSON preserves schema v2 for compatibility; exact face styles are
  lossy until a future schema extension is added.
- The bundled font catalog and CSS declarations must stay in sync, including the
  Source Serif optical families in `source-serif.css`; bundled exact families are
  declared/preloaded, while system exact faces may be lazily bound with local
  `@font-face` rules.
- The web build does not call `queryLocalFonts`.

---

## 9. External behaviors relied upon

**CKEditor 5:**

- `downcast.attributeToElement` calls the view creator for both previous and
  next attribute values while the model item already holds the next state. A
  converter must use its passed value for its own attribute.
- Similar attribute elements merge when wrapping the same range, allowing family
  and style converters to intentionally produce one span.
- `upcast.elementToAttribute` consumes matched view styles when it sets a
  non-null model value, including boolean `false`; this keeps GeneralHtmlSupport
  from preserving redundant `font-weight`/`font-style` spans.
- Built-in `FontFamilyEditing` with `supportAllValues` stores the raw
  `font-family` style as a string and round-trips it.
- Model post-fixers run after changes and before rendering; `differ.getChanges()`
  can scope normalization to touched ranges.

**Browser / Electron:**

- `window.queryLocalFonts()` returns per-face `FontData` and requires the
  `local-fonts` permission in a secure context. Electron grants that permission
  from the main process.
- Standard `font-weight`/`font-style` selects installed faces when the font
  exposes normal weight/slant instances.
- `@font-face { src: local(...) }` can bind a generated family name to an
  installed face for optical/width styles the browser cannot infer.

---

## 10. File map

**Document model and persistence:**

- `src/models/Element.ts` -- runtime `fontStyle` fields for lyrics, text boxes,
  and drop caps, plus saved annotation rich-text HTML.
- `src/models/PageSetup.ts` -- default typography styles and resolved lyrics
  font getter.
- `src/models/save/v1/Element.ts`, `src/models/save/v1/PageSetup.ts` -- saved
  `fontSubfamily` fields plus legacy optional fields.
- `src/services/SaveService.ts` -- writes `fontSubfamily` fields, splits legacy
  full face names, and folds legacy fields on load.

**Font model and rendering data:**

- `src/services/FontCatalog.ts` -- bundled registry, Electron system font
  loading, style lookup, face splitting, face resolution, and exact-face
  `@font-face` injection.
- `src/assets/fonts/source-serif.css`, `src/assets/main.css` -- Source Serif
  base and optical `@font-face` declarations.
- `src/utils/fontStyleAxes.ts` -- parses, matches, toggles, applies, and sorts
  font style strings.
- `src/utils/fontStyle.ts` -- structured-score adapter for normalization,
  legacy folding, family remapping, axis toggles, and CSS resolution.

**CKEditor adapter:**

- `src/ckeditor-plugins/fontstyle/fontstyleediting.ts` -- schema, downcast,
  legacy-marker upcast, and normalization post-fixer.
- `src/ckeditor-plugins/fontstyle/fontstylecommand.ts` -- style command and
  Bold/Italic axis commands.
- `src/ckeditor-plugins/fontstyle/fontstyle-util.ts` -- rich-text
  `composeFontStyleCss` and family/face CSS helpers.
- `src/ckeditor-plugins/fontstyle/fontstyle.ts` -- plugin entry and
  CTRL+B / CTRL+I keystrokes.
- `src/customEditor.ts` -- editor build with `FontStyle` and without
  `BoldEditing`/`ItalicEditing`.
- `src/ckeditor-plugins/insertneume/insertneumeediting.ts` -- allows
  `fontStyle` on inline neume objects.

**Discovery and permissions:**

- `src/components/TheEditor.vue` -- initializes the catalog, preloads bundled
  font families, and feeds system families to controls.
- `electron/main/index.ts` -- grants `local-fonts` permission.

**UI:**

- `src/components/FontStyleSelect.vue` -- shared font style dropdown.
- `src/composables/useRichTextStyleCommands.ts` -- rich-text style state,
  Bold/Italic axis wiring, and family remapping.
- `src/components/RichTextToolbar.vue`,
  `src/components/properties/PropertiesRichTextStyle.vue` -- rich-text controls.
- `src/components/PageSetupDialog.vue`, `src/components/ToolbarTextBox.vue`,
  `src/components/properties/PropertiesTextBox.vue`,
  `src/components/ToolbarLyrics.vue`,
  `src/components/properties/PropertiesLyrics.vue`,
  `src/components/ToolbarDropCap.vue`,
  `src/components/properties/PropertiesDropCap.vue` -- structured-score style
  controls.

**Layout and export:**

- `src/services/LayoutService.ts` -- measures non-rich text using resolved
  styles.
- `src/services/integration/ByzHtmlExporter.ts` -- exports resolved styles to
  byzhtml CSS.
- `src/services/integration/LatexExporter.ts` -- writes schema v2-compatible
  CSS slant/weight fields and leaves exact face-style export as a future schema
  extension.
