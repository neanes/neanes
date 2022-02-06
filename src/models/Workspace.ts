import { CommandService } from '@/services/history/CommandService';
import { NoteElement, ScoreElement } from './Element';
import { Score } from './Score';
import { ScoreElementSelectionRange } from './ScoreElementSelectionRange';
import { EntryMode } from '@/models/EntryMode';

export class Workspace {
  public score: Score = new Score();
  public filePath: string | null = null;
  public tempFileName: string = '';
  public hasUnsavedChanges: boolean = false;
  public commandService: CommandService = new CommandService();
  public selectedElement: ScoreElement | null = null;
  public selectedLyrics: NoteElement | null = null;
  public selectionRange: ScoreElementSelectionRange | null = null;
  public zoom: number = 1;
  public zoomToFit: boolean = false;
  public entryMode: EntryMode = EntryMode.Auto;
  public scrollLeft: number = 0;
  public scrollTop: number = 0;
}
