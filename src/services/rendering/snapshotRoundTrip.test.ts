import { describe, expect, it } from 'vitest';

import { RichTextBoxElement, TextBoxElement } from '@/models/Element';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('render snapshot text-box defaults', () => {
  for (const Box of [TextBoxElement, RichTextBoxElement]) {
    for (const mode of ['single', 'multipanel', 'inline']) {
      it(`preserves blank ${Box.name} ${mode} content through save-format snapshots`, () => {
        const score = new Score();
        const box = new Box();
        box.multipanel = mode === 'multipanel';
        box.inline = mode === 'inline';
        score.staff.elements.unshift(box);
        const saved = JSON.parse(
          JSON.stringify(SaveService.SaveScoreToJson(score)),
        );
        const restored = SaveService.LoadScoreFromJson(saved).staff
          .elements[0] as TextBoxElement | RichTextBoxElement;
        expect(restored.content).toBe('');
        expect(restored.contentLeft).toBe('');
        expect(restored.contentCenter).toBe('');
        expect(restored.contentRight).toBe('');
        expect(restored.contentBottom).toBe('');
        expect(restored.height).toBe(box.height);
        expect(Number.isFinite(restored.height)).toBe(true);
      });
    }
  }
});
