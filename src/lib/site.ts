export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const path = (value = '') => `${base}/${value.replace(/^\//, '')}`;
export const site = {
  name: '0x7ouda',
  title: '0x7ouda.sh',
  description:
    'Follow the evidence. Independent research on digital forensics, incident response, and the traces an attack leaves behind.',
  github: import.meta.env.PUBLIC_GITHUB_URL || 'https://github.com/0x7ouda',
  linkedin: import.meta.env.PUBLIC_LINKEDIN_URL || path('about/#connect'),
  discord: import.meta.env.PUBLIC_DISCORD_URL || path('about/#connect'),
};
export const navigation = [
  ['Home', ''],
  ['Research', 'research/'],
  ['Writeups', 'writeups/'],
  ['Notes', 'notes/'],
  ['Tools', 'tools/'],
  ['About', 'about/'],
] as const;

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

export function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!,
  );
}
