import type { ScoreElement } from '@/models/Element';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import {
  type Command,
  CommandFactory,
} from '@/services/history/CommandService';
import { deepEquals } from '@/utils/deepEquals';
import {
  getModeKeyStyleReferenceChanges,
  getScoreModeKeyHosts,
} from '@/utils/modeKeyStyleReferences';

export interface InitialMartyriaStyleUpdate {
  styles: InitialMartyriaStyle[];
  defaultStyleId: string;
  replacements: Record<string, string>;
}

export function replaceInitialMartyriaStyles(
  workspace: Workspace,
  payload: InitialMartyriaStyleUpdate,
) {
  const { score } = workspace;
  const nextStyleIds = new Set(payload.styles.map((style) => style.id));
  // A mode key of a deleted style takes the style chosen in its place. A
  // reference that resolves to no style at all follows the default again.
  const nextModeKeyStyleId = (styleId: string) =>
    Object.hasOwn(payload.replacements, styleId)
      ? payload.replacements[styleId]
      : nextStyleIds.has(styleId)
        ? styleId
        : null;
  const commands: Command[] = [];

  const scoreValues: Partial<Score> = {};
  if (!deepEquals(score.initialMartyriaStyles, payload.styles)) {
    scoreValues.initialMartyriaStyles = payload.styles;
  }
  if (payload.defaultStyleId !== score.defaultInitialMartyriaStyleId) {
    scoreValues.defaultInitialMartyriaStyleId = payload.defaultStyleId;
  }
  if (Object.keys(scoreValues).length > 0) {
    commands.push(
      new CommandFactory<Score>().create('update-properties', {
        target: score,
        newValues: scoreValues,
      }),
    );
  }

  for (const element of getScoreModeKeyHosts(score)) {
    const newValues = getModeKeyStyleReferenceChanges(
      element,
      nextModeKeyStyleId,
    );
    if (newValues != null) {
      commands.push(
        new CommandFactory<ScoreElement>().create('update-properties', {
          target: element,
          newValues,
        }),
      );
    }
  }

  if (commands.length === 0) {
    return false;
  }

  workspace.commandService.executeAsBatch(commands);
  return true;
}
