# Shared rendering regressions

These scripts verify detached output shared by ordinary UI and automation:

- `hidden-export-smoke.mjs`: background PDF rendering, interruption, and cleanup.
- `print-overlays-smoke.mjs`: captured overlay preferences in PDF output.
- `rendering-migration-smoke.mjs`: PNG output and optional native printing.

They currently require an MCP-enabled Electron test app and its debugging
endpoint to construct scores and inspect the renderer. Their location describes
the production feature under test, not a separate non-MCP test driver.
See [the MCP regression guide](../mcp/README.md) for setup and commands.
