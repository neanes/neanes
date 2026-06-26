import { v4 as uuidv4 } from 'uuid';

import { EntryMode } from '@/models/EntryMode';
import { CommandService } from '@/services/history/CommandService';

import type {
  AlternateLineElement,
  AnnotationElement,
  NoteElement,
  ScoreElement,
} from './Element';
import { Score } from './Score';
import type { ScoreElementSelectionRange } from './ScoreElementSelectionRange';

export type ZoomFitMode = 'page-width' | 'text-width' | 'whole-page';

const ZOOM_MIN_BOUNDARY = 0.05;
const ZOOM_MAX_BOUNDARY = 40;

function integerRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function generateZoomLevels() {
  // A binary ladder around 100%, with 3:2 intermediate stops at larger sizes.
  const powersOfTwo = integerRange(-3, 5).map((exponent) => 2 ** exponent);
  const threeToTwoStops = integerRange(-1, 4).map(
    (exponent) => 1.5 * 2 ** exponent,
  );

  return [
    ZOOM_MIN_BOUNDARY,
    ...powersOfTwo,
    ...threeToTwoStops,
    ZOOM_MAX_BOUNDARY,
  ]
    .sort((a, b) => a - b)
    .filter((zoom, index, zooms) => zoom !== zooms[index - 1]);
}

function formatNumber(value: number) {
  const roundedValue = Math.round(value * 10) / 10;

  return Number.isInteger(roundedValue)
    ? roundedValue.toFixed(0)
    : roundedValue.toFixed(1);
}

export const ZOOM_LEVELS = generateZoomLevels();
export const MIN_ZOOM = ZOOM_LEVELS[0];
export const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

export function formatZoomPercent(zoom: number) {
  return `${formatNumber(zoom * 100)}%`;
}

export class Workspace {
  public id: string = uuidv4();
  public score: Score = new Score();
  public filePath: string | null = null;
  public tempFileName: string = '';
  public hasUnsavedChanges: boolean = false;
  public commandService: CommandService = new CommandService();
  public selectedElement: ScoreElement | null = null;
  public selectedAnnotationElement: AnnotationElement | null = null;
  public selectedAlternateLineElement: AlternateLineElement | null = null;
  public selectedHeaderFooterElement: ScoreElement | null = null;
  public selectedLyrics: NoteElement | null = null;
  public selectionRange: ScoreElementSelectionRange | null = null;
  public zoom: number = 1;
  public zoomFitMode: ZoomFitMode | null = null;
  public entryMode: EntryMode = EntryMode.Auto;
  public scrollLeft: number = 0;
  public scrollTop: number = 0;
  public playbackTime: number = 0;
  public playbackBpm: number = 0;

  private _nextId: number | null = null;

  public get nextId(): number {
    // If the next ID has never been calcualted, calculate it.
    if (this._nextId == null) {
      let maxId = 0;

      for (const element of this.score.staff.elements) {
        if (element.id != null && element.id > maxId) {
          maxId = element.id;
        }
      }

      this._nextId = maxId + 1;
    }

    // return the ID and increment the next ID so we are ready for the next element
    return this._nextId++;
  }
}

export interface WorkspaceLocalStorage {
  id: string;
  score: string;
  filePath: string | null;
  tempFileName: string;
  hasUnsavedChanges: boolean;
}
