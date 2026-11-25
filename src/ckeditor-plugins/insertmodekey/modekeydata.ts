import type { ModelElement } from 'ckeditor5';
import { Parser } from 'htmlparser2';

import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import { Unit } from '@/utils/Unit';

const MODE_KEY_DATA_VERSION = 1;
export const MODE_KEY_CLASS = 'neanes-ck-mode-key';
export const MODE_KEY_DATA_ATTRIBUTE = 'data-neanes-mode-key';
export const MODE_KEY_STYLE_CLIPBOARD_ATTRIBUTE =
  'data-neanes-initial-martyria-style';

export const MODE_KEY_MODEL_ATTRIBUTES = [
  'templateId',
  'mode',
  'scale',
  'scaleNote',
  'fthora',
  'tempo',
  'martyria',
  'note',
  'note2',
  'fthoraAboveNote',
  'fthoraAboveNote2',
  'fthoraAboveQuantitativeNeumeRight',
  'quantitativeNeumeRight',
  'timeNeumeAboveQuantitativeNeumeRight',
  'quantitativeNeumeRight2',
  'gorgonAboveQuantitativeNeumeRight2',
  'quantitativeNeumeAboveNote',
  'quantitativeNeumeAboveNote2',
  'fontSize',
  'fontColor',
  'strokeWidth',
  'bpm',
  'initialMartyriaStyleId',
  'ignoreAttractions',
  'permanentEnharmonicZo',
] as const;

export type ModeKeyModelAttribute = (typeof MODE_KEY_MODEL_ATTRIBUTES)[number];
export type ModeKeyModelAttributes = Partial<
  Record<ModeKeyModelAttribute, unknown>
>;

type SerializedModeKey = {
  version: typeof MODE_KEY_DATA_VERSION;
  attributes: ModeKeyModelAttributes;
};

export function getModeKeyModelAttributes(
  element: Readonly<ModeKeyElement>,
): ModeKeyModelAttributes {
  return omitNullish({
    templateId: element.templateId,
    mode: element.mode,
    scale: element.scale,
    scaleNote: element.scaleNote,
    fthora: element.fthora,
    tempo: element.tempo,
    martyria: element.martyria,
    note: element.note,
    note2: element.note2,
    fthoraAboveNote: element.fthoraAboveNote,
    fthoraAboveNote2: element.fthoraAboveNote2,
    fthoraAboveQuantitativeNeumeRight:
      element.fthoraAboveQuantitativeNeumeRight,
    quantitativeNeumeRight: element.quantitativeNeumeRight,
    timeNeumeAboveQuantitativeNeumeRight:
      element.timeNeumeAboveQuantitativeNeumeRight,
    quantitativeNeumeRight2: element.quantitativeNeumeRight2,
    gorgonAboveQuantitativeNeumeRight2:
      element.gorgonAboveQuantitativeNeumeRight2,
    quantitativeNeumeAboveNote: element.quantitativeNeumeAboveNote,
    quantitativeNeumeAboveNote2: element.quantitativeNeumeAboveNote2,
    fontSize: element.fontSize,
    fontColor: element.color,
    strokeWidth: element.strokeWidth,
    bpm: element.bpm,
    initialMartyriaStyleId: element.initialMartyriaStyleId,
    ignoreAttractions: element.ignoreAttractions,
    permanentEnharmonicZo: element.permanentEnharmonicZo,
  });
}

/**
 * Produces a complete model update. Null entries intentionally remove
 * attributes that were present on the previous mode key.
 */
export function getModeKeyReplacementAttributes(
  element: Readonly<ModeKeyElement>,
): ModeKeyModelAttributes {
  const attributes = getModeKeyModelAttributes(element);

  for (const key of MODE_KEY_MODEL_ATTRIBUTES) {
    if (!(key in attributes)) {
      attributes[key] = null;
    }
  }

  return attributes;
}

export function toModeKeyEditorAttributes(
  attributes: ModeKeyModelAttributes,
): ModeKeyModelAttributes {
  const editorAttributes = { ...attributes };

  if ('fontSize' in editorAttributes) {
    const value = editorAttributes.fontSize;
    const fontSize = getModeKeyFontSizeInPixels(value);

    if (value == null) {
      editorAttributes.fontSize = value;
    } else if (fontSize == null) {
      delete editorAttributes.fontSize;
    } else {
      editorAttributes.fontSize = `${fontSize}px`;
    }
  }

  return editorAttributes;
}

export function createModeKeyElementFromModel(
  modelElement: ModelElement,
): ModeKeyElement {
  const attributes: ModeKeyModelAttributes = {};

  for (const key of MODE_KEY_MODEL_ATTRIBUTES) {
    const value = modelElement.getAttribute(key);

    if (value !== undefined) {
      attributes[key] = value;
    }
  }

  return createModeKeyElementFromAttributes(attributes);
}

export function createModeKeyElementFromAttributes(
  attributes: ModeKeyModelAttributes,
): ModeKeyElement {
  const element = new ModeKeyElement();
  element.alignment = TextBoxAlignment.Left;
  element.showAmbitus = false;
  element.tempoAlignRight = false;

  for (const key of MODE_KEY_MODEL_ATTRIBUTES) {
    const value = attributes[key];

    if (value === undefined) {
      continue;
    }

    if (key === 'fontSize') {
      const fontSize = getModeKeyFontSizeInPixels(value);

      if (fontSize != null) {
        element.fontSize = fontSize;
      }
    } else if (key === 'fontColor') {
      element.color = typeof value === 'string' ? value : null;
    } else {
      Object.assign(element, { [key]: value });
    }
  }

  return element;
}

