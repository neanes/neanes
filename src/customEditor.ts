import '@ckeditor/ckeditor5-style/dist/index.css';
import 'ckeditor5/ckeditor5.css';

import {
  AlignmentEditing,
  AutoImage,
  AutoLink,
  Base64UploadAdapter,
  Clipboard,
  DecoupledEditor,
  Enter,
  FindAndReplace,
  FontColorEditing,
  FontFamilyEditing,
  FontSizeEditing,
  GeneralHtmlSupport,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  IndentBlock,
  IndentEditing,
  Link,
  ListEditing,
  ListProperties,
  Paragraph,
  PasteFromOffice,
  Plugin,
  RemoveFormatEditing,
  SelectAllEditing,
  ShiftEnter,
  Style,
  SubscriptEditing,
  SuperscriptEditing,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextPartLanguage,
  TextTransformation,
  Typing,
  UnderlineEditing,
  UndoEditing,
  WidgetTypeAround,
} from 'ckeditor5';
import elTranslations from 'ckeditor5/translations/el.js';
import idTranslations from 'ckeditor5/translations/id.js';
import roTranslations from 'ckeditor5/translations/ro.js';

import FontStyle from './ckeditor-plugins/fontstyle/fontstyle';
import InsertNeume from './ckeditor-plugins/insertneume/insertneume';
import OpenType from './ckeditor-plugins/opentype/opentype';
import NeanesFakeSelectionEditing from './ckeditor-plugins/richtextselection/richtextselection';
import { RICH_TEXT_LANGUAGE_OPTIONS } from './utils/richTextLanguage';

export default class InlineEditor extends DecoupledEditor {}

// Widget is required by images, tables, and neumes, but CKEditor's type-around
// UI adds block-widget insertion handles and keyboard behavior we do not want.
class DisableWidgetTypeAround extends Plugin {
  public static get pluginName() {
    return 'DisableWidgetTypeAround' as const;
  }

  public static get requires() {
    return [WidgetTypeAround] as const;
  }

  public init() {
    this.editor.plugins
      .get(WidgetTypeAround)
      .forceDisabled('NeanesHeadlessRichText');
  }
}

InlineEditor.builtinPlugins = [
  AlignmentEditing,
  AutoImage,
  AutoLink,
  Base64UploadAdapter,
  Clipboard,
  DisableWidgetTypeAround,
  Enter,
  FindAndReplace,
  FontColorEditing,
  FontFamilyEditing,
  FontSizeEditing,
  GeneralHtmlSupport,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  IndentEditing,
  IndentBlock,
  FontStyle,
  OpenType,
  InsertNeume,
  Link,
  ListEditing,
  ListProperties,
  NeanesFakeSelectionEditing,
  Paragraph,
  PasteFromOffice,
  RemoveFormatEditing,
  SelectAllEditing,
  ShiftEnter,
  Style,
  SubscriptEditing,
  SuperscriptEditing,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextPartLanguage,
  TextTransformation,
  Typing,
  UnderlineEditing,
  UndoEditing,
];

InlineEditor.defaultConfig = {
  toolbar: {
    items: [],
  },
  menuBar: {
    isVisible: false,
  },
  language: {
    ui: 'en',
    content: 'en',
    textPartLanguage: RICH_TEXT_LANGUAGE_OPTIONS,
  },
  translations: [elTranslations, idTranslations, roTranslations],
  fontFamily: {
    supportAllValues: true,
  },
  fontSize: {
    supportAllValues: true,
  },
  list: {
    properties: {
      styles: {
        listStyleTypes: {
          bulleted: ['disc', 'circle', 'square'],
          numbered: [
            'decimal',
            'decimal-leading-zero',
            'lower-roman',
            'upper-roman',
            'lower-latin',
            'upper-latin',
            'arabic-indic',
          ],
        },
      },
    },
  },
  image: {
    toolbar: [
      'imageTextAlternative',
      'toggleImageCaption',
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
    ],
  },
  table: {
    contentToolbar: [
      'tableColumn',
      'tableRow',
      'mergeTableCells',
      'tableProperties',
      'tableCellProperties',
    ],
  },
  htmlSupport: {
    allow: [
      {
        name: 'span',
        styles: true,
        attributes: true,
      },
    ],
    // The OpenType plugin is the sole owner of these three properties: it upcasts
    // the values it models and drops the rest. Keep GeneralHtmlSupport from also
    // capturing them, which would otherwise leave a competing inner declaration
    // that overrides the plugin's own span.
    // TextPartLanguage similarly owns language metadata. If GHS also preserves
    // `dir`, removing the language leaves a stale `<span dir="...">`.
    disallow: [
      {
        name: 'span',
        attributes: ['lang', 'dir'],
      },
      {
        name: 'span',
        styles: [
          'font-variant-numeric',
          'font-variant-ligatures',
          'font-variant-caps',
        ],
      },
    ],
  },
};
