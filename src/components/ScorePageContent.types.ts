import type {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';

export interface ScorePageInteraction {
  isSelected(element: ScoreElement): boolean;
  isAudioSelected(element: ScoreElement): boolean;
  selectedLyrics: NoteElement | null;
  selectedHeaderFooterElement: ScoreElement | null;
  selectedAnnotationElement: AnnotationElement | null;
  selectedAlternateLineElement: AlternateLineElement | null;
  lyricsLocked: boolean;
}

// Explicit events preserve the editor's existing mutation and focus operations.
export interface ScorePageEvents {
  selectElement: [element: ScoreElement];
  selectLyrics: [element: NoteElement];
  selectHeaderFooter: [element: ScoreElement];
  selectHeaderRichTextBox: [pageIndex: number];
  selectFooterRichTextBox: [pageIndex: number];
  showPropertiesPaneForRichTextNeume: [];
  onScoreElementContextMenu: [element: ScoreElement];
  setSelectionRange: [element: ScoreElement];
  openSyllablePositioningDialog: [];
  openModeKeyDialog: [];
  focusLyrics: [index: number];
  updateLyrics: [element: NoteElement, lyrics: string];
  updateDropCapContent: [element: DropCapElement, content: string];
  updateTextBox: [element: TextBoxElement, updates: Partial<TextBoxElement>];
  updateTextBoxHeight: [element: TextBoxElement, height: number];
  updateRichTextBox: [
    element: RichTextBoxElement,
    updates: Partial<RichTextBoxElement>,
  ];
  updateRichTextBoxHeight: [element: RichTextBoxElement, height: number];
  updateAnnotation: [
    element: AnnotationElement,
    updates: Partial<AnnotationElement>,
  ];
  removeAnnotation: [
    parent: NoteElement,
    annotation: AnnotationElement,
    noHistory: boolean,
  ];
  setSelectedAnnotation: [parent: ScoreElement, annotation: AnnotationElement];
  updateAlternateLine: [
    element: AlternateLineElement,
    updates: Partial<AlternateLineElement>,
  ];
  setSelectedAlternateLine: [
    parent: ScoreElement,
    element: AlternateLineElement,
  ];
  resizeImage: [size: { width: number; height: number }];
}

export type ScorePageHandlers = {
  [Event in keyof ScorePageEvents]: (...args: ScorePageEvents[Event]) => void;
};
