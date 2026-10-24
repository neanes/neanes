import type { BrowserWindow } from 'electron';
import { imageSize } from 'image-size';

import {
  PREVIEW_MAX_BYTES,
  type PreviewImage,
  previewImageSchema,
  type PreviewPageResult,
  previewPageResultSchema,
} from '../../../src/automation/contracts/preview';
import type { ScoreRenderSnapshot } from '../../../src/services/rendering/scoreRenderSnapshot';
import { renderSnapshot } from '../export/renderSnapshot';

export interface PreviewPageOptions {
  snapshot: ScoreRenderSnapshot;
  pageNumber: number;
  maxEdge: number;
}

export async function renderPagePreview(options: {
  args: PreviewPageOptions;
  parent?: BrowserWindow;
  preload: string;
  entry: string;
  devServerUrl?: string;
  signal: AbortSignal;
}): Promise<PreviewPageResult> {
  let image: PreviewImage | undefined;
  const result = await renderSnapshot({
    ...options,
    snapshot: options.args.snapshot,
    png: {
      dpi: 192,
      maxEdge: options.args.maxEdge,
      pageNumbers: [options.args.pageNumber],
      transparentBackground: false,
    },
    writeImage: async (pageNumber, imageData, signal) => {
      signal.throwIfAborted();
      if (image !== undefined || pageNumber !== options.args.pageNumber) {
        throw new Error('EXPORT_RENDER_FAILED: Unexpected preview page');
      }
      if (imageData.length > 4 * Math.ceil(PREVIEW_MAX_BYTES / 3)) {
        throw new Error(
          'EXPORT_RENDER_FAILED: Preview exceeds 4 MiB; request a smaller maxEdge',
        );
      }
      const data = Buffer.from(imageData, 'base64');
      if (data.length > PREVIEW_MAX_BYTES) {
        throw new Error(
          'EXPORT_RENDER_FAILED: Preview exceeds 4 MiB; request a smaller maxEdge',
        );
      }
      const size = imageSize(data);
      if (
        size.type !== 'png' ||
        Math.max(size.width, size.height) > options.args.maxEdge
      ) {
        throw new Error(
          'EXPORT_RENDER_FAILED: Invalid preview dimensions or format',
        );
      }
      image = previewImageSchema.parse({
        imageData,
        width: size.width,
        height: size.height,
      });
      return true;
    },
    complete: async (_window, result) => {
      options.signal.throwIfAborted();
      return { image, pageCount: result.pageCount };
    },
  });
  if (options.args.pageNumber > result.pageCount) {
    throw new Error('INVALID_PAGE_NUMBER');
  }
  if (result.image === undefined) {
    throw new Error('EXPORT_RENDER_FAILED: Preview image was not returned');
  }
  return previewPageResultSchema.parse({
    ...result.image,
    pageCount: result.pageCount,
  });
}
