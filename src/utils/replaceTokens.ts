import { TextBoxAlignment } from '@/models/Element';

export interface TokenMetadata {
  pageNumber: number;
  numberOfPages: number;
  fileName: string;
  filePath: string;
  numerals: 'westernArabic' | 'easternArabic';
  title: string;
  author: string;
  chapter: string;
  section: string;
}

export type TokenScope = 'body' | 'header' | 'footer';

const easternArabicNumerals = [
  '٠',
  '١',
  '٢',
  '٣',
  '٤',
  '٥',
  '٦',
  '٧',
  '٨',
  '٩',
];

function formatNumber(
  value: number,
  numerals: 'westernArabic' | 'easternArabic',
) {
  const text = value.toString();

  if (numerals !== 'easternArabic') {
    return text;
  }

  return text.replace(
    /[0-9]/g,
    (digit) => easternArabicNumerals[Number(digit)],
  );
}

export function replaceTokens(
  text: string,
  metadata: TokenMetadata,
  alignment: TextBoxAlignment,
) {
  let pageNumber =
    metadata.pageNumber > 0
      ? formatNumber(metadata.pageNumber, metadata.numerals)
      : '';

  // This is a hack to add in an extra space
  // if the page number is less than the length of
  // the replacement token $p. The extra space helps
  // keep the position of other text in the text box
  // in the correct place.
  if (pageNumber !== '' && pageNumber.length < 2) {
    if (alignment === TextBoxAlignment.Left) {
      pageNumber += ' ';
    } else if (alignment === TextBoxAlignment.Right) {
      pageNumber = ' ' + pageNumber;
    }
  }

  return text
    .replace(/\$:author/g, metadata.author)
    .replace(/\$:title/g, metadata.title)
    .replace(/\$:chapter/g, metadata.chapter)
    .replace(/\$:section/g, metadata.section)
    .replace(/\$p/g, pageNumber)
    .replace(/\$n/g, formatNumber(metadata.numberOfPages, metadata.numerals))
    .replace(/\$f/g, metadata.fileName)
    .replace(/\$F/g, metadata.filePath);
}
