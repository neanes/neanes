import { toRaw } from 'vue';

import type { ScoreElement } from '@/models/Element';
import type { Header } from '@/models/Header';
import type { Staff } from '@/models/Staff';
import { Workspace } from '@/models/Workspace';

import {
  getResizableTextBoxes,
  type MeasuredTextBox,
} from './textBoxMeasurement';

function copy<T extends object>(source: T, changes?: Partial<T>): T {
  return Object.assign(
    Object.create(Object.getPrototypeOf(source)),
    source,
    changes,
  );
}

// Layout writes to element fields. Preserve prototypes and share read-only
// content, without copying the editor's selection, commands or history.
export function detachLayout(workspace: Workspace) {
  const originals = new Map<ScoreElement, ScoreElement>();
  const copies = new Map<ScoreElement, ScoreElement>();
  function copyElements(elements: ScoreElement[]) {
    return elements.map((element) => {
      const detached = copy(element);
      originals.set(detached, element);
      copies.set(element, detached);
      return detached;
    });
  }
  function copyStaff(staff: Staff) {
    return copy(staff, { elements: copyElements(staff.elements) });
  }
  function copyTemplates<T extends Record<keyof T, Header>>(templates: T): T {
    const result = copy(templates);
    for (const key in result) {
      const template = result[key];
      result[key] = copy<Header>(template, {
        elements: copyElements(template.elements),
      }) as T[typeof key];
    }
    return result;
  }

  const score = toRaw(workspace.score);
  const detached = new Workspace();
  detached.filePath = workspace.filePath;
  detached.tempFileName = workspace.tempFileName;
  detached.score = copy(score, {
    pageSetup: copy(score.pageSetup),
    paragraphStyles: score.paragraphStyles.map((style) => copy(style)),
    staff: copyStaff(score.staff),
    footnotes: score.footnotes.map((body) =>
      copy(body, { staff: copyStaff(body.staff) }),
    ),
    headers: copyTemplates(score.headers),
    footers: copyTemplates(score.footers),
  });
  return {
    workspace: detached,
    copies,
    applyHeights() {
      const changed: MeasuredTextBox[] = [];
      for (const box of getResizableTextBoxes(detached.score)) {
        const original = originals.get(box) as MeasuredTextBox;
        if (Math.abs(original.height - box.height) > 0.01) {
          changed.push(original);
        }
        original.height = box.height;
      }
      return changed;
    },
  };
}
