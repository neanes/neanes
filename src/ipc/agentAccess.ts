import { z } from 'zod';

export const agentAccessPolicySchema = z.object({
  token: z.string().min(32),
  enabled: z.boolean().default(false),
});
export type AgentAccessPolicy = z.infer<typeof agentAccessPolicySchema>;
export interface AgentAccessState {
  enabled: boolean;
  status: 'off' | 'starting' | 'ready' | 'error';
  error: string | null;
  endpoint: string | null;
  configuration: string;
}

export interface AgentAccessUpdate {
  state: AgentAccessState;
  confirmationRequired: boolean;
}
