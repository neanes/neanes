import assert from 'node:assert/strict';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import electron from 'electron';

export async function connectHttpClient(
  name,
  {
    url = process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp',
    token = process.env.NEANES_MCP_TOKEN,
  } = {},
) {
  const client = new Client({ name, version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );
  return client;
}

export async function callTool(client, name, args = {}, error) {
  const reply = await client.callTool({ name, arguments: args });
  assert.deepEqual(reply.structuredContent, JSON.parse(reply.content[0].text));
  assert.equal(reply.structuredContent.success, !error, JSON.stringify(reply));
  if (error) {
    assert.equal(reply.isError, true, JSON.stringify(reply));
    assert.equal(reply.structuredContent.error.code, error);
  } else {
    assert.ok(!reply.isError, JSON.stringify(reply));
  }
  return reply;
}

// Pass the discovered inventory only in scenarios that check published schemas.
export function createToolCaller(client, tools) {
  const validator = tools && new AjvJsonSchemaValidator();
  const inputs =
    tools &&
    new Map(
      tools.map((tool) => [
        tool.name,
        validator.getValidator(tool.inputSchema),
      ]),
    );
  const outputs =
    tools &&
    new Map(
      tools.map((tool) => [
        tool.name,
        validator.getValidator(tool.outputSchema),
      ]),
    );
  return async (name, args = {}, error) => {
    if (tools && !error) {
      assert.equal(
        inputs.get(name)(args).valid,
        true,
        `Invalid published input: ${name}`,
      );
    }
    const reply = await callTool(client, name, args, error);
    if (tools) {
      assert.equal(
        outputs.get(name)(reply.structuredContent).valid,
        true,
        `Invalid published output: ${name}: ${JSON.stringify(reply)}`,
      );
    }
    return error ? undefined : reply.structuredContent.result;
  };
}

export async function closeDocument(call, args) {
  const current = await call('get_document_properties', args);
  return call('close_document', {
    ...args,
    expectedRevision: current.revision,
    discardUnsavedChanges: true,
  });
}

export async function connectBridgeClient(
  name,
  {
    policyPath = process.env.NEANES_DEV_USER_DATA_DIR &&
      path.join(process.env.NEANES_DEV_USER_DATA_DIR, 'agent-access.json'),
  } = {},
) {
  assert.ok(
    policyPath,
    'Set NEANES_DEV_USER_DATA_DIR to the disposable editor profile.',
  );
  const client = new Client({ name, version: '1.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [
        path.resolve('scripts/mcp/bridge.mjs'),
        '--executable',
        process.env.NEANES_TEST_EXECUTABLE || electron,
        ...(!process.env.NEANES_TEST_EXECUTABLE
          ? ['--app', process.cwd()]
          : []),
        '--policy',
        policyPath,
      ],
      stderr: 'inherit',
    }),
    { timeout: 70_000 },
  );
  return client;
}
