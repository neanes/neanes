import { z } from 'zod';

import {
  AcceptsLyricsOption,
  ElementType,
  LineBreakType,
} from '@/models/Element';
import * as Neumes from '@/models/Neumes';
import { TextBoxAlignment } from '@/models/ParagraphStyle';
import { Scale, ScaleNote } from '@/models/Scales';

import { dropCapLyricsDescription } from './lyricSyntax';

// Read-only live content projections. These are not edit validation schemas.
// Layout caches are excluded except the explicitly exposed calculated pitches.
// Rendering state, saved IDs and nested objects are excluded.
// Unset values are omitted, except lineHeight: null explicitly resets to normal.
// False, zero and empty strings remain.
const breaks = {
  lineBreak: z
    .boolean()
    .describe(
      'Force a line break after this element. For a break before a passage, set this on its preceding element.',
    ),
  lineBreakType: z
    .enum(LineBreakType)
    .optional()
    .describe(
      'Center centers the line ending at this element; also set lineBreak:true or pageBreak:true. Unset means a left-aligned break; clear with null to restore that alignment.',
    ),
  pageBreak: z
    .boolean()
    .describe(
      'Force a page break after this element, also ending its line. For a new page before a passage, set this on its preceding element.',
    ),
};
const lineHeightSchema = z
  .number()
  .nullable()
  .optional()
  .describe(
    'Omitted (undefined in the live model) inherits the paragraph style. Null explicitly resets line height to normal. A number overrides line height with a unitless multiplier.',
  );

const richTextContent = z
  .string()
  .describe(
    'CKEditor HTML: <p class="neanes-paragraph-style-default-text">Hello</p>. Every p needs a paragraph-style class; use adjacent p elements for new lines. See get_rich_text_format; styles: get_paragraph_styles.',
  );
const annotationContent = z
  .string()
  .describe(
    'CKEditor HTML: <p class="neanes-paragraph-style-annotation">Sing softly</p>. Every p needs a paragraph-style class. See get_rich_text_format.',
  );
const plainTextContent = z
  .string()
  .describe('Plain text, not HTML or Markdown.');

