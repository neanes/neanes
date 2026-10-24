import { randomBytes } from 'node:crypto';
import { promises as fs, writeSync } from 'node:fs';
import path from 'node:path';

import { app, BrowserWindow, ipcMain } from 'electron';

import type {
  AgentAccessPolicy,
  AgentAccessState,
} from '../../../src/ipc/agentAccess';
import { IpcRendererChannels } from '../../../src/ipc/ipcChannels';
import type { PdfExportOptions } from '../../../src/services/documents/fileTypes';
import { OperationQueue } from '../../../src/utils/OperationQueue';
import {
  initializeAccessPolicy,
  readAccessPolicy,
  requireAgentAccess,
  setAccessEnabled,
} from './access';
import { atomicWrite } from './atomicWrite';
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
  const accessQueue = new OperationQueue();
  const failure = (error: unknown) =>
    getErrorMessage(error) ?? 'MCP_START_FAILED';
  ipcMain.on(IpcRendererChannels.AutomationReady, (event) => {
    if (event.sender === win?.webContents) {
      automationRendererReady = true;
      if (!headless) {
        void publishEditorEndpoint();
      }
    }
  });

  const endpointPublication = new OperationQueue();
  function publishEditorEndpoint() {
    return endpointPublication
      .run(async () => {
        if (headless || !accessPolicy) {
          return;
        }
        const file = `${accessPolicyFile}.endpoint`;
        await atomicWrite(
          file,
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
        );
      })
      .catch((error) => {
        accessError = failure(error);
        console.error(error);
      });
  }

  async function createAutomationHost(
    config: { token: string; port: number },
    policyToken = accessPolicy!.token,
  ) {
    return startAutomationHost({
      mode: headless ? 'headless' : 'interactive',
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
      printPdf: options.printPdf,
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
        token: process.env.NEANES_MCP_TOKEN ?? accessPolicy.token,
        port: Number(process.env.NEANES_MCP_PORT ?? 0),
      });
      if (win) {
        automationHost.attach(win, automationRendererReady);
      }
    } catch (error) {
      accessError = failure(error);
      console.error(error);
    }
    await publishEditorEndpoint();
  }

  function agentAccessState(): AgentAccessState {
    const bridge = app.isPackaged
      ? installedBridge
      : path.resolve('electron/mcp/bridge.mjs');
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
            : automationHost?.isReady()
              ? 'ready'
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
      return accessQueue.run(async () => {
        const current = await initializeAccessPolicy(accessPolicyFile);
        if (
          current.enabled === enabled &&
          current.token === accessPolicy?.token
        ) {
          return { state: agentAccessState(), confirmationRequired: false };
        }
        if (!enabled && !discardUnsavedChanges) {
          return { state: agentAccessState(), confirmationRequired: true };
        }
        accessPolicy = await setAccessEnabled(accessPolicyFile, enabled);
        await syncAgentAccess();
        return { state: agentAccessState(), confirmationRequired: false };
      });
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
    void accessQueue
      .run(async () => {
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
          accessError = failure(error);
        }
      })
      .catch(console.error)
      .finally(() => {
        policyCheckRunning = false;
      });
  }, 1000);
  policyTimer.unref();
  app.on('will-quit', () => clearInterval(policyTimer));

  ipcMain.handle(IpcRendererChannels.AgentAccessRetry, (event) => {
    requireEditorSender(event);
    return accessQueue.run(async () => {
      try {
        accessPolicy = await initializeAccessPolicy(accessPolicyFile);
        await syncAgentAccess();
      } catch (error) {
        accessError = failure(error);
      }
      return agentAccessState();
    });
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
    automationHost.attach(win, automationRendererReady);
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
      automationHost?.attach(window, automationRendererReady);
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
      await accessQueue.run(async () => {
        try {
          accessPolicy = await initializeAccessPolicy(accessPolicyFile);
          if (app.isPackaged) {
            await fs.mkdir(path.dirname(installedBridge), { recursive: true });
            for (const name of ['bridgeProtocol.mjs', 'bridge.mjs']) {
              const destination = path.join(
                path.dirname(installedBridge),
                name,
              );
              await atomicWrite(
                destination,
                await fs.readFile(
                  path.join(process.resourcesPath, 'mcp', name),
                ),
              );
            }
          }
          await syncAgentAccess();
        } catch (error) {
          accessPolicy ??= {
            token: randomBytes(32).toString('hex'),
            enabled: false,
          };
          accessError = failure(error);
          console.error('Could not load agent access settings', error);
        }

        agentAccessInitialized = true;
      });
    },
  };
}
