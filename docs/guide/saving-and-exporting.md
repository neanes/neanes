# Saving, Importing, and Exporting

Save the score in a Neanes format when you want to continue editing it. Export creates a separate copy for sharing, printing, or use in another application; it does not replace the editable score.

## Save and reopen scores

Choose `File > Save` to save the current score. The first time you save a new score, Neanes asks for a name and location. Choose `File > Save As` to save another copy or give the score a different name.

Neanes offers two score formats:

- `.byz` is the normal format. It is compressed and is the best choice for everyday work and sharing with other Neanes users.
- `.byzx` is an uncompressed version of the same score data. Because it is text-based, it is also useful for scores kept in a version-control repository, where changes can be compared over time. Use it when you need that workflow, want to inspect the score data, or have been asked to provide it for troubleshooting.

Both formats can be reopened and edited in Neanes. Use `File > Open Recent` to return to a recently opened desktop file.

### Recover unsaved work

If Neanes closes unexpectedly, it may offer to recover unsaved work the next time it starts. Select the score or scores you want and choose `Recover Selected`. A recovered score opens as an unsaved workspace so that you can inspect it before saving it.

Choose `File > Save As` after recovery to keep the recovered copy. `Discard Selected` permanently removes the selected recovery data, while `Not Now` leaves it available for a later launch.

## Export a PDF

1. Check the paper size, orientation, margins, and other layout settings under `File > Page Setup`.
2. Choose `File > Export > Export as PDF`.
3. Choose a name and location for the PDF.

Neanes creates the PDF using the score's current page setup and opens the finished file in your default PDF viewer. If the result needs different page breaks or spacing, make those changes in Neanes and export it again.

## Print a score

Choose `File > Print` to open the system print dialog. Printing uses the paper size and orientation selected under `File > Page Setup`.

Use Print when you want to send the score directly to a physical printer. Use PDF export when you want a fixed file that can be reviewed, shared, archived, or printed later.

## Export HTML

Choose `File > Export > Export as HTML` to create a score that can be opened in a web browser. HTML is useful for publishing a score on the web or sharing it with someone who wants to read it in a browser.

HTML does not preserve the score's page layout. Instead, the neumes dynamically flow to fit the width of the browser. Use PDF export or Print when the page layout must be preserved.

The exported HTML is for viewing rather than further editing in Neanes. It loads supporting web resources from the internet, so an internet connection is required for it to display correctly.

## Export page images

Choose `File > Export > Export as Image` to create a separate PNG image for each selected page. Images are useful when placing score pages in a document, presentation, website, or graphics application.

The export dialog provides these options:

- **Resolution** sets the PNG resolution in DPI. The default of 300 DPI is suitable for most printing; a lower resolution produces smaller files for screen use.
- **Transparent Background** removes the page background so that another background can show through.
- **Pages** exports either the whole score or a page range such as `1-3, 5, 8-10`.
- **Open Destination Folder After Export** reveals the exported files when the export finishes.

Choose a base filename when prompted. Neanes adds the page number to each exported image, such as `My Score-1.png` and `My Score-2.png`.

## Export MusicXML

Choose `File > Export > Export as MusicXML` to transfer the musical content to an application that supports MusicXML. Neanes exports an uncompressed `.musicxml` file.

Use the export options to include time signatures and control whether time signatures and measure subdivisions are displayed.

MusicXML describes the score's musical structure, not its Byzantine notation or Neanes page layout. Expect to review and edit the result after opening it in another music notation program.

## Export for LaTeX

Choose `File > Export > Export as LaTeX` when using the [neanestex](https://github.com/neanes/neanestex) workflow to include Byzantine notation in a LaTeX document. Neanes creates a `.byztex` file for neanestex rather than a standalone `.tex` document.

The export dialog can include initial martyriæ and text boxes. Leave these options disabled when the surrounding LaTeX document supplies that material separately.

## Import OCR output

Choose `File > Import > OCR Result` to open a `.byzocr` result produced by the [Byzantine Chant OCR tool](https://github.com/neanes/byzantine-chant-ocr). Neanes imports it as a new unsaved score rather than replacing the score you were editing.

Only the neumes are imported; text is not included. Review the imported notation, add any necessary text, then choose `File > Save As` to keep it as an editable Neanes score.
