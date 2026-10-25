import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import type { McpLaunchConfiguration } from '@/ipc/ipcChannels';

import { createMcpSetupSnippet } from './mcpSetup';

const launch: McpLaunchConfiguration = {
  command: "/Applications/Chant's $scores `app`/Neanes",
  args: ['/Users/singer/chant project', '--mcp'],
};

describe('MCP setup snippets', () => {
  it.each(['codex', 'claude'] as const)(
    'includes Windows pipe environment in the %s registration command',
    (client) => {
      const windows = {
        command: 'C:\\Scores\\Neanes.exe',
        args: ['--mcp'],
        env: { ELECTRON_NO_ATTACH_CONSOLE: '1' },
      };
      expect(createMcpSetupSnippet(windows, client, 'command', true)).toBe(
        `${client} mcp add neanes --env 'ELECTRON_NO_ATTACH_CONSOLE=1' -- 'C:\\Scores\\Neanes.exe' '--mcp'`,
      );
      if (client === 'codex') {
        expect(
          createMcpSetupSnippet(windows, client, 'configuration', true),
        ).toContain(
          '[mcp_servers.neanes.env]\n"ELECTRON_NO_ATTACH_CONSOLE" = "1"',
        );
      } else {
        expect(
          JSON.parse(
            createMcpSetupSnippet(windows, client, 'configuration', true),
          ),
        ).toEqual({ mcpServers: { neanes: windows } });
      }
    },
  );
  it.skipIf(process.platform === 'win32').each(['codex', 'claude'] as const)(
    'preserves arguments literally in a POSIX shell for %s',
    (client) => {
      const snippet = createMcpSetupSnippet(launch, client, 'command', false);
      // Let the real shell parse the generated arguments without launching a client.
      const args = snippet.slice(snippet.indexOf(' -- ') + 4);
      const output = execFileSync('/bin/sh', ['-c', `printf '%s\\0' ${args}`]);
      expect(output.toString().split('\0')).toEqual([
        launch.command,
        ...launch.args,
        '',
      ]);
      expect(snippet.startsWith(`${client} mcp add neanes -- `)).toBe(true);
    },
  );

  it('escapes Windows paths and apostrophes for PowerShell', () => {
    const windows = {
      command: "C:\\Singer's Scores\\Neanes.exe",
      args: ['--mcp'],
    };
    expect(createMcpSetupSnippet(windows, 'codex', 'command', true)).toBe(
      "codex mcp add neanes -- 'C:\\Singer''s Scores\\Neanes.exe' '--mcp'",
    );
  });

  it.each(['claude', 'other'] as const)(
    'produces lossless JSON configuration for %s',
    (client) => {
      const windows = { command: 'C:\\Scores\\Neanes.exe', args: ['--mcp'] };
      expect(
        JSON.parse(
          createMcpSetupSnippet(windows, client, 'configuration', true),
        ),
      ).toEqual({ mcpServers: { neanes: windows } });
    },
  );

  it('always uses JSON for a generic client', () => {
    expect(
      JSON.parse(createMcpSetupSnippet(launch, 'other', 'command', false)),
    ).toEqual({ mcpServers: { neanes: launch } });
  });

  it('preserves development arguments and escapes strings in TOML', () => {
    const snippet = createMcpSetupSnippet(
      launch,
      'codex',
      'configuration',
      false,
    );
    expect(snippet.split('\n')[0]).toBe('[mcp_servers.neanes]');
    expect(JSON.parse(snippet.split('\n')[1].slice('command = '.length))).toBe(
      launch.command,
    );
    expect(JSON.parse(snippet.split('\n')[2].slice('args = '.length))).toEqual(
      launch.args,
    );
  });
});
