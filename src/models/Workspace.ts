import { v4 as uuidv4 } from 'uuid';

import { EntryMode } from '@/models/EntryMode';
import { CommandService } from '@/services/history/CommandService';

import { NoteElement, ScoreElement } from './Element';
import { Score } from './Score';
import { ScoreElementSelectionRange } from './ScoreElementSelectionRange';

export class Workspace {
  public id: string = uuidv4();
  public score: Score = new Score();
  public filePath: string | null = null;
  public tempFileName: string = '';
  public hasUnsavedChanges: boolean = false;
  public commandService: CommandService = new CommandService();
  public selectedElement: ScoreElement | null = null;
  public selectedHeaderFooterElement: ScoreElement | null = null;
  public selectedLyrics: NoteElement | null = null;
  public selectionRange: ScoreElementSelectionRange | null = null;
  public zoom: number = 1;
  public zoomToFit: boolean = false;
  public entryMode: EntryMode = EntryMode.Auto;
  public scrollLeft: number = 0;
  public scrollTop: number = 0;
  public playbackTime: number = 0;
  public playbackBpm: number = 0;
  public lyricManagerIsOpen: boolean = false;

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
