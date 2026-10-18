# Connect an agent

The desktop app automatically provides a local MCP connection while running. Agents can create, edit, save, and export scores with the same file access as Neanes. Authentication is handled automatically; there are no tokens or access switches to configure.

Install Node.js 22 or later on the same computer before configuring your agent.

## Connect

1. Open `Edit > Preferences` and choose **Agent access (MCP)**.
2. Choose **Copy configuration**, paste it into your client's MCP configuration, and reconnect the client.

The bridge connects to the running editor automatically, or starts a background worker when the editor is closed or its connection is unavailable. You do not need to choose a connection mode or configure folders. Closing an agent connection never closes an editor you opened.

The configuration includes the application and bridge paths. If you move or reinstall Neanes at another location, copy the configuration again.

## Work with scores

Ordinary agent tasks use private documents without adding editor tabs. Ask the agent to work with your open score when you want help with editor documents, including unsaved changes. Working with open tabs requires the editor's connection to be ready.

Private documents read saved files independently of editor tabs. Saving a file privately does not update an already-open tab. Save your editor changes first, or ask the agent to write to another file when you want to preserve the original.

Ask the agent to save work you want to keep. Private drafts are temporary. An existing connection keeps its documents where they were opened; opening or closing the editor does not move an in-progress task between processes. If the connection ends unexpectedly, reconnect and have the agent inspect the saved files before continuing.

## Connection status

Preferences shows **Connection status** and an error if startup fails. A failed agent connection does not prevent you from using the editor. Choose **Retry connection** after resolving the problem. Connection details show the endpoint for troubleshooting; credentials remain internal.

A private background task can still run when the editor's server is unavailable. Requests to work with live tabs report the editor's connection error instead of silently opening a saved copy.
