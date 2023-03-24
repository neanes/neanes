import { QuantitativeNeume } from '@/models/Neumes';

const neumeValueMap = new Map<QuantitativeNeume, number>([
  [QuantitativeNeume.Ison, 0],

  [QuantitativeNeume.Oligon, 1],
  [QuantitativeNeume.OligonPlusKentimaBelow, 2],
  [QuantitativeNeume.OligonPlusKentimaAbove, 3],
  [QuantitativeNeume.OligonPlusHypsiliRight, 4],
  [QuantitativeNeume.OligonPlusHypsiliLeft, 5],
  [QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal, 6],
  [QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical, 7],
  [QuantitativeNeume.OligonPlusDoubleHypsili, 8],
  [QuantitativeNeume.OligonKentimataDoubleYpsili, 9],
  [QuantitativeNeume.OligonKentimaDoubleYpsiliRight, 10],
  [QuantitativeNeume.OligonKentimaDoubleYpsiliLeft, 11],
  [QuantitativeNeume.OligonTripleYpsili, 12],
  [QuantitativeNeume.OligonKentimataTripleYpsili, 13],
  [QuantitativeNeume.OligonKentimaTripleYpsili, 14],

  [QuantitativeNeume.PetastiWithIson, 0],
  [QuantitativeNeume.Petasti, 1],
  [QuantitativeNeume.PetastiPlusOligon, 2],
  [QuantitativeNeume.PetastiPlusKentimaAbove, 3],
  [QuantitativeNeume.PetastiPlusHypsiliRight, 4],
  [QuantitativeNeume.PetastiPlusHypsiliLeft, 5],
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal, 6],
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical, 7],
  [QuantitativeNeume.PetastiPlusDoubleHypsili, 8],
  [QuantitativeNeume.PetastiKentimataDoubleYpsili, 9],
  [QuantitativeNeume.PetastiKentimaDoubleYpsiliRight, 10],
  [QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft, 11],
  [QuantitativeNeume.PetastiTripleYpsili, 12],
  [QuantitativeNeume.PetastiKentimataTripleYpsili, 13],
  [QuantitativeNeume.PetastiKentimaTripleYpsili, 14],

  [QuantitativeNeume.Apostrophos, -1],
  [QuantitativeNeume.Elaphron, -2],
  [QuantitativeNeume.ElaphronPlusApostrophos, -3],
  [QuantitativeNeume.Hamili, -4],
  [QuantitativeNeume.HamiliPlusApostrophos, -5],
  [QuantitativeNeume.HamiliPlusElaphron, -6],
  [QuantitativeNeume.HamiliPlusElaphronPlusApostrophos, -7],
  [QuantitativeNeume.DoubleHamili, -8],
  [QuantitativeNeume.DoubleHamiliApostrofos, -9],
  [QuantitativeNeume.DoubleHamiliElafron, -10],
  [QuantitativeNeume.DoubleHamiliElafronApostrofos, -11],
  [QuantitativeNeume.TripleHamili, -12],

  [QuantitativeNeume.PetastiPlusApostrophos, -1],
  [QuantitativeNeume.PetastiPlusElaphron, -2],
  [QuantitativeNeume.PetastiPlusElaphronPlusApostrophos, -3],
  [QuantitativeNeume.PetastiHamili, -4],
  [QuantitativeNeume.PetastiHamiliApostrofos, -5],
  [QuantitativeNeume.PetastiHamiliElafron, -6],
  [QuantitativeNeume.PetastiHamiliElafronApostrofos, -7],
  [QuantitativeNeume.PetastiDoubleHamili, -8],
  [QuantitativeNeume.PetastiDoubleHamiliApostrofos, -9],

  [QuantitativeNeume.OligonPlusKentemata, 2],
  [QuantitativeNeume.KentemataPlusOligon, 2],
  [QuantitativeNeume.OligonPlusIsonPlusKentemata, 1],
  [QuantitativeNeume.OligonPlusApostrophosPlusKentemata, 0],
  [QuantitativeNeume.OligonPlusHyporoePlusKentemata, -1],
  [QuantitativeNeume.OligonKentimaMiddleKentimata, 3],
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight, 5],
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft, 6],
  [QuantitativeNeume.OligonPlusElaphronPlusKentemata, -1],
  [QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata, -1],
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata, -2],
  [QuantitativeNeume.OligonPlusHamiliPlusKentemata, -3],

  [QuantitativeNeume.RunningElaphron, -2],
  [QuantitativeNeume.Hyporoe, -2],
  [QuantitativeNeume.PetastiPlusRunningElaphron, -2],
  [QuantitativeNeume.PetastiPlusHyporoe, -2],

  [QuantitativeNeume.OligonPlusIson, 0],
  [QuantitativeNeume.OligonPlusApostrophos, -1],
  [QuantitativeNeume.OligonPlusElaphron, -2],
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophos, -3],
  [QuantitativeNeume.OligonPlusHamili, -4],

  [QuantitativeNeume.Kentima, 2],
  [QuantitativeNeume.OligonPlusKentima, 2],
  [QuantitativeNeume.Kentemata, 1],

  [QuantitativeNeume.DoubleApostrophos, -2],
  [QuantitativeNeume.IsonPlusApostrophos, -1],

  [QuantitativeNeume.Cross, 0],
  [QuantitativeNeume.Breath, 0],
  [QuantitativeNeume.VareiaDotted, 0],
  [QuantitativeNeume.VareiaDotted2, 0],
  [QuantitativeNeume.VareiaDotted3, 0],
  [QuantitativeNeume.VareiaDotted4, 0],
]);

export function getNoteSpread(neume: QuantitativeNeume) {
  switch (neume) {
    case QuantitativeNeume.OligonPlusHamiliPlusKentemata:
    case QuantitativeNeume.OligonPlusIsonPlusKentemata:
    case QuantitativeNeume.OligonPlusElaphronPlusKentemata:
    case QuantitativeNeume.OligonPlusApostrophosPlusKentemata:
    case QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata:
    case QuantitativeNeume.OligonKentimaMiddleKentimata:
    case QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft:
    case QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight:
    case QuantitativeNeume.OligonPlusKentemata:
    case QuantitativeNeume.KentemataPlusOligon:
      return [-1, 0];
    case QuantitativeNeume.Hyporoe:
    case QuantitativeNeume.PetastiPlusHyporoe:
    case QuantitativeNeume.DoubleApostrophos:
    case QuantitativeNeume.RunningElaphron:
    case QuantitativeNeume.PetastiPlusRunningElaphron:
    case QuantitativeNeume.IsonPlusApostrophos:
      return [1, 0];
    case QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata:
    case QuantitativeNeume.OligonPlusHyporoePlusKentemata:
      return [0, -1, 0];
    default:
      return [0];
  }
}

export const getNeumeValue = (neume: QuantitativeNeume) =>
  neumeValueMap.get(neume);
