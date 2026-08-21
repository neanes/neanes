import type {
  DowncastAttributeEvent,
  DowncastConversionApi,
  EventInfo,
  ModelItem,
  ModelRange,
  ModelWriter,
  ViewAttributeElement,
  ViewDowncastWriter,
  ViewElement,
} from 'ckeditor5';
import { ModelDocumentSelection, ModelSelection, Plugin } from 'ckeditor5';

import { fontCatalog } from '@/services/FontCatalog';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { firstFontFamilyToken } from '@/utils/fontFamily';
import {
  applyLegacyStyle,
  isCssItalicStyle,
  isNormalCssFontStyle,
} from '@/utils/fontStyle';
import { applyAxes, fontStyleNeedsExplicitFamily } from '@/utils/fontStyleAxes';

import {
  composeFontStyleCss,
  getEditorDefaultFontFamily,
  getEditorDefaultFontFamilyModelValue,
  normalizeFamilyListForSplitFace,
} from './fontstyle-util';
import {
  FONT_STYLE,
  FONT_STYLE_TOGGLE_BOLD,
  FONT_STYLE_TOGGLE_ITALIC,
  FontStyleCommand,
  FontStyleToggleCommand,
} from './fontstylecommand';

const FONT_FAMILY = 'fontFamily';

// Transient markers used only during upcast to carry a legacy <strong>/<em> (or
// a bundled-style font-weight/font-style) onto text and inline neume objects.
// The post-fixer folds them into fontStyle and removes them, so they never
// survive a save.
const LEGACY_BOLD = 'neanesLegacyBold';
const LEGACY_ITALIC = 'neanesLegacyItalic';
const LEGACY_NORMAL = 'neanesLegacyNormal';
const LEGACY_WEIGHT = 'neanesLegacyWeight';
const LEGACY_MARKER_KEYS = [
  LEGACY_BOLD,
  LEGACY_ITALIC,
  LEGACY_NORMAL,
  LEGACY_WEIGHT,
];

function removeLegacyMarkers(writer: ModelWriter, range: ModelRange) {
  for (const key of LEGACY_MARKER_KEYS) {
    writer.removeAttribute(key, range);
  }
}

interface ItemSnapshot {
  family: string | null;
  fontStyle: string | null;
  bold: boolean;
  italic: boolean;
  normal: boolean;
  weight: string | null;
  hasMarkers: boolean;
  range: ModelRange;
}

interface SiblingAttributeChange {
  attributeOldValue: unknown;
  attributeNewValue: unknown;
}

type RemoveFormatCommandWithCustomAttributes = {
  registerCustomAttribute(
    isFormatting: (
      attributeName: string,
      item: ModelItem | ModelDocumentSelection,
    ) => boolean,
    removeFormatting: (
      attributeName: string,
      range: ModelRange,
      writer: ModelWriter,
    ) => void,
  ): void;
};

function isSelectionItem(
  item: DowncastAttributeEvent['args'][0]['item'],
): boolean {
  return (
    item instanceof ModelSelection || item instanceof ModelDocumentSelection
  );
}

function wrapViewSelection(
  writer: ViewDowncastWriter,
  newElements: ViewAttributeElement[],
) {
  let wrappedRange = writer.document.selection.getFirstRange()!;

  for (const newElement of newElements) {
    wrappedRange = writer.wrap(wrappedRange, newElement);
  }
}

function rewrapViewRange(
  data: DowncastAttributeEvent['args'][0],
  conversionApi: DowncastConversionApi,
  oldElements: ViewAttributeElement[],
  newElements: ViewAttributeElement[],
) {
  const writer = conversionApi.writer;
  let viewRange = conversionApi.mapper.toViewRange(data.range);

  for (const oldElement of oldElements) {
    viewRange = writer.unwrap(viewRange, oldElement);
  }

  for (const newElement of newElements) {
    viewRange = writer.wrap(viewRange, newElement);
  }
}

export default class FontStyleEditing extends Plugin {
  static get pluginName() {
    return 'FontStyleEditing';
  }

  init() {
    const editor = this.editor;
    const schema = editor.model.schema;

    schema.extend('$text', {
      allowAttributes: [FONT_STYLE, ...LEGACY_MARKER_KEYS],
    });
    schema.setAttributeProperties(FONT_STYLE, {
      isFormatting: true,
      copyOnEnter: true,
    });

    this._registerDowncast();
    this._registerLegacyUpcast();
    this._registerNormalizingPostFixer();

    editor.commands.add(FONT_STYLE, new FontStyleCommand(editor));
    editor.commands.add(
      FONT_STYLE_TOGGLE_BOLD,
      new FontStyleToggleCommand(editor, 'bold'),
    );
    editor.commands.add(
      FONT_STYLE_TOGGLE_ITALIC,
      new FontStyleToggleCommand(editor, 'italic'),
    );
  }

