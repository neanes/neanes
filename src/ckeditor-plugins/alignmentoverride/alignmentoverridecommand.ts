import type { Batch, ModelElement, ModelWriter } from 'ckeditor5';
import { Command } from 'ckeditor5';

import { ALIGNMENT_OVERRIDE_MIXED_VALUE } from '@/utils/alignmentOverride';

export const ALIGNMENT_OVERRIDE = 'alignmentOverride';

const ALIGNMENT_VALUES = ['left', 'center', 'right', 'justify'] as const;

export type AlignmentOverrideValue = (typeof ALIGNMENT_VALUES)[number];

function isAlignmentOverrideValue(
  value: unknown,
): value is AlignmentOverrideValue {
  return typeof value === 'string' && ALIGNMENT_VALUES.includes(value as never);
}

export class AlignmentOverrideCommand extends Command {
  declare public value:
    | AlignmentOverrideValue
    | typeof ALIGNMENT_OVERRIDE_MIXED_VALUE
    | undefined;

  public override refresh(): void {
    const selection = this.editor.model.document.selection;
    const selectedBlocks = Array.from(selection.getSelectedBlocks());
    const schema = this.editor.model.schema;
    const executableBlocks = selectedBlocks.filter((block) =>
      schema.checkAttribute(block, ALIGNMENT_OVERRIDE),
    );
    const explicitValues = new Set<AlignmentOverrideValue>();
    let explicitBlockCount = 0;

    for (const block of executableBlocks) {
      const value = block.getAttribute(ALIGNMENT_OVERRIDE);

      if (isAlignmentOverrideValue(value)) {
        explicitValues.add(value);
        explicitBlockCount += 1;
      }
    }

    if (executableBlocks.length === 0) {
      this.value = undefined;
    } else if (
      explicitBlockCount === executableBlocks.length &&
      explicitValues.size === 1
    ) {
      this.value = [...explicitValues][0];
    } else if (explicitBlockCount > 0) {
      this.value = ALIGNMENT_OVERRIDE_MIXED_VALUE;
    } else {
      this.value = undefined;
    }

    this.isEnabled = selectedBlocks[0]
      ? schema.checkAttribute(selectedBlocks[0], ALIGNMENT_OVERRIDE)
      : false;
  }

  public override execute(
    options: { value?: AlignmentOverrideValue; batch?: Batch } = {},
  ): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const schema = model.schema;
    const value = options.value;
    const batch = options.batch;

    const updateAttribute = (writer: ModelWriter) => {
      for (const block of selection.getSelectedBlocks()) {
        if (!schema.checkAttribute(block, ALIGNMENT_OVERRIDE)) {
          continue;
        }

        if (isAlignmentOverrideValue(value)) {
          writer.setAttribute(ALIGNMENT_OVERRIDE, value, block as ModelElement);
        } else {
          writer.removeAttribute(ALIGNMENT_OVERRIDE, block as ModelElement);
        }
      }
    };

    if (batch) {
      model.enqueueChange(batch, updateAttribute);
    } else {
      model.change(updateAttribute);
    }
  }
}
