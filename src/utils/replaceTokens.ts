import { TextBoxAlignment } from '@/models/Element';

export interface TokenMetadata {
  pageNumber: number;
  numberOfPages: number;
  fileName: string;
  filePath: string;
}

export function replaceTokens(
  text: string,
  metadata: TokenMetadata,
  alignment: TextBoxAlignment,
) {
  let pageNumber = metadata.pageNumber.toString();

  // This is a hack to add in an extra space
  // if the page number is less than the length of
  // the replacement token $p. The extra space helps
  // keep the position of other text in the text box
  // in the correct place.
  if (pageNumber.length < 2) {
    if (alignment === TextBoxAlignment.Left) {
      pageNumber += ' ';
    } else if (alignment === TextBoxAlignment.Right) {
      pageNumber = ' ' + pageNumber;
    }
  }

  return text
    .replace(/\$p/g, pageNumber)
    .replace(/\$n/g, metadata.numberOfPages.toString())
    .replace(/\$f/g, metadata.fileName)
    .replace(/\$F/g, metadata.filePath);
}
