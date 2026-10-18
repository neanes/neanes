import { z } from 'zod';

export const agentAccessPolicySchema = z.object({
  token: z.string().min(32),
});
export type AgentAccessPolicy = z.infer<typeof agentAccessPolicySchema>;
export interface AgentAccessState {
  status: 'starting' | 'ready' | 'error';
  error: string | null;
  endpoint: string | null;
  configuration: string;
}
