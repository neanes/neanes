import { z } from 'zod';

import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';

export const richTextFormatQuerySchema = z.strictObject({
  topics: z
    .array(z.enum(['basics', 'inline', 'opentype', 'footnotes']))
    .min(1)
    .max(4)
    .default(['basics', 'inline']),
});

// Keep detailed authoring instructions out of the always-published tool inventory.
export function getRichTextFormat(
  options: z.input<typeof richTextFormatQuerySchema> = {},
) {
  const { topics } = richTextFormatQuerySchema.parse(options);
  const paragraph = (id: string, text: string) =>
    `<p class="${richTextParagraphStyleClassName(id)}">${text}</p>`;
  const text = paragraph(
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    'Hello &amp; welcome',
  );
  const annotation = paragraph(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
    'Sing softly',
  );
  const inline = paragraph(
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    `Sing <span style="color:#c00000;font-size:18pt;font-family:'Source Serif';font-weight:700;font-style:italic;font-variant-caps:small-caps;">softly</span> here.`,
  );
  const call = (actions: object[]) =>
    JSON.stringify({
      tool: 'edit_elements',
      arguments: { documentId: 'DOCUMENT_ID', expectedRevision: 0, actions },
    });
  const sections = {
    footnotes: [
      'FOOTNOTES',
      'Use edit_elements insert_footnote with a main-score Note or Martyria elementRef, or a main-score RichTextBox elementRef with contentKey and htmlOffset. Tempo, plain TextBox, annotations, alternate lines, headers/footers and footnote bodies cannot own references. Each reference owns one body; nested/shared references are unsupported.',
      'For rich text, contentKey must be an active panel for the box layout. htmlOffset is a UTF-16 offset in the exact stored HTML, within paragraph text or immediately after a p opening tag. Offsets inside tags, entities, surrogate pairs or atomic objects are invalid. Read exact HTML first; earlier actions can change offsets.',
      'Optional elements supplies body element definitions. Omitted/empty elements creates an empty musical staff for Note/Martyria, or a RichTextBox using footnote-text for rich references. Bodies can mix music and text, retain a terminal Empty, and reject pageBreak:true. They inherit musical context at the anchor and then evolve independently.',
      'Read Note/Martyria footnoteId or project RichTextBox footnoteReferences:[{footnoteId,contentKey}] with get_elements/get_element/find_elements; this needs no HTML. Omitted means no references in active panels. insert_footnote also returns createdFootnotes:[{footnoteId,elementRef,contentKey?}] unless includeCreated:false, filtered to references surviving the batch. elementRef identifies the owning anchor. Use the returned IDs directly for body or marker edits. Rich references serialize as <span class="neanes-footnote" data-footnote-id="BODY_UUID"></span> in panel HTML; preserve these spans when editing content. Preserve spans and surrounding formatting during HTML edits; do not invent IDs or display numbers.',
      'Use collection:{kind:"footnote",footnoteId:BODY_UUID} with get_elements and normal element edits. get_elements returns footnote:{id,marker,label,number}; marker is the stored override or null, label is the displayed string, and number is null for custom markers. get_staff_lyrics and set_staff_lyrics accept the same collection; locks apply independently to each staff.',
      'Use update_footnote with footnoteId and marker to change a label. Null restores automatic numbering; custom markers are trimmed, contain 1-16 Unicode characters without control characters, and do not advance the automatic sequence. remove_footnote takes a musical anchor elementRef. Remove rich references by updating panel HTML without their spans. Removing any owning element removes its bodies atomically; undo restores both. copy_elements copies owned bodies with fresh IDs.',
      'Page setup controls footnoteFormat:numbers|symbols, footnoteSymbolSequence:standard|asterisks, footnoteNumbering:continuous|page|section, firstFootnoteNumber, footnoteReferenceParentheses, showFootnoteHorizontalRule and footnoteHorizontalRuleLength (1-100 percent). footnoteSpaceAboveRule, footnoteSpaceBelowRule, and footnoteRuleThickness are in pixels. footnoteRuleColor defaults to black. Starts are 1-based, at most 1000000 for numbers, 384 for standard symbols or 64 for asterisks. Standard symbols cycle *, dagger, double dagger, section, pilcrow, double vertical line, repeating each twice, three times, etc. Page restarts follow physical pages; section restarts follow nonempty section running markers.',
      'Musical reference labels optionally use parentheses; rich references use superscripts. Body labels use a period after numeric labels. Styles: footnote-text, footnote-body-marker, footnote-reference (musical references only). Note/Martyria footnoteOffsetX/Y use neume-font em, positive right/down. Automatic collision clearance raises markers; footnotePositionOverride:true disables clearance and uses offsets directly. Markers do not reserve horizontal space.',
      'Footnotes stay on their anchor page as whole bodies. Oversized bodies remain editable/saveable but settled page discovery and visual export fail until they fit. Page occurrences include region:footnote and exclude the terminal Empty for populated bodies. Unknown or duplicate body IDs fail with INVALID_FOOTNOTE_REFERENCE before mutation.',
      call([
        {
          action: 'insert',
          elements: [
            {
              elementType: 'RichTextBox',
              clientId: 'box',
              properties: {
                content: paragraph(
                  BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
                  'Hello',
                ),
              },
            },
          ],
        },
        {
          action: 'insert_footnote',
          elementRef: '@box',
          contentKey: 'content',
          htmlOffset: paragraph(
            BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
            '',
          ).indexOf('</p>'),
        },
      ]),
    ],
    basics: [
      'BASICS',
      'Use get_paragraph_styles with documentId and includeResolved:false for existing IDs (not display names). Common IDs: default-text for ordinary text, annotation for annotations, lyrics for inline text boxes, header/footer for templates; title/subtitle/chapter/section for headings.',
      `Minimal text: ${text}. Annotation: ${annotation}.`,
      `New lines use adjacent styled paragraphs: ${paragraph(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, 'First')}${paragraph(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, 'Second')}.`,
      'RichTextBox: ordinary boxes use content; inline:true uses content above and contentBottom below the staff; multipanel:true uses contentLeft/contentCenter/contentRight instead. Set the matching layout flag. Annotation uses text in a note child collection named annotations.',
      call([
        {
          action: 'insert',
          elements: [
            { elementType: 'RichTextBox', properties: { content: text } },
          ],
        },
      ]),
      call([
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: 'NOTE_REF',
            collection: 'annotations',
          },
          elements: [
            { elementType: 'Annotation', properties: { text: annotation } },
          ],
        },
      ]),
    ],
    inline: [
      'INLINE OVERRIDES',
      'For one word or a selection, wrap only that text in <span style="..."> inside the existing styled p. Do not create a paragraph style for a local override. Create paragraph styles only for reusable paragraph formatting.',
      "CSS map: color:#c00000; font-size:18pt (explicit pt or px, 1pt=4/3px; paragraph-style fontSize uses px); font-family:'Source Serif' (quote names containing spaces; get_capabilities({ includeFonts: true }) lists available families); font-weight:400/500/600/700 for Regular/Medium/Semibold/Bold; font-style:normal/italic. Font-style is a CSS slant, not a face name such as Bold Italic. For underline use <u>text</u>.",
      "Weight/slant are a pair; set both explicitly. When changing them, replace stale face aliases with the base family, e.g. 'Source Serif Bold Italic' -> font-family:'Source Serif';font-weight:700;font-style:normal for upright bold. Aliases can restore old axes on normalization. Preserve unrelated optical styling and fallback families. To inherit, remove overrides, including enclosing spans and face aliases that set them. Normal/400 explicitly reset.",
      'Preserve paragraph classes, unrelated CSS declarations, links and all text outside the selection. If a selection cuts through a span, split it and change only the selected fragment; if it crosses runs/paragraphs, apply the override to each selected fragment. Merge declarations instead of adding competing nested spans. Never move a word into a separate paragraph to format it.',
      'OpenType properties use font-variant-caps/numeric/ligatures/alternates; request topics:["opentype"] for supported values and reset rules. CKEditor can normalize equivalent HTML, so preserve meaning rather than byte-identical markup.',
      `Combined word override: ${inline}`,
      'Example update replaces the complete content field; keep the rest of the original HTML. For annotations use elementType:Annotation and properties.text instead.',
      call([
        {
          action: 'update',
          elementRef: 'ELEMENT_REF',
          elementType: 'RichTextBox',
          properties: { content: inline },
        },
      ]),
    ],
    opentype: [
      'OPENTYPE INLINE OVERRIDES',
      'Put these CSS longhands on a span around the selection inside its styled p. Use the supported font-variant-* vocabulary below rather than inventing feature names. Actual glyph changes require font support.',
      'font-variant-caps: normal | small-caps | all-small-caps | petite-caps | all-petite-caps | titling-caps | unicase (choose one).',
      'font-variant-numeric: normal, or space-separated tokens: lining-nums/oldstyle-nums; proportional-nums/tabular-nums; diagonal-fractions/stacked-fractions; ordinal; slashed-zero. Choose at most one from each slash-separated pair.',
      'font-variant-ligatures: normal | none | space-separated no-common-ligatures, discretionary-ligatures, historical-ligatures, no-contextual. Normal enables common/contextual and disables discretionary/historical ligatures. Use normal for explicit defaults; default-only tokens such as common-ligatures or no-discretionary-ligatures alone can normalize away.',
      'font-variant-alternates: normal, or space-separated historical-forms and functions: styleset(ss01, ss05) (ss01-ss20); character-variant(cv01, cv03) (cv01-cv99); stylistic(stylistic-1), swash(swash-2), ornaments(ornaments-1), annotation(annotation-1) (indices 1-99). Use these exact identifier conventions; do not substitute font-specific names. annotation() here is a font feature, not an Annotation element.',
      'Inheritance/reset: an absent longhand inherits from the surrounding span/paragraph style. To defeat inherited features, set that longhand to normal explicitly; removing it restores inheritance. Ligatures:none disables every ligature category. Each longhand replaces its whole value, not individual tokens: retain other desired tokens from the effective value when changing one feature. Use get_paragraph_styles to inspect inherited values. Do not combine normal or none with other tokens.',
      paragraph(
        BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
        'Verse <span style="font-variant-numeric:oldstyle-nums tabular-nums;font-variant-alternates:styleset(ss01, ss05);">123</span>.',
      ),
      paragraph(
        BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
        'Inherited caps <span style="font-variant-caps:normal;">ordinary case</span>.',
      ),
    ],
  };
  return {
    guide: [
      'RichTextBox content/contentBottom/contentLeft/contentCenter/contentRight and Annotation.text are CKEditor HTML fragments. TextBox fields and DropCap.content are plain text. Every p needs one neanes-paragraph-style-STYLE_ID class; preserve existing classes. Paragraph styles format paragraphs; span CSS overrides words/selections. Do not send Markdown or a full HTML document.',
      'Escape literal text: & -> &amp;, < -> &lt;, > -> &gt;; attribute quotes -> &quot;. JSON-encode the HTML string normally; do not HTML-escape markup.',
      "Read exact content and revision before editing (get_element_content for omitted/chunked HTML). Supplied fields replace complete HTML; omitted fields stay unchanged. Empty string clears a field. In examples replace DOCUMENT_ID, NOTE_REF, ELEMENT_REF and expectedRevision:0 with current values; pass the same documentScope as reads and use each edit's returned revision for the next edit.",
      ...[...new Set(topics)].flatMap((topic) => sections[topic]),
    ].join('\n'),
  };
}
