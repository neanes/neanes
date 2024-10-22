type MusicXmlYesNoType = 'yes' | 'no';
export type MusicXmlStepType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
type MusicXmlMeasureContentType =
  | MusicXmlNote
  | MusicXmlBarline
  | MusicXmlPrint
  | MusicXmlSound;

type MusicXmlTagType = 'note' | 'barline' | 'print' | 'sound';

class Token<T> {
  tag: string;
  value: T | null;

  constructor(tag: string, value: T | null) {
    this.tag = tag;
    this.value = value;
  }

  toXml() {
    return this.value != null ? `${this.tag}="${this.value}"` : '';
  }
}

export class MusicXmlYesNo extends Token<MusicXmlYesNoType> {}

export class MusicXmlMeasure {
  number: number;
  contents: MusicXmlMeasureContentType[] = [];
  attributes?: MusicXmlAttributes;

  constructor(number: number) {
    this.number = number;
  }

  toXml() {
    let contents = '';
    this.contents.forEach((x) => (contents += x.toXml()));

    const xml = `<measure number="${this.number}">
      ${this.attributes?.toXml() ?? ''}
      ${contents}
    </measure>`;

    return xml;
  }
}

export class MusicXmlPrint {
  tag: MusicXmlTagType = 'print';
  newSystem: MusicXmlYesNo = new MusicXmlYesNo('new-system', null);

  toXml() {
    const xml = `<print ${this.newSystem.toXml() ?? ''}></print>`;

    return xml;
  }
}

export class MusicXmlSound {
  tag: MusicXmlTagType = 'sound';
  tempo?: number = 120;

  toXml() {
    const tempo = this.tempo != null ? `tempo="${this.tempo}"` : undefined;
    const xml = `<sound ${tempo ?? ''}></sound>`;

    return xml;
  }
}

export class MusicXmlAttributes {
  divisions?: MusicXmlDivisions;
  clef?: MusicXmlClef;
  key?: MusicXmlKey;

  toXml() {
    const xml = `<attributes>
        ${this.divisions?.toXml() ?? ''}
        ${this.clef?.toXml() ?? ''}
        ${this.key?.toXml() ?? ''}
      </attributes>`;

    return xml;
  }
}

export class MusicXmlKey {
  fifths?: MusicXmlFifths;
  stepsAndAlters: Array<MusicXmlKeyStep | MusicXmlKeyAlter> = [];
  octaves: MusicXmlKeyOctave[] = [];

  toXml() {
    let stepsAndAlters = '';
    this.stepsAndAlters.forEach((x) => (stepsAndAlters += x.toXml()));

    let octaves = '';
    this.octaves.forEach((x) => (octaves += x.toXml()));

    const xml = `<key>${this.fifths?.toXml() ?? ''}${stepsAndAlters}${octaves}</key>`;

    return xml;
  }
}

export class MusicXmlFifths {
  contents: number;

  constructor(contents: number) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<fifths>${this.contents}</fifths>`;

    return xml;
  }
}
export class MusicXmlKeyStep {
  contents: MusicXmlStepType;

  constructor(contents: MusicXmlStepType) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<key-step>${this.contents}</key-step>`;

    return xml;
  }
}

export class MusicXmlKeyAlter {
  contents: number;

  constructor(contents: number) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<key-alter>${this.contents}</key-alter>`;

    return xml;
  }
}

export class MusicXmlKeyOctave {
  number: number;
  contents: number;

  constructor(number: number, contents: number) {
    this.number = number;
    this.contents = contents;
  }

  toXml() {
    const xml = `<key-octave number="${this.number}">${this.contents}</key-octave>`;

    return xml;
  }
}

export class MusicXmlClef {
  sign: MusicXmlSign;
  line: MusicXmlLine;

  constructor(sign: MusicXmlSign, line: MusicXmlLine) {
    this.sign = sign;
    this.line = line;
  }

  toXml() {
    const xml = `<clef>${this.sign.toXml()}${this.line.toXml()}</clef>`;

    return xml;
  }
}

export class MusicXmlSign {
  contents: string;

  constructor(contents: string) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<sign>${this.contents}</sign>`;

