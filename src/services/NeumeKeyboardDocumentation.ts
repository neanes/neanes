import en from '@/i18n/en';
import {
  getFthoraLabelSelector,
  getGorgonNeumeLabelSelector,
  getMeasureBarLabelSelector,
  getQuantitativeNeumeLabelSelector,
  getScaleLabelSelector,
  getTempoSignLabelSelector,
  getTimeNeumeLabelSelector,
  getVocalExpressionNeumeLabelSelector,
  type ModelSelector,
} from '@/models/NeumeI18nMappings';
import type { Neume } from '@/models/Neumes';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  Note,
  QuantitativeNeume,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';

import type { KeyboardMapping } from './NeumeKeyboard';
import { NeumeMappingService } from './NeumeMappingService';

export interface NeumeKeyboardDocumentationSource {
  modifiers: ReadonlyArray<{ code: string; description: string }>;
  noteIndicatorKey: string;
  martyriaKey: string;
  klasmaKey: string;
  quantitativeMappings: readonly KeyboardMapping[];
  vocalExpressionMappings: readonly KeyboardMapping[];
  tieMappings: readonly KeyboardMapping[];
  hapliMappings: readonly KeyboardMapping[];
  gorgonMappings: readonly KeyboardMapping[];
  tempoMappings: readonly KeyboardMapping[];
  martyriaTempoMappings: readonly KeyboardMapping[];
  martyriaConfigMappings: readonly KeyboardMapping[];
  fthoraMappings: readonly KeyboardMapping[];
  accidentalMappings: readonly KeyboardMapping[];
  isonMappings: readonly KeyboardMapping[];
  measureBarMappings: readonly KeyboardMapping[];
  measureNumberMappings: readonly KeyboardMapping[];
}

const quantitativeNeumes = new Set<string>(Object.values(QuantitativeNeume));
const timeNeumes = new Set<string>(Object.values(TimeNeume));
const vocalExpressionNeumes = new Set<string>(
  Object.values(VocalExpressionNeume),
);
const gorgonNeumes = new Set<string>(Object.values(GorgonNeume));
const fthoras = new Set<string>(Object.values(Fthora));
const tempoSigns = new Set<string>(Object.values(TempoSign));
const measureBars = new Set<string>(Object.values(MeasureBar));
const isons = new Set<string>(Object.values(Ison));
const notes = new Set<string>(Object.values(Note));

function translate(selector: ModelSelector): string {
  return selector(en as never) as unknown as string;
}

function formatCode(code: string): string {
  return code
    .replace('Key', '')
    .replace('Digit', '')
    .replace('Comma', ',')
    .replace('Period', '.')
    .replace('Slash', '/')
    .replace('Equal', '=')
    .replace('Semicolon', ';')
    .replace('Quote', "'")
    .replace('BracketLeft', '[')
    .replace('BracketRight', ']');
}

function renderShortcut(mapping: KeyboardMapping): string {
  const keys: string[] = [];

  if (mapping.shiftKey) {
    keys.push('Shift');
  }

  if (mapping.modifier != null && mapping.modifier !== mapping.code) {
    keys.push(formatCode(mapping.modifier));
  }

  keys.push(formatCode(mapping.code));

  return keys.map((key) => `<kbd>${key}</kbd>`).join(' + ');
}

function renderShortcutForCode(code: string): string {
  return `<kbd>${formatCode(code)}</kbd>`;
}

function toCharacterReferences(text: string): string {
  return Array.from(
    text,
    (character) => `&#x${character.codePointAt(0)!.toString(16)};`,
  ).join('');
}

function getDisplayedNeume(mapping: KeyboardMapping): Neume {
  return mapping.neume ?? mapping.neumes![0];
}

function isUnadornedGlyph(neume: Neume): boolean {
  return (
    quantitativeNeumes.has(neume) ||
    tempoSigns.has(neume) ||
    measureBars.has(neume)
  );
}

function renderGlyph(mapping: KeyboardMapping): string {
  const neume = getDisplayedNeume(mapping);
  const glyph = NeumeMappingService.getMapping(neume).text;
  const ison = NeumeMappingService.getMapping(QuantitativeNeume.Ison).text;
  const oligon = NeumeMappingService.getMapping(QuantitativeNeume.Oligon).text;
  const kentemata = NeumeMappingService.getMapping(
    QuantitativeNeume.KentemataPlusOligon,
  ).text;

  let display = glyph;

  if (neume === VocalExpressionNeume.Vareia) {
    display += ison;
  } else if (
    neume === VocalExpressionNeume.Antikenoma ||
    neume === VocalExpressionNeume.Homalon
  ) {
    display = oligon + display;
  } else if (
    neume === VocalExpressionNeume.HomalonConnecting ||
    neume === VocalExpressionNeume.HeteronConnecting ||
    neume === VocalExpressionNeume.HeteronConnectingLong ||
    Object.values(Tie).includes(neume as Tie)
  ) {
    display = ison + display + ison;
  } else if (
    neume === GorgonNeume.Argon ||
    neume === GorgonNeume.Hemiolion ||
    neume === GorgonNeume.Diargon
  ) {
    display = kentemata + display;
  } else if (!isUnadornedGlyph(neume)) {
    display = ison + display;
  }

  return `<span class="neume" aria-hidden="true">${toCharacterReferences(display)}</span>`;
}

