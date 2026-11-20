import { rewriteModeKeyAttributesInHtml } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  ElementType,
  type ModeKeyElement,
  RICH_TEXT_BOX_CONTENT_KEYS,
  type RichTextBoxElement,
} from '@/models/Element';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import {
  type Command,
  CommandFactory,
} from '@/services/history/CommandService';
import { deepEquals } from '@/utils/deepEquals';

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
  const nextModeKeyStyleId = (styleId: string | null) =>
    styleId == null
      ? null
      : Object.hasOwn(payload.replacements, styleId)
        ? payload.replacements[styleId]
        : nextStyleIds.has(styleId)
          ? styleId
          : null;
  const commands: Command[] = [];

  if (!deepEquals(score.initialMartyriaStyles, payload.styles)) {
    commands.push(
      new CommandFactory<Score>().create('update-properties', {
        target: score,
        newValues: { initialMartyriaStyles: payload.styles },
      }),
    );
  }

  if (payload.defaultStyleId !== score.pageSetup.initialMartyriaStyleId) {
    commands.push(
      new CommandFactory<PageSetup>().create('update-properties', {
        target: score.pageSetup,
        newValues: { initialMartyriaStyleId: payload.defaultStyleId },
      }),
    );
  }

  const staffElements = score.staves.flatMap((staff) => staff.elements);

  for (const item of staffElements) {
    if (item.elementType !== ElementType.ModeKey) {
      continue;
    }
    const modeKey = item as ModeKeyElement;
    const styleId = nextModeKeyStyleId(modeKey.initialMartyriaStyleId);
    if (styleId !== modeKey.initialMartyriaStyleId) {
      commands.push(
        new CommandFactory<ModeKeyElement>().create('update-properties', {
          target: modeKey,
          newValues: { initialMartyriaStyleId: styleId },
        }),
      );
    }
  }

  for (const item of [...staffElements, ...score.headersAndFooters]) {
    if (item.elementType !== ElementType.RichTextBox) {
      continue;
    }

    const richTextBox = item as RichTextBoxElement;
    const newValues: Partial<RichTextBoxElement> = {};

    for (const key of RICH_TEXT_BOX_CONTENT_KEYS) {
      const content = richTextBox[key];
      const rewritten = rewriteModeKeyAttributesInHtml(
        content,
        (attributes) => {
          const styleId = attributes.initialMartyriaStyleId;
          if (typeof styleId !== 'string') {
            return attributes;
          }
          const nextStyleId = nextModeKeyStyleId(styleId);

          return nextStyleId === styleId
            ? attributes
            : { ...attributes, initialMartyriaStyleId: nextStyleId };
        },
      );

      if (rewritten !== content) {
        newValues[key] = rewritten;
      }
    }

    if (Object.keys(newValues).length > 0) {
      commands.push(
        new CommandFactory<RichTextBoxElement>().create('update-properties', {
          target: richTextBox,
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
