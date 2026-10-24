# MCP Server

The Neanes desktop app includes a local [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server. Connect an AI assistant that supports MCP to create, inspect, edit, save, and export Byzantine chant scores through natural-language requests.

## What you can do

- Find saved scores and inspect their notation, lyrics, text, and document properties.
- Create scores or edit notes, martyriæ, mode keys, tempo signs, lyrics, text, annotations, and alternate lines.
- Change paragraph styles, page layout, and headers and footers.
- Inspect page contents and preview a page as an image before exporting a PDF.
- Apply common formatting changes or export PDFs across several saved scores.
- Work privately in the background, or explicitly ask for help with open editor tabs and their unsaved changes.

## Requirements

- Neanes installed on the same computer as your MCP client.
- Node.js 22 or later, with `node` available to the client.
- A client that supports command-based (stdio) MCP servers.
- **Allow agent access** enabled in Neanes Preferences.

Agent access is off by default. Connected agents have the same file access as Neanes; this setting does not restrict them to a particular folder. Your MCP client determines which model receives the score content returned by tools, so use a client and model you trust with your scores.

## Connect an agent

1. Open `Edit > Preferences` and choose **Agent access (MCP)**.
2. Turn on **Allow agent access**. The change takes effect immediately.
3. Choose **Copy configuration**.
4. Add the copied server entry to your client's MCP settings, preserving any other configured servers, then reconnect the client.
5. Ask the agent to report the Neanes capabilities to check the connection.

The copied configuration contains the correct paths for your installation. For clients that accept an `mcpServers` JSON object, its structure looks like this; the paths below are placeholders, so use the copied values:

```json
{
  "mcpServers": {
    "neanes": {
      "command": "node",
      "args": [
        "/absolute/path/to/bridge.mjs",
        "--executable",
        "/absolute/path/to/Neanes",
        "--policy",
        "/absolute/path/to/agent-access.json"
      ]
    }
  }
}
```

If your client has separate fields, use `command` as its command and each item in `args` as a separate argument. Clients with another configuration format need the same command and arguments in that format.

The client connects over stdio through the bridge shipped with Neanes. Neanes starts a private background worker automatically; you do not need to launch the editor for ordinary file tasks or configure an HTTP endpoint or token. Authentication is handled automatically. If you move or reinstall Neanes at another location, copy the configuration again.

## Example requests

Tell the agent which score or folder to use and where to save the result. For example:

- "Open `/scores/hymn.byz` privately, tell me its title and author, and find its Third Mode sections."
- "In my open Neanes score, read the selected passage and its lyrics without changing anything."
- "In my open score, change the default text paragraph style to Arial, preview the first page, and leave the changes for me to review."
- "Open `/scores/hymn.byz`, set the author to Maria, and save a copy as `/scores/hymn-revised.byz`."
- "Find the scores in `/scores/service`, export each to a PDF alongside its source, and leave the score files unchanged."

## Private documents and editor tabs

Ordinary agent tasks use private documents without adding editor tabs. Each client connection has its own background worker. Private drafts last until the connection ends, the worker stops, or access is turned off. Ask the agent to save work you want to keep.

Ask the agent to work with your **open score** when you want help with editor documents, including unsaved changes. Agents can also create a new score or open a saved file in a visible editor tab. The editor must be open and its connection ready. Edits to editor documents appear in Neanes; document editing tools make undoable changes, but saving remains a separate action. Closing an agent connection never closes an editor you opened.

Private documents read saved files independently of editor tabs. Saving a file privately does not update an already-open tab. Save your editor changes first, or ask the agent to write to another file when you want to preserve the original.

Opening or closing the editor does not move an in-progress private task into or out of editor tabs. If the connection ends unexpectedly, reconnect and have the agent inspect saved files before continuing; temporary drafts are not restored.

## Commands (MCP tools)

These are tools your agent calls through MCP, rather than commands to enter in a terminal. You can request them in ordinary language. Your client's tool list provides the current arguments for your installed version of Neanes.

### Files and documents

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

### Score content and layout

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
| `get_pages`           | List laid-out pages.                                                                                          |
| `get_page_elements`   | Find which elements appear on a page.                                                                         |
| `preview_page`        | Return an image of one page for visual inspection without writing a file.                                     |

### Formatting and reference

| Tool                                                           | Purpose                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `get_page_setup` / `update_page_setup`                         | Read or change page geometry, notation defaults, and layout settings.                                                     |
| `get_header_footer_settings` / `update_header_footer_settings` | Read or change header/footer visibility, margins, rules, and page numbering. Use the element tools to edit their content. |
| `get_paragraph_styles` / `edit_paragraph_styles`               | Read, create, or change paragraph styles and their inheritance.                                                           |
| `get_capabilities`                                             | Discover supported formats and units; optionally list installed fonts and error codes.                                    |
| `get_element_catalog`                                          | Discover element types, editable properties, and available neumes.                                                        |
| `get_mode_key_templates`                                       | Find the mode-key templates used to insert or change a mode key.                                                          |
| `get_rich_text_format`                                         | Get formatting guidance for rich text boxes and annotations.                                                              |

### Tool usage and schema resources

For clients or workflows that call tools directly:

- Document tools default to `documentScope: "private"`. To work with editor tabs, pass `documentScope: "editor"` to `list_documents` and subsequent document calls. Use the returned document IDs in the same scope.
- Read the document first and pass its latest `revision` as `expectedRevision` when editing, saving, exporting, or previewing. If a revision conflict occurs, read the document again before deciding whether to retry.
- Find elements first, then use their returned references for targeted edits. Follow `nextOffset` when reading paginated results.
- Use absolute file paths. Saving or exporting to an existing destination requires `overwrite: true`, except when saving a score back to its unchanged source.

Full input and output schemas are available as MCP resources at `neanes://schemas/{tool}/input` and `neanes://schemas/{tool}/output`. For example, read `neanes://schemas/edit_elements/input` for supported edit actions. Clients that support MCP resources can use these for detailed field descriptions and constraints.

## Turn agent access off

Turn off **Allow agent access** in Preferences to disconnect agents and stop background workers. This also prevents future connections while the editor is closed. Neanes asks for confirmation before turning access off because temporary agent work may be discarded.

Temporary agent drafts are discarded. Saved files and editor tabs keep their contents, including edits already applied by an agent. A file write already underway may finish. Re-enable access and reconnect the client to start fresh.

The command-line `--headless-mcp` flag also requires this setting; launching a worker does not enable access automatically.

## Troubleshooting

| Problem                                              | What to do                                                                                                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The client cannot find `node`                        | Install Node.js 22 or later and make sure the client can find it. If necessary, replace `command` with the absolute path to your Node.js executable.                                                            |
| Agent access is disabled                             | Enable **Allow agent access** in Neanes Preferences, then reconnect the client.                                                                                                                                 |
| The editor connection is unavailable                 | Check **Connection status** and the reported error in Preferences. Choose **Retry connection** after resolving the problem. A private background task can still run while the editor connection is unavailable. |
| The agent cannot see open tabs                       | Open Neanes and ask explicitly to work with editor tabs. Direct tool calls must use `documentScope: "editor"`.                                                                                                  |
| The connection fails after moving Neanes             | Copy the configuration again from Preferences and update the client settings.                                                                                                                                   |
| A task disconnects or reports an error after editing | Reconnect if needed and inspect the current document or saved file before repeating edits. Some work may already have completed.                                                                                |

An editor connection failure does not prevent normal score editing. **Connection details** shows the editor endpoint for troubleshooting; credentials remain internal.
