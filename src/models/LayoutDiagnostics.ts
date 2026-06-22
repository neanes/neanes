import type { ElementType } from './Element';

export type LayoutDiagnosticItemType = 'box' | 'glue' | 'penalty';

export interface LayoutDiagnosticItem {
  anonymous: boolean;
  cost?: number;
  flagged?: boolean;
  infinitePenalty?: boolean;
  forcedBreak?: boolean;
  label?: string;
  ownerElementId: number | null;
  ownerElementIndex: number | null;
  ownerElementType: ElementType | null;
  shrink?: number;
  stretch?: number;
  type: LayoutDiagnosticItemType;
  width: number;
}

export interface LayoutDiagnosticItemGroup {
  anonymous: boolean;
  items: LayoutDiagnosticItem[];
  ownerElementId: number | null;
  ownerElementIndex: number | null;
  ownerElementType: ElementType | null;
}

export interface ElementOverlayBox {
  height: number;
  kind?: string;
  left: number;
  top: number;
  width: number;
}

export interface ElementOverlayDiagnostics {
  advanceBox: ElementOverlayBox | null;
  collisionBoxes: ElementOverlayBox[];
  glyph: string | null;
  inkBox: ElementOverlayBox | null;
  leftProjection: number | null;
  leftTuck: number | null;
  lyricBox: ElementOverlayBox | null;
  rightProjection: number | null;
  rightTuck: number | null;
  rootNeume: string | null;
}

export interface GlueOverlayDiagnostics {
  actualWidth: number;
  anonymous: boolean;
  label?: string;
  left: number;
  ownerElementId: number | null;
  ownerElementIndex: number | null;
  ownerElementType: ElementType | null;
  preferredWidth: number;
  shrink: number;
  stretch: number;
}

export interface LineLayoutDiagnostics {
  actualContentWidth: number;
  adjustmentRatio: number;
  glueOverlays: GlueOverlayDiagnostics[];
  itemGroups: LayoutDiagnosticItemGroup[];
  naturalContentWidth: number;
  paragraphIndex: number;
  paragraphLineIndex: number;
  recomputedBadness: number | null;
  shrinkUsed: number;
  stretchUsed: number;
  targetWidth: number;
}

export interface LayoutDiagnosticsOptions {
  collectDiagnostics?: boolean;
}
