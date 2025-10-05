import {
  AlternateLineElement,
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
import { PageSetup } from '@/models/PageSetup';
import { CommandFactory } from '@/services/history/CommandService';

const noteElementCommandFactory: CommandFactory<NoteElement> =
  new CommandFactory<NoteElement>();

const martyriaCommandFactory: CommandFactory<MartyriaElement> =
  new CommandFactory<MartyriaElement>();

const tempoCommandFactory: CommandFactory<TempoElement> =
  new CommandFactory<TempoElement>();

const annotationCommandFactory: CommandFactory<AnnotationElement> =
  new CommandFactory<AnnotationElement>();

const alternateLineCommandFactory: CommandFactory<AlternateLineElement> =
  new CommandFactory<AlternateLineElement>();

const textBoxCommandFactory: CommandFactory<TextBoxElement> =
  new CommandFactory<TextBoxElement>();

const richTextBoxCommandFactory: CommandFactory<RichTextBoxElement> =
  new CommandFactory<RichTextBoxElement>();

const imageBoxCommandFactory: CommandFactory<ImageBoxElement> =
  new CommandFactory<ImageBoxElement>();

const modeKeyCommandFactory: CommandFactory<ModeKeyElement> =
  new CommandFactory<ModeKeyElement>();

const dropCapCommandFactory: CommandFactory<DropCapElement> =
  new CommandFactory<DropCapElement>();

const scoreElementCommandFactory: CommandFactory<ScoreElement> =
  new CommandFactory<ScoreElement>();

const pageSetupCommandFactory: CommandFactory<PageSetup> =
  new CommandFactory<PageSetup>();

export function useCommandFactories() {
  return {
    noteElementCommandFactory,
    martyriaCommandFactory,
    tempoCommandFactory,
    annotationCommandFactory,
    alternateLineCommandFactory,
    textBoxCommandFactory,
    richTextBoxCommandFactory,
    imageBoxCommandFactory,
    modeKeyCommandFactory,
    dropCapCommandFactory,
    scoreElementCommandFactory,
    pageSetupCommandFactory,
  };
}
