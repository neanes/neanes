import type { McpLaunchConfiguration } from '@/ipc/ipcChannels';

export type McpClient = 'codex' | 'claude' | 'other';
export type McpSetupFormat = 'command' | 'configuration';

export function createMcpSetupSnippet(
  launch: McpLaunchConfiguration,
  client: McpClient,
  format: McpSetupFormat,
  windows: boolean,
): string {
  if (client === 'other' || format === 'configuration') {
    if (client === 'codex') {
      return `[mcp_servers.neanes]\ncommand = ${JSON.stringify(launch.command)}\nargs = ${JSON.stringify(launch.args)}`;
    }
    return JSON.stringify({ mcpServers: { neanes: launch } }, null, 2);
  }

  const quote = windows
    ? (value: string) => `'${value.replaceAll("'", "''")}'`
    : (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
  const prefix =
    client === 'codex' ? 'codex mcp add neanes --' : 'claude mcp add neanes --';
  return `${prefix} ${[launch.command, ...launch.args].map(quote).join(' ')}`;
}
