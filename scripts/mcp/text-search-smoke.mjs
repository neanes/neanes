// Run outside the agent command sandbox; starts a disposable Electron app.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import electron from 'electron';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';

const directory = await mkdtemp(path.join(tmpdir(), 'neanes-text-search-'));
await writeFile(
  path.join(directory, 'agent-access.json'),
  JSON.stringify({ enabled: true, token: randomBytes(32).toString('hex') }),
  { mode: 0o600 },
);
const editor = spawn(electron, [process.cwd(), '--no-update'], {
  env: {
    ...process.env,
    IS_TEST: '1',
    NEANES_DEV_USER_DATA_DIR: directory,
    NEANES_MCP_PORT: '0',
    NEANES_MCP_TOKEN: undefined,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
editor.stdout.on('data', (data) => {
  log += data;
});
editor.stderr.on('data', (data) => {
  log += data;
});
let client;
try {
  let endpoint;
  for (let attempt = 0; attempt < 300; attempt++) {
    if (editor.exitCode !== null) {
      throw new Error(`Electron exited: ${log}`);
    }
    try {
      endpoint = JSON.parse(
        await readFile(
          path.join(directory, 'agent-access.json.endpoint'),
          'utf8',
        ),
      );
      if (endpoint.endpoint) {
        break;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    await delay(100);
  }
  assert.ok(endpoint?.endpoint, log);
  client = new Client({ name: 'text-search-smoke', version: '1' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(endpoint.endpoint), {
      requestInit: { headers: { Authorization: `Bearer ${endpoint.token}` } },
    }),
  );
  const tools = (await client.listTools()).tools;
  const validator = new AjvJsonSchemaValidator();
  const inputs = new Map(
    tools.map((tool) => [tool.name, validator.getValidator(tool.inputSchema)]),
  );
  const outputs = new Map(
    tools.map((tool) => [tool.name, validator.getValidator(tool.outputSchema)]),
  );
  async function call(name, args = {}, error) {
    if (!error) {
      assert.equal(
        inputs.get(name)(args).valid,
        true,
        `Invalid input: ${name}`,
      );
    }
    const reply = await client.callTool({ name, arguments: args });
    const outcome = reply.structuredContent;
    assert.deepEqual(outcome, JSON.parse(reply.content[0].text));
    assert.equal(
      outputs.get(name)(outcome).valid,
      true,
      `Invalid output: ${name}`,
    );
    assert.equal(outcome.success, !error, JSON.stringify(outcome));
    if (error) {
      assert.equal(outcome.error.code, error);
    } else {
      return outcome.result;
    }
  }
  assert.equal(
    tools.find((tool) => tool.name === 'find_text').annotations.readOnlyHint,
    true,
  );
  const sessionId = (await call('create_session')).sessionId;
  for (const scope of [{}, { sessionId }]) {
    const created = await call('create_document', {
      ...scope,
      title: 'Text search regression',
    });
    const args = { ...scope, documentId: created.documentId };
    const inserted = await call('edit_elements', {
      ...args,
      expectedRevision: created.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'DropCap',
              clientId: 'drop',
              properties: { content: 'Κ' },
            },
            {
              elementType: 'Note',
              clientId: 'note',
              properties: { lyrics: 'ύ' },
            },
            {
              elementType: 'Note',
              clientId: 'end',
              properties: { lyrics: 'ριε' },
            },
            {
              elementType: 'TextBox',
              clientId: 'box',
              properties: {
                content: 'Κύριε plain',
                contentBottom: 'ΛΟΓΟΣ',
                contentLeft: 'Arabic اـب',
              },
            },
            {
              elementType: 'RichTextBox',
              clientId: 'rich',
              properties: {
                content:
                  '<p title="hidden">Κύ<strong>ριε</strong> &amp; mercy</p>',
              },
            },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@note',
            collection: 'annotations',
          },
          elements: [
            {
              elementType: 'Annotation',
              clientId: 'annotation',
              properties: { text: '<p>Κύριε annotation</p>' },
            },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@note',
            collection: 'alternateLines',
          },
          elements: [{ elementType: 'AlternateLine', clientId: 'alternate' }],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@alternate',
            collection: 'elements',
          },
          elements: [
            {
              elementType: 'Note',
              clientId: 'altNote',
              properties: { lyrics: 'Κύριε' },
            },
          ],
        },
      ],
    });
    const refs = Object.fromEntries(
      inserted.created.map((element) => [element.clientId, element.elementRef]),
    );
    const header = (
      await call('get_elements', {
        ...args,
        collection: { kind: 'headers', variant: 'odd' },
        properties: [],
      })
    ).elements[0];
    const updated = await call('edit_elements', {
      ...args,
      expectedRevision: inserted.revision,
      actions: [
        {
          action: 'update',
          elementRef: header.elementRef,
          elementType: header.elementType,
          properties: { content: 'Κύριε header' },
        },
      ],
    });
    const before = await readScoreSnapshot(call, args);
    const search = {
      ...args,
      expectedRevision: updated.revision,
      query: 'κύριε',
    };
    const all = await call('find_text', search);
    assert.deepEqual(
      all.matches.map((match) => match.elementRef),
      [
        refs.drop,
        refs.annotation,
        refs.altNote,
        refs.box,
        refs.rich,
        header.elementRef,
      ],
    );
    assert.deepEqual(
      all.matches[0].elements.map((element) => element.elementRef),
      [refs.drop, refs.note, refs.end],
    );
    for (const match of all.matches) {
      assert.equal(
        match.snippet.slice(match.matchStart, match.matchEnd),
        'κύριε',
      );
    }
    const pages = [];
    let offset = 0;
    do {
      const page = await call('find_text', { ...search, limit: 1, offset });
      pages.push(...page.matches);
      if (page.nextOffset === null) {
        break;
      }
      offset = page.nextOffset;
    } while (true);
    assert.deepEqual(pages, all.matches);
    assert.equal(
      (await call('find_text', { ...search, offset: 6 })).matches.length,
      0,
    );
    await call('find_text', { ...search, offset: 7 }, 'INVALID_ELEMENT_RANGE');
    assert.equal(
      (await call('find_text', { ...search, caseSensitive: true })).matches
        .length,
      0,
    );
    assert.equal(
      (await call('find_text', { ...search, fields: ['text'] })).matches[0]
        .elementRef,
      refs.annotation,
    );
    assert.equal(
      (await call('find_text', { ...search, query: 'اب' })).matches[0]
        .elements[0].field,
      'contentLeft',
    );
    assert.equal(
      (await call('find_text', { ...search, query: 'ριε & mercy' })).matches[0]
        .elementRef,
      refs.rich,
    );
    assert.equal(
      (await call('find_text', { ...search, query: 'hidden' })).matches.length,
      0,
    );
    assert.equal(
      (await call('find_text', { ...search, query: 'λογος' })).matches[0]
        .elementRef,
      refs.box,
    );
    assert.equal(
      (await call('find_text', { ...search, query: 'Κυ\u0301ριε' })).matches
        .length,
      6,
    );
    assert.equal(
      (
        await call('find_text', {
          ...search,
          scope: { kind: 'collection', collection: { kind: 'staff' } },
        })
      ).matches.length,
      3,
    );
    assert.equal(
      (
        await call('find_text', {
          ...search,
          scope: {
            kind: 'collection',
            collection: { kind: 'staff' },
            includeDescendants: true,
          },
        })
      ).matches.length,
      5,
    );
    assert.deepEqual(await readScoreSnapshot(call, args), before);
    await call('find_text', { ...search, query: ' \tـ' }, 'VALIDATION_ERROR');
    if (scope.sessionId) {
      await call(
        'find_text',
        { ...search, sessionId: undefined },
        'DOCUMENT_NOT_FOUND',
      );
    } else {
      await call('find_text', { ...search, sessionId }, 'DOCUMENT_NOT_FOUND');
    }
    const edited = await call('edit_elements', {
      ...args,
      expectedRevision: updated.revision,
      actions: [{ action: 'remove', elementRef: refs.box }],
    });
    await call('find_text', search, 'REVISION_CONFLICT');
    await call('close_document', {
      ...args,
      expectedRevision: edited.revision,
      discardUnsavedChanges: true,
    });
    console.log(
      `Text search passed: ${scope.sessionId ? 'isolated' : 'interactive'}`,
    );
  }
  await call('close_session', { sessionId, discardUnsavedChanges: true });
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await client?.close();
  editor.kill('SIGKILL');
}