function getPositionQualifier(neume: QuantitativeNeume): string {
  if (neume.endsWith('Below')) {
    return ' (below)';
  }
  if (neume.endsWith('Above')) {
    return ' (above)';
  }
  if (neume.endsWith('Left')) {
    return ' (left)';
  }
  if (neume.endsWith('Right')) {
    return ' (right)';
  }
  if (neume.endsWith('Horizontal')) {
    return ' (horizontal)';
  }
  if (neume.endsWith('Vertical')) {
    return ' (vertical)';
  }
  return '';
}

function humanizeIdentifier(value: string): string {
  return value
    .replace(/^Ison\./, '')
    .replaceAll('_', ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace('Thi', 'Di');
}

function getNoteName(note: Note | Ison): string {
  const identifier = humanizeIdentifier(note);
  const octave = identifier.endsWith(' Low')
    ? ' (low)'
    : identifier.endsWith(' High')
      ? ' (high)'
      : '';
  const name = identifier.replace(/ (Low|High)$/, '');

  return name + octave;
}

function getNeumeName(neume: Neume): string {
  if (quantitativeNeumes.has(neume)) {
    const quantitative = neume as QuantitativeNeume;
    const label = translate(getQuantitativeNeumeLabelSelector(quantitative));

    if (quantitative === QuantitativeNeume.VareiaDotted) {
      return 'Rest (1 beat)';
    }
    if (quantitative === QuantitativeNeume.VareiaDotted2) {
      return 'Rest (2 beats)';
    }
    if (quantitative === QuantitativeNeume.VareiaDotted3) {
      return 'Rest (3 beats)';
    }
    if (quantitative === QuantitativeNeume.VareiaDotted4) {
      return 'Rest (4 beats)';
    }

    return label + getPositionQualifier(quantitative);
  }

  if (timeNeumes.has(neume)) {
    return translate(getTimeNeumeLabelSelector(neume as TimeNeume));
  }

  if (vocalExpressionNeumes.has(neume)) {
    const vocalExpression = neume as VocalExpressionNeume;
    const label = translate(
      getVocalExpressionNeumeLabelSelector(vocalExpression),
    );

    if (vocalExpression === VocalExpressionNeume.PsifistonSlanted) {
      return `${label} (slanted)`;
    }
    if (vocalExpression === VocalExpressionNeume.HeteronConnectingLong) {
      return `${label} (long)`;
    }

    return label;
  }

  if (gorgonNeumes.has(neume)) {
    const gorgon = neume as GorgonNeume;
    const label = translate(getGorgonNeumeLabelSelector(gorgon));
    const dotted = gorgon.match(/Dotted(Left|Right)([12])?/);

    if (dotted != null) {
      const dotNumber = dotted[2] == null ? '' : ` ${dotted[2]}`;
      return `${label} (dot${dotNumber} ${dotted[1].toLowerCase()})`;
    }

    return label;
  }

  if (fthoras.has(neume)) {
    return `${translate(getFthoraLabelSelector(neume as Fthora))} fthora`;
  }

  if (tempoSigns.has(neume)) {
    return translate(getTempoSignLabelSelector(neume as TempoSign));
  }

  if (measureBars.has(neume)) {
    return `Measure bar: ${translate(
      getMeasureBarLabelSelector(neume as MeasureBar),
    )}`;
  }

  if (isons.has(neume)) {
    return neume === Ison.Unison
      ? 'Unison indicator'
      : `Ison: ${getNoteName(neume as Ison)}`;
  }

  if (notes.has(neume)) {
    return getNoteName(neume as Note);
  }

  if (Object.values(MeasureNumber).includes(neume as MeasureNumber)) {
    return `Measure number ${humanizeIdentifier(neume).toLowerCase()}`;
  }

  if (Object.values(Accidental).includes(neume as Accidental)) {
    return humanizeIdentifier(neume).replace(
      / (Left|Right)$/,
      (_, position: string) => ` (${position.toLowerCase()})`,
    );
  }

  if (Object.values(Tie).includes(neume as Tie)) {
    return 'Yfen (above or below)';
  }

  return humanizeIdentifier(neume);
}

function renderMappingTable(
  title: string,
  mappings: readonly KeyboardMapping[],
): string {
  const rows = mappings
    .filter((mapping) => mapping.neume != null || mapping.neumes != null)
    .map((mapping) => {
      const neume = getDisplayedNeume(mapping);
      return `| ${renderGlyph(mapping)} | ${getNeumeName(neume)} | ${renderShortcut(mapping)} |`;
    });

  return [
    `## ${title}`,
    '',
    '| Symbol | Name | Keyboard shortcut |',
    '| :----: | ---- | ----------------- |',
    ...rows,
    '',
  ].join('\n');
}

function renderNamedMappingTable(
  title: string,
  mappings: readonly KeyboardMapping[],
  getName: (mapping: KeyboardMapping) => string,
): string {
  return [
    `### ${title}`,
    '',
    '| Name | Keyboard shortcut |',
    '| ---- | ----------------- |',
    ...mappings.map(
      (mapping) => `| ${getName(mapping)} | ${renderShortcut(mapping)} |`,
    ),
    '',
  ].join('\n');
}

function getAcceptsLyricsName(mapping: KeyboardMapping): string {
  switch (mapping.acceptsLyricsOption) {
    case 'Yes':
      return 'Set Accepts Lyrics to Yes';
    case 'MelismaOnly':
      return 'Set Accepts Lyrics to Melisma Only';
    case 'Default':
      return 'Set Accepts Lyrics to Default';
    case 'No':
      return 'Set Accepts Lyrics to No';
    default:
      throw new Error('Expected an Accepts Lyrics mapping');
  }
}

function getMartyriaToggleName(mapping: KeyboardMapping): string {
  if (mapping.martyriaAlignmentToggle) {
    return 'Toggle Right Align';
  }
  if (mapping.martyriaAutoToggle) {
    return 'Toggle Auto-calculated';
  }
  throw new Error('Expected a martyria toggle mapping');
}

export function generateNeumeKeyboardDocumentation(
  source: NeumeKeyboardDocumentationSource,
): string {
  const quantityMappings = source.quantitativeMappings.filter(
    (mapping) => mapping.acceptsLyricsOption == null,
  );
  const acceptsLyricsMappings = source.quantitativeMappings.filter(
    (mapping) => mapping.acceptsLyricsOption != null,
  );
  const noteMappings = source.martyriaConfigMappings.filter(
    (mapping) =>
      mapping.note != null &&
      !mapping.shiftKey &&
      !mapping.martyriaAlignmentToggle,
  );
  const scaleMappings = source.martyriaConfigMappings.filter(
    (mapping) => mapping.scale != null,
  );
  const toggleMappings = source.martyriaConfigMappings.filter(
    (mapping) =>
      mapping.note == null &&
      (mapping.martyriaAlignmentToggle || mapping.martyriaAutoToggle),
  );
  const klasmaMapping: KeyboardMapping = {
    code: source.klasmaKey,
    neume: TimeNeume.Klasma_Top,
  };

  const result = [
    '<!-- Generated by node scripts/generate-keyboard-documentation.mjs. -->',
    '',
    '## Modifier keys',
    '',
    'Hold a modifier with your left hand, then press the shortcut key with your right hand. `Shift` can be added where shown.',
    '',
    '| Key | Category |',
    '| :-: | -------- |',
    ...source.modifiers.map(
      ({ code, description }) =>
        `| ${renderShortcutForCode(code)} | ${description} |`,
    ),
    '',
    renderMappingTable('Characters of Quantity', quantityMappings),
    renderNamedMappingTable(
      'Lyric acceptance',
      acceptsLyricsMappings,
      getAcceptsLyricsName,
    ),
    renderMappingTable('Characters of Quality', [
      ...source.vocalExpressionMappings,
      ...source.tieMappings,
    ]),
    renderMappingTable('Characters of Temporal Augmentation', [
      klasmaMapping,
      ...source.hapliMappings,
    ]),
    renderMappingTable(
      'Characters of Temporal Division',
      source.gorgonMappings,
    ),
    renderMappingTable('Characters of Tempo', source.tempoMappings),
    '## Martyrias of the Notes',
    '',
    `Press ${renderShortcutForCode(source.martyriaKey)} to insert an auto-calculated martyria. Hold <kbd>Shift</kbd> while using one of the note shortcuts below to insert a right-aligned martyria.`,
    '',
    renderNamedMappingTable('Notes', noteMappings, (mapping) =>
      getNeumeName(mapping.note!),
    ),
    renderNamedMappingTable('Martyria options', toggleMappings, (mapping) =>
      getMartyriaToggleName(mapping),
    ),
    renderNamedMappingTable('Scales', scaleMappings, (mapping) =>
      translate(getScaleLabelSelector(mapping.scale!)),
    ),
    renderMappingTable('Tempo Above a Martyria', source.martyriaTempoMappings),
    renderMappingTable('Fthoras', source.fthoraMappings),
    renderMappingTable('Signs of Alteration', source.accidentalMappings),
    renderMappingTable('Ison Indicators', source.isonMappings),
    '## Note Indicators',
    '',
    `Press ${renderShortcutForCode(source.noteIndicatorKey)} to toggle the automatically calculated note indicator on the selected quantitative neume.`,
    '',
    renderMappingTable('Measure Bars', source.measureBarMappings),
    renderMappingTable('Measure Numbers', source.measureNumberMappings),
  ];

  return `${result.join('\n').trim()}\n`;
}
