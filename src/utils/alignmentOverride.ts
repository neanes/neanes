export const ALIGNMENT_OVERRIDE_MIXED_VALUE = '__mixed__';

export const ALIGNMENT_VALUES = ['left', 'center', 'right', 'justify'] as const;

export type AlignmentOverrideValue = (typeof ALIGNMENT_VALUES)[number];

export function isAlignmentOverrideValue(
  value: unknown,
): value is AlignmentOverrideValue {
  return (
    typeof value === 'string' &&
    (ALIGNMENT_VALUES as readonly string[]).includes(value)
  );
}