export function serializeModeKeyAttributes(
  attributes: ModeKeyModelAttributes,
): string {
  const sanitized = sanitizeAttributes(attributes);
  const fontSize = getModeKeyFontSizeInPixels(sanitized.fontSize);

  if ('fontSize' in sanitized) {
    if (fontSize == null) {
      delete sanitized.fontSize;
    } else {
      sanitized.fontSize = fontSize;
    }
  }

  const payload: SerializedModeKey = {
    version: MODE_KEY_DATA_VERSION,
    attributes: sanitized,
  };

  return encodeURIComponent(JSON.stringify(payload)).replaceAll("'", '%27');
}

export function getModeKeyFontSizeInPixels(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^([\d.]+)(pt|px)$/u);

  if (match == null) {
    return null;
  }

  const size = Number(match[1]);

  if (!Number.isFinite(size) || size <= 0) {
    return null;
  }

  return match[2] === 'pt' ? Unit.fromPt(size) : size;
}

export function deserializeModeKeyAttributes(
  value: string | undefined,
): ModeKeyModelAttributes | null {
  if (value == null || value === '') {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeURIComponent(value),
    ) as Partial<SerializedModeKey>;

    if (
      payload.version !== MODE_KEY_DATA_VERSION ||
      payload.attributes == null ||
      typeof payload.attributes !== 'object' ||
      Array.isArray(payload.attributes)
    ) {
      return null;
    }

    return sanitizeAttributes(payload.attributes);
  } catch {
    return null;
  }
}

export function extractModeKeyElementsFromHtml(html: string): ModeKeyElement[] {
  return locateModeKeysInHtml(html).map(({ element }) => element);
}

export function modeKeyHtml(element: ModeKeyElement) {
  return modeKeyAttributesHtml(getModeKeyModelAttributes(element));
}

function modeKeyAttributesHtml(attributes: ModeKeyModelAttributes) {
  const data = serializeModeKeyAttributes(attributes);
  return `<span class="${MODE_KEY_CLASS}" ${MODE_KEY_DATA_ATTRIBUTE}="${data}"></span>`;
}

interface LocatedModeKey {
  attributes: ModeKeyModelAttributes;
  element: ModeKeyElement;
  start: number;
  end: number;
}

/**
 * The embedded mode keys of rich text HTML, with the source range of each
 * widget span. Matches the editor upcast, which keeps only classed widget
 * spans with a readable payload.
 */
export function locateModeKeysInHtml(html: string): LocatedModeKey[] {
  const widgets: LocatedModeKey[] = [];
  if (!html.includes(MODE_KEY_DATA_ATTRIBUTE)) {
    return widgets;
  }

  let depth = 0;
  let open: (Omit<LocatedModeKey, 'end'> & { depth: number }) | undefined;
  const parser = new Parser({
    onopentag(name, attributes) {
      depth++;
      if (
        name !== 'span' ||
        open !== undefined ||
        !attributes.class?.split(/\s+/).includes(MODE_KEY_CLASS)
      ) {
        return;
      }
      const data = deserializeModeKeyAttributes(
        attributes[MODE_KEY_DATA_ATTRIBUTE],
      );
      if (data !== null) {
        open = {
          attributes: data,
          element: createModeKeyElementFromAttributes(data),
          start: parser.startIndex,
          depth,
        };
      }
    },
    onclosetag(_name, implied) {
      if (open?.depth === depth) {
        widgets.push({
          attributes: open.attributes,
          element: open.element,
          start: open.start,
          end: implied ? parser.startIndex : parser.endIndex + 1,
        });
        open = undefined;
      }
      depth--;
    },
  });
  parser.end(html);
  return widgets;
}

/**
 * Replaces each embedded mode key widget with the markup `replace` returns,
 * or leaves it as it is when `replace` returns null.
 */
export function replaceModeKeysInHtml(
  html: string,
  replace: (widget: LocatedModeKey) => string | null,
) {
  let result = html;
  for (const widget of locateModeKeysInHtml(html).reverse()) {
    const replacement = replace(widget);
    if (replacement !== null) {
      result =
        result.slice(0, widget.start) + replacement + result.slice(widget.end);
    }
  }
  return result;
}

export function rewriteModeKeyAttributesInHtml(
  html: string,
  rewrite: (attributes: ModeKeyModelAttributes) => ModeKeyModelAttributes,
) {
  return replaceModeKeysInHtml(html, ({ attributes }) => {
    const updated = rewrite(attributes);
    return updated === attributes ? null : modeKeyAttributesHtml(updated);
  });
}

function sanitizeAttributes(
  attributes: ModeKeyModelAttributes,
): ModeKeyModelAttributes {
  const sanitized: ModeKeyModelAttributes = {};

  for (const key of MODE_KEY_MODEL_ATTRIBUTES) {
    const value = attributes[key];

    if (
      value == null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

function omitNullish(
  attributes: ModeKeyModelAttributes,
): ModeKeyModelAttributes {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value != null),
  ) as ModeKeyModelAttributes;
}
