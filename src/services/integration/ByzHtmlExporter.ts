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

export class ByzHtmlExporter {
  neumeToTagMap: Map<Neume, string> = new Map<Neume, string>();

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

      x-lyrics {
        color: ${pageSetup.lyricsDefaultColor};
      }

      x-gorthmikon, x-pelastikon {
        --byz-neume-font-size: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
        line-height: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
      }

      x-martyria.byz--align-right {
        margin-left: auto;
      }

      .byz--line-break {
        margin-left: auto;
      }

      .byz--text-box {
        white-space: break-spaces;
      }

      .byz--text-box-inline {
        display: flex;
        align-items: center;
      }

      .byz--mode-key .byz--tempo {
        position: relative;
        top: -9pt;
        margin-left: 8px;
      }

      .byz--mode-key .byz--tempo-align-right {
        float: right;
      }

      .byz--neume-paragraph {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-bottom: ${Unit.toPt(pageSetup.neumeDefaultFontSize)}pt;
      }

      .byz--neume-paragraph:last-child {
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
    const classFthora = 'byz--fthora';
    const classGorgon = 'byz--gorgon';
    const classIson = 'byz--ison';
    const classNoteIndicator = 'byz--note-indicator';

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
      classGorgon,
    );

    inner += this.exportNeume(
      element.secondaryGorgonNeume,
      indentation + 2,
      {
        x: element.secondaryGorgonNeumeOffsetX,
        y: element.secondaryGorgonNeumeOffsetY,
      },
      classGorgon,
    );

    inner += this.exportNeume(
      element.fthora,
      indentation + 2,
      { x: element.fthoraOffsetX, y: element.fthoraOffsetY },
      classFthora,
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
        classNoteIndicator,
      );
    }

    inner += this.exportNeume(
      element.ison,
      indentation + 2,
      { x: element.isonOffsetX, y: element.isonOffsetY },
      classIson,
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
      let spacer = '';

      if (element.vareia) {
        spacer = '<x-spacer-vareia></x-spacer-vareia>';
      }

      if (element.quantitativeNeume === QuantitativeNeume.RunningElaphron) {
        spacer += '<x-spacer-apostrofos></x-spacer-apostrofos>';
      }

      let lyrics = element.lyrics
        .replaceAll('\u{1d0b4}', `<x-pelastikon></x-pelastikon`)
        .replaceAll('\u{1d0b5}', `<x-gorthmikon></x-gorthmikon`);

      inner += `<x-lyric slot="lyric">${spacer}${lyrics}</x-lyric\n${this.getIndentationString(
        indentation,
      )}>`;

      if (element.isMelisma) {
        inner += `<x-melisma slot="melisma">${element.melismaText.replaceAll(
          ' ',
          '&nbsp;',
        )}</x-melisma\n${this.getIndentationString(indentation)}>`;
      }
    }

    return `<x-note\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</x-note\n${this.getIndentationString(indentation)}>`;
  }

  exportMartyria(element: MartyriaElement, indentation: number) {
    const classFthora = 'byz--fthora';
    const classTempo = 'byz--martyria-tempo';
    const classAlignRight = 'byz--align-right';

    let inner = '';

    inner += this.exportNeume(element.note, indentation + 2);
    inner += this.exportNeume(element.rootSign, indentation + 2);
    inner += this.exportNeume(
      element.tempo,
      indentation + 2,
      NoOffset,
      classTempo,
    );
    inner += this.exportNeume(
      element.fthora,
      indentation + 2,
      NoOffset,
      classFthora,
    );

    let classAttribute = '';

    if (element.alignRight) {
      classAttribute = ` class="${classAlignRight}"`;
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
    return this.exportNeume(element.neume, 0, NoOffset, 'byz--tempo');
  }

  exportTextBox(element: TextBoxElement, indentation: number) {
    let style = '';

    let className = 'byz--text-box';

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

    if (element.inline) {
      className += ' byz--text-box-inline';
    }

    return `<div class="${className}" style="${style}">${
      element.content
    }</div\n${this.getIndentationString(indentation)}>`;
  }

  exportModeKey(element: ModeKeyElement, indentation: number) {
    const classFthora = 'byz--fthora';
    const classTempo = 'byz--tempo';
    const classTempoAlignRight = 'byz--tempo-align-right';

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
      classFthora,
    );
    inner += this.exportNeume(
      element.fthoraAboveNote,
      indentation + 2,
      NoOffset,
      classFthora,
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
      classFthora,
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
        ? classTempo + ' ' + classTempoAlignRight
        : classTempo,
    );

    let style = '';

    style += `color: ${element.computedColor};`;
    style += `font-family: ${getFontFamilyWithFallback(
      element.computedFontFamily,
    ).replaceAll('"', "'")};`;
    style += `font-size: ${Unit.toPt(element.computedFontSize)}pt;`;
    style += `text-align: ${element.alignment};`;
    style += `-webkit-text-stroke-width: ${element.computedStrokeWidth};`;

    return `<div class="byz--mode-key" style="${style}"\n${this.getIndentationString(
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

    const tag = this.getTag(neume);

    let styleAttribute = '';

    if (offset && offset.x != null && offset.y != null) {
      styleAttribute = ` left="${offset.x}em" top="${offset.y}em"`;
    }

    if (classname != null) {
      return `<${tag} class="${classname}"${styleAttribute}></${tag}\n${this.getIndentationString(
        indentation,
      )}>`;
    } else {
      return `<${tag}${styleAttribute}></${tag}\n${this.getIndentationString(
        indentation,
      )}>`;
    }
  }

  startPage(indentation: number) {
    return `<div class="byz--neume-paragraph"\n${this.getIndentationString(
      indentation,
    )}>`;
  }

  endPage(indentation: number, needLineBreak: boolean) {
    const lineBreak = needLineBreak
      ? `<div class="byz--line-break"></div\n${this.getIndentationString(
          indentation + 2,
        )}>`
      : '';

    return `${lineBreak}</div\n${this.getIndentationString(indentation)}>`;
  }

  getTag(neume: Neume) {
    if (!this.neumeToTagMap.has(neume)) {
      const glyphName = NeumeMappingService.getMapping(neume).glyphName;
      const pattern = /(?<!^)(?=[A-Z])/g;

      this.neumeToTagMap.set(
        neume,
        'x-' + glyphName.replaceAll(pattern, '-').toLowerCase(),
      );
    }

    return this.neumeToTagMap.get(neume);
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
