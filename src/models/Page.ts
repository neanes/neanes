import type { ScoreElement } from '@/models/Element';
import { ElementType } from '@/models/Element';
import type { LineLayoutDiagnostics } from '@/models/LayoutDiagnostics';

export interface PageFootnote {
  id: string;
  number: number;
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

  // A page is empty if it contains only one line
  // and the line is empty
  public get isEmpty() {
    return this.lines.length === 1 && this.lines[0].isEmpty;
  }
}

export class Line {
  public footnoteId: string | null = null;
  public elements: ScoreElement[] = [];
  public paragraphEnd: boolean = false;
  public indentation = 0;
  public adjustmentRatio: number | null = null;
  public diagnostics: LineLayoutDiagnostics | null = null;

  // A line is empty if it contains only the empty element
  public get isEmpty() {
    return (
      this.elements.length === 1 &&
      this.elements[0].elementType === ElementType.Empty
    );
  }
}
