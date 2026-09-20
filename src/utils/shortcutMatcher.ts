// Keyboard Shortcut Matcher & Event Normalizer

export function eventToShortcutString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey && e.key.length > 1) parts.push('Shift');

  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();

  // Don't duplicate modifier keys
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
    parts.push(key);
  }

  return parts.join('+');
}

export function matchesShortcut(e: KeyboardEvent, shortcutStr: string): boolean {
  if (!shortcutStr) return false;
  const currentStr = eventToShortcutString(e);
  if (currentStr.toLowerCase() === shortcutStr.toLowerCase()) return true;

  // Direct key check (e.g. F2, F9, Escape)
  if (e.key.toLowerCase() === shortcutStr.toLowerCase() && !e.ctrlKey && !e.altKey && !e.metaKey) {
    return true;
  }

  return false;
}

/**
 * Checks if the event is inside an active text input or textarea
 */
export function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toUpperCase();
  if (tagName === 'TEXTAREA') return true;
  if (tagName === 'INPUT') {
    const inputType = (target as HTMLInputElement).type.toLowerCase();
    return ['text', 'search', 'tel', 'number', 'password', 'email'].includes(inputType);
  }
  return target.isContentEditable;
}
