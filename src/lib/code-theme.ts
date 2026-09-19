import { bundledThemes, type ThemeRegistration } from 'shiki';
const original = (await bundledThemes['github-dark']()).default;
export const codeTheme: ThemeRegistration = {
  ...original,
  name: 'forensic-dark',
  colors: { ...original.colors, 'editor.background': '#11170f' },
  tokenColors: original.tokenColors?.map((rule) => ({
    ...rule,
    settings: {
      ...rule.settings,
      foreground:
        rule.settings.foreground?.toLowerCase() === '#6a737d'
          ? '#9aa78d'
          : rule.settings.foreground,
    },
  })),
};
