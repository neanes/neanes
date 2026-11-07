# Footnotes

Use footnotes for explanations, alternate melodies, finales, or other material that belongs at the bottom of the page. A marker beside a note or martyria connects the passage to its footnote. Neanes keeps each footnote on the same page as its reference and updates automatic markers as the score changes.

## Create a footnote

### From a note or martyria

1. Right-click the note or martyria in the main score.
2. Choose **Insert Footnote**.
3. Enter the footnote at the bottom of the page. Use the Neume Selector or neume keyboard to enter music, and add lyrics as you would in the main score. To add an explanation, insert a text box or rich text box within the footnote.

This is useful for an alternate melody or finale that readers should consult without interrupting the principal musical line.

## Edit and navigate footnotes

Click the music or text in a footnote to work with it using the usual editor controls. A footnote can contain both music and text.

- To return to a musical footnote, right-click its note or martyria and choose **Edit footnote**, followed by its marker.
- To return to the passage in the main score, double-click the footnote's label at the bottom of the page. Neanes selects the reference and scrolls it into view.

To change the shared appearance of footnote text and markers, use `Format > Paragraph Styles`. The built-in **Footnote Text**, **Footnote Body Marker**, and **Footnote Reference** styles control the text, the labels beside footnote bodies, and the markers beside music, respectively. See [Paragraph Styles](/guide/text-and-styles.html).

## Remove a footnote

For a footnote attached to music, right-click the note or martyria in the main score and choose **Remove Footnote**. The note or martyria remains in place.

Deleting a score element that owns a footnote removes the associated footnote as well.

Use `Edit > Undo` to restore an accidentally removed footnote.

## Change an individual marker

Right-click the note, martyria, or footnote label and choose **Footnote Properties…**.

### Use custom text

Enter **Custom text** to replace the automatic marker for this footnote, for example with `*` or `**`. The **Reference** and **Footnote label** previews show how it will appear in the score and beside the footnote body. Choose **Update** to apply the change.

Leave **Custom text** empty to use the automatic marker from Page Setup. A custom marker does not advance the automatic numbering sequence. If you give several musical footnotes custom asterisks, choose their markers individually so readers can distinguish them on each page.

### Position a musical marker

For a footnote attached to a note or martyria, expand **Positioning** and enable **Override position**. Drag the marker's handle in the preview, or enter **Horizontal offset (em)** and **Vertical offset (em)**. Positive values move the marker right or down; the offsets scale with the neume font size.

Use **Reset position** to clear the offsets. Turn off **Override position** to restore automatic positioning and collision adjustment. Choose **Update** to apply the settings.

## Set up footnotes throughout the score

Open `File > Page Setup` and select **Footnotes**. These settings control the automatic markers and the separator above the footnote area:

| Setting                                          | Use it to...                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format**                                       | Choose numbers (`1, 2, 3, …`), the standard symbol sequence (`*, †, ‡, …`), or asterisks (`*, **, ***, …`).                                  |
| **Numbering**                                    | Keep one **Continuous** sequence or **Restart each section**. Section restarts follow text boxes with a **Section** running marker.          |
| **Starts at**                                    | Choose the first number or symbol in each sequence. For symbols, type a symbol from the selected sequence or use the adjacent arrow buttons. |
| **Wrap musical footnote markers in parentheses** | Put parentheses around references beside music, such as `(1)` or `(*)`.                                                                      |
| **Show separator above footnotes**               | Draw a horizontal line between the main score and its footnotes.                                                                             |
| **Separator Length (%)**                         | Set the separator's length as a percentage of the available text width.                                                                      |
| **Space Above Separator (pt)**                   | Set the minimum gap after the main score. Defaults to **6 pt** and still applies when the separator is hidden.                               |
| **Space Below Separator (pt)**                   | Set the gap between the separator and the footnote area. Defaults to **2.6 pt**.                                                             |
| **Separator Thickness (pt)**                     | Set the thickness of the separator. Defaults to **1 pt**.                                                                                    |
| **Color**                                        | Choose the separator color. Defaults to black.                                                                                               |

The spacing defaults match the nominal values of the standard 10 pt LaTeX classes. The default separator thickness matches the header and footer rules. These measurements stay fixed when font sizes change. The footnotes sit at the bottom of the page’s content area, so the space above the separator may be larger than the minimum. Older scores without saved spacing settings use these defaults when opened, which can change pagination.

Parentheses make a musical footnote marker easier to notice and distinguish it from a measure number indicating a beat count. Enable them when a bare number or symbol could be mistaken for part of the notation.

Choose **Update** to apply the settings to the score. See [Page Layout and Books](/guide/page-layout.html) for saving Page Setup defaults and using running markers.
