import {
  DropCapElement,
  ElementType,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import {
  MeasureBar,
  ModeSign,
  Neume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Score } from '@/models/Score';
import { GORTHMIKON, PELASTIKON } from '@/utils/constants';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { Unit } from '@/utils/Unit';

import { MelismaHelperGreek } from '../MelismaHelperGreek';
import { NeumeMappingService, SbmuflGlyphName } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

interface NeumeOffset {
  x: number | null;
  y: number | null;
}

const NoOffset: NeumeOffset = { x: null, y: null };
const byzhtmlVersion = import.meta.env.VITE_BYZHTML_VERSION;

interface TagInfo {
  tag: string;
  glyphName: string;
  salt: number | undefined;
}

interface ByzHtmlExporterConfig {
  classFthora: string;
  classGorgon: string;
  classIson: string;
  classNoteIndicator: string;
  classTempo: string;
  classTempoAbove: string;
  classMartyriaAlignRight: string;
  classTempoAlignRight: string;
  classNeumeParagraph: string;
  classNeumeParagraphCenter: string;
  classTextBox: string;
  classTextBoxInline: string;
  classRichTextBox: string;
  classImageBox: string;
  classImageBoxInline: string;
  classModeKey: string;
  classModeKeyRightContainer: string;
  classModeKeyAmbitus: string;
  classModeKeyAmbitusText: string;
  classModeKeyAmbitusHigh: string;
  classModeKeyAmbitusLow: string;
  classLineBreak: string;

  tagLyric: string;
  tagMelisma: string;
  tagNote: string;
  tagMartyria: string;
  tagDropCap: string;

  attributeMelismaAuto: string;
  attributeMelismaHyphen: string;

  mapNeumeTag: Map<string, string>;
}

export class ByzHtmlExporter {
  neumeToTagMap: Map<Neume, TagInfo> = new Map<Neume, TagInfo>();

  config: ByzHtmlExporterConfig = {
    classFthora: 'byz--f',
    classGorgon: 'byz--g',
    classIson: 'byz--ii',
    classNoteIndicator: 'byz--ni',
    classTempo: 'byz--t',
    classTempoAbove: 'byz--t-m',
    classMartyriaAlignRight: 'byz--m-align-right',
    classTempoAlignRight: 'byz--t-align-right',
    classNeumeParagraph: 'byz--neume-paragraph',
    classNeumeParagraphCenter: 'byz--neume-paragraph-center',
    classTextBox: 'byz--text-box',
    classRichTextBox: 'byz---rich-text-box',
    classTextBoxInline: 'byz--text-box-inline',
    classImageBox: 'byz--image-box',
    classImageBoxInline: 'byz--image-box-inline',
    classModeKey: 'byz--mode-key',
    classModeKeyRightContainer: 'byz--mode-key-right-container',
    classModeKeyAmbitus: 'byz--mode-key-ambitus',
    classModeKeyAmbitusText: 'byz--mode-key-ambitus-text',
    classModeKeyAmbitusLow: 'byz--mode-key-ambitus-low',
    classModeKeyAmbitusHigh: 'byz--mode-key-ambitus-high',
    classLineBreak: 'byz--line-break',

    tagLyric: 'x-ly',
    tagMelisma: 'x-mel',
    tagNote: 'x-n',
    tagMartyria: 'x-m',
    tagDropCap: 'x-dc',

    attributeMelismaAuto: 'a',
    attributeMelismaHyphen: 'h',

    mapNeumeTag: this.createNeumeTagMap(),
  };

  exportScore(score: Score) {
    const style = this.exportPageSetup(score.pageSetup);

    const body = this.exportElements(score.staff.elements, score.pageSetup, 4);

    let injectRtl = '';

    if (score.pageSetup.melkiteRtl) {
      injectRtl = `<script>      
  byzhtml.options.melkiteRtl = true;
</script>`;
    }

    const result = `<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/danielgarthur/byzhtml@${byzhtmlVersion}/dist/Neanes.css"
    />
    
    <script src="https://cdn.jsdelivr.net/gh/danielgarthur/byzhtml@${byzhtmlVersion}/dist/byzhtml.min.js"></script>

    ${injectRtl}

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0"
    />

    <meta charset="UTF-8">

    <style>
      ${style}
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`;

    return result;
  }

  exportPageSetup(pageSetup: PageSetup) {
    const orientation = pageSetup.landscape ? 'landscape' : 'portrait';

    const rtlParagraph = pageSetup.melkiteRtl ? 'direction: rtl' : '';
    const lyricOffsetH = pageSetup.melkiteRtl ? '0' : '3.6pt';

    const style = `:root {
        --byz-neume-font-family: ${pageSetup.neumeDefaultFontFamily};
        --byz-neume-font-size: ${Unit.toPt(pageSetup.neumeDefaultFontSize)}pt;
        
        --byz-lyric-font-family: ${pageSetup.lyricsDefaultFontFamily};
        --byz-lyric-font-size: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
        --byz-lyric-offset-h: ${lyricOffsetH};
        --byz-lyric-offset-v: ${Unit.toPt(pageSetup.lyricsVerticalOffset)}pt;

        --byz-drop-cap-font-family: ${pageSetup.dropCapDefaultFontFamily};
        --byz-drop-cap-font-size: ${Unit.toPt(
          pageSetup.dropCapDefaultFontSize,
        )}pt;
        --byz-drop-cap-offset-v: ${Unit.toPt(
          this.getDropCapAdjustment(pageSetup),
        )}pt;
        --byz-drop-cap-color: ${pageSetup.dropCapDefaultColor};

        --byz-color-accidental: ${pageSetup.accidentalDefaultColor};
        --byz-color-agogi: ${pageSetup.tempoDefaultColor};
        --byz-color-barline: ${pageSetup.measureBarDefaultColor};
        --byz-color-fthora: ${pageSetup.fthoraDefaultColor};
        --byz-color-gorgon: ${pageSetup.gorgonDefaultColor};
        --byz-color-heteron: ${pageSetup.heteronDefaultColor};
        --byz-color-ison-indicator: ${pageSetup.isonDefaultColor};
        --byz-color-koronis: ${pageSetup.koronisDefaultColor};
        --byz-color-martyria: ${pageSetup.martyriaDefaultColor};
        --byz-color-measure-number: ${pageSetup.measureNumberDefaultColor};
        --byz-color-note-indicator: ${pageSetup.noteIndicatorDefaultColor};
      }
      
      body {
        margin: ${Unit.toPt(pageSetup.topMargin)}px ${Unit.toPt(
          pageSetup.rightMargin,
        )}px ${Unit.toPt(pageSetup.bottomMargin)}px ${Unit.toPt(
          pageSetup.leftMargin,
        )}px;
      }

      @page {
        margin: ${Unit.toPt(pageSetup.topMargin)}px ${Unit.toPt(
          pageSetup.rightMargin,
        )}px ${Unit.toPt(pageSetup.bottomMargin)}px ${Unit.toPt(
          pageSetup.leftMargin,
        )}px;
        size: ${pageSetup.pageSize} ${orientation}
      }

      @media print {
        body {
          margin: 0;
        }
      }

      @media screen and (max-width: 768px) {
        body {
          margin: 24px;
        }
      }

      ${this.config.tagLyric} {
        color: ${pageSetup.lyricsDefaultColor};
      }

      ${this.config.tagDropCap} {
        font-weight: ${pageSetup.dropCapDefaultFontWeight};
        font-style: ${pageSetup.dropCapDefaultFontStyle};
        -webkit-text-stroke-width: ${pageSetup.dropCapDefaultStrokeWidth};
      }

      ${this.getTag('gorthmikon')}, ${this.getTag('pelastikon')} {
        --byz-neume-font-size: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
        line-height: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
      }

      ${this.config.tagMartyria}.${this.config.classMartyriaAlignRight} {
        margin-left: auto;
      }

      .${this.config.classLineBreak} {
        margin-left: auto;
      }

      .${this.config.classTextBox} {
        white-space: break-spaces;
        font-family: ${pageSetup.textBoxDefaultFontFamily};
        font-size: ${Unit.toPt(pageSetup.textBoxDefaultFontSize)}pt;
        font-weight: ${pageSetup.textBoxDefaultFontWeight};
        font-style: ${pageSetup.textBoxDefaultFontStyle};
        color: ${pageSetup.textBoxDefaultColor};
        -webkit-text-stroke-width: ${pageSetup.textBoxDefaultStrokeWidth};
      }

      .${this.config.classTextBoxInline} {
        display: flex;
        align-items: center;
      }

      .${this.config.classRichTextBox} {
        font-family: ${pageSetup.textBoxDefaultFontFamily};
        font-size: ${Unit.toPt(pageSetup.textBoxDefaultFontSize)}pt;
      }

      .${this.config.classImageBox} {
        display: flex;
        align-items: center;
      }

      .${this.config.classModeKey} {
        position: relative;
        font-size: ${Unit.toPt(pageSetup.modeKeyDefaultFontSize)}pt;
        color: ${pageSetup.modeKeyDefaultColor};
        -webkit-text-stroke-width: ${pageSetup.modeKeyDefaultStrokeWidth};
      }

      .${this.config.classModeKeyRightContainer} {
        position: absolute;
        right: 0;
      } 

      .${this.config.classModeKeyAmbitus} {
        position: relative;
        top: -4px;
      }

      .${this.config.classModeKeyAmbitusText} {
        font-family: Arial, Helvetica, sans-serif;
      }

      .${this.config.classModeKeyAmbitusLow} {
        margin-right: 10px;
        position: relative;
        top: -12px;
      }

      .${this.config.classModeKeyAmbitusHigh} {
        margin-left: 2px;
        margin-right: 4px;
        position: relative;
        top: -12px;
      }

      .${this.config.classModeKey} .${this.config.classTempo} {
        position: relative;
        top: -9pt;
        margin-left: 8px;
      }

      .${this.config.classModeKey} .${this.config.classTempoAlignRight} {
        position: absolute;
        right: 0;
      }

      .${this.config.classNeumeParagraph} {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-bottom: ${Unit.toPt(pageSetup.neumeDefaultFontSize)}pt;
        ${rtlParagraph}
      }

      .${this.config.classNeumeParagraph}:last-child {
        margin-bottom: 0;
      }

      .${this.config.classNeumeParagraphCenter} {
        justify-content: center;
      }
`;

    return style;
  }

  exportElements(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    indentation: number,
    startInsidePage: boolean = false,
  ) {
    let result = '';

    let insidePage = startInsidePage;
    let needLineBreak = true;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      switch (element.elementType) {
        case ElementType.Note:
          if (!insidePage) {
            result += this.startPage(indentation + 2, i, elements);
            insidePage = true;
          }

          result += this.exportNote(
            element as NoteElement,
            pageSetup,
            indentation + 2,
          );
          needLineBreak = true;
          break;
        case ElementType.Martyria:
          if (!insidePage) {
            result += this.startPage(indentation + 2, i, elements);
            insidePage = true;
          }

          result += this.exportMartyria(
            element as MartyriaElement,
            pageSetup,
            indentation + 2,
          );

          if ((element as MartyriaElement).alignRight) {
            result += this.endPage(indentation + 2, false);
            insidePage = false;
            needLineBreak = false;
          } else {
            needLineBreak = true;
          }
          break;
        case ElementType.DropCap:
          if (!insidePage) {
            result += this.startPage(indentation + 2, i, elements);
            insidePage = true;
          }

          result += this.exportDropCap(
            element as DropCapElement,
            indentation + 2,
          );

          needLineBreak = true;
          break;
        case ElementType.Tempo:
          if (!insidePage) {
            result += this.startPage(indentation + 2, i, elements);
            insidePage = true;
          }

          result += this.exportTempo(element as TempoElement, indentation + 2);

          needLineBreak = true;
          break;
        case ElementType.TextBox:
          if (insidePage && !(element as TextBoxElement).inline) {
            result += this.endPage(indentation + 2, needLineBreak);
            insidePage = false;
            needLineBreak = false;
          }

          result += this.exportTextBox(element as TextBoxElement, indentation);
          break;
        case ElementType.RichTextBox:
          if (insidePage) {
            result += this.endPage(indentation + 2, needLineBreak);
            insidePage = false;
            needLineBreak = false;
          }

          result += this.exportRichTextBox(
            element as RichTextBoxElement,
            indentation,
          );
          break;
        case ElementType.ModeKey:
          if (insidePage) {
            result += this.endPage(indentation + 2, needLineBreak);
            insidePage = false;
          }

          result += this.exportModeKey(element as ModeKeyElement, indentation);
          break;
        case ElementType.ImageBox:
          if (insidePage && !(element as ImageBoxElement).inline) {
            result += this.endPage(indentation + 2, needLineBreak);
            insidePage = false;
            needLineBreak = false;
          }

          result += this.exportImageBox(
            element as ImageBoxElement,
            indentation,
          );
          break;
      }

      if (
        (element.lineBreak &&
          element.lineBreakType !== LineBreakType.Justify) ||
        element.pageBreak
      ) {
        if (insidePage) {
          result += this.endPage(
            indentation + 2,
            element.pageBreak || element.lineBreakType !== LineBreakType.Center,
          );
          insidePage = false;
        }
      }
    }

    if (insidePage) {
      result += this.endPage(indentation + 2, needLineBreak);
    }

    return result;
  }

  exportNote(element: NoteElement, pageSetup: PageSetup, indentation: number) {
    let inner = '';

    if (element.measureBarLeft) {
      inner += this.exportNeume(element.measureBarLeft, indentation + 2, {
        x: element.measureBarLeftOffsetX,
        y: element.measureBarLeftOffsetY,
      });
    }

    if (element.vareia) {
      inner += this.exportNeume(VocalExpressionNeume.Vareia, indentation + 2, {
        x: element.vareiaOffsetX,
        y: element.vareiaOffsetY,
      });
    }

    inner += this.exportNeume(element.quantitativeNeume, indentation + 2);

    if (element.stavros) {
      inner += this.exportNeume(
        VocalExpressionNeume.Cross_Top,
        indentation + 2,
        {
          x: element.stavrosOffsetX,
          y: element.stavrosOffsetY,
        },
      );
    }

    inner += this.exportNeume(element.vocalExpressionNeume, indentation + 2, {
      x: element.vocalExpressionNeumeOffsetX,
      y: element.vocalExpressionNeumeOffsetY,
    });

    inner += this.exportNeume(element.timeNeume, indentation + 2, {
      x: element.timeNeumeOffsetX,
      y: element.timeNeumeOffsetY,
    });

    inner += this.exportNeume(
      element.gorgonNeume,
      indentation + 2,
      { x: element.gorgonNeumeOffsetX, y: element.gorgonNeumeOffsetY },
      this.config.classGorgon,
    );

    inner += this.exportNeume(
      element.secondaryGorgonNeume,
      indentation + 2,
      {
        x: element.secondaryGorgonNeumeOffsetX,
        y: element.secondaryGorgonNeumeOffsetY,
      },
      this.config.classGorgon,
    );

    inner += this.exportNeume(
      element.fthora,
      indentation + 2,
      { x: element.fthoraOffsetX, y: element.fthoraOffsetY },
      this.config.classFthora,
    );

    inner += this.exportNeume(
      element.secondaryFthora,
      indentation + 2,
      { x: element.secondaryFthoraOffsetX, y: element.secondaryFthoraOffsetY },
      this.config.classFthora,
    );

    inner += this.exportNeume(
      element.tertiaryFthora,
      indentation + 2,
      { x: element.tertiaryFthoraOffsetX, y: element.tertiaryFthoraOffsetY },
      this.config.classFthora,
    );

    inner += this.exportNeume(element.accidental, indentation + 2, {
      x: element.accidentalOffsetX,
      y: element.accidentalOffsetY,
    });

    inner += this.exportNeume(element.secondaryAccidental, indentation + 2, {
      x: element.secondaryAccidentalOffsetX,
      y: element.secondaryAccidentalOffsetY,
    });

    inner += this.exportNeume(element.tertiaryAccidental, indentation + 2, {
      x: element.tertiaryAccidentalOffsetX,
      y: element.tertiaryAccidentalOffsetY,
    });

    inner += this.exportNeume(element.measureNumber, indentation + 2, {
      x: element.measureNumberOffsetX,
      y: element.measureNumberOffsetY,
    });

    if (element.noteIndicator) {
      inner += this.exportNeume(
        element.noteIndicatorNeume,
        indentation + 2,
        { x: element.noteIndicatorOffsetX, y: element.noteIndicatorOffsetY },
        this.config.classNoteIndicator,
      );
    }

    inner += this.exportNeume(
      element.ison,
      indentation + 2,
      { x: element.isonOffsetX, y: element.isonOffsetY },
      this.config.classIson,
    );

    inner += this.exportNeume(element.tie, indentation + 2, {
      x: element.tieOffsetX,
      y: element.tieOffsetY,
    });

    if (element.koronis) {
      inner += this.exportNeume(TimeNeume.Koronis, indentation + 2, {
        x: element.koronisOffsetX,
        y: element.koronisOffsetY,
      });
    }

    if (element.measureBarRight) {
      inner += this.exportNeume(MeasureBar.MeasureBarRight, indentation + 2, {
        x: element.measureBarRightOffsetX,
        y: element.measureBarRightOffsetY,
      });
    }

    if (element.lyrics.trim() != '') {
      const lyrics = element.lyrics
        .replaceAll(
          PELASTIKON,
          `<${this.getTag('pelastikon')}></${this.getTag('pelastikon')}>`,
        )
        .replaceAll(
          GORTHMIKON,
          `<${this.getTag('gorthmikon')}></${this.getTag('gorthmikon')}>`,
        );

      inner += `<${this.config.tagLyric}>${lyrics}</${
        this.config.tagLyric
      }\n${this.getIndentationString(indentation)}>`;

      if (
        !pageSetup.disableGreekMelismata &&
        element.isMelismaStart &&
        !MelismaHelperGreek.isGreek(element.lyrics)
      ) {
        const hyphenAttribute = element.isHyphen
          ? ` ${this.config.attributeMelismaHyphen}`
          : '';

        inner += `<${this.config.tagMelisma} ${
          this.config.attributeMelismaAuto
        }${hyphenAttribute}></${
          this.config.tagMelisma
        }\n${this.getIndentationString(indentation)}>`;
      }
    } else if (element.melismaText.trim() != '') {
      inner += `<${this.config.tagLyric}>${element.melismaText}</${
        this.config.tagLyric
      }\n${this.getIndentationString(indentation)}>`;
    }

    return `<${this.config.tagNote}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</${this.config.tagNote}\n${this.getIndentationString(
      indentation,
    )}>`;
  }

  exportMartyria(
    element: MartyriaElement,
    pageSetup: PageSetup,
    indentation: number,
  ) {
    let inner = '';

    inner += this.exportNeume(
      element.tempoLeft,
      indentation + 2,
      NoOffset,
      this.config.classTempo,
    );
    inner += this.exportNeume(element.note, indentation + 2);
    inner += this.exportNeume(element.rootSign, indentation + 2);
    inner += this.exportNeume(
      element.tempo,
      indentation + 2,
      NoOffset,
      this.config.classTempoAbove,
    );
    inner += this.exportNeume(
      element.fthora,
      indentation + 2,
      NoOffset,
      this.config.classFthora,
    );

    inner += this.exportNeume(
      element.tempoRight,
      indentation + 2,
      NoOffset,
      this.config.classTempo,
    );

    let classAttribute = '';

    if (element.alignRight) {
      classAttribute = ` class="${this.config.classMartyriaAlignRight}"`;
    }

    let styleAttribute = '';

    const offset = pageSetup.martyriaVerticalOffset + element.verticalOffset;
    if (offset != 0) {
      let style = '';

      style += 'position: relative;';
      style += `top: ${Unit.toPt(offset)}pt;`;

      styleAttribute = ` style="${style}"`;
    }

    return `<${
      this.config.tagMartyria
    }${styleAttribute}${classAttribute}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</${this.config.tagMartyria}\n${this.getIndentationString(
      indentation,
    )}>`;
  }

  exportDropCap(element: DropCapElement, indentation: number) {
    let styleAttribute = '';

    if (!element.useDefaultStyle) {
      let style = '';

      style += `color: ${element.computedColor};`;
      style += `font-family: ${getFontFamilyWithFallback(
        element.computedFontFamily,
      ).replaceAll('"', "'")};`;
      style += `font-size: ${Unit.toPt(element.computedFontSize)}pt;`;
      style += `font-weight: ${element.computedFontWeight};`;
      style += `font-style: ${element.computedFontStyle};`;
      style += `line-height: ${element.computedLineHeight};`;
      style += `-webkit-text-stroke-width: ${element.computedStrokeWidth};`;

      styleAttribute = ` style="${style}"`;
    }

    return `<${this.config.tagDropCap}${styleAttribute}>${element.content}</${
      this.config.tagDropCap
    }\n${this.getIndentationString(indentation)}>`;
  }

  exportTempo(element: TempoElement, indentation: number) {
    return this.exportNeume(
      element.neume,
      indentation,
      NoOffset,
      this.config.classTempo,
    );
  }

  exportTextBox(element: TextBoxElement, indentation: number) {
    let styleAttribute = '';

    let className = this.config.classTextBox;

    let style = '';

    if (!element.inline || !element.useDefaultStyle) {
      style += `color: ${element.computedColor};`;
      style += `font-family: ${getFontFamilyWithFallback(
        element.computedFontFamily,
      ).replaceAll('"', "'")};`;
      style += `font-size: ${Unit.toPt(element.computedFontSize)}pt;`;
      style += `font-weight: ${element.computedFontWeight};`;
      style += `font-style: ${element.computedFontStyle};`;
      style += `line-height: ${element.computedLineHeight};`;
      style += `-webkit-text-stroke-width: ${element.computedStrokeWidth};`;
      //style += `width: ${element.width};`;
      //style += `height: ${element.height};`;
    }

    style += `text-align: ${element.alignment};`;

    styleAttribute = ` style="${style}"`;

    if (element.inline) {
      className += ` ${this.config.classTextBoxInline}`;
    }

    return `<div class="${className}"${styleAttribute}>${
      element.content
    }</div\n${this.getIndentationString(indentation)}>`;
  }

  exportRichTextBox(element: RichTextBoxElement, indentation: number) {
    const className = this.config.classRichTextBox;

    let styleAttribute = '';
    let style = '';

    if (element.rtl) {
      style += 'direction: rtl;';
    }

    styleAttribute = ` style="${style}"`;

    return `<div class="${className}"${styleAttribute}>${
      element.content
    }</div\n${this.getIndentationString(indentation)}>`;
  }

  exportModeKey(element: ModeKeyElement, indentation: number) {
    let inner = '';

    inner += this.exportNeume(ModeSign.Ekhos, indentation + 2);

    if (element.isPlagal) {
      inner += this.exportNeume(ModeSign.Plagal, indentation + 2);
    }

    if (element.isVarys) {
      inner += this.exportNeume(ModeSign.Varys, indentation + 2);
    }

    inner += this.exportNeume(element.martyria, indentation + 2);
    inner += this.exportNeume(element.note, indentation + 2);
    inner += this.exportNeume(
      element.fthoraAboveNote,
      indentation + 2,
      NoOffset,
      this.config.classFthora,
    );
    inner += this.exportNeume(
      element.quantitativeNeumeAboveNote,
      indentation + 2,
    );
    inner += this.exportNeume(element.note2, indentation + 2);
    inner += this.exportNeume(
      element.fthoraAboveNote2,
      indentation + 2,
      NoOffset,
      this.config.classFthora,
    );
    inner += this.exportNeume(
      element.quantitativeNeumeAboveNote2,
      indentation + 2,
    );
    inner += this.exportNeume(element.quantitativeNeumeRight, indentation + 2);
    inner += this.exportNeume(
      element.fthoraAboveQuantitativeNeumeRight,
      indentation + 2,
    );

    let rightContainer = false;

    if (element.showAmbitus) {
      inner += `<span class="${this.config.classModeKeyRightContainer}">`;
      rightContainer = true;

      inner += `<span class="${this.config.classModeKeyAmbitus}">`;
      inner += `<span class="${this.config.classModeKeyAmbitusText}">(</span>`;
      inner += `<span class="${this.config.classModeKeyAmbitusLow}">`;
      inner += this.exportNeume(
        element.ambitusLowNote,
        indentation + 2,
        NoOffset,
      );

      inner += this.exportNeume(
        element.ambitusLowRootSign,
        indentation + 2,
        NoOffset,
      );
      inner += '</span>';
      inner += `<span class="${this.config.classModeKeyAmbitusText}">-</span>`;
      inner += `<span class="${this.config.classModeKeyAmbitusHigh}">`;
      inner += this.exportNeume(
        element.ambitusHighNote,
        indentation + 2,
        NoOffset,
      );

      inner += this.exportNeume(
        element.ambitusHighRootSign,
        indentation + 2,
        NoOffset,
      );
      inner += '</span>';
      inner += `<span class="${this.config.classModeKeyAmbitusText}">)</span>`;
      inner += '</span>';
    }

    if (element.tempo && element.tempoAlignRight && !rightContainer) {
      inner += `<span class="${this.config.classModeKeyRightContainer}">`;
      rightContainer = true;
    }

    inner += this.exportNeume(
      element.tempo,
      indentation + 2,
      NoOffset,
      this.config.classTempo,
    );

    if (rightContainer) {
      inner += `</span>`;
    }

    let styleAttribute = '';
    let style = '';

    if (!element.useDefaultStyle) {
      style += `color: ${element.computedColor};`;
      style += `font-family: ${getFontFamilyWithFallback(
        element.computedFontFamily,
      ).replaceAll('"', "'")};`;
      style += `font-size: ${Unit.toPt(element.computedFontSize)}pt;`;
      style += `-webkit-text-stroke-width: ${element.computedStrokeWidth};`;
    }

    style += `text-align: ${element.alignment};`;

    styleAttribute = ` style="${style}"`;

    return `<div class="${
      this.config.classModeKey
    }"${styleAttribute}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</div\n${this.getIndentationString(indentation)}>`;
  }

  exportImageBox(element: ImageBoxElement, indentation: number) {
    let styleAttribute = '';

    let className = this.config.classImageBox;

    let style = '';

    if (!element.inline) {
      style += `justify-content: ${element.alignment};`;
    }

    style += `text-align: ${element.alignment};`;

    styleAttribute = ` style="${style}"`;

    if (element.inline) {
      className += ` ${this.config.classImageBoxInline}`;
    }

    const imgTag = `<img src="${element.data}" style="width: ${element.imageWidth}px; height: ${element.imageHeight}px" />`;

    return `<div class="${className}"${styleAttribute}>\n${this.getIndentationString(
      indentation + 4,
    )}${imgTag}\n${this.getIndentationString(
      indentation,
    )}</div\n${this.getIndentationString(indentation)}>`;
  }

  exportNeume(
    neume: Neume | null,
    indentation: number,
    offset?: NeumeOffset,
    classname?: string,
  ) {
    if (neume == null) {
      return '';
    }

    const tagInfo = this.getTagInfo(neume);

    let styleAttribute = '';
    let saltAttribute = '';
    let classAttribute = '';
    let nameAttribute = '';

    if (offset && offset.x != null && offset.y != null) {
      styleAttribute = ` left="${offset.x}em" top="${offset.y}em";`;
    }

    if (tagInfo.salt != null) {
      saltAttribute = ` salt="${tagInfo.salt}"`;
    }

    if (classname != null) {
      classAttribute = ` class="${classname}"`;
    }

    if (tagInfo.tag === 'x-neume') {
      nameAttribute = ` name=${tagInfo.glyphName}`;
    }

    return `<${
      tagInfo.tag
    }${classAttribute}${styleAttribute}${saltAttribute}${nameAttribute}></${
      tagInfo.tag
    }\n${this.getIndentationString(indentation)}>`;
  }

  startPage(indentation: number, index: number, elements: ScoreElement[]) {
    const center = this.shouldCenterParagraph(index, elements)
      ? ` ${this.config.classNeumeParagraphCenter}`
      : '';

    return `<div class="${
      this.config.classNeumeParagraph
    }${center}"\n${this.getIndentationString(indentation)}>`;
  }

  endPage(indentation: number, needLineBreak: boolean) {
    const lineBreak = needLineBreak
      ? `<div class="${
          this.config.classLineBreak
        }"></div\n${this.getIndentationString(indentation + 2)}>`
      : '';

    return `${lineBreak}</div\n${this.getIndentationString(indentation)}>`;
  }

  shouldCenterParagraph(index: number, elements: ScoreElement[]) {
    for (let i = index; i < elements.length; i++) {
      const element = elements[i];

      if (element.lineBreak && element.lineBreakType === LineBreakType.Center) {
        return true;
      }

      if (
        element.lineBreak ||
        element.pageBreak ||
        element.elementType === ElementType.ModeKey
      ) {
        return false;
      }

      if (
        element.elementType === ElementType.TextBox &&
        !(element as TextBoxElement).inline
      ) {
        return false;
      }

      if (
        element.elementType === ElementType.ImageBox &&
        !(element as ImageBoxElement).inline
      ) {
        return false;
      }

      if (
        element.elementType === ElementType.Martyria &&
        (element as MartyriaElement).alignRight
      ) {
        return false;
      }
    }

    return false;
  }

  getTagInfo(neume: Neume) {
    if (!this.neumeToTagMap.has(neume)) {
      const mapping = NeumeMappingService.getMapping(neume);

      this.neumeToTagMap.set(neume, {
        tag: this.getTag(mapping.glyphName) ?? 'x-neume',
        glyphName: mapping.glyphName,
        salt: mapping.salt,
      });
    }

    return this.neumeToTagMap.get(neume)!;
  }

  getIndentationString(indentation: number) {
    let result = '';

    for (let i = 0; i < indentation; i++) {
      result += ' ';
    }

    return result;
  }

  getDropCapAdjustment(pageSetup: PageSetup) {
    const neumeHeight = TextMeasurementService.getFontHeight(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const font = `${pageSetup.dropCapDefaultFontStyle} normal ${
      pageSetup.dropCapDefaultFontWeight
    } ${pageSetup.dropCapDefaultFontSize}px/${
      pageSetup.dropCapDefaultLineHeight ?? 'normal'
    } "${pageSetup.dropCapDefaultFontFamily}"`;

    const fontBoundingBoxDescent =
      TextMeasurementService.getFontBoundingBoxDescent(font);

    // TODO this doesn't work correctly for every font
    return (
      neumeHeight +
      pageSetup.lyricsDefaultFontSize +
      pageSetup.lyricsVerticalOffset -
      fontBoundingBoxDescent
    );
  }

  getTag(glyphName: SbmuflGlyphName) {
    return this.config.mapNeumeTag.get(glyphName);
  }

  createNeumeTagMap() {
    const map = new Map<string, string>();
    map.set('ison', 'x-i');
    map.set('oligon', 'x-o');
    map.set('oligonKentimaMiddle', 'x-o2-m');
    map.set('oligonKentimaBelow', 'x-o2');
    map.set('oligonKentimaAbove', 'x-o3');
    map.set('oligonYpsiliRight', 'x-o4');
    map.set('oligonYpsiliLeft', 'x-o5');
    map.set('oligonKentimaYpsiliRight', 'x-o6');
    map.set('oligonKentimaYpsiliMiddle', 'x-o7');
    map.set('oligonDoubleYpsili', 'x-o8');
    map.set('oligonKentimataDoubleYpsili', 'x-o9');
    map.set('oligonKentimaDoubleYpsiliRight', 'x-o10');
    map.set('oligonKentimaDoubleYpsiliLeft', 'x-o11');
    map.set('oligonTripleYpsili', 'x-o12');
    map.set('oligonKentimataTripleYpsili', 'x-o13');
    map.set('oligonKentimaTripleYpsili', 'x-o14');
    map.set('oligonIson', 'x-o-i');
    map.set('oligonApostrofos', 'x-o-a');
    map.set('oligonYporroi', 'x-o-y');
    map.set('oligonElafron', 'x-o-e');
    map.set('oligonElafronApostrofos', 'x-o-ea');
    map.set('oligonChamili', 'x-o-ch');
    map.set('isonApostrofos', 'x-i-a');
    map.set('apostrofos', 'x-a');
    map.set('apostrofosSyndesmos', 'x-aa');
    map.set('yporroi', 'x-y');
    map.set('elafron', 'x-e');
    map.set('runningElafron', 'x-re');
    map.set('elafronApostrofos', 'x-ea');
    map.set('chamili', 'x-ch');
    map.set('chamiliApostrofos', 'x-ch5');
    map.set('chamiliElafron', 'x-ch6');
    map.set('chamiliElafronApostrofos', 'x-ch7');
    map.set('doubleChamili', 'x-ch8');
    map.set('doubleChamiliApostrofos', 'x-ch9');
    map.set('doubleChamiliElafron', 'x-ch10');
    map.set('doubleChamiliElafronApostrofos', 'x-ch11');
    map.set('tripleChamili', 'x-ch12');
    map.set('petastiIson', 'x-p0');
    map.set('petasti', 'x-p');
    map.set('petastiOligon', 'x-p2');
    map.set('petastiKentima', 'x-p3');
    map.set('petastiYpsiliRight', 'x-p4');
    map.set('petastiYpsiliLeft', 'x-p5');
    map.set('petastiKentimaYpsiliRight', 'x-p6');
    map.set('petastiKentimaYpsiliMiddle', 'x-p7');
    map.set('petastiDoubleYpsili', 'x-p8');
    map.set('petastiKentimataDoubleYpsili', 'x-p9');
    map.set('petastiKentimaDoubleYpsiliRight', 'x-p10');
    map.set('petastiKentimaDoubleYpsiliLeft', 'x-p11');
    map.set('petastiTripleYpsili', 'x-p12');
    map.set('petastiKentimataTripleYpsili', 'x-p13');
    map.set('petastiKentimaTripleYpsili', 'x-p14');
    map.set('petastiApostrofos', 'x-p-a');
    map.set('petastiYporroi', 'x-p-y');
    map.set('petastiElafron', 'x-p-e');
    map.set('petastiRunningElafron', 'x-p-re');
    map.set('petastiElafronApostrofos', 'x-p-ea');
    map.set('petastiChamili', 'x-p-ch');
    map.set('petastiChamiliApostrofos', 'x-p-ch5');
    map.set('petastiChamiliElafron', 'x-p-ch6');
    map.set('petastiChamiliElafronApostrofos', 'x-p-ch7');
    map.set('petastiDoubleChamili', 'x-p-ch8');
    map.set('petastiDoubleChamiliApostrofos', 'x-p-ch9');
    map.set('kentima', 'x-kentima');
    map.set('kentimata', 'x-k');
    map.set('oligonKentimataBelow', 'x-ko');
    map.set('oligonKentimataAbove', 'x-ok');
    map.set('oligonIsonKentimata', 'x-o-i-k');
    map.set('oligonKentimaMiddleKentimata', 'x-o2-m-k');
    map.set('oligonYpsiliRightKentimata', 'x-o4-k');
    map.set('oligonYpsiliLeftKentimata', 'x-ο5-k');
    map.set('oligonApostrofosKentimata', 'x-o-a-k');
    map.set('oligonYporroiKentimata', 'x-o-y-k');
    map.set('oligonElafronKentimata', 'x-o-e-k');
    map.set('oligonRunningElafronKentimata', 'x-o-re-k');
    map.set('oligonElafronApostrofosKentimata', 'x-o-ea-k');
    map.set('oligonChamiliKentimata', 'x-o-ch-k');
    map.set('vareia', 'x-var');
    map.set('psifiston', 'x-psi');
    map.set('antikenoma', 'x-anti');
    map.set('omalon', 'x-om');
    map.set('omalonConnecting', 'x-om-c');
    map.set('heteron', 'x-et');
    map.set('heteronConnecting', 'x-et-c');
    map.set('endofonon', 'x-endofonon');
    map.set('yfenAbove', 'x-yfen-above');
    map.set('yfenBelow', 'x-yfen-below');
    map.set('stavros', 'x-stavros');
    map.set('breath', 'x-breath');
    map.set('stavrosAbove', 'x-stavros-above');
    map.set('klasmaAbove', 'x-kl');
    map.set('klasmaBelow', 'x-kl-b');
    map.set('apli', 'x-apli');
    map.set('dipli', 'x-dipli');
    map.set('tripli', 'x-tripli');
    map.set('tetrapli', 'x-tetrapli');
    map.set('koronis', 'x-koronis');
    map.set('leimma1', 'x-l1');
    map.set('leimma2', 'x-l2');
    map.set('leimma3', 'x-l3');
    map.set('leimma4', 'x-l4');
    map.set('leimmaDot', 'x-leimma-dot');
    map.set('gorgonAbove', 'x-g');
    map.set('gorgonBelow', 'x-g-b');
    map.set('gorgonDottedLeft', 'x-dg');
    map.set('gorgonDottedRight', 'x-gd');
    map.set('digorgon', 'x-gg');
    map.set('digorgonDottedLeftBelow', 'x-dgg');
    map.set('digorgonDottedLeftAbove', 'x-gdg');
    map.set('digorgonDottedRight', 'x-ggd');
    map.set('trigorgon', 'x-ggg');
    map.set('trigorgonDottedLeftBelow', 'x-dggg');
    map.set('trigorgonDottedLeftAbove', 'x-ggdg');
    map.set('trigorgonDottedRight', 'x-gggd');
    map.set('argon', 'x-argon');
    map.set('diargon', 'x-diargon');
    map.set('triargon', 'x-triargon');
    map.set('gorgonSecondary', 'x-g-2');
    map.set('gorgonDottedLeftSecondary', 'x-dg-2');
    map.set('gorgonDottedRightSecondary', 'x-gd-2');
    map.set('digorgonSecondary', 'x-gg-2');
    map.set('digorgonDottedLeftBelowSecondary', 'x-dgg-2');
    map.set('digorgonDottedRightSecondary', 'x-ggd-2');
    map.set('digorgonDottedLeftSecondary', 'x-gdg-2');
    map.set('trigorgonSecondary', 'x-ggg-2');
    map.set('trigorgonDottedLeftBelowSecondary', 'x-dggg-2');
    map.set('trigorgonDottedLeftSecondary', 'x-ggdg-2');
    map.set('trigorgonDottedRightSecondary', 'x-gggd-2');
    map.set('agogiPoliArgi', 'x-t1');
    map.set('agogiArgoteri', 'x-t2');
    map.set('agogiArgi', 'x-t3');
    map.set('agogiMetria', 'x-t4');
    map.set('agogiMesi', 'x-t5');
    map.set('agogiGorgi', 'x-t6');
    map.set('agogiGorgoteri', 'x-t7');
    map.set('agogiPoliGorgi', 'x-t8');
    map.set('agogiPoliArgiAbove', 'x-t1-m');
    map.set('agogiArgoteriAbove', 'x-t2-m');
    map.set('agogiArgiAbove', 'x-t3-m');
    map.set('agogiMetriaAbove', 'x-t4-m');
    map.set('agogiMesiAbove', 'x-t5-m');
    map.set('agogiGorgiAbove', 'x-t6-m');
    map.set('agogiGorgoteriAbove', 'x-t7-m');
    map.set('agogiPoliGorgiAbove', 'x-t8-m');
    map.set('martyriaNoteZoLow', 'x-m-zo-low');
    map.set('martyriaNoteNiLow', 'x-m-ni-low');
    map.set('martyriaNotePaLow', 'x-m-pa-low');
    map.set('martyriaNoteVouLow', 'x-m-vou-low');
    map.set('martyriaNoteGaLow', 'x-m-ga-low');
    map.set('martyriaNoteDiLow', 'x-m-di-low');
    map.set('martyriaNoteKeLow', 'x-m-ke-low');
    map.set('martyriaNoteZo', 'x-m-zo');
    map.set('martyriaNoteNi', 'x-m-ni');
    map.set('martyriaNotePa', 'x-m-pa');
    map.set('martyriaNoteVou', 'x-m-vou');
    map.set('martyriaNoteGa', 'x-m-ga');
    map.set('martyriaNoteDi', 'x-m-di');
    map.set('martyriaNoteKe', 'x-m-ke');
    map.set('martyriaNoteZoHigh', 'x-m-zo-high');
    map.set('martyriaNoteNiHigh', 'x-m-ni-high');
    map.set('martyriaNotePaHigh', 'x-m-pa-high');
    map.set('martyriaNoteVouHigh', 'x-m-vou-high');
    map.set('martyriaNoteGaHigh', 'x-m-ga-high');
    map.set('martyriaNoteDiHigh', 'x-m-di-high');
    map.set('martyriaNoteKeHigh', 'x-m-ke-high');
    map.set('martyriaTick', 'x-m-tick');
    map.set('martyriaZoBelow', 'x-m-varys');
    map.set('martyriaDeltaBelow', 'x-m-delta');
    map.set('martyriaAlphaBelow', 'x-m-alpha');
    map.set('martyriaLegetosBelow', 'x-m-legetos');
    map.set('martyriaNanaBelow', 'x-m-nana');
    map.set('martyriaDeltaDottedBelow', 'x-m-delta-aa');
    map.set('martyriaAlphaDottedBelow', 'x-m-alpha-aa');
    map.set('martyriaHardChromaticPaBelow', 'x-m-hc-pa');
    map.set('martyriaHardChromaticDiBelow', 'x-m-hc-di');
    map.set('martyriaSoftChromaticDiBelow', 'x-m-sc-di');
    map.set('martyriaSoftChromaticKeBelow', 'x-m-sc-ke');
    map.set('martyriaZygosBelow', 'x-m-zygos');
    map.set('martyriaZoAbove', 'x-m-varys-a');
    map.set('martyriaDeltaAbove', 'x-m-delta-a');
    map.set('martyriaAlphaAbove', 'x-m-alpha-a');
    map.set('martyriaLegetosAbove', 'x-m-legetos-a');
    map.set('martyriaNanaAbove', 'x-m-nana-a');
    map.set('martyriaDeltaDottedAbove', 'x-m-delta-aa-a');
    map.set('martyriaAlphaDottedAbove', 'x-m-alpha-aa-a');
    map.set('martyriaHardChromaticPaAbove', 'x-m-hc-pa-a');
    map.set('martyriaHardChromaticDiAbove', 'x-m-hc-di-a');
    map.set('martyriaSoftChromaticDiAbove', 'x-m-sc-di-a');
    map.set('martyriaSoftChromaticKeAbove', 'x-m-sc-ke-a');
    map.set('martyriaZygosAbove', 'x-m-zygos-a');
    map.set('fthoraDiatonicNiLowAbove', 'x-f-d-ni-low');
    map.set('fthoraDiatonicPaAbove', 'x-f-d-pa');
    map.set('fthoraDiatonicVouAbove', 'x-f-d-vou');
    map.set('fthoraDiatonicGaAbove', 'x-f-d-ga');
    map.set('fthoraDiatonicDiAbove', 'x-f-d-di');
    map.set('fthoraDiatonicKeAbove', 'x-f-d-ke');
    map.set('fthoraDiatonicZoAbove', 'x-f-d-zo');
    map.set('fthoraDiatonicNiHighAbove', 'x-f-d-ni-high');
    map.set('fthoraHardChromaticPaAbove', 'x-f-hc-pa');
    map.set('fthoraHardChromaticDiAbove', 'x-f-hc-di');
    map.set('fthoraSoftChromaticDiAbove', 'x-f-sc-di');
    map.set('fthoraSoftChromaticKeAbove', 'x-f-sc-ke');
    map.set('fthoraEnharmonicAbove', 'x-f-agem');
    map.set('chroaZygosAbove', 'x-f-zygos');
    map.set('chroaKlitonAbove', 'x-f-kliton');
    map.set('chroaSpathiAbove', 'x-f-spathi');
    map.set('fthoraDiatonicNiLowSecondary', 'x-f-d-ni-low-2');
    map.set('fthoraDiatonicPaSecondary', 'x-f-d-pa-2');
    map.set('fthoraDiatonicVouSecondary', 'x-f-d-vou-2');
    map.set('fthoraDiatonicGaSecondary', 'x-f-d-ga-2');
    map.set('fthoraDiatonicDiSecondary', 'x-f-d-di-2');
    map.set('fthoraDiatonicKeSecondary', 'x-f-d-ke-2');
    map.set('fthoraDiatonicZoSecondary', 'x-f-d-zo-2');
    map.set('fthoraDiatonicNiHighSecondary', 'x-f-d-ni-high-2');
    map.set('fthoraHardChromaticPaSecondary', 'x-f-hc-pa-2');
    map.set('fthoraHardChromaticDiSecondary', 'x-f-hc-di-2');
    map.set('fthoraSoftChromaticDiSecondary', 'x-f-sc-di-2');
    map.set('fthoraSoftChromaticKeSecondary', 'x-f-sc-ke-2');
    map.set('fthoraEnharmonicSecondary', 'x-f-agem-2');
    map.set('chroaZygosSecondary', 'x-f-zygos-2');
    map.set('chroaKlitonSecondary', 'x-f-kliton-2');
    map.set('chroaSpathiSecondary', 'x-f-spathi-2');
    map.set('fthoraDiatonicNiLowTertiary', 'x-f-d-ni-low-3');
    map.set('fthoraDiatonicPaTertiary', 'x-f-d-pa-3');
    map.set('fthoraDiatonicVouTertiary', 'x-f-d-vou-3');
    map.set('fthoraDiatonicGaTertiary', 'x-f-d-ga-3');
    map.set('fthoraDiatonicDiTertiary', 'x-f-d-di-3');
    map.set('fthoraDiatonicKeTertiary', 'x-f-d-ke-3');
    map.set('fthoraDiatonicZoTertiary', 'x-f-d-zo-3');
    map.set('fthoraDiatonicNiHighTertiary', 'x-f-d-ni-high-3');
    map.set('fthoraHardChromaticPaTertiary', 'x-f-hc-pa-3');
    map.set('fthoraHardChromaticDiTertiary', 'x-f-hc-di-3');
    map.set('fthoraSoftChromaticDiTertiary', 'x-f-sc-di-3');
    map.set('fthoraSoftChromaticKeTertiary', 'x-f-sc-ke-3');
    map.set('fthoraEnharmonicTertiary', 'x-f-agem-3');
    map.set('chroaZygosTertiary', 'x-f-zygos-3');
    map.set('chroaKlitonTertiary', 'x-f-kliton-3');
    map.set('chroaSpathiTertiary', 'x-f-spathi-3');
    map.set('fthoraDiatonicNiLowBelow', 'x-f-d-ni-low-b');
    map.set('fthoraDiatonicPaBelow', 'x-f-d-pa-b');
    map.set('fthoraDiatonicVouBelow', 'x-f-d-vou-b');
    map.set('fthoraDiatonicGaBelow', 'x-f-d-ga-b');
    map.set('fthoraDiatonicDiBelow', 'x-f-d-di-b');
    map.set('fthoraDiatonicKeBelow', 'x-f-d-ke-b');
    map.set('fthoraDiatonicZoBelow', 'x-f-d-zo-b');
    map.set('fthoraDiatonicNiHighBelow', 'x-f-d-ni-high-b');
    map.set('fthoraHardChromaticPaBelow', 'x-f-hc-pa-b');
    map.set('fthoraHardChromaticDiBelow', 'x-f-hc-di-b');
    map.set('fthoraSoftChromaticDiBelow', 'x-f-sc-di-b');
    map.set('fthoraSoftChromaticKeBelow', 'x-f-sc-ke-b');
    map.set('fthoraEnharmonicBelow', 'x-f-agem-b');
    map.set('chroaZygosBelow', 'x-f-zygos-b');
    map.set('chroaKlitonBelow', 'x-f-kliton-b');
    map.set('chroaSpathiBelow', 'x-f-spathi-b');
    map.set('diesis2', 'x-di2');
    map.set('diesis4', 'x-di4');
    map.set('diesis6', 'x-di6');
    map.set('diesis8', 'x-di8');
    map.set('diesisGenikiAbove', 'x-di-g');
    map.set('diesisGenikiBelow', 'x-di-g-b');
    map.set('diesis2Secondary', 'x-di2-2');
    map.set('diesis4Secondary', 'x-di4-2');
    map.set('diesis6Secondary', 'x-di6-2');
    map.set('diesis8Secondary', 'x-di8-2');
    map.set('diesis2Tertiary', 'x-di2-3');
    map.set('diesis4Tertiary', 'x-di4-3');
    map.set('diesis6Tertiary', 'x-di6-3');
    map.set('diesis8Tertiary', 'x-di8-3');
    map.set('diesisGenikiSecondary', 'x-di-g-2');
    map.set('diesisGenikiTertiary', 'x-di-g-3');
    map.set('yfesis2', 'x-yf2');
    map.set('yfesis4', 'x-yf4');
    map.set('yfesis6', 'x-yf6');
    map.set('yfesis8', 'x-yf8');
    map.set('yfesisGenikiAbove', 'x-yf-g');
    map.set('yfesisGenikiBelow', 'x-yf-g-b');
    map.set('yfesis2Secondary', 'x-yf2-2');
    map.set('yfesis4Secondary', 'x-yf4-2');
    map.set('yfesis6Secondary', 'x-yf6-2');
    map.set('yfesis8Secondary', 'x-yf8-2');
    map.set('yfesis2Tertiary', 'x-yf2-3');
    map.set('yfesis4Tertiary', 'x-yf4-3');
    map.set('yfesis6Tertiary', 'x-yf6-3');
    map.set('yfesis8Tertiary', 'x-yf8-3');
    map.set('yfesisGenikiSecondary', 'x-yf-g-2');
    map.set('yfesisGenikiTertiary', 'x-yf-g-3');
    map.set('barlineSingle', 'x-bar');
    map.set('barlineDouble', 'x-bar2');
    map.set('barlineTheseos', 'x-bar-th');
    map.set('barlineShortSingle', 'x-bar-s');
    map.set('barlineShortDouble', 'x-bar2-s');
    map.set('barlineShortTheseos', 'x-bar-th-s');
    map.set('barlineSingleAbove', 'x-bar-a');
    map.set('barlineDoubleAbove', 'x-bar2-a');
    map.set('barlineTheseosAbove', 'x-bar-th-a');
    map.set('barlineShortSingleAbove', 'x-bar-s-a');
    map.set('barlineShortDoubleAbove', 'x-bar2-s-a');
    map.set('barlineShortTheseosAbove', 'x-bar-th-s-a');
    map.set('measureNumber2', 'x-mn2');
    map.set('measureNumber3', 'x-mn3');
    map.set('measureNumber4', 'x-mn4');
    map.set('measureNumber5', 'x-mn5');
    map.set('measureNumber6', 'x-mn6');
    map.set('measureNumber7', 'x-mn7');
    map.set('measureNumber8', 'x-mn8');
    map.set('noteIndicatorNi', 'x-ni-ni');
    map.set('noteIndicatorPa', 'x-ni-pa');
    map.set('noteIndicatorVou', 'x-ni-vou');
    map.set('noteIndicatorGa', 'x-ni-ga');
    map.set('noteIndicatorDi', 'x-ni-di');
    map.set('noteIndicatorKe', 'x-ni-ke');
    map.set('noteIndicatorZo', 'x-ni-zo');
    map.set('isonIndicatorUnison', 'x-ii-uni');
    map.set('isonIndicatorDiLow', 'x-ii-di-low');
    map.set('isonIndicatorKeLow', 'x-ii-ke-low');
    map.set('isonIndicatorZo', 'x-ii-zo');
    map.set('isonIndicatorNi', 'x-ii-ni');
    map.set('isonIndicatorPa', 'x-ii-pa');
    map.set('isonIndicatorVou', 'x-ii-vou');
    map.set('isonIndicatorGa', 'x-ii-ga');
    map.set('isonIndicatorDi', 'x-ii-di');
    map.set('isonIndicatorKe', 'x-ii-ke');
    map.set('isonIndicatorZoHigh', 'x-ii-zo-high');
    map.set('gorthmikon', 'x-gor');
    map.set('pelastikon', 'x-pel');
    map.set('modeFirst', 'x-mode-first');
    map.set('modeSecond', 'x-mode-second');
    map.set('modeThird', 'x-mode-third');
    map.set('modeThirdNana', 'x-mode-third-nana');
    map.set('modeFourth', 'x-mode-fourth');
    map.set('modeLegetos', 'x-mode-legetos');
    map.set('modePlagalFirst', 'x-mode-plagal-first');
    map.set('modePlagalSecond', 'x-mode-plagal-second');
    map.set('modeVarys', 'x-mode-varys');
    map.set('modeVarys2', 'x-mode-varys2');
    map.set('modePlagalFourth', 'x-mode-plagal-fourth');
    map.set('modeNi', 'x-mode-ni');
    map.set('modePa', 'x-mode-pa');
    map.set('modeVou', 'x-mode-vou');
    map.set('modeGa', 'x-mode-ga');
    map.set('modeDi', 'x-mode-di');
    map.set('modeKe', 'x-mode-ke');
    map.set('modeZo', 'x-mode-zo');
    map.set('modeOligonKentimaAbove', 'x-mode-oligon-kentima-above');
    map.set('modeOligonYpsili', 'x-mode-oligon-ypsili');
    map.set('modeElafron', 'x-mode-elafron');
    map.set('modeRunningElafron', 'x-mode-running-elafron');
    map.set('modePlagal', 'x-mode-plagal');
    map.set('modeWordEchos', 'x-mode-word-echos');
    map.set('modeWordVarys', 'x-mode-word-varys');
    map.set('modeAlpha', 'x-mode-alpha');
    map.set('modeBeta', 'x-mode-beta');
    map.set('modeGamma', 'x-mode-gamma');
    map.set('modeDelta', 'x-mode-delta');
    map.set('modeAlphaCapital', 'x-mode-alpha-capital');
    map.set('modeBetaCapital', 'x-mode-beta-capital');
    map.set('modeGammaCapital', 'x-mode-gamma-capital');
    map.set('modeDeltaCapital', 'x-mode-delta-capital');
    return map;
  }
}
