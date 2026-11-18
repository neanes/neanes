import assert from 'node:assert/strict';

import { eventually } from './smokePolling.mjs';

export async function checkRichTextScorePaste({ call, evaluate, menu }) {
  const workspace = 'window._editor.selectedWorkspace.value';
  // Observe real menu delivery after the editor's synchronous clipboard handler.
  await evaluate(`
    window.__scorePasteMenu = null;
    for (const channel of ['FileMenuCopy', 'FileMenuPaste', 'FileMenuUndo', 'FileMenuRedo']) {
      window.ipcRenderer.on(channel, () => { window.__scorePasteMenu = channel; });
    }
  `);
  async function delivered(channel) {
    if (channel === 'FileMenuCopy' || channel === 'FileMenuPaste') {
      // Selecting a rich text box schedules focus. Let it finish, then use the
      // score clipboard route rather than the focused text editor's clipboard.
      await evaluate(
        'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
      );
      await evaluate('document.activeElement?.blur()');
      assert.equal(
        await evaluate('document.activeElement?.isContentEditable'),
        false,
      );
    }
    await evaluate('window.__scorePasteMenu = null');
    await menu(channel);
    await eventually(async () =>
      assert.equal(await evaluate('window.__scorePasteMenu'), channel),
    );
  }
  for (const sourceHasFootnote of [true, false]) {
    const doc = await call('create_document', {
      documentScope: 'editor',
      title: `Score rich text paste: source footnote ${sourceHasFootnote}`,
    });
    const args = { documentScope: 'editor', documentId: doc.documentId };
    const initial = await call('get_elements', args);
    const actions = [
      { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
      {
        action: 'insert',
        elements: ['Source', 'Destination'].map((text) => ({
          elementType: 'RichTextBox',
          clientId: text,
          properties: { content: `<p>${text}</p>` },
        })),
      },
      ...['Destination', ...(sourceHasFootnote ? ['Source'] : [])].map(
        (text) => ({
          action: 'insert_footnote',
          elementRef: `@${text}`,
          contentKey: 'content',
          htmlOffset: 3,
          elements: [
            {
              elementType: 'RichTextBox',
              properties: { content: `<p>${text} body</p>` },
            },
          ],
        }),
      ),
    ];
    await call('edit_elements', {
      ...args,
      expectedRevision: initial.revision,
      actions,
    });
    await evaluate(`
      document.activeElement?.blur();
      ${workspace}.entryMode = 'Edit';
      window._editor.selectedElement.value = ${workspace}.score.staff.elements[0];
    `);
    await delivered('FileMenuCopy');
    await evaluate(`
      document.activeElement?.blur();
      window._editor.selectedElement.value = ${workspace}.score.staff.elements[1];
    `);
    const snapshot = () =>
      evaluate(`({
        content: ${workspace}.score.staff.elements[1].content,
        bodies: ${workspace}.score.footnotes.map(body => ({
          id: body.id, content: body.staff.elements[0].content
        })),
        history: ${workspace}.commandService.commandHistory.length
      })`);
    const before = await snapshot();
    const oldId = before.bodies.find((body) =>
      body.content.includes('Destination body'),
    ).id;
    await delivered('FileMenuPaste');
    const pasted = await snapshot();
    assert.ok(pasted.content.includes('Source'));
    assert.ok(!pasted.content.includes('Destination'));
    assert.equal(pasted.history, before.history + 1);
    assert.ok(pasted.bodies.every((body) => body.id !== oldId));
    assert.equal(pasted.bodies.length, sourceHasFootnote ? 2 : 0);
    if (sourceHasFootnote) {
      assert.ok(
        pasted.bodies.every((body) => body.content.includes('Source body')),
      );
      assert.equal(new Set(pasted.bodies.map((body) => body.id)).size, 2);
      const sourceId = await evaluate(
        `${workspace}.score.staff.elements[0].content.match(/data-footnote-id="([^"]+)"/)[1]`,
      );
      assert.ok(!pasted.content.includes(sourceId));
      const pastedBody = pasted.bodies.find((body) =>
        pasted.content.includes(body.id),
      );
      assert.ok(pastedBody);
      assert.equal(
        pasted.content,
        `<p><span class="neanes-footnote" data-footnote-id="${pastedBody.id}"></span>Source</p>`,
      );
    }
    // Settled discovery also checks that every remaining reference has a body.
    await call('get_pages', args);
    await delivered('FileMenuUndo');
    assert.deepEqual(await snapshot(), { ...before, history: pasted.history });
    await delivered('FileMenuRedo');
    assert.deepEqual(await snapshot(), pasted);
    await call('get_pages', args);
    await call('close_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      discardUnsavedChanges: true,
    });
  }
  console.log(
    'Score rich text paste: footnote ownership and Undo/Redo passed.',
  );
}
