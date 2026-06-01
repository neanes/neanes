import { LatexExporterOptions } from '@/services/integration/LatexExporter';
import { MusicXmlExporterOptions } from '@/services/integration/MusicXmlExporter';

export enum ExportFormat {
  HTML = 'HTML',
  PDF = 'PDF',
  PNG = 'PNG',
  SVG = 'SVG',
  MusicXml = 'MusicXml',
  Latex = 'Latex',
}

export interface ExportAsPngSettings {
  dpi: number;
  openFolder: boolean;
  transparentBackground: boolean;
}

export interface ExportAsMusicXmlSettings {
  options: MusicXmlExporterOptions;
  openFolder: boolean;
  compressed: boolean;
}

export interface ExportAsLatexSettings {
  options: LatexExporterOptions;
}
