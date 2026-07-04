import type {
  Batch,
  Editor,
  ModelElement,
  ModelRange,
  ModelWriter,
} from 'ckeditor5';
import { Command, ModelDocumentSelection } from 'ckeditor5';

import { fontCatalog } from '@/services/FontCatalog';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import {
  firstFontFamilyToken,
  toRichTextFontFamilyModelValue,
} from '@/utils/fontFamily';
import type { StyleAxis } from '@/utils/fontStyleAxes';
import {
  fontStyleNeedsExplicitFamily,
  parseStyleAxes,
  resolveAxisToggle,
} from '@/utils/fontStyleAxes';

export const FONT_STYLE = 'fontStyle';
export const FONT_STYLE_TOGGLE_BOLD = 'fontStyleToggleBold';
export const FONT_STYLE_TOGGLE_ITALIC = 'fontStyleToggleItalic';

const FONT_FAMILY = 'fontFamily';

type ResolvedParagraphStyleFallback = {
  fontFamily: string;
  fontStyle: string;
};

// The family whose styles the Bold/Italic shortcuts and the style list
// operate against: the explicit fontFamily on the selection, the resolved
// paragraph style's family, or the text box's default family when neither is
// set (so default-font text can still be bolded).
function effectiveFamily(
  editor: Editor,
  fallback?: ResolvedParagraphStyleFallback | null,
): string | null {
  const family = editor.model.document.selection.getAttribute(FONT_FAMILY) as
    | string
    | undefined;

  if (family != null && family.trim() !== '') {
    return firstFontFamilyToken(family);
  }

  const resolvedFallback = fallback?.fontFamily;

  if (resolvedFallback != null && resolvedFallback.trim() !== '') {
    return firstFontFamilyToken(resolvedFallback);
  }

  const defaultFamily = editor.config.get('insertNeume.defaultFontFamily') as
    | string
    | undefined;

  return defaultFamily != null && defaultFamily.trim() !== ''
    ? firstFontFamilyToken(defaultFamily)
    : null;
}

function effectiveFontStyle(
  editor: Editor,
  fallback?: ResolvedParagraphStyleFallback | null,
): string {
  const selection = editor.model.document.selection;
  const fontStyle = selection.getAttribute(FONT_STYLE) as string | undefined;

  if (fontStyle != null && fontStyle.trim() !== '') {
    return fontStyle;
  }

  const resolvedFallback = fallback?.fontStyle;

  if (resolvedFallback != null && resolvedFallback.trim() !== '') {
    return resolvedFallback;
  }

  return DEFAULT_FONT_STYLE;
}

function hasExplicitFamily(editor: Editor): boolean {
  const family = editor.model.document.selection.getAttribute(FONT_FAMILY) as
    | string
    | undefined;

  return family != null && family.trim() !== '';
}

// Sets the fontStyle attribute on the selection (or removes it when empty).
export class FontStyleCommand extends Command {
  declare public value: string | undefined;

  public override refresh(): void {
    const selection = this.editor.model.document.selection;

    this.value = selection.getAttribute(FONT_STYLE) as string | undefined;
    this.isEnabled = this.editor.model.schema.checkAttributeInSelection(
      selection,
      FONT_STYLE,
    );
  }

  public override execute(
    options: { value?: string; batch?: Batch } = {},
  ): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const value = options.value;
    const batch = options.batch;

    const updateAttribute = (writer: ModelWriter) => {
      if (selection.isCollapsed) {
        if (value) {
          writer.setSelectionAttribute(FONT_STYLE, value);
        } else {
          writer.removeSelectionAttribute(FONT_STYLE);
        }
      } else {
        const ranges = model.schema.getValidRanges(
          selection.getRanges(),
          FONT_STYLE,
          { includeEmptyRanges: true },
        );

        for (const range of ranges) {
          // An empty range (e.g. an empty block inside the selection) cannot hold
          // a text attribute, so pin the style on its parent element via the
          // selection store key, matching CKEditor's built-in FontCommand. Text
          // typed there then inherits the style.
          let itemOrRange: ModelRange | ModelElement = range;
          let attributeKey = FONT_STYLE;

          if (range.isCollapsed) {
            itemOrRange = range.start.parent as ModelElement;
            attributeKey =
              ModelDocumentSelection._getStoreAttributeKey(FONT_STYLE);
          }

          if (value) {
            writer.setAttribute(attributeKey, value, itemOrRange);
          } else {
            writer.removeAttribute(attributeKey, itemOrRange);
          }
        }
      }
    };

    // An optional caller-supplied batch folds this change into a single undo
    // step (e.g. a live preview), matching CKEditor's built-in FontCommand.
    if (batch) {
      model.enqueueChange(batch, updateAttribute);
    } else {
      model.change(updateAttribute);
    }
  }
}

// Toggles the bold or italic axis of the current font style, switching to the
// matching face when it exists. Disabled when the family has no such face.
export class FontStyleToggleCommand extends Command {
  declare public value: boolean;

  private readonly axis: StyleAxis;
  private target: string | null = null;
  private resolvedParagraphStyleFallback: ResolvedParagraphStyleFallback | null =
    null;

  constructor(editor: Editor, axis: StyleAxis) {
    super(editor);
    this.axis = axis;
  }

  public setResolvedParagraphStyleFallback(
    fallback: ResolvedParagraphStyleFallback | null,
  ) {
    this.resolvedParagraphStyleFallback = fallback;
  }

  public override refresh(): void {
    const selection = this.editor.model.document.selection;
    const fontStyle = effectiveFontStyle(
      this.editor,
      this.resolvedParagraphStyleFallback,
    );

    const family = effectiveFamily(
      this.editor,
      this.resolvedParagraphStyleFallback,
    );
    const available = family
      ? fontCatalog.getStyles(family)
      : [DEFAULT_FONT_STYLE, 'Bold', 'Italic', 'Bold Italic'];

    this.target = resolveAxisToggle(fontStyle, this.axis, available);
    this.value = parseStyleAxes(fontStyle)[this.axis];
    this.isEnabled =
      this.target != null &&
      this.editor.model.schema.checkAttributeInSelection(selection, FONT_STYLE);
  }

  public override execute(): void {
    if (this.target == null) {
      return;
    }

    if (
      !hasExplicitFamily(this.editor) &&
      fontStyleNeedsExplicitFamily(this.target)
    ) {
      const family = effectiveFamily(
        this.editor,
        this.resolvedParagraphStyleFallback,
      );

      if (family != null) {
        const neumeFallback = this.editor.config.get(
          'insertNeume.neumeDefaultFontFamily',
        ) as string | undefined;
        const modelValue = toRichTextFontFamilyModelValue(
          family,
          neumeFallback ?? '',
        );

        if (modelValue != null) {
          this.editor.execute(FONT_FAMILY, { value: modelValue });
        }
      }
    }

    this.editor.execute(FONT_STYLE, { value: this.target });
  }
}
