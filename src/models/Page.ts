import type { ScoreElement } from '@/models/Element';
import type { LineLayoutDiagnostics } from '@/models/LayoutDiagnostics';

export interface PageFootnote {
  id: string;
  number: number | null;
  marker: string;
  reference: ScoreElement;
  lines: Line[];
  top: number;
  height: number;
  labelX: number;
}

export class Page {
  public lines: Line[] = [];
  public footnotes: PageFootnote[] = [];
  public footnoteRuleTop: number | null = null;
  public footnoteRuleThickness = 0;
  public footnoteOverflow = false;
  public footnoteOverflowBottom = 0;

  // Rendering can visit all content while musical postprocessing stays scoped.
  public get allLines() {
    return [
      ...this.lines,
      ...this.footnotes.flatMap((footnote) => footnote.lines),
    ];
  }

  public physicalPageNumber = 1;

  public isVisible: boolean = false;
}

export class Line {
  public footnoteId: string | null = null;
  public elements: ScoreElement[] = [];
  public paragraphEnd: boolean = false;
  public indentation = 0;
  public adjustmentRatio: number | null = null;
  public diagnostics: LineLayoutDiagnostics | null = null;
}
