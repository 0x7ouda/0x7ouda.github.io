export const commandSections = {
  home: '',
  research: 'research/',
  writeups: 'writeups/',
  notes: 'notes/',
  tools: 'tools/',
  about: 'about/',
} as const;
export function parseCommand(value: string) {
  const text = value.trim();
  if (text.toLowerCase() === 'clear') return { kind: 'clear' } as const;
  if (/^(?:help|cd)$/i.test(text)) return { kind: 'help' } as const;
  const navigation = /^cd\s+(.+)$/i.exec(text);
  if (navigation) {
    const section =
      navigation[1]!.toLowerCase().replace(/^\/+|\/+$/g, '') || 'home';
    if (section === '..')
      return { kind: 'navigate', section: 'home', route: '' } as const;
    if (Object.hasOwn(commandSections, section))
      return {
        kind: 'navigate',
        section,
        route: commandSections[section as keyof typeof commandSections],
      } as const;
    return { kind: 'unknown' } as const;
  }
  return { kind: 'search', query: text.replace(/^\/\s*/, '') } as const;
}
