import { Unit } from '@/utils/Unit';

export type UnitOfMeasure =
  'pc' | 'pt' | 'in' | 'cm' | 'mm' | 'percent' | 'unitless';

export function toStorage(value: number, unit: UnitOfMeasure) {
  switch (unit) {
    case 'pc':
      return Unit.fromPc(value);
    case 'pt':
      return Unit.fromPt(value);
    case 'in':
      return Unit.fromInch(value);
    case 'cm':
      return Unit.fromCm(value);
    case 'mm':
      return Unit.fromMm(value);
    case 'percent':
      return Unit.fromPercent(value);
    case 'unitless':
      return value;
  }
}

export function toDisplay(value: number | null, unit: UnitOfMeasure) {
  if (value == null) {
    return null;
  }

  switch (unit) {
    case 'pc':
      return Unit.toPc(value);
    case 'pt':
      return Unit.toPt(value);
    case 'in':
      return Unit.toInch(value);
    case 'cm':
      return Unit.toCm(value);
    case 'mm':
      return Unit.toMm(value);
    case 'percent':
      return Unit.toPercent(value);
    case 'unitless':
      return value;
  }
}
