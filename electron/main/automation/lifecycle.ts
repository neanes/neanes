import { randomBytes, randomUUID } from 'node:crypto';
import { promises as fs, writeSync } from 'node:fs';
import path from 'node:path';

import { app, BrowserWindow, ipcMain } from 'electron';

import type {
  AgentAccessPolicy,
  AgentAccessState,
} from '../../../src/ipc/agentAccess';
import { IpcRendererChannels } from '../../../src/ipc/ipcChannels';
import type { PdfExportOptions } from '../../../src/services/documents/fileTypes';
import {
  hasAgentDrafts,
  initializeAccessPolicy,
  readAccessPolicy,
  requireAgentAccess,
  setAccessEnabled,
} from './access';
import { startAutomationHost } from './host';
import { renderPagePreview } from './preview';

export function installAgentAccess(options: {
  headless: boolean;
  isMac: boolean;
  accessPolicyFile: string;
  installedBridge: string;
  preload: string;
  url?: string;
  setWindow(window: BrowserWindow): void;
  getErrorMessage(error: unknown): string | undefined;
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
  withFileLock<T>(operation: () => Promise<T>): Promise<T>;
  printPdf(args: PdfExportOptions, signal: AbortSignal): Promise<Buffer>;
}) {
  const {
    headless,
    isMac,
    accessPolicyFile,
    installedBridge,
    preload,
    url,
    getErrorMessage,
  } = options;
  let win: BrowserWindow | null = null;
  let automationHost: Awaited<ReturnType<typeof startAutomationHost>> | null =
    null;
  let accessPolicy: AgentAccessPolicy | null = null;
  let automationRendererReady = false;
  let accessError: string | null = null;
  let accessQueue = Promise.resolve();
  ipcMain.on(IpcRendererChannels.AutomationReady, (event) => {
    if (event.sender === win?.webContents) {
      automationRendererReady = true;
      if (!headless) {
        void publishEditorEndpoint();
      }
    }
  });

  let endpointPublication = Promise.resolve();
  function publishEditorEndpoint() {
    endpointPublication = endpointPublication
      .then(async () => {
        if (headless || !accessPolicy) {
          return;
        }
        const file = `${accessPolicyFile}.endpoint`;
        const temporary = `${file}.${randomUUID()}.tmp`;
        try {
          await fs.writeFile(
            temporary,
            JSON.stringify({
              pid: process.pid,
              error: !accessPolicy.enabled
                ? 'AGENT_ACCESS_DISABLED'
                : (accessError ?? automationHost?.error() ?? null),
              token: process.env.NEANES_MCP_TOKEN ?? accessPolicy.token,
              endpoint: automationHost?.isReady()
                ? `http://127.0.0.1:${automationHost.port}/mcp`
                : null,
            }),
            { mode: 0o600, flag: 'wx' },
          );
          await fs.rename(temporary, file);
        } finally {
          await fs.rm(temporary, { force: true });
        }
      })
      .catch((error) => {
        accessError = getErrorMessage(error) ?? 'MCP_START_FAILED';
        console.error(error);
      });
    return endpointPublication;
  }

  async function createAutomationHost(
    config: { token: string; port: number },
    policyToken = accessPolicy!.token,
  ) {
    return startAutomationHost({
      mode: headless ? 'headless' : 'interactive',
      policyFile: accessPolicyFile,
      policyToken,
      authorize: () => requireAgentAccess(accessPolicyFile, policyToken),
      onStateChange: () => {
        if (!headless) {
          void publishEditorEndpoint();
        }
      },
      config,
      initiallyReady: automationRendererReady,
      getWindow: () => win,
      version: app.getVersion(),
      runExclusive: options.runExclusive,
      withFileLock: options.withFileLock,
      previewPage: (args, signal) =>
        renderPagePreview({
          args,
          signal,
          parent: win ?? undefined,
          preload,
          entry: path.join(process.env.DIST!, 'export.html'),
          devServerUrl: url,
        }),
      printPdf: (args, signal) => options.printPdf(args, signal),
    });
  }

  async function syncAgentAccess() {
    if (automationHost) {
      await automationHost.close();
      automationHost = null;
    }
    accessError = null;
    if (!accessPolicy?.enabled) {
      await publishEditorEndpoint();
      return;
    }
    try {
      automationHost = await createAutomationHost({
        token: process.env.NEANES_MCP_TOKEN ?? accessPolicy!.token,
        port: Number(process.env.NEANES_MCP_PORT ?? 0),
      });
      if (win) {
        automationHost.attach(win);
      }
    } catch (error) {
      accessError = getErrorMessage(error) ?? 'MCP_START_FAILED';
      console.error(error);
    }
    await publishEditorEndpoint();
  }

  function agentAccessState(): AgentAccessState {
    const bridge = app.isPackaged
      ? installedBridge
      : path.resolve('scripts/mcp/bridge.mjs');
    const configuration = JSON.stringify(
      {
        mcpServers: {
          neanes: {
            command: 'node',
            args: [
              bridge,
              '--executable',
              process.env.APPIMAGE || process.execPath,
              ...(!app.isPackaged ? ['--app', app.getAppPath()] : []),
              '--policy',
              accessPolicyFile,
            ],
          },
        },
      },
      null,
      2,
    );
    return {
      enabled: accessPolicy?.enabled ?? false,
      status:
        accessError || automationHost?.error()
          ? 'error'
          : !accessPolicy?.enabled
            ? 'off'
            : automationHost
              ? automationHost.isReady()
                ? 'ready'
                : 'starting'
              : 'starting',
      error: accessError ?? automationHost?.error() ?? null,
      endpoint: automationHost
        ? `http://127.0.0.1:${automationHost.port}/mcp`
        : null,
      configuration,
    };
  }
  function requireEditorSender(event: Electron.IpcMainInvokeEvent) {
    if (headless || event.sender !== win?.webContents) {
      throw new Error('PERMISSION_DENIED');
    }
  }
  ipcMain.handle(IpcRendererChannels.AgentAccessGet, (event) => {
    requireEditorSender(event);
    return agentAccessState();
  });
  ipcMain.handle(
    IpcRendererChannels.AgentAccessSetEnabled,
    (event, enabled: unknown, discardUnsavedChanges: unknown = false) => {
      requireEditorSender(event);
      if (
        typeof enabled !== 'boolean' ||
        typeof discardUnsavedChanges !== 'boolean'
      ) {
        throw new Error('INVALID_AGENT_ACCESS_SETTING');
      }
      const operation = accessQueue.then(async () => {
        const current = await initializeAccessPolicy(accessPolicyFile);
        if (
          current.enabled === enabled &&
          current.token === accessPolicy?.token
        ) {
          return { state: agentAccessState(), confirmationRequired: false };
        }
        if (
          !enabled &&
          !discardUnsavedChanges &&
          (await hasAgentDrafts(accessPolicyFile))
        ) {
          return { state: agentAccessState(), confirmationRequired: true };
        }
        accessPolicy = await setAccessEnabled(accessPolicyFile, enabled);
        await syncAgentAccess();
        return { state: agentAccessState(), confirmationRequired: false };
      });
      accessQueue = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation;
    },
  );

  // Catch policy changes made while workers or the editor are already running.
  let policyCheckRunning = false;
  let agentAccessInitialized = false;
  const policyTimer = setInterval(() => {
    if (headless || policyCheckRunning || !agentAccessInitialized) {
      return;
    }
    policyCheckRunning = true;
    const operation = accessQueue.then(async () => {
      try {
        const next = await readAccessPolicy(accessPolicyFile);
        if (
          next.enabled !== accessPolicy?.enabled ||
          next.token !== accessPolicy?.token
        ) {
          accessPolicy = next;
          await syncAgentAccess();
        }
      } catch (error) {
        accessPolicy = null;
        await automationHost?.close();
        automationHost = null;
        accessError = getErrorMessage(error) ?? 'MCP_START_FAILED';
      }
    });
    accessQueue = operation.catch(console.error).finally(() => {
      policyCheckRunning = false;
    });
  }, 1000);
  policyTimer.unref();
  app.on('will-quit', () => clearInterval(policyTimer));

  ipcMain.handle(IpcRendererChannels.AgentAccessRetry, (event) => {
    requireEditorSender(event);
    const operation = accessQueue.then(async () => {
      try {
        accessPolicy = await initializeAccessPolicy(accessPolicyFile);
        await syncAgentAccess();
      } catch (error) {
        accessError = getErrorMessage(error) ?? 'MCP_START_FAILED';
      }
      return agentAccessState();
    });
    accessQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  });

  async function launchHeadless() {
    if (isMac) {
      app.dock!.hide();
    }
    const credentials = await requireAgentAccess(accessPolicyFile);
    automationHost = await createAutomationHost(
      {
        token: process.env.NEANES_WORKER_TOKEN || credentials.token,
        port: 0,
      },
      credentials.token,
    );
    win = new BrowserWindow({
      show: false,
      webPreferences: {
        preload,
        spellcheck: false,
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    options.setWindow(win);
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    automationHost.attach(win);
    const startup = setTimeout(() => app.exit(1), 60_000);
    const onReady = (event: Electron.IpcMainEvent) => {
      if (event.sender !== win?.webContents) {
        return;
      }
      clearTimeout(startup);
      // The bridge owns this private pipe; stdout is never a startup protocol.
      writeSync(
        3,
        JSON.stringify({
          endpoint: `http://127.0.0.1:${automationHost!.port}/mcp`,
          pid: process.pid,
        }) + '\n',
      );
      ipcMain.removeListener(IpcRendererChannels.AutomationReady, onReady);
    };
    ipcMain.on(IpcRendererChannels.AutomationReady, onReady);
    let stopping = false;
    async function stop() {
      if (stopping) {
        return;
      }
      stopping = true;
      await automationHost?.close();
      app.exit(0);
    }
    let checking = false;
    const policyTimer = setInterval(() => {
      if (checking || stopping) {
        return;
      }
      checking = true;
      void requireAgentAccess(accessPolicyFile, credentials.token)
        .catch(() => stop())
        .finally(() => {
          checking = false;
        });
    }, 1000);
    policyTimer.unref();
    app.on('will-quit', () => clearInterval(policyTimer));
    process.stdin.resume();
    process.stdin.once('end', () => {
      setTimeout(() => void stop(), 60_000).unref();
    });
    process.on('SIGTERM', () => void stop());
    win.webContents.on('render-process-gone', () => void stop());
    if (url) {
      await win.loadURL(new URL('automation.html', url).href);
    } else {
      await win.loadFile(path.join(process.env.DIST!, 'automation.html'));
    }
  }

  return {
    attach(window: BrowserWindow) {
      win = window;
      automationRendererReady = false;
      window.webContents.on(
        'did-start-navigation',
        (_event, _url, inPlace, mainFrame) => {
          if (mainFrame && !inPlace) {
            automationRendererReady = false;
            void publishEditorEndpoint();
          }
        },
      );
      automationHost?.attach(window);
    },
    detach() {
      win = null;
      automationRendererReady = false;
    },
    async close() {
      await automationHost?.close();
    },
    async start() {
      if (headless) {
        try {
          await launchHeadless();
        } catch (error) {
          console.error(error);
          app.exit(1);
        }
        return;
      }
      try {
        accessPolicy = await initializeAccessPolicy(accessPolicyFile);
        if (app.isPackaged) {
          await fs.mkdir(path.dirname(installedBridge), { recursive: true });
          for (const name of ['bridgeProtocol.mjs', 'bridge.mjs']) {
            const destination = path.join(path.dirname(installedBridge), name);
            const temporary = `${destination}.${randomUUID()}.tmp`;
            try {
              await fs.writeFile(
                temporary,
                await fs.readFile(
                  path.join(process.resourcesPath, 'mcp', name),
                ),
                { mode: 0o600, flag: 'wx' },
              );
              await fs.rename(temporary, destination);
            } finally {
              await fs.rm(temporary, { force: true });
            }
          }
        }
        await syncAgentAccess();
      } catch (error) {
        accessPolicy ??= {
          token: randomBytes(32).toString('hex'),
          enabled: false,
        };
        accessError = getErrorMessage(error) ?? 'MCP_START_FAILED';
        console.error('Could not load agent access settings', error);
      }

      agentAccessInitialized = true;
    },
  };
}
