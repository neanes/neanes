import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

// Exercise the real MCP transport in interactive, private and headless smoke runs.
export async function checkSettings(client, scope = {}) {
  async function call(name, args = {}, errorCode) {
    const reply = await client.callTool({
      name,
      arguments: { ...scope, ...args },
    });
    if (errorCode) {
      assert.equal(
        reply.structuredContent.error.code,
        errorCode,
        JSON.stringify(reply),
      );
      return;
    }
    assert.ok(!reply.isError, JSON.stringify(reply));
    assert.deepEqual(
      reply.structuredContent,
      JSON.parse(reply.content[0].text),
    );
    return reply.structuredContent.result;
  }
  const tools = (await client.listTools()).tools;
  assert.ok(!tools.some(({ name }) => name === 'get_document'));
  for (const name of [
    'get_document_properties',
    'get_page_setup',
    'get_header_footer_settings',
  ]) {
    assert.equal(
      tools.find((tool) => tool.name === name).annotations.readOnlyHint,
      true,
    );
  }
  const document = await call('create_document', {
    title: 'Focused settings smoke',
  });
  const args = { documentId: document.documentId };
  try {
    const original = await call('get_document_properties', args);
    assert.equal(original.properties.title, 'Focused settings smoke');
    assert.ok(!('score' in original));
    const header = await call('get_elements', {
      ...args,
      collection: { kind: 'headers', variant: 'default' },
      includeContent: true,
      properties: [
        'content',
        'contentBottom',
        'contentLeft',
        'contentCenter',
        'contentRight',
        'multipanel',
        'paragraphStyleId',
      ],
    });
    const updated = await call('update_page_setup', {
      ...args,
      expectedRevision: original.revision,
      changes: {
        pageSize: 'Custom',
        pageWidthCustom: 576,
        pageHeightCustom: 864,
        landscape: true,
        topMargin: 48,
      },
    });
    assert.ok(updated.revision > original.revision);
    assert.ok(!('settings' in updated));
    const page = await call('get_page_setup', {
      ...args,
      expectedRevision: updated.revision,
      properties: ['pageWidth', 'pageHeight', 'topMargin'],
    });
    assert.deepEqual(page.settings, {
      pageWidth: 864,
      pageHeight: 576,
      topMargin: 48,
    });
    assert.deepEqual(
      (await call('get_header_footer_settings', { ...args, properties: [] }))
        .settings,
      {},
    );
    await call(
      'update_page_setup',
      {
        ...args,
        expectedRevision: original.revision,
        changes: { topMargin: 50 },
      },
      'REVISION_CONFLICT',
    );
    await call(
      'get_page_setup',
      { ...args, expectedRevision: original.revision },
      'REVISION_CONFLICT',
    );
    await call(
      'update_page_setup',
      {
        ...args,
        expectedRevision: updated.revision,
        changes: { pageWidth: 100 },
      },
      'VALIDATION_ERROR',
    );
    await call(
      'update_page_setup',
      {
        ...args,
        expectedRevision: updated.revision,
        changes: { leftMargin: 10000 },
      },
      'INVALID_PAGE_SETUP',
    );
    await call(
      'update_header_footer_settings',
      {
        ...args,
        expectedRevision: updated.revision,
        changes: { landscape: false },
      },
      'VALIDATION_ERROR',
    );
    await call(
      'get_header_footer_settings',
      { ...args, properties: ['unknown'] },
      'VALIDATION_ERROR',
    );
    const unchanged = await call('update_page_setup', {
      ...args,
      expectedRevision: updated.revision,
      changes: {},
    });
    assert.equal(unchanged.revision, updated.revision);
    const changedHeader = await call('update_header_footer_settings', {
      ...args,
      expectedRevision: updated.revision,
      changes: {
        showHeader: true,
        showFooter: true,
        headerDifferentOddEven: true,
        firstPageNumber: 3,
        numerals: 'easternArabic',
        richHeaderFooter: true,
      },
    });
    // Newly visible live text boxes can report measured heights asynchronously.
    // Refresh reads before a dependent operation; never replay a write.
    let settled = changedHeader;
    for (let attempt = 0; attempt < 20; attempt++) {
      await setTimeout(50);
      const current = await call('get_document_properties', args);
      if (current.revision === settled.revision) {
        break;
      }
      settled = current;
    }
    const settings = await call('get_header_footer_settings', {
      ...args,
      expectedRevision: settled.revision,
      properties: [
        'showHeader',
        'firstPageNumber',
        'numerals',
        'richHeaderFooter',
      ],
    });
    assert.deepEqual(settings.settings, {
      showHeader: true,
      firstPageNumber: 3,
      numerals: 'easternArabic',
      richHeaderFooter: true,
    });
    const headerAfter = await call('get_elements', {
      ...args,
      collection: { kind: 'headers', variant: 'default' },
      includeContent: true,
      properties: [
        'content',
        'contentBottom',
        'contentLeft',
        'contentCenter',
        'contentRight',
        'multipanel',
        'paragraphStyleId',
      ],
    });
    assert.deepEqual(headerAfter.elements, header.elements);
    assert.equal(
      (await call('get_document_properties', args)).properties.title,
      original.properties.title,
    );
    const metadata = await call('replace_document_properties', {
      ...args,
      expectedRevision: settled.revision,
      properties: { title: 'Changed settings title', author: 'Author' },
    });
    assert.deepEqual(
      (
        await call('get_document_properties', {
          ...args,
          expectedRevision: metadata.revision,
        })
      ).properties,
      { title: 'Changed settings title', author: 'Author' },
    );
  } finally {
    const current = await call('get_document_properties', args);
    await call('close_document', {
      ...args,
      expectedRevision: current.revision,
      discardUnsavedChanges: true,
    });
  }
}
