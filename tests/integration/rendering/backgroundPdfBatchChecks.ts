import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  type PDFPage,
  PDFStream,
  PDFString,
} from 'pdf-lib';

import {
  EmptyElement,
  RichTextBoxElement,
  TextBoxElement,
} from '../../../src/models/save/v1/Element';
import type { ScoreRenderSnapshot } from '../../../src/services/rendering/scoreRenderSnapshot';

// CKEditor marks images with a width and height as lazy-loading.
const sizedImage =
  '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEUlEQVR4nGP4z8DwnwGMgRQAH+4D/dJQfRoAAAAASUVORK5CYII=" width="24" height="24">';

function containsImage(resources: PDFDict | undefined): boolean {
  const objects = resources?.lookupMaybe(PDFName.of('XObject'), PDFDict);
  return (objects?.values() ?? []).some((ref) => {
    const object = resources!.context.lookup(ref);
    if (!(object instanceof PDFStream)) {
      return false;
    }
    const subtype = object.dict.get(PDFName.of('Subtype'));
    return (
      subtype === PDFName.of('Image') ||
      (subtype === PDFName.of('Form') &&
        containsImage(
          object.dict.lookupMaybe(PDFName.of('Resources'), PDFDict),
        ))
    );
  });
}

export async function checkPdfBatches(
  input: ScoreRenderSnapshot,
  render: (snapshot: ScoreRenderSnapshot) => Promise<Buffer>,
  output: string,
) {
  const snapshot = structuredClone(input);
  const first = new RichTextBoxElement();
  first.id = 1001;
  first.pageBreak = true;
  first.content =
    '<p><a href="#element-1051">Go to the last page</a></p>' +
    '<p><a href="#bookmark">Go to the bookmark</a></p>' +
    // The URL parser strips surrounding whitespace from an href.
    '<p><a href=" #element-1051 ">Padded link to the last page</a></p>' +
    // Browsers match the fragment as written before percent-decoding it.
    '<p><a href="#step%201">Go to step 1</a></p>' +
    '<p><a href="https://example.com/">External link</a></p>';
  const last = new RichTextBoxElement();
  last.id = 1051;
  // The only link to the first page encodes its fragment as an entity.
  last.content =
    '<p><a href="&#35;element-1001">Return to the first page</a></p>' +
    '<p><a href="#element-9999">Missing target</a></p>' +
    '<p><a href="#bookmark">Back to the bookmark</a></p>' +
    `<p>${sizedImage}</p>` +
    '<p><span id="bookmark">Bookmarked passage</span></p>' +
    '<p><span id="step%201">Step 1</span></p>';
  const middle = Array.from({ length: 49 }, (_, index) => {
    const page = new TextBoxElement();
    page.content = `Body of page ${index + 2}`;
    page.pageBreak = true;
    return page;
  });
  snapshot.score.staff.elements = [first, ...middle, last, new EmptyElement()];
  const footer = new TextBoxElement();
  footer.content = 'Page $p / $n';
  Object.assign(snapshot.score.pageSetup, {
    showFooter: true,
    richHeaderFooter: false,
    footerMargin: 48,
    footerDifferentFirstPage: false,
    footerDifferentOddEven: false,
    headerFooterDifferentChapterOpening: false,
  });
  for (const variant of Object.values(snapshot.score.footers)) {
    variant.elements = [structuredClone(footer)];
  }

  const data = await render(snapshot);
  await writeFile(path.join(output, 'batched.pdf'), data);
  const document = await PDFDocument.load(data, { updateMetadata: false });
  assert.equal(document.getPageCount(), 51);
  // The first batch's Chromium metadata is kept as the merged document's.
  assert.equal(document.getTitle(), snapshot.title);
  assert.equal(document.getCreator(), 'Chromium');
  assert(document.getProducer()?.startsWith('Skia/PDF'));
  assert(document.getCreationDate() instanceof Date);
  const firstPage = document.getPage(0);
  const lastPage = document.getPage(50);
  assert(
    containsImage(lastPage.node.Resources()),
    'A lazy rich-text image far below the viewport must load and print.',
  );
  const annotationsOf = (page: PDFPage) =>
    page.node
      .Annots()!
      .asArray()
      .map((entry) => document.context.lookup(entry, PDFDict));
  // Returns the top of each internal destination, which must be on `page`.
  const internalTops = (links: PDFDict[], page: PDFPage) =>
    links.flatMap((link) => {
      const destination = link.lookupMaybe(PDFName.of('Dest'), PDFArray);
      if (destination?.get(0) !== page.ref) {
        return [];
      }
      assert.equal(destination.get(1), PDFName.of('XYZ'));
      const y = destination.lookup(3, PDFNumber).asNumber();
      assert(y > 0 && y <= page.getHeight());
      return [y];
    });
  const destinationCount = (links: PDFDict[]) =>
    links.filter((link) => link.has(PDFName.of('Dest'))).length;

  const links = annotationsOf(firstPage);
  assert.equal(links.length, 5);
  assert.equal(destinationCount(links), 4);
  const [boxTop, paddedTop, bookmarkTop, stepTop] = internalTops(
    links,
    lastPage,
  ).sort((a, b) => b - a);
  assert(
    stepTop < bookmarkTop,
    'A link must find an ID containing a literal percent sequence.',
  );
  assert.equal(paddedTop, boxTop, 'A padded href must resolve like its trim.');
  assert(
    bookmarkTop < boxTop,
    'A rich-text span destination must point at the span, not its box.',
  );
  const external = links
    .map((link) => link.lookupMaybe(PDFName.of('A'), PDFDict))
    .find((action) => action !== undefined);
  assert.equal(
    external?.lookup(PDFName.of('URI'), PDFString).decodeText(),
    'https://example.com/',
  );
  const lastLinks = annotationsOf(lastPage);
  assert.equal(lastLinks.length, 2);
  assert.equal(destinationCount(lastLinks), 2);
  assert.equal(internalTops(lastLinks, firstPage).length, 1);
  assert.deepEqual(internalTops(lastLinks, lastPage), [bookmarkTop]);
  console.log(
    'PASS: multi-batch PDF, Chromium metadata, external links, bidirectional cross-batch element and rich-text span links (including entity-encoded, whitespace-padded and literal-percent hrefs) and lazy rich-text images',
  );
}