  afterInit() {
    const schema = this.editor.model.schema;

    if (schema.isRegistered('neume')) {
      schema.extend('neume', {
        allowAttributes: LEGACY_MARKER_KEYS,
      });
    }

    this._registerRemoveFormatIntegration();
  }

  private _registerRemoveFormatIntegration() {
    const removeFormatCommand = this.editor.commands.get('removeFormat') as
      Partial<RemoveFormatCommandWithCustomAttributes> | undefined;

    removeFormatCommand?.registerCustomAttribute?.(
      (attributeName) =>
        attributeName === FONT_FAMILY || attributeName === FONT_STYLE,
      (_attributeName, range, writer) => {
        writer.removeAttribute(FONT_STYLE, range);
        writer.removeAttribute(FONT_FAMILY, range);
      },
    );
  }

  // Explicit font styles always serialize as CSS so the rendered axes are
  // pinned even when the surrounding paragraph style already sets weight/slant.
  private _registerDowncast() {
    const editor = this.editor;

    const createFontElements = (
      family: string | null | undefined,
      fontStyle: string | null | undefined,
      writer: ViewDowncastWriter,
    ): ViewAttributeElement[] => {
      const neumeFallback = editor.config.get(
        'insertNeume.neumeDefaultFontFamily',
      ) as string | undefined;

      const style = composeFontStyleCss(family, fontStyle, neumeFallback);

      if (style === '') {
        return [];
      }

      return [
        writer.createAttributeElement('span', { style }, { priority: 7 }),
      ];
    };

    editor.conversion.for('downcast').add((dispatcher) => {
      dispatcher.on<DowncastAttributeEvent>(
        `attribute:${FONT_STYLE}`,
        (evt, data, conversionApi) => {
          this._convertFontStyleAttribute(
            evt,
            data,
            conversionApi,
            createFontElements,
          );
        },
      );

      // Replace FontFamilyEditing's generic downcast: the exact system-face
      // alias depends on the sibling fontStyle, so both model attributes must
      // render through the same combined span.
      dispatcher.on<DowncastAttributeEvent>(
        `attribute:${FONT_FAMILY}`,
        (evt, data, conversionApi) => {
          this._convertFontFamilyAttribute(
            evt,
            data,
            conversionApi,
            createFontElements,
          );
        },
        { priority: 'high' },
      );
    });
  }

  private _convertFontFamilyAttribute(
    evt: EventInfo,
    data: DowncastAttributeEvent['args'][0],
    conversionApi: DowncastConversionApi,
    createElement: (
      family: string | null | undefined,
      fontStyle: string | null | undefined,
      writer: ViewDowncastWriter,
    ) => ViewAttributeElement[],
  ) {
    // Always consume: the combined span replaces CKEditor's generic fontFamily
    // downcast, which must never add a nested base-family span.
    if (!conversionApi.consumable.consume(data.item, evt.name)) {
      return;
    }

    // A same-batch fontStyle conversion reads the sibling family change and
    // rebuilds the combined span itself.
    if (this._getSiblingAttributeChange(data, FONT_STYLE) != null) {
      return;
    }

    const fontStyle = data.item.getAttribute(FONT_STYLE) as string | undefined;
    const writer = conversionApi.writer;
    const newElements = createElement(
      data.attributeNewValue as string | undefined,
      fontStyle,
      writer,
    );

    if (isSelectionItem(data.item)) {
      wrapViewSelection(writer, newElements);
      return;
    }

    const oldElements = createElement(
      data.attributeOldValue as string | undefined,
      fontStyle,
      writer,
    );

    rewrapViewRange(data, conversionApi, oldElements, newElements);
  }

