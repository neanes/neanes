import { Note, RootSign } from '@/models/Neumes';
import { getNoteValue } from '@/models/Scales';

const lowRootSignMap = new Map<RootSign, RootSign>([
  [RootSign.Legetos, RootSign.LegetosLow],
  [RootSign.Nana, RootSign.NanaLow],
  [RootSign.Delta, RootSign.DeltaLow],
  [RootSign.DeltaDotted, RootSign.DeltaDottedLow],
  [RootSign.Alpha, RootSign.AlphaLow],
  [RootSign.AlphaDotted, RootSign.AlphaDottedLow],
  [RootSign.Zo, RootSign.ZoLow],
  [RootSign.SoftChromaticPaRootSign, RootSign.SoftChromaticPaRootSignLow],
  [RootSign.SoftChromaticSquiggle, RootSign.SoftChromaticSquiggleLow],
  [RootSign.Tilt, RootSign.TiltLow],
  [RootSign.Squiggle, RootSign.SquiggleLow],
  [RootSign.Zygos, RootSign.ZygosLow],
]);

export function normalizeRootSign(note: Note, rootSign: RootSign) {
  if (getNoteValue(note) <= getNoteValue(Note.KeLow)) {
    rootSign = lowRootSignMap.get(rootSign) || rootSign;
  }

  return rootSign;
}
