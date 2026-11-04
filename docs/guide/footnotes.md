# Footnotes

Use footnotes for explanations, alternate melodies, finales, or other material that belongs at the bottom of the page. A marker beside a note or martyria, or within rich text, connects the passage to its footnote. Neanes keeps each footnote on the same page as its reference and updates automatic markers as the score changes.

## Create a footnote

### From a note or martyria

1. Right-click the note or martyria in the main score.
2. Choose **Insert Footnote**.
3. Enter the footnote at the bottom of the page. Use the Neume Selector or neume keyboard to enter music, and add lyrics as you would in the main score. To add an explanation, insert a text box or rich text box within the footnote.

This is useful for an alternate melody or finale that readers should consult without interrupting the principal musical line.

### From rich text

1. Edit a rich text box in the main score and place the cursor where the marker should appear.
2. Choose **Insert Footnote** in the rich-text toolbar.
3. Type in the new footnote's rich text box at the bottom of the page. Use the rich-text toolbar to format it.

The reference appears as a superscript in the original text. Footnote insertion is available in rich text boxes in the main score; footnotes cannot contain further footnote references.

## Edit and navigate footnotes

Click the music or text in a footnote to work with it using the usual editor controls. A footnote can contain both music and text.

- To return to a musical footnote, right-click its note or martyria and choose **Edit footnote**, followed by its marker.
- To open a footnote from rich text, double-click its superscript marker.
- To return to the passage in the main score, double-click the footnote's label at the bottom of the page. Neanes selects the reference and scrolls it into view.

To change the shared appearance of footnote text and markers, use `Format > Paragraph Styles`. The built-in **Footnote Text**, **Footnote Body Marker**, and **Footnote Reference** styles control the text, the labels beside footnote bodies, and the markers beside music, respectively. See [Paragraph Styles](/guide/text-and-styles.html).

## Remove a footnote

For a footnote attached to music, right-click the note or martyria in the main score and choose **Remove Footnote**. The note or martyria remains in place.

For a footnote referenced in rich text, select its superscript marker while editing the text and delete it. Removing the reference also removes its footnote body. Deleting a score element that owns a footnote removes the associated footnote as well.

Use `Edit > Undo` to restore an accidentally removed footnote.

## Change an individual marker

Right-click a footnote's label at the bottom of the page or its superscript marker in rich text and choose **Footnote Properties…**. For a musical reference, you can also right-click the note or martyria and choose **Footnote Properties…**.

### Use custom text

Enter **Custom text** to replace the automatic marker for this footnote, for example with `*` or `**`. The **Reference** and **Footnote label** previews show how it will appear in the score and beside the footnote body. Choose **Update** to apply the change.

Leave **Custom text** empty to use the automatic marker from Page Setup. A custom marker does not advance the automatic numbering sequence. If you give several musical footnotes custom asterisks, choose their markers individually so readers can distinguish them on each page.

### Position a musical marker

For a footnote attached to a note or martyria, expand **Positioning** and enable **Override position**. Drag the marker's handle in the preview, or enter **Horizontal offset (em)** and **Vertical offset (em)**. Positive values move the marker right or down; the offsets scale with the neume font size.

Use **Reset position** to clear the offsets. Turn off **Override position** to restore automatic positioning and collision adjustment. Choose **Update** to apply the settings.

## Set up footnotes throughout the score

Open `File > Page Setup` and select **Footnotes**. These settings control the automatic markers and the separator above the footnote area:

| Setting                                          | Use it to...                                                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format**                                       | Choose numbers (`1, 2, 3, …`), the standard symbol sequence (`*, †, ‡, …`), or asterisks (`*, **, ***, …`).                                                 |
| **Numbering**                                    | Keep one **Continuous** sequence, **Restart each page**, or **Restart each section**. Section restarts follow text boxes with a **Section** running marker. |
| **Starts at**                                    | Choose the first number or symbol in each sequence. For symbols, type a symbol from the selected sequence or use the adjacent arrow buttons.                |
| **Wrap musical footnote markers in parentheses** | Put parentheses around references beside music, such as `(1)` or `(*)`. Rich-text references remain superscripts without these parentheses.                 |
| **Show separator above footnotes**               | Draw a horizontal line between the main score and its footnotes.                                                                                            |
| **Separator Length (%)**                         | Set the separator's length as a percentage of the available text width.                                                                                     |

Parentheses make a musical footnote marker easier to notice and distinguish it from a measure number indicating a beat count. Enable them when a bare number or symbol could be mistaken for part of the notation.

Choose **Update** to apply the settings to the score. See [Page Layout and Books](/guide/page-layout.html) for saving Page Setup defaults and using running markers.

### Recommended settings

- **Alternate melodies, finales, and other musical footnotes only:** Consider the asterisk format (`*, **, ***, …`) and set **Numbering** to **Restart each page**. Choose whether to wrap musical markers in parentheses according to how prominently you want them to stand out and whether they could be confused with beat counts.
- **A mixture of textual and musical footnotes:** Set Page Setup to the format and numbering you want for the textual footnotes. If you prefer different symbols for the musical footnotes, override those markers individually with **Custom text** in Footnote Properties. For example, textual footnotes can keep automatic numbers while musical alternatives use custom asterisks.
- **Textual footnotes only:** Choose whichever format and numbering convention best suits the document.
