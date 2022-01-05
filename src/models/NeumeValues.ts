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

  [QuantitativeNeume.PetastiWithIson, 0],
  [QuantitativeNeume.Petasti, 1],
  [QuantitativeNeume.PetastiPlusOligon, 2],
  [QuantitativeNeume.PetastiPlusKentimaAbove, 3],
  [QuantitativeNeume.PetastiPlusHypsiliRight, 4],
  [QuantitativeNeume.PetastiPlusHypsiliLeft, 5],
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal, 6],
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical, 7],
  [QuantitativeNeume.PetastiPlusDoubleHypsili, 8],

  [QuantitativeNeume.Apostrophos, -1],
  [QuantitativeNeume.Elaphron, -2],
  [QuantitativeNeume.ElaphronPlusApostrophos, -3],
  [QuantitativeNeume.Hamili, -4],
  [QuantitativeNeume.HamiliPlusApostrophos, -5],
  [QuantitativeNeume.HamiliPlusElaphron, -6],
  [QuantitativeNeume.HamiliPlusElaphronPlusApostrophos, -7],
  [QuantitativeNeume.DoubleHamili, -8],

  [QuantitativeNeume.PetastiPlusApostrophos, -1],
  [QuantitativeNeume.PetastiPlusElaphron, -2],
  [QuantitativeNeume.PetastiPlusElaphronPlusApostrophos, -3],

  [QuantitativeNeume.OligonPlusKentemata, 2],
  [QuantitativeNeume.KentemataPlusOligon, 2],
  [QuantitativeNeume.KentemataPlusOligonSpecial, 2],
  [QuantitativeNeume.OligonPlusIsonPlusKentemata, 1],
  [QuantitativeNeume.OligonPlusApostrophos, -1],
  [QuantitativeNeume.OligonPlusApostrophosPlusKentemata, 0],
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft, 6],
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight, 5],
  [QuantitativeNeume.OligonPlusElaphronPlusKentemata, -1],
  [QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata, -2],
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata, -2],
  [QuantitativeNeume.OligonPlusHamiliPlusKentemata, -3],
  [QuantitativeNeume.RunningElaphron, -2],
  [QuantitativeNeume.Hyporoe, -2],

  [QuantitativeNeume.Kentima, 2],
  [QuantitativeNeume.OligonPlusKentima, 2],
  [QuantitativeNeume.Kentemata, 1],

  [QuantitativeNeume.DoubleApostrophos, -2],
  [QuantitativeNeume.IsonPlusApostrophos, -1],

  [QuantitativeNeume.Cross, 0],
  [QuantitativeNeume.VareiaDotted, 0],
]);

export const getNeumeValue = (neume: QuantitativeNeume) =>
  neumeValueMap.get(neume);
