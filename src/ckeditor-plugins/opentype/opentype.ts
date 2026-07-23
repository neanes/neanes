import type { ViewElement } from 'ckeditor5';
import { FontCommand, Plugin } from 'ckeditor5';

import {
  FONT_VARIANT_ALTERNATES,
  FONT_VARIANT_CAPS,
  FONT_VARIANT_CSS_NAMES,
  FONT_VARIANT_LIGATURES,
  FONT_VARIANT_NUMERIC,
  normalizeAlternatesStyle,
  normalizeLigatureStyle,
  normalizeNumericStyle,
  parseFontVariantCaps,
} from '@/utils/fontVariants';

// Each attribute maps to exactly one CSS property; the model value is that
// property's canonical owned value. Downcast prefixes the property name;
// upcast parses and canonicalizes supported values and drops the rest.
// GeneralHtmlSupport is disallowed from owning these properties, so there is
// never a competing declaration for the same text.
interface StyleAttribute {
  property: string;
  model: string;
  toModel: (style: string) => string | null;
}

const STYLE_ATTRIBUTES: StyleAttribute[] = [
  {
    property: FONT_VARIANT_CSS_NAMES[FONT_VARIANT_NUMERIC],
    model: FONT_VARIANT_NUMERIC,
    toModel: normalizeNumericStyle,
  },
  {
    property: FONT_VARIANT_CSS_NAMES[FONT_VARIANT_LIGATURES],
    model: FONT_VARIANT_LIGATURES,
    toModel: normalizeLigatureStyle,
  },
  {
    property: FONT_VARIANT_CSS_NAMES[FONT_VARIANT_CAPS],
    model: FONT_VARIANT_CAPS,
    toModel: parseFontVariantCaps,
  },
  {
    property: FONT_VARIANT_CSS_NAMES[FONT_VARIANT_ALTERNATES],
    model: FONT_VARIANT_ALTERNATES,
    toModel: normalizeAlternatesStyle,
  },
];

class OpenTypeCommand extends FontCommand {}

// Adds inline character-formatting attributes that each render as one OpenType
// CSS property on a `<span>`:
//   - fontVariantNumeric   -> font-variant-numeric   (figure style, fractions,
//     ordinals, slashed zero)
//   - fontVariantLigatures -> font-variant-ligatures (common/discretionary/
//     historical ligatures, contextual alternates)
//   - fontVariantCaps      -> font-variant-caps      (small caps / all small caps)
//   - fontVariantAlternates -> font-variant-alternates (historical forms,
//     stylistic sets, character variants, swash, stylistic alternates)
// All downcast to a priority-7 span so compatible attributes can merge into one
// combined style.
export default class OpenType extends Plugin {
  public static get pluginName() {
    return 'OpenType' as const;
  }

  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;

    schema.extend('$text', {
      allowAttributes: STYLE_ATTRIBUTES.map((attribute) => attribute.model),
    });

    for (const { property, model, toModel } of STYLE_ATTRIBUTES) {
      // isFormatting so the existing "Remove Format" command clears them;
      // copyOnEnter so they carry to a new paragraph.
      schema.setAttributeProperties(model, {
        isFormatting: true,
        copyOnEnter: true,
      });

      editor.conversion.for('downcast').attributeToElement({
        model,
        view: (value: string, { writer }) =>
          writer.createAttributeElement(
            'span',
            { style: `${property}:${value}` },
            { priority: 7 },
          ),
      });

      editor.conversion.for('upcast').elementToAttribute({
        view: { name: 'span', styles: { [property]: /.*/ } },
        model: {
          key: model,
          value: (viewElement: ViewElement) =>
            toModel(viewElement.getStyle(property)!),
        },
      });

      editor.commands.add(model, new OpenTypeCommand(editor, model));
    }
  }
}
