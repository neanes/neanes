# MCP Tool Reference

For setup and example requests, see [MCP Server](./agent-access.md).

These are tools your agent calls through MCP, rather than commands to enter in a terminal. Your client's tool list provides the current arguments for your installed version of Neanes.

## Files and documents

| Tool                          | Purpose                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discover_score_files`        | Find saved `.byz` and `.byzx` files in a folder, optionally including subfolders.                                                                             |
| `batch_update_files`          | Apply paragraph style, page setup, header/footer, or title/author changes to several saved scores; optionally save copies or export PDFs. Supports a dry run. |
| `list_documents`              | List the connection's private documents, or open editor tabs when explicitly requested.                                                                       |
| `create_document`             | Create an unsaved score.                                                                                                                                      |
| `open_document`               | Open a saved `.byz` or `.byzx` score.                                                                                                                         |
| `close_document`              | Close a document; discarding unsaved changes requires an explicit choice.                                                                                     |
| `get_document_properties`     | Read the title and author.                                                                                                                                    |
| `replace_document_properties` | Set the title and author together.                                                                                                                            |
| `save_document`               | Save a score to its source path or another explicit path.                                                                                                     |
| `export_pdf`                  | Export to an explicit PDF path without saving the score itself.                                                                                               |

Batch operations work on saved files privately. They can save changes in place, save copies, or export PDFs without saving scores. Ask for a dry run to check proposed formatting changes before writing files. A batch can complete some files before an error; have the agent check the per-file results before resuming or retrying.

## Score content and layout

| Tool                  | Purpose                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `find_text`           | Search lyrics, drop caps, annotations, and text boxes.                                                        |
| `find_elements`       | Locate elements by type or property, such as mode keys for a particular mode.                                 |
| `get_elements`        | Read a range of score elements.                                                                               |
| `get_element`         | Inspect one element and, optionally, its neighbors.                                                           |
| `get_element_content` | Read complete text or image content in chunks.                                                                |
| `get_staff_lyrics`    | Read the Lyrics Manager text and whether it is locked.                                                        |
| `get_selection`       | Read the selection in an editor tab. Private documents have no editor selection.                              |
| `edit_elements`       | Insert, update, replace, or remove elements, assign lyrics, or update the Lyrics Manager text and lock state. |
| `copy_elements`       | Copy a staff range within a score or between scores, including lyrics, child elements, and images.            |
| `get_pages`           | List laid-out pages.                                                                                          |
| `get_page_elements`   | Find which elements appear on a page.                                                                         |
| `preview_page`        | Return an image of one page for visual inspection without writing a file.                                     |

## Formatting and reference

| Tool                                                           | Purpose                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `get_page_setup` / `update_page_setup`                         | Read or change page geometry, notation defaults, and layout settings.                                                     |
| `get_header_footer_settings` / `update_header_footer_settings` | Read or change header/footer visibility, margins, rules, and page numbering. Use the element tools to edit their content. |
| `get_paragraph_styles` / `edit_paragraph_styles`               | Read, create, or change paragraph styles and their inheritance.                                                           |
| `get_capabilities`                                             | Discover supported formats and units; optionally list installed fonts and error codes.                                    |
| `get_element_catalog`                                          | Discover element types, editable properties, and available neumes.                                                        |
| `get_mode_key_templates`                                       | Find the mode-key templates used to insert or change a mode key.                                                          |
| `get_rich_text_format`                                         | Get formatting guidance for rich text boxes and annotations.                                                              |

## Tool usage and schema resources

For clients or workflows that call tools directly:

- Document tools default to `documentScope: "private"`. To work with editor tabs, pass `documentScope: "editor"` to `list_documents` and subsequent document calls. Use the returned document IDs in the same scope.
- Read the document first and pass its latest `revision` as `expectedRevision` when editing, saving, exporting, or previewing. If a revision conflict occurs, read the document again before deciding whether to retry.
- Find elements first, then use their returned references for targeted edits. Follow `nextOffset` when reading paginated results.
- Use absolute file paths. Saving or exporting to an existing destination requires `overwrite: true`, except when saving a score back to its unchanged source.

Full input and output schemas are available as MCP resources at `neanes://schemas/{tool}/input` and `neanes://schemas/{tool}/output`. For example, read `neanes://schemas/edit_elements/input` for supported edit actions. Clients that support MCP resources can use these for detailed field descriptions and constraints.

## Formatting details

For font and size changes, distinguish an element's current appearance from formatting set directly on that element. Paragraph styles can supply inherited formatting, and advanced text boxes can contain several fonts. Use **font size** for the size of a drop cap's letter, or **Lines to Drop** for the number of lines it spans.

## Copying details

Copied passages include lyrics, annotations, alternate lines, text boxes, images, and explicit formatting. Missing custom paragraph styles are imported; styles with matching IDs or custom names use the destination's definitions. The destination keeps its page layout and built-in styles, so inherited formatting can look different. The insertion and imported styles can be undone together in the destination.

Copying **without lyrics** omits note lyrics and their formatting, including lyrics in alternate lines. Drop caps, annotations, and text boxes are still copied.

If the destination's Lyrics Manager text is locked, the agent reports the lock instead of replacing copied lyrics with the destination's locked text.
