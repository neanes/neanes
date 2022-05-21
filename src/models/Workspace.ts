import { CommandService } from '@/services/history/CommandService';
import { NoteElement, ScoreElement } from './Element';
import { Score } from './Score';
import { ScoreElementSelectionRange } from './ScoreElementSelectionRange';
import { EntryMode } from '@/models/EntryMode';
import { v4 as uuidv4 } from 'uuid';

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
}

export interface WorkspaceLocalStorage {
  id: string;
  score: string;
  filePath: string | null;
  tempFileName: string;
  hasUnsavedChanges: boolean;
}
