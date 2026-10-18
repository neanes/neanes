import type { BrowserWindow } from 'electron';
import { imageSize } from 'image-size';

import {
  PREVIEW_MAX_BYTES,
  type PreviewImage,
  previewImageSchema,
} from '../../../src/automation/contracts/preview';
import type { ScoreRenderSnapshot } from '../../../src/services/documents/scoreRenderSnapshot';
import { renderSnapshot } from '../export/renderSnapshot';

export interface PreviewPageOptions {
  snapshot: ScoreRenderSnapshot;
  pageNumber: number;
  maxEdge: number;
  expectedGeometry: string;
}

export async function renderPagePreview(options: {
  args: PreviewPageOptions;
  parent?: BrowserWindow;
  preload: string;
  entry: string;
  devServerUrl?: string;
  signal: AbortSignal;
}): Promise<PreviewImage> {
  let image: PreviewImage | undefined;
  return renderSnapshot({
    ...options,
    snapshot: options.args.snapshot,
    png: {
      dpi: 192,
      maxEdge: options.args.maxEdge,
      expectedGeometry: options.args.expectedGeometry,
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
    complete: async () => {
      options.signal.throwIfAborted();
      if (image === undefined) {
        throw new Error('INVALID_PAGE_NUMBER');
      }
      return image;
    },
  });
}