    return xml;
  }
}

export class MusicXmlLine {
  contents: number;

  constructor(contents: number) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<line>${this.contents}</line>`;

    return xml;
  }
}

export class MusicXmlDivisions {
  contents: number;

  constructor(contents: number) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<divisions>${this.contents}</divisions>`;

    return xml;
  }
}

export class MusicXmlNote {
  tag: MusicXmlTagType = 'note';
  pitch?: MusicXmlPitch;
  rest?: MusicXmlRest;
  duration: number = 1;
  type: string = 'quarter';
  dot?: MusicXmlDot;
  lyric?: MusicXmlLyric;

  constructor(duration: number, type: string) {
    this.duration = duration;
    this.type = type;
  }

  toXml() {
    const xml = `<note>
        ${this.pitch?.toXml() ?? ''}
        ${this.rest?.toXml() ?? ''}
        <duration>${this.duration}</duration>
        <type>${this.type}</type>
        ${this.dot?.toXml() ?? ''}
        ${this.lyric?.toXml() ?? ''}
      </note>`;

    return xml;
  }
}

export class MusicXmlRest {
  toXml() {
    const xml = `<rest/>`;

    return xml;
  }
}

export class MusicXmlPitch {
  step: MusicXmlStepType;
  octave: number;
  alter?: MusicXmlAlter;

  constructor(step: MusicXmlStepType, octave: number, alter?: MusicXmlAlter) {
    this.step = step;
    this.octave = octave;
    this.alter = alter;
  }

  clone() {
    return new MusicXmlPitch(this.step, this.octave, this.alter?.clone());
  }

  toXml() {
    const xml = `<pitch>
          <step>${this.step}</step>
          <octave>${this.octave}</octave>
          ${this.alter?.toXml() ?? ''}
        </pitch>`;

    return xml;
  }
}

export class MusicXmlAlter {
  content: number;

  constructor(content: number) {
    this.content = content;
  }

  clone() {
    return new MusicXmlAlter(this.content);
  }

  toXml() {
    const xml = `<alter>${this.content}</alter>`;

    return xml;
  }
}

export class MusicXmlDot {
  toXml() {
    const xml = `<dot/>`;

    return xml;
  }
}

export class MusicXmlLyric {
  text: MusicXmlText;
  syllabic?: MusicXmlSyllabic;
  extend?: MusicXmlExtend;

  constructor(text: MusicXmlText) {
    this.text = text;
  }

  toXml() {
    const xml = `<lyric>
          ${this.syllabic?.toXml() ?? ''}
          ${this.text.toXml()}
          ${this.extend?.toXml() ?? ''}
        </lyric>`;

    return xml;
  }
}

type MusicXmlSyllabicType = 'begin' | 'end' | 'middle' | 'syllable';

export class MusicXmlSyllabic {
  contents: MusicXmlSyllabicType;

  constructor(contents: MusicXmlSyllabicType) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<syllabic>${this.contents}</syllabic>`;

    return xml;
  }
}

export class MusicXmlExtend {
  toXml() {
    const xml = `<extend></extend>`;

    return xml;
  }
}

export class MusicXmlText {
  content: string;

  constructor(content: string) {
    this.content = content;
  }

  toXml() {
    const xml = `<text>${this.content}</text>`;

    return xml;
  }
}

export class MusicXmlBarline {
  tag: MusicXmlTagType = 'barline';
  barStyle?: MusicXmlBarStyle;

  toXml() {
    const xml = `<barline>${this.barStyle?.toXml() ?? ''}</barline>`;

    return xml;
  }
}

type MusicXmlBarStyleType =
  | 'regular'
  | 'dotted'
  | 'dashed'
  | 'heavy'
  | 'light-light'
  | 'light-heavy'
  | 'heavy-light'
  | 'heavy-heavy'
  | 'tick'
  | 'short'
  | 'none';

export class MusicXmlBarStyle {
  contents: MusicXmlBarStyleType;

  constructor(contents: MusicXmlBarStyleType) {
    this.contents = contents;
  }

  toXml() {
    const xml = `<bar-style>${this.contents}</bar-style>`;

    return xml;
  }
}
