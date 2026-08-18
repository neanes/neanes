# Saving, Importing, and Exporting

## Save and reopen scores

Use `File > Save` or `File > Save As`. `.byz` is the normal compressed score format; it contains the score's `.byzx` JSON. `.byzx` is the uncompressed JSON form, useful when inspecting a score or diagnosing a problem. `File > Open Recent` lists recent desktop files.

If Neanes closes unexpectedly, it may offer a recovered copy the next time it starts. A recovered score opens as an unsaved workspace so that you can inspect it before choosing where to save it.

## Import OCR output

Choose `File > Import > OCR Result` and select the result produced by a compatible OCR tool. Neanes opens it as a new unsaved score rather than replacing the score you were editing.

## Export or print

Choose `File > Export` and select an output format:

| Format                     | Use it for                                   |
| -------------------------- | -------------------------------------------- |
| PDF                        | sharing or printing a fixed score            |
| PNG or SVG images          | page images or graphics for another document |
| HTML                       | a browser-readable score export              |
| MusicXML or compressed MXL | interchange with compatible music software   |
| LaTeX (`.byztex`)          | a structured export for the LaTeX workflow   |

The export dialog shows the options that apply to the selected format. Image export, for example, lets you choose PNG or SVG, select a page range, and decide whether to create separate files. Choose `File > Print` to use the system print dialog.
