# Connect an agent

The desktop app can provide a local MCP connection. Agents can create, edit, save, and export scores with the same file access as Neanes. Authentication is handled automatically. Agent access is off by default.

Install Node.js 22 or later on the same computer before configuring your agent.

## Connect

1. Open `Edit > Preferences` and choose **Agent access (MCP)**.
2. Turn on **Allow agent access**.
3. Choose **Copy configuration**, paste it into your client's MCP configuration, and reconnect the client.

While agent access is enabled, each connection starts a private background worker. Agents can also work with open editor tabs when explicitly requested. You do not need to choose a connection mode or configure folders. Closing an agent connection never closes an editor you opened.

The configuration includes the application and bridge paths. If you move or reinstall Neanes at another location, copy the configuration again.

## Turn agent access off

Turn off **Allow agent access** to disconnect agents and stop background workers, even if the editor is closed later. Neanes asks for confirmation if an agent has unsaved private drafts or a task in progress. Temporary agent drafts are discarded; saved files and editor tabs keep their contents, including edits already applied by an agent. A file write already underway may finish.

The command-line `--headless-mcp` flag also requires this setting. Neither a client nor a background worker enables access automatically. Re-enable access and reconnect the client to start fresh; temporary drafts are not restored.

On upgrade, an existing explicit enabled setting is preserved. Older installations without an explicit setting start with agent access off; enable it once here to continue using your existing client configuration.

## Work with scores

Ordinary agent tasks use private documents without adding editor tabs. Ask the agent to work with your open score when you want help with editor documents, including unsaved changes. Working with open tabs requires the editor's connection to be ready.

Private documents read saved files independently of editor tabs. Saving a file privately does not update an already-open tab. Save your editor changes first, or ask the agent to write to another file when you want to preserve the original.

Ask the agent to save work you want to keep. Private drafts are temporary. An existing connection keeps its documents where they were opened; opening or closing the editor does not move an in-progress task between processes. If the connection ends unexpectedly, reconnect and have the agent inspect the saved files before continuing.

## Connection status

Preferences shows **Connection status** and an error if startup fails. A failed agent connection does not prevent you from using the editor. Choose **Retry connection** after resolving the problem. Connection details show the endpoint for troubleshooting; credentials remain internal.

A private background task can still run when the editor's server is unavailable. Requests to work with live tabs report the editor's connection error instead of silently opening a saved copy.
