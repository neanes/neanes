import type { CharacterReplacement } from '@/models/EditorPreferences';

export function findCharacterReplacement(
  replacements: readonly CharacterReplacement[],
  typed: string,
) {
  // Rows missing either side are unfinished dialog input and change nothing.
  return replacements.find(
    (r) => r.from !== '' && r.to !== '' && r.from === typed,
  )?.to;
}
