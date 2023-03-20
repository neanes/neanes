import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import {
  MeasureBar,
  Neume,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
  ModeSign,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Score } from '@/models/Score';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { Unit } from '@/utils/Unit';
import { NeumeMappingService } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

interface NeumeOffset {
  x: number | null;
  y: number | null;
}

const NoOffset: NeumeOffset = { x: null, y: null };
const byzhtmlVersion = process.env.VUE_APP_BYZHTML_VERSION;

interface TagInfo {
  tag: string;
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
  classTextBox: string;
  classTextBoxInline: string;
  classModeKey: string;
  classLineBreak: string;
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
    classTextBox: 'byz--text-box',
    classTextBoxInline: 'byz--text-box-inline',
    classModeKey: 'byz--mode-key',
    classLineBreak: 'byz--line-break',
  };

  exportScore(score: Score) {
    const style = this.exportPageSetup(score.pageSetup);

    const body = this.exportElements(score.staff.elements, 4);

    const result = `<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/danielgarthur/byzhtml@${byzhtmlVersion}/dist/Neanes.css"
    />
    
    <script src="https://cdn.jsdelivr.net/gh/danielgarthur/byzhtml@${byzhtmlVersion}/dist/byzhtml.min.js"></script>

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
    let orientation = pageSetup.landscape ? 'landscape' : 'portrait';

    let style = `:root {
        --byz-neume-font-size: ${Unit.toPt(pageSetup.neumeDefaultFontSize)}pt;
        
        --byz-lyric-font-family: ${pageSetup.lyricsDefaultFontFamily};
        --byz-lyric-font-size: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
        --byz-lyric-offset-h: 3.6pt;
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

      x-lyrics {
        color: ${pageSetup.lyricsDefaultColor};
      }

      x-gorthmikon, x-pelastikon {
        --byz-neume-font-size: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
        line-height: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
      }

      x-martyria.${this.config.classMartyriaAlignRight} {
        margin-left: auto;
      }

      .${this.config.classLineBreak} {
        margin-left: auto;
      }

      .${this.config.classTextBox} {
        white-space: break-spaces;
      }

      .${this.config.classTextBoxInline} {
        display: flex;
        align-items: center;
      }

      .${this.config.classModeKey} .${this.config.classTempo} {
        position: relative;
        top: -9pt;
        margin-left: 8px;
      }

      .${this.config.classModeKey} .${this.config.classTempoAlignRight} {
        float: right;
      }

      .${this.config.classNeumeParagraph} {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-bottom: ${Unit.toPt(pageSetup.neumeDefaultFontSize)}pt;
      }

      .${this.config.classNeumeParagraph}:last-child {
        margin-bottom: 0;
      }
`;

    return style;
  }

  exportElements(
    elements: ScoreElement[],
    indentation: number,
    startInsidePage: boolean = false,
  ) {
    let result = '';

    let insidePage = startInsidePage;
    let needLineBreak = true;

    for (let element of elements) {
      switch (element.elementType) {
        case ElementType.Note:
          if (!insidePage) {
            result += this.startPage(indentation + 2);
            insidePage = true;
          }

          result += this.exportNote(element as NoteElement, indentation + 2);
          needLineBreak = true;
          break;
        case ElementType.Martyria:
          if (!insidePage) {
            result += this.startPage(indentation + 2);
            insidePage = true;
          }

          result += this.exportMartyria(
            element as MartyriaElement,
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
            result += this.startPage(indentation + 2);
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
            result += this.startPage(indentation + 2);
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
        case ElementType.ModeKey:
          if (insidePage) {
            result += this.endPage(indentation + 2, needLineBreak);
            insidePage = false;
          }

          result += this.exportModeKey(element as ModeKeyElement, indentation);
          break;
      }

      if (element.lineBreak || element.pageBreak) {
        if (insidePage) {
          result += this.endPage(indentation + 2, true);
          insidePage = false;
        }
      }
    }

    if (insidePage) {
      result += this.endPage(indentation + 2, needLineBreak);
    }

    return result;
  }

  exportNote(element: NoteElement, indentation: number) {
    let inner = '';

    if (element.vareia) {
      inner += this.exportNeume(VocalExpressionNeume.Vareia, indentation + 2, {
        x: element.vareiaOffsetX,
        y: element.vareiaOffsetY,
      });
    }

    if (element.measureBarLeft) {
      inner += this.exportNeume(MeasureBar.MeasureBarRight, indentation + 2, {
        x: element.measureBarRightOffsetX,
        y: element.measureBarRightOffsetY,
      });
    }

    inner += this.exportNeume(element.quantitativeNeume, indentation + 2);

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

    inner += this.exportNeume(element.accidental, indentation + 2, {
      x: element.accidentalOffsetX,
      y: element.accidentalOffsetY,
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
      let lyrics = element.lyrics
        .replaceAll('\u{1d0b4}', `<x-pelastikon></x-pelastikon`)
        .replaceAll('\u{1d0b5}', `<x-gorthmikon></x-gorthmikon`);

      inner += `<x-lyric>${lyrics}</x-lyric\n${this.getIndentationString(
        indentation,
      )}>`;

      if (element.isMelismaStart) {
        const hyphenAttribute = element.isHyphen ? ' hyphen' : '';

        inner += `<x-melisma auto${hyphenAttribute}></x-melisma\n${this.getIndentationString(
          indentation,
        )}>`;
      }
    }

    return `<x-note\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</x-note\n${this.getIndentationString(indentation)}>`;
  }

  exportMartyria(element: MartyriaElement, indentation: number) {
    let inner = '';

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

    let classAttribute = '';

    if (element.alignRight) {
      classAttribute = ` class="${this.config.classMartyriaAlignRight}"`;
    }

    return `<x-martyria${classAttribute}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</x-martyria\n${this.getIndentationString(indentation)}>`;
  }

  exportDropCap(element: DropCapElement, indentation: number) {
    return `<x-drop-cap>${
      element.content
    }</x-drop-cap\n${this.getIndentationString(indentation)}>`;
  }

  exportTempo(element: TempoElement, indentation: number) {
    return this.exportNeume(element.neume, 0, NoOffset, this.config.classTempo);
  }

  exportTextBox(element: TextBoxElement, indentation: number) {
    let styleAttribute = '';

    let className = this.config.classTextBox;

    if (!element.useDefaultStyle) {
      let style = '';

      style += `color: ${element.computedColor};`;
      style += `font-family: ${getFontFamilyWithFallback(
        element.computedFontFamily,
      ).replaceAll('"', "'")};`;
      style += `font-size: ${Unit.toPt(element.computedFontSize)}pt;`;
      style += `font-weight: ${element.computedFontWeight};`;
      style += `font-style: ${element.computedFontStyle};`;
      style += `text-align: ${element.alignment};`;
      style += `-webkit-text-stroke-width: ${element.computedStrokeWidth};`;
      //style += `width: ${element.width};`;
      //style += `height: ${element.height};`;

      styleAttribute = ` style="${style}"`;
    }

    if (element.inline) {
      className += ` ${this.config.classTextBoxInline}`;
    }

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
      element.fthora,
      indentation + 2,
      NoOffset,
      this.config.classFthora,
    );
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

    inner += this.exportNeume(
      element.tempo,
      indentation + 2,
      NoOffset,
      element.tempoAlignRight
        ? this.config.classTempo + ' ' + this.config.classTempoAlignRight
        : this.config.classTempo,
    );

    let styleAttribute = '';

    if (!element.useDefaultStyle) {
      let style = '';

      style += `color: ${element.computedColor};`;
      style += `font-family: ${getFontFamilyWithFallback(
        element.computedFontFamily,
      ).replaceAll('"', "'")};`;
      style += `font-size: ${Unit.toPt(element.computedFontSize)}pt;`;
      style += `text-align: ${element.alignment};`;
      style += `-webkit-text-stroke-width: ${element.computedStrokeWidth};`;

      styleAttribute = ` style="${style}"`;
    }

    return `<div class="${
      this.config.classModeKey
    }"${styleAttribute}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</div\n${this.getIndentationString(indentation)}>`;
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

    if (offset && offset.x != null && offset.y != null) {
      styleAttribute = ` left="${offset.x}em" top="${offset.y}em";`;
    }

    if (tagInfo.salt != null) {
      saltAttribute = ` salt="${tagInfo.salt}"`;
    }

    if (classname != null) {
      classAttribute = ` class="${classname}"`;
    }

    return `<${
      tagInfo.tag
    } ${classAttribute}${styleAttribute}${saltAttribute}></${
      tagInfo.tag
    }\n${this.getIndentationString(indentation)}>`;
  }

  startPage(indentation: number) {
    return `<div class="${
      this.config.classNeumeParagraph
    }"\n${this.getIndentationString(indentation)}>`;
  }

  endPage(indentation: number, needLineBreak: boolean) {
    const lineBreak = needLineBreak
      ? `<div class="${
          this.config.classLineBreak
        }"></div\n${this.getIndentationString(indentation + 2)}>`
      : '';

    return `${lineBreak}</div\n${this.getIndentationString(indentation)}>`;
  }

  getTagInfo(neume: Neume) {
    if (!this.neumeToTagMap.has(neume)) {
      const mapping = NeumeMappingService.getMapping(neume);
      const pattern = /(?<!^)(?=[A-Z0-9])/g;

      this.neumeToTagMap.set(neume, {
        tag: 'x-' + mapping.glyphName.replaceAll(pattern, '-').toLowerCase(),
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

    const font = `${pageSetup.dropCapDefaultFontStyle} normal ${pageSetup.dropCapDefaultFontWeight} ${pageSetup.dropCapDefaultFontSize}px "${pageSetup.dropCapDefaultFontFamily}"`;

    const fontBoundingBoxDescent =
      TextMeasurementService.getFontBoundingBoxDescent('R', font);

    // TODO this doesn't work correctly for every font
    return (
      neumeHeight +
      pageSetup.lyricsDefaultFontSize +
      pageSetup.lyricsVerticalOffset -
      fontBoundingBoxDescent
    );
  }
}