  private _convertFontStyleAttribute(
    evt: EventInfo,
    data: DowncastAttributeEvent['args'][0],
    conversionApi: DowncastConversionApi,
    createElement: (
      family: string | null | undefined,
      fontStyle: string | null | undefined,
      writer: ViewDowncastWriter,
    ) => ViewAttributeElement[],
  ) {
    if (!conversionApi.consumable.test(data.item, evt.name)) {
      return;
    }

    const oldFontStyle = data.attributeOldValue as string | undefined;
    const newFontStyle = data.attributeNewValue as string | undefined;
    const siblingChange = this._getSiblingAttributeChange(data, FONT_FAMILY);
    const currentFamily = data.item.getAttribute(FONT_FAMILY) as
      string | undefined;

    const oldFamily =
      (siblingChange?.attributeOldValue as string | undefined) ?? currentFamily;
    const newFamily =
      (siblingChange?.attributeNewValue as string | undefined) ?? currentFamily;

    const writer = conversionApi.writer;
    const oldElements = createElement(oldFamily, oldFontStyle, writer);
    const newElements = createElement(newFamily, newFontStyle, writer);

    if (oldElements.length === 0 && newElements.length === 0) {
      return;
    }

    conversionApi.consumable.consume(data.item, evt.name);

    if (isSelectionItem(data.item)) {
      wrapViewSelection(writer, newElements);
      return;
    }

    rewrapViewRange(data, conversionApi, oldElements, newElements);
  }

  private _getSiblingAttributeChange(
    data: DowncastAttributeEvent['args'][0],
    attributeKey: string,
  ): SiblingAttributeChange | null {
    if (isSelectionItem(data.item)) {
      return null;
    }

    const changes = this.editor.model.document.differ.getChanges();

    for (const change of changes) {
      if (
        change.type === 'attribute' &&
        change.attributeKey === attributeKey &&
        change.range.isIntersecting(data.range)
      ) {
        return {
          attributeOldValue: change.attributeOldValue,
          attributeNewValue: change.attributeNewValue,
        };
      }
    }

    return null;
  }

  // Recognise legacy bold/italic/normal (as separate <strong>/<em> wrappers or
  // as font-weight/font-style on the family span) and mark them for the
  // post-fixer. These do not consume font-family, so the built-in fontFamily
  // upcast still stores the raw value for the post-fixer to split.
  private _registerLegacyUpcast() {
    const editor = this.editor;

    for (const name of ['strong', 'b']) {
      editor.conversion.for('upcast').elementToAttribute({
        view: name,
        model: LEGACY_BOLD,
        converterPriority: 'high',
      });
    }

    for (const name of ['em', 'i']) {
      editor.conversion.for('upcast').elementToAttribute({
        view: name,
        model: LEGACY_ITALIC,
        converterPriority: 'high',
      });
    }

    editor.conversion.for('upcast').elementToAttribute({
      view: { name: 'span', styles: { 'font-weight': /.*/ } },
      model: {
        // Carry the raw font-weight (always a non-null string, so the converter
        // consumes the style and GeneralHtmlSupport never preserves it). The
        // post-fixer folds it into the font style, recovering named weights such
        // as Semibold (600) or Light (300) that are not the bold axis. Bold
        // (>= 700) still resolves to the bold axis during that fold.
        key: LEGACY_WEIGHT,
        value: (viewElement: ViewElement) =>
          viewElement.getStyle('font-weight') ?? '',
      },
      converterPriority: 'high',
    });

    editor.conversion.for('upcast').elementToAttribute({
      view: { name: 'span', styles: { 'font-style': /.*/ } },
      model: {
        key: LEGACY_ITALIC,
        // Classify via the shared CSS helper so casing and oblique angles
        // ('Italic', 'oblique 14deg') fold like plain 'italic'. Returning null
        // skips the conversion without consuming the style, leaving it to the
        // LEGACY_NORMAL converter below.
        value: (viewElement: ViewElement) =>
          isCssItalicStyle(viewElement.getStyle('font-style')) ? true : null,
      },
      converterPriority: 'high',
    });

    editor.conversion.for('upcast').elementToAttribute({
      view: { name: 'span', styles: { 'font-style': /.*/ } },
      model: {
        key: LEGACY_NORMAL,
        value: (viewElement: ViewElement) =>
          isNormalCssFontStyle(viewElement.getStyle('font-style'))
            ? true
            : null,
      },
      converterPriority: 'high',
    });
  }

  // Normalize the model after every change: derive fontStyle from any face name
  // in the first font-family token, fold legacy bold/italic markers into the
  // style, and keep existing CSS font-family lists intact for ordinary families.
  private _registerNormalizingPostFixer() {
    const editor = this.editor;

    editor.model.document.registerPostFixer((writer) => {
      const snapshots = this._collectSnapshots(writer);
      let changed = false;

      for (const snapshot of snapshots) {
        if (this._applyNormalization(writer, snapshot)) {
          changed = true;
        }
      }

      return changed;
    });
  }

