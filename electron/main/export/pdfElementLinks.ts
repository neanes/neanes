import {
  PDFArray,
  PDFDict,
  type PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
} from 'pdf-lib';

export function resolvePdfElementLinks(document: PDFDocument, baseUrl: string) {
  const destinations = new Map<string, PDFArray>();
  const links: {
    annotations: PDFArray;
    index: number;
    annotation: PDFDict;
    role: string;
    targets: string[];
  }[] = [];
  for (const page of document.getPages()) {
    const annotations = page.node.Annots();
    if (!annotations) {
      continue;
    }
    // Collect in reverse order so removing markers later keeps indexes stable.
    for (let index = annotations.size() - 1; index >= 0; index--) {
      const annotation = annotations.lookup(index, PDFDict);
      const action = annotation.lookupMaybe(PDFName.of('A'), PDFDict);
      const uri = action
        ?.lookupMaybe(PDFName.of('URI'), PDFString, PDFHexString)
        ?.decodeText();
      if (!uri?.startsWith(baseUrl)) {
        continue;
      }
      // A target marks one ID; a source lists its candidate IDs in order.
      const [role, ...targets] = uri.slice(baseUrl.length).split('/');
      const [target] = targets;
      // Each batch marks the first element with an ID. Like a single-pass
      // export, links go to the first of those in document order.
      if (role === 'target' && !destinations.has(target)) {
        const rectangle = annotation.lookup(PDFName.of('Rect'), PDFArray);
        destinations.set(
          target,
          document.context.obj([
            page.ref,
            'XYZ',
            rectangle.lookup(0, PDFNumber),
            rectangle.lookup(3, PDFNumber),
            null,
          ]),
        );
      }
      links.push({
        annotations,
        index,
        annotation,
        role,
        targets,
      });
    }
  }
  for (const { annotations, index, annotation, role, targets } of links) {
    const destination = targets
      .map((target) => destinations.get(target))
      .find((candidate) => candidate !== undefined);
    if (role === 'source' && destination) {
      annotation.delete(PDFName.of('A'));
      annotation.set(PDFName.of('Dest'), destination);
    } else {
      annotations.remove(index);
    }
  }
}
