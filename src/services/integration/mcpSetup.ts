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
      const env = Object.entries(launch.env ?? {});
      return (
        `[mcp_servers.neanes]\ncommand = ${JSON.stringify(launch.command)}\nargs = ${JSON.stringify(launch.args)}` +
        (env.length
          ? '\n\n[mcp_servers.neanes.env]\n' +
            env
              .map(
                ([key, value]) =>
                  `${JSON.stringify(key)} = ${JSON.stringify(value)}`,
              )
              .join('\n')
          : '')
      );
    }
    return JSON.stringify({ mcpServers: { neanes: launch } }, null, 2);
  }

  const quote = windows
    ? (value: string) => `'${value.replaceAll("'", "''")}'`
    : (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
  const prefix =
    client === 'codex' ? 'codex mcp add neanes' : 'claude mcp add neanes';
  const env = Object.entries(launch.env ?? {})
    .map(([key, value]) => ` --env ${quote(`${key}=${value}`)}`)
    .join('');
  return `${prefix}${env} -- ${[launch.command, ...launch.args].map(quote).join(' ')}`;
}
