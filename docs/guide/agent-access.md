# MCP Server

The Neanes desktop app includes a local [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server. Connect an AI assistant that supports MCP to create, inspect, edit, save, and export Byzantine chant scores through natural-language requests.

## What you can do

- Search scores for lyrics, text, and notation.
- Edit scores, including notation, lyrics, and formatting.
- Apply changes across multiple saved scores.
- Export scores to PDF.
- Work with open editor tabs or saved scores in the background.

## Requirements

- Neanes installed on the same computer as your MCP client.
- A client that supports command-based (stdio) MCP servers.

Adding Neanes to your client's MCP configuration enables access. Connected agents
have the same file access as Neanes and can edit your open tabs. Your MCP client
determines which model receives score content, so choose a client and model you
trust with your scores.

## Connect an agent

1. In Neanes, choose **Help > Connect to AI tools…**.
2. Select your client and choose **Terminal command** or **Configuration**. For other MCP clients, the dialog provides JSON configuration.
3. Copy the generated command or configuration and follow the instructions in the dialog. Terminal commands require your client's command-line tool to be installed.
4. Reconnect your AI tool, then ask: "List the scores open in Neanes."

The dialog uses your installed Neanes executable's path and includes any
platform-specific settings. No separate Node.js installation is needed.

<details>
<summary>Manual configuration</summary>

If you prefer to configure your client manually, use the instructions below.
On macOS and Linux, run the Neanes executable with `--mcp`. Windows requires
the bundled launcher and an environment variable, as shown below.

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
For manual JSON configuration, use the Windows example under
[Other MCP clients](#other-mcp-clients).

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
tabs.

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

On Linux, replace `command` with your AppImage's absolute path. On Windows,
include the launcher and environment variable:

```json
{
  "mcpServers": {
    "neanes": {
      "command": "C:\\path\\to\\Neanes.exe",
      "args": ["C:\\path\\to\\resources\\mcp\\stdio-launcher.mjs", "--mcp"],
      "env": { "ELECTRON_RUN_AS_NODE": "1" }
    }
  }
}
```

Replace the example paths with your installation paths. In JSON, Windows
backslashes must be doubled. If your client has separate fields, enter the
executable path as the command and copy all arguments and environment settings
from the example for your operating system.

</details>

## Private documents and editor tabs

By default, agents open saved scores as background drafts, called **private
documents**, without adding editor tabs. "Private" describes these separate
drafts; your MCP client and model still determine where score content is
processed. You do not need to open the editor for these tasks. Background edits
are not saved automatically.

Ask the agent to work with your **open score** to include unsaved editor changes.
The editor must be open and ready. Edits appear in Neanes and can be undone;
saving is a separate action. Agents can also create or open scores in visible
tabs when asked.

Background drafts and editor tabs are independent. Opening the editor does not
move a background draft into a tab, and saving a draft does not update an
already-open tab. Save your editor changes first, or ask the agent to write to
another file when you want to preserve the original.

## Example requests

Tell the agent which score or folder to use, and whether to save the changes. For example:

- "In my open score, find all text boxes using Times New Roman and change them to Arial, including boxes that inherit their font from a paragraph style. Leave the changes unsaved for me to review."
- "Set all drop caps in my open score to 36 pt."
- "Open `/scores/hymn.byz` privately, temporarily remove all ison indicators, and export `/scores/hymn-without-ison.pdf`. Discard the draft afterward and leave the original score unchanged."
- "Find the scores in `/scores/service`, export each to a PDF alongside its source, and leave the score files unchanged."

For formatting changes, tell the agent how you want the score to look. It can
check both paragraph styles and formatting applied to individual elements.

## MCP tool reference

You can request tasks in ordinary language. For the tool catalog, direct tool
usage, schemas, and detailed formatting and copying rules, see the
[MCP Tool Reference](./mcp-tool-reference.md).

## Disconnect an agent

Disconnect the Neanes server in your MCP client to stop that connection's
background process. Remove its configuration to prevent future connections.
Disconnect each client separately if you configured more than one.

Save background drafts you want to keep before disconnecting; unsaved drafts
are discarded and cannot be restored after reconnecting. Saved files and editor
tabs keep their contents, including edits already applied by an agent.
Disconnecting does not close the editor, and a file write already underway may
finish.

## Troubleshooting

| Problem                                              | What to do                                                                                                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The client cannot launch Neanes                      | Check the executable path and confirm Neanes can run normally. Copy fresh settings from **Help > Connect to AI tools…**; Windows needs the bundled launcher and environment variable. |
| The agent cannot see open tabs                       | Open Neanes and ask explicitly to work with your open score.                                                                                                                          |
| The editor connection is unavailable                 | Wait for Neanes to finish opening. If necessary, restart the editor. Private tasks can still run independently.                                                                       |
| The connection fails after moving or updating Neanes | Update the executable path if it changed, then reconnect the client.                                                                                                                  |
| A task disconnects or reports an error after editing | Inspect the current document or saved file before repeating edits. Some work may already have completed.                                                                              |
| Neanes reports incompatible versions                 | Save private drafts, update Neanes, reopen the editor, and reconnect the client.                                                                                                      |
