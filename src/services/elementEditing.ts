import type { MartyriaElement, NoteElement } from '@/models/Element';
import { getDefaultChromaticFthoraNote } from '@/models/NeumeReplacements';
import type { Fthora } from '@/models/Neumes';
import { CompositeCommand } from '@/services/history/commands/CompositeCommand';
import type { StateEdit } from '@/services/history/commands/StateEditCommand';
import { StateEditCommand } from '@/services/history/commands/StateEditCommand';
import type { UpdatePropertiesCommandArgs } from '@/services/history/commands/UpdatePropertiesCommand';
import { UpdatePropertiesCommand } from '@/services/history/commands/UpdatePropertiesCommand';
import type { Command } from '@/services/history/CommandService';

// Only notation edits capture notation. Lyrics, formatting, and collections keep
// their ordinary property commands so undo does not overwrite unrelated edits.
function createNotationUpdateCommand<
  T extends object,
  State extends Partial<T>,
>(
  { target, newValues }: UpdatePropertiesCommandArgs<T>,
  notation: Pick<StateEdit<State>, 'capture' | 'restore'>,
): Command {
  const notationState = notation.capture();
  const notationValues: Partial<T> = {};
  const ordinaryValues: Partial<T> = {};
  for (const key of Object.keys(newValues) as (keyof T)[]) {
    const values = Object.hasOwn(notationState, key)
      ? notationValues
      : ordinaryValues;
    values[key] = newValues[key];
  }

  const commands: Command[] = [];
  if (Object.keys(notationValues).length > 0) {
    commands.push(
      new StateEditCommand({
        ...notation,
        apply: () => {
          for (const key of Object.keys(notationValues) as (keyof T)[]) {
            if (!Object.is(target[key], notationValues[key])) {
              target[key] = notationValues[key]!;
            }
          }
        },
        equals: (left, right) =>
          (Object.keys(left) as (keyof State)[]).every((key) =>
            Object.is(left[key], right[key]),
          ),
      }),
    );
  }
  if (Object.keys(ordinaryValues).length > 0) {
    commands.push(
      new UpdatePropertiesCommand({ target, newValues: ordinaryValues }),
    );
  }
  return new CompositeCommand(commands);
}

export function createNoteUpdateCommand(
  args: UpdatePropertiesCommandArgs<NoteElement>,
): Command {
  return createNotationUpdateCommand(args, {
    capture: () => args.target.captureNotationState(),
    restore: (state) => args.target.restoreNotationState(state),
  });
}

export function createMartyriaUpdateCommand(
  args: UpdatePropertiesCommandArgs<MartyriaElement>,
): Command {
  return createNotationUpdateCommand(args, {
    capture: () => args.target.captureNotationState(),
    restore: (state) => args.target.restoreNotationState(state),
  });
}

export const fthoraInterpretationKeys = {
  fthora: 'chromaticFthoraNote',
  secondaryFthora: 'secondaryChromaticFthoraNote',
  tertiaryFthora: 'tertiaryChromaticFthoraNote',
  quantitativeNeumeFthora: 'quantitativeNeumeChromaticFthoraNote',
} as const;

type FthoraKey = keyof typeof fthoraInterpretationKeys;
type FthoraChange<K extends FthoraKey> = Pick<
  NoteElement & MartyriaElement,
  K | (typeof fthoraInterpretationKeys)[K]
>;

// Selecting a fthora also selects its default interpretation. Callers decide
// whether this is a selection or a partial update that preserves an override.
export function getFthoraChange<K extends FthoraKey>(
  key: K,
  fthora: Fthora | null,
): FthoraChange<K> {
  return {
    [key]: fthora,
    [fthoraInterpretationKeys[key]]: getDefaultChromaticFthoraNote(fthora),
  } as FthoraChange<K>;
}

// Changing alignment clears the attached quantitative neume in either direction.
export function getMartyriaAlignmentChange(
  current: boolean,
  alignRight: boolean,
): Partial<MartyriaElement> {
  return current === alignRight
    ? { alignRight }
    : { alignRight, quantitativeNeume: null };
}
