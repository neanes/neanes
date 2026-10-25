import { readFile } from 'node:fs/promises';

import { eventually } from './smokePolling.mjs';

// Test-only aggregate of the focused readers, for fixture construction and
// before/after comparisons. This is not a save-format serializer or MCP tool.
export async function readScoreSnapshot(call, args) {
  if (args.expectedRevision !== undefined) {
    return readSnapshot(call, args);
  }
  // Only replay a read snapshot if live text measurement advanced revision.
  return eventually(() => readSnapshot(call, args), {
    timeoutMs: 5000,
    intervalMs: 50,
    retry: (error) => error.message.includes('REVISION_CONFLICT'),
  });
}

async function readSnapshot(call, args) {
  const scope = { ...args };
  const metadata = await call('get_document_properties', scope);
  const atRevision = { ...scope, expectedRevision: metadata.revision };
  const page = await call('get_page_setup', atRevision);
  const headerFooter = await call('get_header_footer_settings', atRevision);
  const styleArgs = { ...scope, includeResolved: false };
  delete styleArgs.expectedRevision;
  const styles = await call('get_paragraph_styles', styleArgs);
  async function content(elementRef, property) {
    let value = '';
    let offset = 0;
    do {
      const chunk = await call('get_element_content', {
        ...atRevision,
        elementRef,
        property,
        offset,
      });
      value += chunk.content;
      offset = chunk.nextOffset;
    } while (offset !== null);
    return value;
  }
  async function collection(selector) {
    const elements = [];
    let offset = 0;
    do {
      const query = { ...atRevision, collection: selector, offset };
      let result;
      try {
        result = await call('get_elements', { ...query, includeContent: true });
      } catch (error) {
        if (!error.message.includes('RESPONSE_TOO_LARGE')) {
          throw error;
        }
        result = await call('get_elements', query);
      }
      for (const element of result.elements) {
        const properties = { ...element.properties };
        if (element.elementType === 'ImageBox') {
          const image = await call('get_element_image', {
            ...atRevision,
            elementRef: element.elementRef,
          });
          properties.data = `data:${image.mimeType};base64,${(await readFile(image.outputFilePath)).toString('base64')}`;
        }
        const contentProperties = ['TextBox', 'RichTextBox'].includes(
          element.elementType,
        )
          ? [
              'content',
              'contentLeft',
              'contentCenter',
              'contentRight',
              'contentBottom',
            ]
          : (element.omittedContent ?? []);
        for (const property of contentProperties) {
          if (!Object.hasOwn(properties, property)) {
            properties[property] = await content(element.elementRef, property);
          }
        }
        const children = {};
        for (const name of Object.keys(element.children)) {
          children[name] =
            element.children[name] === 0
              ? []
              : await collection({
                  kind: 'children',
                  parentRef: element.elementRef,
                  collection: name,
                });
        }
        elements.push({
          elementType: element.elementType,
          ...properties,
          ...children,
        });
      }
      offset = result.nextOffset;
    } while (offset !== null);
    return elements;
  }
  const headers = {};
  const footers = {};
  for (const variant of [
    'default',
    'firstPage',
    'odd',
    'even',
    'chapterOpening',
  ]) {
    headers[variant] = {
      elements: await collection({ kind: 'headers', variant }),
    };
    footers[variant] = {
      elements: await collection({ kind: 'footers', variant }),
    };
  }
  let text = '';
  let offset = 0;
  let locked;
  do {
    const lyrics = await call('get_staff_lyrics', { ...atRevision, offset });
    text += lyrics.text;
    locked = lyrics.locked;
    offset = lyrics.nextOffset;
  } while (offset !== null);
  const elements = await collection({ kind: 'staff' });
  const completed = await call('get_document_properties', atRevision);
  const { properties, ...summary } = completed;
  return {
    ...summary,
    score: {
      version: '1.1',
      documentProperties: properties,
      pageSetup: { ...page.settings, ...headerFooter.settings },
      paragraphStyles: styles.styles.map(({ overrides, ...style }) => {
        const { fontStyle, ...values } = overrides;
        return {
          ...style,
          ...values,
          ...(fontStyle !== undefined ? { fontSubfamily: fontStyle } : {}),
        };
      }),
      headers,
      footers,
      staff: {
        elements,
        lyrics: { text, locked },
      },
    },
  };
}
