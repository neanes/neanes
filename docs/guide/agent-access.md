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
- A client that supports command-based (stdio) MCP servers.

Adding Neanes to your client's MCP configuration enables access. Connected agents
have the same file access as Neanes and can edit your open tabs. Your MCP client
determines which model receives score content, so choose a client and model you
trust with your scores.

## Connect an agent

Configure your client to run the Neanes executable with the `--mcp` argument.
No separate Node.js installation or Neanes preference is needed.

Choose the command for your client and operating system. Replace example paths
with the location of your installed Neanes executable.

### macOS

These commands assume Neanes is installed in `/Applications`.

**Codex:**

```sh
codex mcp add neanes -- /Applications/Neanes.app/Contents/MacOS/Neanes --mcp
```

**Claude Code:**

```sh
claude mcp add neanes -- /Applications/Neanes.app/Contents/MacOS/Neanes --mcp
```

### Windows

In PowerShell, set `$neanes` to the full path of your installed `Neanes.exe`.
To find it, open the Neanes shortcut's **Properties** and check **Target**.
The path below is a placeholder; replace it before running either setup command.

```powershell
$neanes = 'C:\path\to\Neanes.exe'
$launcher = Join-Path (Split-Path $neanes) 'resources\mcp\stdio-launcher.mjs'
```

**Codex:**

```powershell
codex mcp add neanes --env ELECTRON_RUN_AS_NODE=1 -- "$neanes" "$launcher" --mcp
```

**Claude Code:**

```powershell
claude mcp add neanes --env ELECTRON_RUN_AS_NODE=1 -- "$neanes" "$launcher" --mcp
```

Keep the quotes around the path so installation folders containing spaces work.
The Windows launcher removes an extra newline emitted by Electron during startup.
It uses the Node runtime included with Neanes; no separate installation is needed.
For manual JSON configuration, set `"env": { "ELECTRON_RUN_AS_NODE": "1" }` and
put the launcher path before `--mcp` in `args`. The setup dialog includes these
settings automatically.

### Linux

Use the full path to your downloaded AppImage and make it executable. These
examples assume it is saved as `~/Applications/Neanes.AppImage`; use your actual
filename and location.

```sh
chmod +x "$HOME/Applications/Neanes.AppImage"
```

**Codex:**

```sh
codex mcp add neanes -- "$HOME/Applications/Neanes.AppImage" --mcp
```

**Claude Code:**

```sh
claude mcp add neanes -- "$HOME/Applications/Neanes.AppImage" --mcp
```

Run the client in your desktop session when you want it to access open editor
tabs. If an update changes the AppImage filename or location, update the path in
your MCP client configuration.

### Other MCP clients

For clients that accept an `mcpServers` JSON object, this example uses the macOS
path:

```json
{
  "mcpServers": {
    "neanes": {
      "command": "/Applications/Neanes.app/Contents/MacOS/Neanes",
      "args": ["--mcp"]
    }
  }
}
```

Replace `command` with your executable's absolute path. In JSON, Windows
backslashes must be doubled, for example `"C:\\path\\to\\Neanes.exe"`.
If your client has separate fields, enter the executable path as the command and
`--mcp` as its argument.

Neanes runs privately in the background for ordinary file tasks. You only need to
open the editor when you want the agent to work with visible tabs. If you move
Neanes or an update changes the AppImage filename, update the executable path in
your client settings.

## Example requests

Tell the agent which score or folder to use and where to save the result. For example:

- "Open `/scores/hymn.byz` privately, tell me its title and author, and find its Third Mode sections."
- "In my open Neanes score, read the selected passage and its lyrics without changing anything."
- "In my open score, change the default text paragraph style to Arial, preview the first page, and leave the changes for me to review."
- "Open `/scores/hymn.byz`, set the author to Maria, and save a copy as `/scores/hymn-revised.byz`."
- "Find the scores in `/scores/service`, export each to a PDF alongside its source, and leave the score files unchanged."

## Private documents and editor tabs

Ordinary agent tasks use private documents without adding editor tabs. Each client connection has its own background worker. Private drafts last until the connection ends, or the background process stops. Ask the agent to save work you want to keep.

Ask the agent to work with your **open score** when you want help with editor documents, including unsaved changes. Agents can also create a new score or open a saved file in a visible editor tab. The editor must be open and ready. Edits to editor documents appear in Neanes; document editing tools make undoable changes, but saving remains a separate action. Closing an agent connection never closes an editor you opened.

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

## Disconnect an agent

Disconnect the Neanes server in your MCP client to stop that connection's
background process. Remove its configuration to prevent future connections.
Disconnect each client separately if you configured more than one.

Temporary private drafts are discarded. Save work you want to keep before
disconnecting. Saved files and editor tabs keep their contents, including edits
already applied by an agent. A file write already underway may finish.

## Troubleshooting

| Problem                                              | What to do                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| The client cannot launch Neanes                      | Check the executable path and confirm Neanes can run normally on your computer. Use the executable itself with `--mcp`. |
| The agent cannot see open tabs                       | Open Neanes and ask explicitly to work with editor tabs. Direct tool calls must use `documentScope: "editor"`.          |
| The editor connection is unavailable                 | Wait for Neanes to finish opening. If necessary, restart the editor. Private tasks can still run independently.         |
| The connection fails after moving or updating Neanes | Update the executable path if it changed, then reconnect the client.                                                    |
| A task disconnects or reports an error after editing | Inspect the current document or saved file before repeating edits. Some work may already have completed.                |
| Neanes reports incompatible versions                 | Save private drafts, update Neanes, reopen the editor, and reconnect the client.                                        |