  private _collectSnapshots(writer: ModelWriter): ItemSnapshot[] {
    const model = this.editor.model;
    const changes = model.document.differ.getChanges();
    const ranges: ModelRange[] = [];

    for (const change of changes) {
      if (change.type === 'insert') {
        ranges.push(
          model.createRange(
            change.position,
            change.position.getShiftedBy(change.length),
          ),
        );
      } else if (change.type === 'attribute') {
        ranges.push(change.range);
      }
    }

    const snapshots: ItemSnapshot[] = [];

    for (const range of ranges) {
      for (const item of range.getItems()) {
        const isNeume = item.is('element', 'neume');

        if (!item.is('$textProxy') && !isNeume) {
          continue;
        }

        const boldMarker = item.getAttribute(LEGACY_BOLD);
        const italicMarker = item.getAttribute(LEGACY_ITALIC);
        const normalMarker = item.getAttribute(LEGACY_NORMAL);
        const weightMarker = item.getAttribute(LEGACY_WEIGHT);

        snapshots.push({
          family: (item.getAttribute(FONT_FAMILY) as string) ?? null,
          fontStyle: (item.getAttribute(FONT_STYLE) as string) ?? null,
          bold: boldMarker === true,
          italic: italicMarker === true,
          normal: normalMarker === true,
          weight: typeof weightMarker === 'string' ? weightMarker : null,
          hasMarkers:
            boldMarker !== undefined ||
            italicMarker !== undefined ||
            normalMarker !== undefined ||
            weightMarker !== undefined,
          range: writer.createRangeOn(item),
        });
      }
    }

    return snapshots;
  }

  private _applyNormalization(
    writer: ModelWriter,
    snapshot: ItemSnapshot,
  ): boolean {
    const {
      family,
      fontStyle,
      bold,
      italic,
      normal,
      weight,
      hasMarkers,
      range,
    } = snapshot;

    let newFamily = family;
    let desired: string | null;

    if (fontStyle == null) {
      // Fresh from upcast, including neumes, or default-font text: derive the
      // font style from the face name, then fold in any legacy markers.
      if (family == null || family === '') {
        newFamily = null;
        const fallbackFamily = getEditorDefaultFontFamily(this.editor);
        desired = applyLegacyStyle(
          DEFAULT_FONT_STYLE,
          { bold, italic, weight },
          fallbackFamily == null ? [] : fontCatalog.getStyles(fallbackFamily),
        );
      } else {
        const split = fontCatalog.splitFace(firstFontFamilyToken(family));
        newFamily = normalizeFamilyListForSplitFace(family, split);
        desired = applyLegacyStyle(
          split.style,
          { bold, italic, weight },
          fontCatalog.getStyles(split.family),
        );
      }
    } else {
      // Already normalized: keep the family, just fold any legacy markers.
      const fallbackFamily = getEditorDefaultFontFamily(this.editor);
      const styleFamily = family
        ? fontCatalog.splitFace(firstFontFamilyToken(family)).family
        : fallbackFamily;
      desired = applyAxes(
        fontStyle,
        { bold: bold || undefined, italic: italic || undefined },
        styleFamily == null ? [] : fontCatalog.getStyles(styleFamily),
      );
    }

    if (
      normal &&
      !bold &&
      !italic &&
      weight == null &&
      (fontStyle == null || fontStyle === DEFAULT_FONT_STYLE)
    ) {
      desired = DEFAULT_FONT_STYLE;
    }

    if (
      (newFamily == null || newFamily === '') &&
      fontStyleNeedsExplicitFamily(desired)
    ) {
      newFamily = getEditorDefaultFontFamilyModelValue(this.editor);
    }

    if (desired === DEFAULT_FONT_STYLE && fontStyle == null && !normal) {
      desired = null;
    }

    const familyChanged = (newFamily ?? '') !== (family ?? '');
    const fontStyleChanged = desired !== fontStyle;

    if (!hasMarkers && !familyChanged && !fontStyleChanged) {
      return false;
    }

    if (hasMarkers) {
      removeLegacyMarkers(writer, range);
    }

    if (familyChanged) {
      if (newFamily == null) {
        writer.removeAttribute(FONT_FAMILY, range);
      } else {
        writer.setAttribute(FONT_FAMILY, newFamily, range);
      }
    }

    if (fontStyleChanged) {
      if (desired == null) {
        writer.removeAttribute(FONT_STYLE, range);
      } else {
        writer.setAttribute(FONT_STYLE, desired, range);
      }
    }

    return true;
  }
}
