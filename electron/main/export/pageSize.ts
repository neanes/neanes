import type { PageSize } from '../../../src/models/PageSetup';

export function getPageSize(pageSize: PageSize, width: number, height: number) {
  switch (pageSize) {
    case 'Half-Legal':
      return {
        width: 7,
        height: 8.5,
      };
    case 'Half-Letter':
      return {
        width: 5.5,
        height: 8.5,
      };
    case 'Custom':
      return {
        width,
        height,
      };
    default:
      return pageSize;
  }
}

export function getNativePrintPageSize(args: {
  pageSize: PageSize;
  pageWidthInches: number;
  pageHeightInches: number;
}) {
  const size = getPageSize(
    args.pageSize,
    args.pageWidthInches,
    args.pageHeightInches,
  );
  return typeof size === 'string'
    ? size
    : {
        width: Math.round(size.width * 25400),
        height: Math.round(size.height * 25400),
      };
}
