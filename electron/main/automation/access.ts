import { randomBytes, randomUUID } from 'node:crypto';
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
