import YAML from 'yaml';

import {
  MartyriaElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '@/models/Element';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  QuantitativeNeume,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';

import { NeumeMappingService, SbmuflGlyphName } from '../NeumeMappingService';

export class OcrImporter {
  public import(data: string) {
    const analysis: OcrAnalysis = YAML.parse(data);

    const elements: ScoreElement[] = [];

    for (const page of analysis.pages) {
      for (let i = 0; i < page.interpreted_groups.length; i++) {
        const group = page.interpreted_groups[i];
        let prev: InterpretedNeumeGroup | null = null;
        let next: InterpretedNeumeGroup | null = null;

        if (i - 1 >= 0) {
          prev = page.interpreted_groups[i - 1];
        }

        if (i + 1 < page.interpreted_groups.length) {
          next = page.interpreted_groups[i + 1];
        }

        if (group.type === 'note') {
          const noteGroup = group as NoteGroup;
          const element = new NoteElement();
          elements.push(element);
          element.quantitativeNeume = NeumeMappingService.getReverseMapping(
            noteGroup.neume,
          ) as QuantitativeNeume;

          if (noteGroup.accidental) {
            element.accidental = NeumeMappingService.getReverseMapping(
              noteGroup.accidental,
            ) as Accidental;
          }

          if (noteGroup.fthora) {
            element.fthora = NeumeMappingService.getReverseMapping(
              noteGroup.fthora,
            ) as Fthora;
          }

          if (noteGroup.gorgon) {
            element.gorgonNeume = NeumeMappingService.getReverseMapping(
              noteGroup.gorgon,
            ) as GorgonNeume;
          }

          if (noteGroup.time) {
            element.timeNeume = NeumeMappingService.getReverseMapping(
              noteGroup.time,
            ) as TimeNeume;
          }

          if (noteGroup.quality) {
            element.vocalExpressionNeume =
              NeumeMappingService.getReverseMapping(
                noteGroup.quality,
              ) as VocalExpressionNeume;
          }

          element.vareia = noteGroup.vareia === true;
        } else if (group.type === 'martyria') {
          const martyriaGroup = group as MartyriaGroup;
          const element = new MartyriaElement();
          elements.push(element);
          if (martyriaGroup.fthora) {
            element.fthora = NeumeMappingService.getReverseMapping(
              martyriaGroup.fthora,
            ) as Fthora;
          }

          const curBase = page.matches.find(
            (m) => m.id === group.components.base,
          );

          const prevBase = page.matches.find(
            (m) => m.id === prev?.components.base,
          );

          // If the martyria is the last neume group on the line,
          // and if it is more than 2 * oligon_width away from the previous neume,
          // we assume it is a right aligned martyria.
          if (
            martyriaGroup.line !== next?.line &&
            curBase != null &&
            prevBase != null &&
            prev != null &&
            group.line === prev.line &&
            curBase.bounding_rect.x -
              (prevBase.bounding_rect.x + prevBase.bounding_rect.w) >=
              page.segmentation.oligon_width * 2
          ) {
            element.alignRight = true;
          }

          // TODO handle line break and alignRight
        } else if (group.type === 'tempo') {
          const tempoGroup = group as TempoGroup;
          const element = new TempoElement();
          elements.push(element);
          element.neume = NeumeMappingService.getReverseMapping(
            tempoGroup.neume,
          ) as TempoSign;
        }
      }
    }

    return elements;
  }
}

export class OcrAnalysis {
  public schema_version: number = 0;
  public model_metadata: ModelMetadata = new ModelMetadata();
  public pages: PageAnalysis[] = [];
}

export class ModelMetadata {
  public model_version: string = '';
  public classes: OcrClass[] = [];
}

export class PageAnalysis {
  public id: number = 0;
  public original_page_num?: number;
  public page_area?: 'left' | 'right';

  public segmentation: Segmentation = new Segmentation();
  public matches: ContourMatch[] = [];
  public interpreted_groups: InterpretedNeumeGroup[] = [];
}

export class InterpretedNeumeGroup {
  public id: number = 0;
  public line: number = 0;
  public type: 'note' | 'martyria' | 'tempo' = 'note';
  public components: {
    base: number;
    support?: number[];
  } = { base: 0 };
}

export class NoteGroup extends InterpretedNeumeGroup {
  public neume: SbmuflGlyphName = 'ison';
  public accidental?: SbmuflGlyphName;
  public fthora?: SbmuflGlyphName;
  public gorgon?: SbmuflGlyphName;
  public time?: SbmuflGlyphName;
  public quality?: SbmuflGlyphName;
  public vareia?: boolean = false;
}

export class MartyriaGroup extends InterpretedNeumeGroup {
  public fthora?: SbmuflGlyphName;
}

export class TempoGroup extends InterpretedNeumeGroup {
  public neume: SbmuflGlyphName = 'agogiMesi';
}

export class Segmentation {
  public page_width: number = 0;
  public page_height: number = 0;
  public oligon_width: number = 0;
  public oligon_height: number = 0;
  public avg_text_height: number = 0;
  public baselines: number[] = [];
  public textlines: number[] = [];
  public textlines_adj: number[] = [];
}

export class ContourMatch {
  public id: number = 0;
  public bounding_circle: Circle = new Circle();
  public bounding_rect: Rect = new Rect();
  public label: OcrClass | null = null;
  public confidence: number = 0;
  public line: number = 0;
}

export class Rect {
  public x: number = 0;
  public y: number = 0;
  public w: number = 0;
  public h: number = 0;
}

export class Circle {
  public x: number = 0;
  public y: number = 0;
  public r: number = 0;
}

export type OcrClass =
  | 'antikenoma'
  | 'antikenoma_apli'
  | 'apli'
  | 'apostrofos'
  | 'argon'
  | 'breath'
  | 'digorgon'
  | 'elafron'
  | 'elafron_apostrofos'
  | 'elafron_syndesmos'
  | 'flat_2'
  | 'flat_4'
  | 'flat_general'
  | 'fthora_diatonic_di'
  | 'fthora_diatonic_ke'
  | 'fthora_diatonic_ni'
  | 'fthora_diatonic_ni_high'
  | 'fthora_diatonic_pa'
  | 'fthora_diatonic_vou'
  | 'fthora_enharmonic'
  | 'fthora_hard_chromatic_di'
  | 'fthora_hard_chromatic_pa'
  | 'fthora_kliton'
  | 'fthora_soft_chromatic_di'
  | 'fthora_zygos'
  | 'gorgon'
  | 'hamili'
  | 'heteron'
  | 'ison'
  | 'ison_di'
  | 'ison_ke'
  | 'ison_low'
  | 'ison_ni'
  | 'ison_pa'
  | 'ison_unison'
  | 'kentima'
  | 'klasma'
  | 'kronos'
  | 'martyria_diatonic_di'
  | 'martyria_diatonic_ga'
  | 'martyria_diatonic_ke'
  | 'martyria_diatonic_vou'
  | 'martyria_diatonic_zo_low'
  | 'martyria_root_di'
  | 'martyria_root_pa'
  | 'martyria_root_vou'
  | 'martyria_soft_chromatic_di'
  | 'num_2'
  | 'num_3'
  | 'num_4'
  | 'oligon'
  | 'omalon'
  | 'paren_left'
  | 'paren_right'
  | 'petaste'
  | 'psifiston'
  | 'sharp_2'
  | 'sharp_general'
  | 'stavros'
  | 'trigorgon'
  | 'vareia'
  | 'yporroe'
  | 'ypsili';
