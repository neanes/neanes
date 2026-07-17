import type {
  RichTextBoxElement,
  RichTextBoxFragment,
  ScoreElement,
} from '@/models/Element';
import { ElementType } from '@/models/Element';
import type { LineLayoutDiagnostics } from '@/models/LayoutDiagnostics';

export class Page {
  public lines: Line[] = [];

  public physicalPageNumber = 1;

  public isVisible: boolean = false;

  // A page is empty if it has no lines or contains only one empty line.
  public get isEmpty() {
    return (
      this.lines.length === 0 ||
      (this.lines.length === 1 && this.lines[0].isEmpty)
    );
  }
}

export class Line {
  public elements: ScoreElement[] = [];
  public indentation = 0;
  public adjustmentRatio: number | null = null;
  public diagnostics: LineLayoutDiagnostics | null = null;

  // When a rich text box flows across pages, each page-sized slice occupies
  // its own line. For the origin slice the box itself lives in `elements`;
  // continuation slices keep a reference here instead of duplicating the box
  // across pages.
  public richTextFragment: RichTextLineFragment | null = null;

  // A line is empty if it contains only the empty element
  public get isEmpty() {
    return (
      this.elements.length === 1 &&
      this.elements[0].elementType === ElementType.Empty
    );
  }
}

export interface RichTextLineFragment {
  element: RichTextBoxElement;
  fragment: RichTextBoxFragment;
}
