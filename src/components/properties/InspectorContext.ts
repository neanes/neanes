import type {
  AnnotationElement,
  DropCapElement,
  ImageBoxElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';

export type InspectorContext =
  | { kind: 'none' }
  | { kind: 'annotation'; element: AnnotationElement }
  | {
      kind: 'text-box';
      element: TextBoxElement;
      source: 'score' | 'header-footer';
    }
  | {
      kind: 'rich-text-box';
      element: RichTextBoxElement;
      source: 'score' | 'header-footer';
    }
  | { kind: 'drop-cap'; element: DropCapElement }
  | { kind: 'image-box'; element: ImageBoxElement }
  | { kind: 'lyrics'; element: NoteElement }
  | { kind: 'mode-key'; element: ModeKeyElement }
  | { kind: 'neume'; element: NoteElement }
  | { kind: 'martyria'; element: MartyriaElement }
  | { kind: 'tempo'; element: TempoElement }
  | { kind: 'range'; elements: ScoreElement[] };
