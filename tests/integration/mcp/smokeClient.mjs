import assert from 'node:assert/strict';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import electron from 'electron';

export async function connectEditorClient(name, options = {}) {
  const client = await connectStdioClient(name, options);
  const tools = (await client.listTools()).tools;
  const call = client.callTool.bind(client);
  client.callTool = (params, ...rest) =>
    call(
      {
        ...params,
        arguments: {
          ...params.arguments,
          ...(tools.find((tool) => tool.name === params.name)?.inputSchema
            .properties?.documentScope
            ? { documentScope: 'editor' }
            : {}),
        },
      },
      ...rest,
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

export function stdioConfiguration(
  profile = process.env.NEANES_DEV_USER_DATA_DIR,
) {
  assert.ok(
    profile,
    'Set NEANES_DEV_USER_DATA_DIR to the disposable editor profile.',
  );
  const env = {
    ...process.env,
    IS_TEST: '1',
    NEANES_DEV_USER_DATA_DIR: profile,
  };
  delete env.ELECTRON_RUN_AS_NODE;
  return {
    command: process.env.NEANES_TEST_EXECUTABLE || electron,
    args: [
      ...(!process.env.NEANES_TEST_EXECUTABLE ? [process.cwd()] : []),
      '--mcp',
    ],
    env,
    stderr: 'inherit',
  };
}

export async function connectStdioClient(
  name,
  { profile = process.env.NEANES_DEV_USER_DATA_DIR } = {},
) {
  const client = new Client({ name, version: '1.0.0' });
  await client.connect(new StdioClientTransport(stdioConfiguration(profile)), {
    timeout: 70_000,
  });
  return client;
}
