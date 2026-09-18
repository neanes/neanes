import type { ModelElement } from 'ckeditor5';

import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';

export const MODE_KEY_DATA_VERSION = 1;

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

    if (key === 'fontColor') {
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
  const payload: SerializedModeKey = {
    version: MODE_KEY_DATA_VERSION,
    attributes: sanitizeAttributes(attributes),
  };

  return encodeURIComponent(JSON.stringify(payload));
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
  const elements: ModeKeyElement[] = [];
  const attributePattern = /data-neanes-mode-key=(['"])(.*?)\1/gu;

  for (const match of html.matchAll(attributePattern)) {
    const attributes = deserializeModeKeyAttributes(match[2]);

    if (attributes != null) {
      elements.push(createModeKeyElementFromAttributes(attributes));
    }
  }

  return elements;
}

export function rewriteModeKeyAttributesInHtml(
  html: string,
  rewrite: (attributes: ModeKeyModelAttributes) => ModeKeyModelAttributes,
) {
  return html.replace(
    /data-neanes-mode-key=(['"])(.*?)\1/gu,
    (source, quote: string, value: string) => {
      const attributes = deserializeModeKeyAttributes(value);

      return attributes == null
        ? source
        : `data-neanes-mode-key=${quote}${serializeModeKeyAttributes(
            rewrite(attributes),
          )}${quote}`;
    },
  );
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
