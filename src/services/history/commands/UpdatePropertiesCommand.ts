import { MartyriaElement, NoteElement } from '@/models/Element';

import type { Command } from '../CommandService';

export interface UpdatePropertiesCommandArgs<T> {
  target: T;
  newValues: Partial<T>;
}

export class UpdatePropertiesCommand<T> implements Command {
  private previousValues?: Map<PropertyKey, unknown>;
  private nextValues?: Map<PropertyKey, unknown>;
  private changedKeys: PropertyKey[] = [];
  private applied = false;

  constructor(private args: UpdatePropertiesCommandArgs<T>) {}

  public execute() {
    // Model setters can normalize or clear other fields. Capture their actual
    // effects on this object, including backing fields, without cloning children
    // or serializing the document. Retain changed fields and their layout
    // dependencies in history.
    const before = this.captureProperties();
    for (const key of Object.keys(this.args.newValues)) {
      if (
        !Object.is(
          (this.args.target as any)[key],
          (this.args.newValues as any)[key],
        )
      ) {
        (this.args.target as any)[key] = (this.args.newValues as any)[key];
      }
    }
    const after = this.captureProperties();
    this.changedKeys = [...new Set([...before.keys(), ...after.keys()])].filter(
      (key) =>
        before.has(key) !== after.has(key) ||
        !Object.is(before.get(key), after.get(key)),
    );
    if (this.changedKeys.length === 0) {
      this.applied = true;
      return false;
    }
    // Layout can move a fthora between its visible field and its carry after
    // execute returns. Restore both sides, even when one was unchanged during
    // execute, so a later layout cannot overwrite the restored notation.
    this.changedKeys = [
      ...new Set([
        ...this.changedKeys,
        ...getLayoutDependentProperties(this.args.target, this.changedKeys),
      ]),
    ];
    this.previousValues = new Map(
      this.changedKeys
        .filter((key) => before.has(key))
        .map((key) => [key, before.get(key)]),
    );
    this.nextValues = new Map(
      this.changedKeys
        .filter((key) => after.has(key))
        .map((key) => [key, after.get(key)]),
    );
    this.applied = true;
    return this.changedKeys.length > 0;
  }

  public undo() {
    if (this.applied && this.previousValues !== undefined) {
      const changed = this.restoreProperties(this.previousValues);
      this.applied = false;
      return changed;
    }
    return false;
  }

  public redo() {
    if (!this.applied) {
      if (this.nextValues === undefined) {
        return this.execute();
      }
      const changed = this.restoreProperties(this.nextValues);
      this.applied = true;
      return changed;
    }
    return false;
  }

  private captureProperties() {
    const descriptors = Object.getOwnPropertyDescriptors(this.args.target);
    const values = new Map<PropertyKey, unknown>();
    for (const key of Reflect.ownKeys(descriptors)) {
      const descriptor: PropertyDescriptor = Reflect.get(descriptors, key);
      if ('value' in descriptor) {
        values.set(key, descriptor.value);
      }
    }
    return values;
  }

  private restoreProperties(values: Map<PropertyKey, unknown>) {
    let changed = false;
    for (const key of this.changedKeys) {
      const current = Object.getOwnPropertyDescriptor(this.args.target, key);
      if (values.has(key)) {
        const value = values.get(key);
        if (current === undefined || !Object.is(current.value, value)) {
          // Restore the recorded data fields directly. Re-running public setters
          // in a different order could normalize away part of the original state.
          (this.args.target as any)[key] = value;
          changed = true;
        }
      } else if (current !== undefined) {
        delete (this.args.target as any)[key];
        changed = true;
      }
    }
    return changed;
  }
}

function getLayoutDependentProperties(
  target: unknown,
  changedKeys: PropertyKey[],
): string[] {
  if (target instanceof NoteElement) {
    const fthoraProperties = [
      '_fthora',
      '_secondaryFthora',
      '_tertiaryFthora',
      'fthoraCarry',
      'secondaryFthoraCarry',
      'tertiaryFthoraCarry',
    ];
    const triggers = [
      ...fthoraProperties,
      '_quantitativeNeume',
      'chromaticFthoraNote',
      'secondaryChromaticFthoraNote',
      'tertiaryChromaticFthoraNote',
    ];
    if (triggers.some((key) => changedKeys.includes(key))) {
      return fthoraProperties;
    }
  } else if (target instanceof MartyriaElement) {
    const fthoraProperties = [
      'fthora',
      'fthoraCarry',
      'quantitativeNeumeFthora',
      'quantitativeNeumeFthoraCarry',
    ];
    const triggers = [
      ...fthoraProperties,
      'auto',
      'note',
      'scale',
      'alignRight',
      'quantitativeNeume',
      'chromaticFthoraNote',
      'quantitativeNeumeChromaticFthoraNote',
    ];
    if (triggers.some((key) => changedKeys.includes(key))) {
      // Auto layout overwrites these persisted manual settings after execute.
      // Keep them with the toggle so undo can restore the manual notation.
      return changedKeys.includes('auto')
        ? [...fthoraProperties, 'note', 'scale']
        : fthoraProperties;
    }
  }
  return [];
}
