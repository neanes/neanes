import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  type AgentAccessPolicy,
  agentAccessPolicySchema,
} from '../../../src/ipc/agentAccess';
import { atomicWrite } from './atomicWrite';

export async function readAccessPolicy(
  file: string,
): Promise<AgentAccessPolicy> {
  return agentAccessPolicySchema.parse(
    JSON.parse(await fs.readFile(file, 'utf8')),
  );
}

export async function initializeAccessPolicy(file: string) {
  try {
    return await readAccessPolicy(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    const policy = {
      token: randomBytes(32).toString('hex'),
      enabled: false,
    };
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(policy), {
        mode: 0o600,
        flag: 'wx',
      });
      try {
        await fs.link(temporary, file);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }
    } finally {
      await fs.rm(temporary, { force: true });
    }
    return readAccessPolicy(file);
  }
}

// Changing the credential invalidates hosts even if they miss an off/on cycle.
export async function setAccessEnabled(file: string, enabled: boolean) {
  const policy = await initializeAccessPolicy(file);
  if (policy.enabled === enabled) {
    return policy;
  }
  const next = { enabled, token: randomBytes(32).toString('hex') };
  await atomicWrite(file, JSON.stringify(next));
  return next;
}

export async function requireAgentAccess(file: string, token?: string) {
  const policy = await readAccessPolicy(file);
  if (!policy.enabled || (token !== undefined && policy.token !== token)) {
    throw new Error('AGENT_ACCESS_DISABLED');
  }
  return policy;
}

// Private host records let the editor warn about drafts in background workers.
export async function hasAgentDrafts(file: string) {
  const policy = await readAccessPolicy(file);
  const generation = createHash('sha256').update(policy.token).digest('hex');
  let names: string[];
  try {
    names = await fs.readdir(`${file}.hosts`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
  for (const name of names.filter((name) => name.endsWith('.json'))) {
    const record = path.join(`${file}.hosts`, name);
    let host: {
      pid: number;
      dirty: boolean;
      busy: boolean;
      generation: string;
    };
    try {
      host = JSON.parse(await fs.readFile(record, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw error;
    }
    if (!Number.isInteger(host.pid) || host.pid <= 0) {
      throw new Error('INVALID_AGENT_HOST');
    }
    try {
      process.kill(host.pid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
        await fs.rm(record, { force: true });
        continue;
      }
      throw error;
    }
    if (host.generation === generation && (host.dirty || host.busy)) {
      return true;
    }
  }
  return false;
}

export async function registerAgentHost(file: string, token: string) {
  const generation = createHash('sha256').update(token).digest('hex');
  const directory = `${file}.hosts`;
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const record = path.join(directory, `${process.pid}-${randomUUID()}.json`);
  let queue = Promise.resolve();
  return {
    update(dirty: boolean, busy: boolean) {
      const operation = queue.then(async () => {
        await atomicWrite(
          record,
          JSON.stringify({ pid: process.pid, dirty, busy, generation }),
        );
      });
      queue = operation.catch(() => {});
      return operation;
    },
    async close() {
      await queue;
      await fs.rm(record, { force: true });
    },
  };
}
