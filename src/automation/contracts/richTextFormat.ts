import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';

// Keep detailed authoring instructions out of the always-published tool inventory.
export function getRichTextFormat() {
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
  const examples = [
    {
      tool: 'edit_elements',
      arguments: {
        documentId: 'DOCUMENT_ID',
        expectedRevision: 0,
        actions: [
          {
            action: 'insert',
            elements: [
              { elementType: 'RichTextBox', properties: { content: text } },
            ],
          },
        ],
      },
    },
    {
      tool: 'edit_elements',
      arguments: {
        documentId: 'DOCUMENT_ID',
        expectedRevision: 0,
        actions: [
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
        ],
      },
    },
  ];
  return {
    guide: [
      'RichTextBox content/contentBottom/contentLeft/contentCenter/contentRight and Annotation.text are CKEditor HTML fragments. TextBox content fields and DropCap.content are plain text. Do not send Markdown or a full HTML document.',
      'Give every paragraph exactly one class neanes-paragraph-style-STYLE_ID, using an existing paragraph style ID (not its display name). Use get_paragraph_styles with documentId and includeResolved:false to discover styles; preserve existing classes when editing. Common IDs: default-text for ordinary text, annotation for annotations, lyrics for inline text boxes, header/footer for their templates; title/subtitle/chapter/section for headings. Choose the appropriate style explicitly.',
      `Minimal rich text: ${text}. Minimal annotation: ${annotation}.`,
      `Multiple paragraphs are adjacent styled p elements: ${paragraph(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, 'First')}${paragraph(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText, 'Second')}. Use separate paragraphs for new lines.`,
      'Escape literal text before inserting it into HTML: & becomes &amp;, < becomes &lt;, > becomes &gt;; escape double quotes in attribute values as &quot;. JSON-encode the complete HTML string normally; do not HTML-escape the markup itself.',
      'Prefer paragraph styles for consistent typography. For local emphasis inside a styled paragraph, use <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>. CKEditor may normalize equivalent HTML when edited; preserve the meaning rather than expecting identical markup.',
      'RichTextBox: ordinary boxes use content; inline:true uses content above and contentBottom below the staff; multipanel:true uses contentLeft/contentCenter/contentRight instead. Set the matching layout flag when targeting these panels. Annotation uses text and belongs to a note child collection named annotations.',
      'Read the target content and revision before updating. An update replaces each supplied HTML field completely; omitted fields stay unchanged. Use get_element_content for content omitted from ordinary reads. Keep unrelated paragraphs and formatting. Set a field to an empty string to clear it.',
      'Example calls follow. Replace DOCUMENT_ID and NOTE_REF with discovered references and expectedRevision:0 with the latest document revision; pass the same documentScope/sessionId as your document reads. Each edit advances the revision; use its returned revision for the next edit.',
      ...examples.map((example) => JSON.stringify(example)),
    ].join('\n'),
  };
}
