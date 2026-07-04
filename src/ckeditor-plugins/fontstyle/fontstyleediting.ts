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
import {
  firstFontFamilyToken,
  normalizeFontFamily,
  splitFontFamilyList,
} from '@/utils/fontFamily';
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
// a bundled-style font-weight/font-style) onto the wrapped text. The post-fixer
// folds them into fontStyle and removes them, so they never survive a save.
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
  isText: boolean;
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

function normalizeFamilyListForSplitFace(
  fontFamily: string,
  split: { family: string; style: string },
) {
  if (split.style === DEFAULT_FONT_STYLE) {
    return fontFamily;
  }

  const families = splitFontFamilyList(fontFamily)
    .map((family) => family.trim())
    .filter((family) => family !== '');
  const rest = families.slice(1);

  if (rest.length > 0 && normalizeFontFamily(rest[0]) === split.family) {
    return rest.join(',');
  }

  return [split.family, ...rest].join(',');
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
    this._registerRemoveFormatIntegration();
  }

  private _registerRemoveFormatIntegration() {
    const removeFormatCommand = this.editor.commands.get('removeFormat') as
      | Partial<RemoveFormatCommandWithCustomAttributes>
      | undefined;

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

    const createFontStyleElements = (
      family: string | null | undefined,
      fontStyle: string | null | undefined,
      writer: ViewDowncastWriter,
    ): ViewAttributeElement[] => {
      const explicitFontStyle = fontStyle?.trim();

      if (explicitFontStyle == null || explicitFontStyle === '') {
        return [];
      }

      const neumeFallback = editor.config.get(
        'insertNeume.neumeDefaultFontFamily',
      ) as string | undefined;

      const style = composeFontStyleCss(
        family,
        explicitFontStyle,
        neumeFallback,
      );

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
            createFontStyleElements,
          );
        },
      );

      // The fontStyle span embeds the family it was resolved against, but only
      // attribute:fontStyle reconverts it. When the family changes while the
      // style name stays the same (e.g. Semibold to Semibold across families),
      // the fontStyle command no-ops, so without this the span keeps rendering
      // the old family in the editing view. We rebuild the dependent span here
      // without consuming the family event, leaving the separate
      // FontFamilyEditing span to CKEditor.
      dispatcher.on<DowncastAttributeEvent>(
        `attribute:${FONT_FAMILY}`,
        (evt, data, conversionApi) => {
          this._reconvertFontStyleForFamilyChange(
            data,
            conversionApi,
            createFontStyleElements,
          );
        },
      );
    });
  }

  // Rebuilds the fontStyle span when only the sibling family changes. Same-batch
  // fontStyle changes are left untouched (the fontStyle converter rebuilds the
  // span itself, reading the sibling family change).
  private _reconvertFontStyleForFamilyChange(
    data: DowncastAttributeEvent['args'][0],
    conversionApi: DowncastConversionApi,
    createElement: (
      family: string | null | undefined,
      fontStyle: string | null | undefined,
      writer: ViewDowncastWriter,
    ) => ViewAttributeElement[],
  ) {
    if (
      data.item instanceof ModelSelection ||
      data.item instanceof ModelDocumentSelection
    ) {
      return;
    }

    const fontStyle = (data.item as ModelItem).getAttribute(FONT_STYLE) as
      | string
      | undefined;

    if (fontStyle == null || fontStyle.trim() === '') {
      return;
    }

    // When fontStyle also changes in this batch, its own converter rebuilds the
    // span (reading the sibling family change); rebuilding here too would
    // double-unwrap.
    if (this._hasSiblingFontStyleChange(data.range)) {
      return;
    }

    const writer = conversionApi.writer;
    const oldElements = createElement(
      data.attributeOldValue as string | undefined,
      fontStyle,
      writer,
    );
    const newElements = createElement(
      data.attributeNewValue as string | undefined,
      fontStyle,
      writer,
    );

    if (oldElements.length === 0 && newElements.length === 0) {
      return;
    }

    let viewRange = conversionApi.mapper.toViewRange(data.range);

    for (const oldElement of oldElements) {
      viewRange = writer.unwrap(viewRange, oldElement);
    }

    for (const newElement of newElements) {
      viewRange = writer.wrap(viewRange, newElement);
    }
  }

  private _hasSiblingFontStyleChange(range: ModelRange): boolean {
    const changes = this.editor.model.document.differ.getChanges();

    for (const change of changes) {
      if (
        change.type === 'attribute' &&
        change.attributeKey === FONT_STYLE &&
        change.range.isIntersecting(range)
      ) {
        return true;
      }
    }

    return false;
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
    const siblingChange = this._getSiblingFontFamilyChange(data);
    const currentFamily =
      data.item instanceof ModelSelection ||
      data.item instanceof ModelDocumentSelection
        ? (data.item.getAttribute(FONT_FAMILY) as string | undefined)
        : ((data.item as ModelItem).getAttribute(FONT_FAMILY) as
            | string
            | undefined);

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

    if (
      data.item instanceof ModelSelection ||
      data.item instanceof ModelDocumentSelection
    ) {
      const viewRange = writer.document.selection.getFirstRange()!;
      let wrappedRange = viewRange;

      for (const newElement of newElements) {
        wrappedRange = writer.wrap(wrappedRange, newElement);
      }

      return;
    }

    let viewRange = conversionApi.mapper.toViewRange(data.range);

    for (const oldElement of oldElements) {
      viewRange = writer.unwrap(viewRange, oldElement);
    }

    for (const newElement of newElements) {
      viewRange = writer.wrap(viewRange, newElement);
    }
  }

  private _getSiblingFontFamilyChange(
    data: DowncastAttributeEvent['args'][0],
  ): SiblingAttributeChange | null {
    if (
      data.item instanceof ModelSelection ||
      data.item instanceof ModelDocumentSelection
    ) {
      return null;
    }

    const changes = this.editor.model.document.differ.getChanges();

    for (const change of changes) {
      if (
        change.type !== 'attribute' ||
        change.attributeKey !== FONT_FAMILY ||
        !change.range.isIntersecting(data.range)
      ) {
        continue;
      }

      return {
        attributeOldValue: change.attributeOldValue,
        attributeNewValue: change.attributeNewValue,
      };
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
        const isText = item.is('$textProxy');
        const isNeume = item.is('element', 'neume');

        if (!isText && !isNeume) {
          continue;
        }

        const boldMarker = item.getAttribute(LEGACY_BOLD);
        const italicMarker = item.getAttribute(LEGACY_ITALIC);
        const normalMarker = item.getAttribute(LEGACY_NORMAL);
        const weightMarker = item.getAttribute(LEGACY_WEIGHT);

        snapshots.push({
          isText,
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
      isText,
      family,
      fontStyle,
      bold,
      italic,
      normal,
      weight,
      hasMarkers,
      range,
    } = snapshot;

    // Non-text items (neumes) only need stray markers cleaned off.
    if (!isText) {
      if (hasMarkers) {
        removeLegacyMarkers(writer, range);
        return true;
      }

      return false;
    }

    let newFamily = family;
    let desired: string | null;

    if (fontStyle == null) {
      // Fresh from upcast (or default-font text): derive the font style from the
      // face name, then fold in any legacy markers.
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
