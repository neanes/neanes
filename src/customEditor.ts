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
  Paragraph,
  PasteFromOffice,
  Plugin,
  RemoveFormatEditing,
  SelectAllEditing,
  ShiftEnter,
  SubscriptEditing,
  SuperscriptEditing,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
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
import NeanesFakeSelectionEditing from './ckeditor-plugins/richtextselection/richtextselection';

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
  InsertNeume,
  Link,
  ListEditing,
  NeanesFakeSelectionEditing,
  Paragraph,
  PasteFromOffice,
  RemoveFormatEditing,
  SelectAllEditing,
  ShiftEnter,
  SubscriptEditing,
  SuperscriptEditing,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
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
  },
  translations: [elTranslations, idTranslations, roTranslations],
  fontFamily: {
    supportAllValues: true,
  },
  fontSize: {
    supportAllValues: true,
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
  },
};
