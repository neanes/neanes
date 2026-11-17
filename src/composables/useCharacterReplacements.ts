import { inject } from 'vue';

import { editorPreferencesKey } from '@/injectionKeys';
import { findCharacterReplacement } from '@/utils/characterReplacements';

// Returns a beforeinput handler that swaps typed characters using the
// character replacements in the editor preferences.
export function useCharacterReplacements() {
  // The export and automation renderers (src/export.ts, src/automation.ts)
  // mount score pages without TheEditor, so no preferences are provided.
  const editorPreferences = inject(editorPreferencesKey, undefined);

  return (event: InputEvent) => {
    if (
      event.inputType !== 'insertText' ||
      event.isComposing ||
      event.data == null ||
      editorPreferences == null
    ) {
      return;
    }

    const replacement = findCharacterReplacement(
      editorPreferences.value.characterReplacements,
      event.data,
    );

    if (replacement === undefined) {
      return;
    }

    event.preventDefault();
    // insertText keeps the native undo stack and fires the input event.
    document.execCommand('insertText', false, replacement);
  };
}
