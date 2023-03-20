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
import { NeumeMappingService, SbmuflGlyphName } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

interface NeumeOffset {
  x: number | null;
  y: number | null;
}

const NoOffset: NeumeOffset = { x: null, y: null };
const byzhtmlVersion = process.env.VUE_APP_BYZHTML_VERSION;

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
  classTextBox: string;
  classTextBoxInline: string;
  classModeKey: string;
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
    classTextBox: 'byz--text-box',
    classTextBoxInline: 'byz--text-box-inline',
    classModeKey: 'byz--mode-key',
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

      ${this.config.tagLyric} {
        color: ${pageSetup.lyricsDefaultColor};
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
        font-family: ${pageSetup.lyricsDefaultFontFamily};
        font-size: ${Unit.toPt(pageSetup.lyricsDefaultFontSize)}pt;
        font-weight ${pageSetup.lyricsDefaultFontWeight};
        font-style: ${pageSetup.lyricsDefaultFontStyle};
        color: ${pageSetup.lyricsDefaultColor};
        -webkit-text-stroke-width: ${pageSetup.lyricsDefaultStrokeWidth};
      }

      .${this.config.classTextBoxInline} {
        display: flex;
        align-items: center;
      }

      .${this.config.classModeKey} {
        font-size: ${Unit.toPt(pageSetup.modeKeyDefaultFontSize)}pt;
        color: ${pageSetup.modeKeyDefaultColor};
        -webkit-text-stroke-width: ${pageSetup.modeKeyDefaultStrokeWidth};
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
        .replaceAll(
          '\u{1d0b4}',
          `<${this.getTag('pelastikon')}></${this.getTag('pelastikon')}>`,
        )
        .replaceAll(
          '\u{1d0b5}',
          `<${this.getTag('gorthmikon')}></${this.getTag('gorthmikon')}>`,
        );

      inner += `<${this.config.tagLyric}>${lyrics}</${
        this.config.tagLyric
      }\n${this.getIndentationString(indentation)}>`;

      if (element.isMelismaStart) {
        const hyphenAttribute = element.isHyphen
          ? ` ${this.config.attributeMelismaHyphen}`
          : '';

        inner += `<${this.config.tagMelisma} ${
          this.config.attributeMelismaAuto
        }${hyphenAttribute}></${
          this.config.tagMelisma
        }\n${this.getIndentationString(indentation)}>`;
      }
    }

    return `<${this.config.tagNote}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</${this.config.tagNote}\n${this.getIndentationString(
      indentation,
    )}>`;
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

    return `<${
      this.config.tagMartyria
    }${classAttribute}\n${this.getIndentationString(
      indentation + 2,
    )}>${inner}</${this.config.tagMartyria}\n${this.getIndentationString(
      indentation,
    )}>`;
  }

  exportDropCap(element: DropCapElement, indentation: number) {
    return `<${this.config.tagDropCap}>${element.content}</${
      this.config.tagDropCap
    }\n${this.getIndentationString(indentation)}>`;
  }

  exportTempo(element: TempoElement, indentation: number) {
    return this.exportNeume(element.neume, 0, NoOffset, this.config.classTempo);
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
    map.set('trigorgonSecondary', 'x-ggg-2');
    map.set('trigorgonDottedLeftBelowSecondary', 'x-dggg-2');
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
    map.set('yfesis2', 'x-yf2');
    map.set('yfesis4', 'x-yf4');
    map.set('yfesis6', 'x-yf6');
    map.set('yfesis8', 'x-yf8');
    map.set('yfesisGenikiAbove', 'x-yf-g');
    map.set('yfesisGenikiBelow', 'x-yf-g-b');
    map.set('barlineSingle', 'x-bar');
    map.set('barlineDouble', 'x-bar2');
    map.set('barlineTheseos', 'x-bar-th');
    map.set('barlineShortSingle', 'x-bar-s');
    map.set('barlineShortDouble', 'x-bar2-s');
    map.set('barlineShortTheseos', 'x-bar-th-s');
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
    map.set('isonIndicatorUnison', 'x-i-uni');
    map.set('isonIndicatorDiLow', 'x-i-di-low');
    map.set('isonIndicatorKeLow', 'x-i-ke-low');
    map.set('isonIndicatorZo', 'x-i-zo');
    map.set('isonIndicatorNi', 'x-i-ni');
    map.set('isonIndicatorPa', 'x-i-pa');
    map.set('isonIndicatorVou', 'x-i-vou');
    map.set('isonIndicatorGa', 'x-i-ga');
    map.set('isonIndicatorDi', 'x-i-di');
    map.set('isonIndicatorKe', 'x-i-ke');
    map.set('isonIndicatorZoHigh', 'x-i-zo-high');
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