export const elementPropertySchemas = {
  [ElementType.Note]: z.strictObject({
    ...breaks,
    lyrics: z.string(),
    isHyphen: z.boolean(),
    isMelismaStart: z.boolean(),
    isMelisma: z.boolean(),
    lyricsParagraphStyleId: z.string(),
    lyricsColor: z.string().optional(),
    lyricsFontFamily: z.string().optional(),
    lyricsFontSize: z.number().optional(),
    lyricsFontStyle: z.string().optional(),
    lyricsTextDecoration: z.string().optional(),
    lyricsStrokeWidth: z.number().optional(),
    lyricsStrokeColor: z.string().optional(),
    lyricsFontVariantCaps: z.string().optional(),
    lyricsFontVariantNumeric: z.string().optional(),
    lyricsFontVariantLigatures: z.string().optional(),
    lyricsFontVariantAlternates: z.string().optional(),
    scaleNotes: z
      .array(z.enum(ScaleNote).nullable())
      .describe(
        'Read-only calculated physical pitches in neume order, including octave. A multi-note neume has multiple entries. Null entries indicate pitches outside the supported range.',
      ),
    scaleNotesVirtual: z
      .array(z.enum(ScaleNote).nullable())
      .describe(
        'Read-only calculated virtual pitches in neume order, including octave, using the active fthora shift. Null entries indicate pitches outside the supported range.',
      ),
    quantitativeNeume: z
      .enum(Neumes.QuantitativeNeume)
      .describe(
        'Compound mark targets: get_element_catalog includeNeumeComponents:true. Roles follow the application mapping, not the order of names in this enum.',
      ),
    acceptsLyrics: z.enum(AcceptsLyricsOption),
    measureBarLeft: z.enum(Neumes.MeasureBar).optional(),
    measureBarLeftOffsetX: z.number().optional(),
    measureBarLeftOffsetY: z.number().optional(),
    measureBarRight: z.enum(Neumes.MeasureBar).optional(),
    measureBarRightOffsetX: z.number().optional(),
    measureBarRightOffsetY: z.number().optional(),
    measureNumber: z.enum(Neumes.MeasureNumber).optional(),
    measureNumberOffsetX: z.number().optional(),
    measureNumberOffsetY: z.number().optional(),
    noteIndicator: z.boolean(),
    noteIndicatorOffsetX: z.number().optional(),
    noteIndicatorOffsetY: z.number().optional(),
    ison: z.enum(Neumes.Ison).optional(),
    isonOffsetX: z.number().optional(),
    isonOffsetY: z.number().optional(),
    accidental: z
      .enum(Neumes.Accidental)
      .optional()
      .describe(
        'Primary component mark; use unsuffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    accidentalOffsetX: z.number().optional(),
    accidentalOffsetY: z.number().optional(),
    secondaryAccidental: z
      .enum(Neumes.Accidental)
      .optional()
      .describe(
        'Secondary component mark; use Secondary-suffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    secondaryAccidentalOffsetX: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of secondaryAccidental; does not select a component.',
      ),
    secondaryAccidentalOffsetY: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of secondaryAccidental; does not select a component.',
      ),
    tertiaryAccidental: z
      .enum(Neumes.Accidental)
      .optional()
      .describe(
        'Tertiary component mark; use Tertiary-suffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    tertiaryAccidentalOffsetX: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of tertiaryAccidental; does not select a component.',
      ),
    tertiaryAccidentalOffsetY: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of tertiaryAccidental; does not select a component.',
      ),
    fthora: z
      .enum(Neumes.Fthora)
      .optional()
      .describe(
        'Primary component mark; use unsuffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    fthoraOffsetX: z.number().optional(),
    fthoraOffsetY: z.number().optional(),
    secondaryFthora: z
      .enum(Neumes.Fthora)
      .optional()
      .describe(
        'Secondary component mark; use Secondary-suffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    secondaryFthoraOffsetX: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of secondaryFthora; does not select a component.',
      ),
    secondaryFthoraOffsetY: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of secondaryFthora; does not select a component.',
      ),
    tertiaryFthora: z
      .enum(Neumes.Fthora)
      .optional()
      .describe(
        'Tertiary component mark; use Tertiary-suffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    tertiaryFthoraOffsetX: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of tertiaryFthora; does not select a component.',
      ),
    tertiaryFthoraOffsetY: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of tertiaryFthora; does not select a component.',
      ),
    chromaticFthoraNote: z
      .enum(ScaleNote)
      .optional()
      .describe(
        'Primary component chromatic interpretation; pairs with fthora. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    secondaryChromaticFthoraNote: z
      .enum(ScaleNote)
      .optional()
      .describe(
        'Secondary component chromatic interpretation; pairs with secondaryFthora. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    tertiaryChromaticFthoraNote: z
      .enum(ScaleNote)
      .optional()
      .describe(
        'Tertiary component chromatic interpretation; pairs with tertiaryFthora. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    gorgonNeume: z
      .enum(Neumes.GorgonNeume)
      .optional()
      .describe(
        'Primary component mark; use unsuffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    gorgonNeumeOffsetX: z.number().optional(),
    gorgonNeumeOffsetY: z.number().optional(),
    secondaryGorgonNeume: z
      .enum(Neumes.GorgonNeume)
      .optional()
      .describe(
        'Secondary component mark; use Secondary-suffixed enum values. Resolve targets with get_element_catalog includeNeumeComponents:true.',
      ),
    secondaryGorgonNeumeOffsetX: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of secondaryGorgonNeume; does not select a component.',
      ),
    secondaryGorgonNeumeOffsetY: z
      .number()
      .optional()
      .describe(
        'CSS-pixel adjustment of secondaryGorgonNeume; does not select a component.',
      ),
    koronis: z.boolean(),
    koronisOffsetX: z.number().optional(),
    koronisOffsetY: z.number().optional(),
    stavros: z.boolean(),
    stavrosOffsetX: z.number().optional(),
    stavrosOffsetY: z.number().optional(),
    tie: z.enum(Neumes.Tie).optional(),
    tieOffsetX: z.number().optional(),
    tieOffsetY: z.number().optional(),
    timeNeume: z.enum(Neumes.TimeNeume).optional(),
    timeNeumeOffsetX: z.number().optional(),
    timeNeumeOffsetY: z.number().optional(),
    vocalExpressionNeume: z.enum(Neumes.VocalExpressionNeume).optional(),
    vocalExpressionNeumeOffsetX: z.number().optional(),
    vocalExpressionNeumeOffsetY: z.number().optional(),
    vareia: z.boolean(),
    vareiaOffsetX: z.number().optional(),
    vareiaOffsetY: z.number().optional(),
    spaceAfter: z.number(),
    keepWithNext: z.boolean(),
    ignoreAttractions: z.boolean(),
  }),
  [ElementType.Martyria]: z.strictObject({
    ...breaks,
    auto: z
      .boolean()
      .describe(
        'True derives note and scale from preceding music. Set false to assign note and scale manually; rootSign is still recomputed by layout.',
      ),
    note: z
      .enum(Neumes.Note)
      .describe(
        'Martyria pitch; derived from preceding music when auto:true. Set auto:false for a manual pitch.',
      ),
    rootSign: z
      .enum(Neumes.RootSign)
      .describe(
        'Layout-computed root sign, including rootSignOverride. Use rootSignOverride for a persistent display override.',
      ),
    rootSignOverride: z
      .enum(Neumes.RootSign)
      .optional()
      .describe(
        'Override the displayed root sign without changing pitch or scale. Null clears the override and restores calculation.',
      ),
    scale: z
      .enum(Scale)
      .describe(
        'Martyria scale; derived from preceding music when auto:true. Set auto:false for a manual scale.',
      ),
    alignRight: z
      .boolean()
      .describe(
        'Place at the end of the line. Changing this clears quantitativeNeume unless the same patch explicitly supplies it; an unchanged value preserves it.',
      ),
    measureBarLeft: z.enum(Neumes.MeasureBar).optional(),
    measureBarRight: z.enum(Neumes.MeasureBar).optional(),
    fthora: z.enum(Neumes.Fthora).optional(),
    chromaticFthoraNote: z.enum(ScaleNote).optional(),
    quantitativeNeume: z
      .enum(Neumes.QuantitativeNeume)
      .optional()
      .describe(
        'Attached neume, active when alignRight:true; changes the pitch for subsequent music. When changing alignment, explicitly supply this field to retain or replace it.',
      ),
    quantitativeNeumeFthora: z.enum(Neumes.Fthora).optional(),
    quantitativeNeumeChromaticFthoraNote: z.enum(ScaleNote).optional(),
    tempo: z.enum(Neumes.TempoSign).optional(),
    bpm: z.number(),
    tempoLeft: z.enum(Neumes.TempoSign).optional(),
    tempoRight: z.enum(Neumes.TempoSign).optional(),
    spaceAfter: z.number(),
    verticalOffset: z.number(),
  }),
  [ElementType.Tempo]: z.strictObject({
    ...breaks,
    neume: z.enum(Neumes.TempoSign),
    bpm: z.number(),
    spaceAfter: z.number(),
  }),
  [ElementType.Empty]: z.strictObject({
    ...breaks,
  }),
  [ElementType.TextBox]: z.strictObject({
    ...breaks,
    paragraphStyleId: z.string(),
    alignment: z.enum(TextBoxAlignment).optional(),
    color: z.string().optional(),
    content: plainTextContent,
    contentBottom: plainTextContent,
    contentLeft: plainTextContent,
    contentCenter: plainTextContent,
    contentRight: plainTextContent,
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    strokeWidth: z.number().optional(),
    strokeColor: z.string().optional(),
    customWidth: z.number().optional(),
    customHeight: z.number().optional(),
    fillWidth: z.boolean(),
    marginTop: z.number(),
    marginBottom: z.number(),
    inline: z.boolean(),
    fontStyle: z.string().optional(),
    underline: z.boolean().optional(),
    lineHeight: lineHeightSchema,
    fontVariantCaps: z.string().optional(),
    fontVariantNumeric: z.string().optional(),
    fontVariantLigatures: z.string().optional(),
    fontVariantAlternates: z.string().optional(),
    multipanel: z.boolean(),
    runningMarkerRole: z.enum(['chapter', 'section']).optional(),
    runningMarkerText: z.string().optional(),
    height: z.number(),
  }),
  [ElementType.RichTextBox]: z.strictObject({
    ...breaks,
    content: richTextContent,
    contentBottom: richTextContent,
    contentLeft: richTextContent,
    contentRight: richTextContent,
    contentCenter: richTextContent,
    languageCode: z.string().optional(),
    textDirection: z.enum(['ltr', 'rtl']).optional(),
    multipanel: z.boolean(),
    inline: z.boolean(),
    scrollable: z.boolean(),
    centerOnPage: z.boolean(),
    height: z.number(),
    customWidth: z.number().optional(),
    marginBottom: z.number(),
    marginTop: z.number(),
    offsetYBottom: z.number(),
    offsetYTop: z.number(),
    modeChange: z
      .boolean()
      .describe(
        'When true, this text box also resets the musical context for subsequent music using modeChange* fields; when false, those fields are inactive.',
      ),
    modeChangePhysicalNote: z
      .enum(ScaleNote)
      .describe(
        'Starting physical pitch, including octave, for subsequent music when modeChange:true.',
      ),
    modeChangeScale: z
      .enum(Scale)
      .describe('Scale for subsequent music when modeChange:true.'),
    modeChangeVirtualNote: z
      .enum(ScaleNote)
      .optional()
      .describe(
        'Virtual pitch corresponding to modeChangePhysicalNote; establishes the scale shift when modeChange:true. Unset means no shift. Null clears it.',
      ),
    modeChangeIgnoreAttractions: z
      .boolean()
      .describe(
        'Disable automatic pitch attractions in the new musical context when modeChange:true.',
      ),
    modeChangePermanentEnharmonicZo: z
      .boolean()
      .describe(
        'Enable permanent enharmonic Zo in the new musical context when modeChange:true.',
      ),
    modeChangeBpm: z
      .number()
      .describe(
        'Playback tempo in beats per minute for subsequent music when modeChange:true.',
      ),
    runningMarkerRole: z.enum(['chapter', 'section']).optional(),
    runningMarkerText: z.string().optional(),
  }),
  [ElementType.DropCap]: z.strictObject({
    ...breaks,
    paragraphStyleId: z.string(),
    color: z.string().optional(),
    content: z.string().describe(dropCapLyricsDescription),
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    fontStyle: z.string().optional(),
    lineHeight: lineHeightSchema,
    strokeWidth: z.number().optional(),
    strokeColor: z.string().optional(),
    fontVariantCaps: z.string().optional(),
    fontVariantNumeric: z.string().optional(),
    fontVariantLigatures: z.string().optional(),
    fontVariantAlternates: z.string().optional(),
    customWidth: z.number().optional(),
    lineSpan: z.number(),
  }),
  [ElementType.ModeKey]: z.strictObject({
    ...breaks,
    alignment: z.enum(TextBoxAlignment),
    color: z.string(),
    templateId: z.number().optional(),
    mode: z.number(),
    scale: z.enum(Scale),
    scaleNote: z.enum(ScaleNote),
    fthora: z.enum(Neumes.Fthora).optional(),
    martyria: z.enum(Neumes.ModeSign),
    fthoraAboveNote: z.enum(Neumes.Fthora).optional(),
    fthoraAboveNote2: z.enum(Neumes.Fthora).optional(),
    fthoraAboveQuantitativeNeumeRight: z.enum(Neumes.Fthora).optional(),
    note: z.enum(Neumes.ModeSign).optional(),
    note2: z.enum(Neumes.ModeSign).optional(),
    quantitativeNeumeAboveNote: z.enum(Neumes.ModeSign).optional(),
    quantitativeNeumeAboveNote2: z.enum(Neumes.ModeSign).optional(),
    quantitativeNeumeRight: z.enum(Neumes.QuantitativeNeume).optional(),
    fontSize: z.number(),
    strokeWidth: z.number(),
    heightAdjustment: z.number(),
    marginBottom: z.number(),
    marginTop: z.number(),
    useDefaultStyle: z.boolean(),
    ignoreAttractions: z.boolean(),
    permanentEnharmonicZo: z.boolean(),
    showAmbitus: z.boolean(),
    tempo: z.enum(Neumes.TempoSign).optional(),
    tempoAlignRight: z.boolean(),
    bpm: z.number(),
    height: z.number(),
    ambitusLowNote: z.enum(Neumes.Note),
    ambitusLowRootSign: z.enum(Neumes.RootSign),
    ambitusHighNote: z.enum(Neumes.Note),
    ambitusHighRootSign: z.enum(Neumes.RootSign),
  }),
  [ElementType.ImageBox]: z.strictObject({
    ...breaks,
    imageHeight: z.number(),
    imageWidth: z.number(),
    inline: z.boolean(),
    lockAspectRatio: z.boolean(),
    alignment: z.enum(TextBoxAlignment).optional(),
  }),
  [ElementType.Annotation]: z.strictObject({
    ...breaks,
    text: annotationContent,
    x: z.number(),
    y: z.number(),
    languageCode: z.string().optional(),
    textDirection: z.enum(['ltr', 'rtl']).optional(),
  }),
  [ElementType.AlternateLine]: z.strictObject({
    ...breaks,
    x: z.number(),
    y: z.number(),
  }),
} as const;
