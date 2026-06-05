const shortcutKeyGlyphs: Record<string, string> = {
  alt: '⌥',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  backspace: '⌫',
  capslock: '⇪',
  cmd: '⌘',
  command: '⌘',
  control: '⌃',
  ctrl: '⌃',
  delete: '⌦',
  del: '⌦',
  down: '↓',
  enter: '↵',
  esc: '⎋',
  escape: '⎋',
  left: '←',
  meta: '⌘',
  option: '⌥',
  return: '↵',
  right: '→',
  shift: '⇧',
  tab: '⇥',
  up: '↑',
};

export function getShortcutKeyDisplayText(key: string) {
  return shortcutKeyGlyphs[key.replace(/\s+/g, '').toLowerCase()] ?? key;
}
