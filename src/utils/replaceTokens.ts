export interface TokenMetadata {
  pageNumber: number;
  numberOfPages: number;
  fileName: string;
  filePath: string;
}

export function replaceTokens(path: string, metadata: TokenMetadata) {
  return path
    .replace('$p', metadata.pageNumber.toString())
    .replace('$n', metadata.numberOfPages.toString())
    .replace('$f', metadata.fileName)
    .replace('$F', metadata.filePath);
}
