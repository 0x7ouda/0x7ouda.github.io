import type { LanguageRegistration } from 'shiki';

// Small, repository-owned TextMate grammar for common YARA rule syntax.
// This highlights source; it does not parse or validate a detection rule.
export const yaraLanguage: LanguageRegistration = {
  name: 'yara',
  scopeName: 'source.yara',
  repository: {},
  patterns: [
    { name: 'comment.line.double-slash.yara', match: '//.*$' },
    { name: 'comment.block.yara', begin: '/\\*', end: '\\*/' },
    {
      name: 'string.quoted.double.yara',
      begin: '"',
      end: '"',
      patterns: [{ name: 'constant.character.escape.yara', match: '\\\\.' }],
    },
    {
      name: 'string.regexp.yara',
      begin: '/(?=[^/*])',
      end: '/[is]*',
      patterns: [{ name: 'constant.character.escape.yara', match: '\\\\.' }],
    },
    {
      name: 'keyword.control.yara',
      match:
        '\\b(rule|private|global|import|include|meta|strings|condition|and|or|not|of|them|any|all|for|in|at|filesize|entrypoint|matches|contains|icontains|startswith|endswith|defined)\\b',
    },
    {
      name: 'storage.modifier.yara',
      match: '\\b(ascii|wide|nocase|fullword|xor|base64|base64wide)\\b',
    },
    { name: 'constant.language.yara', match: '\\b(true|false)\\b' },
    {
      name: 'constant.numeric.yara',
      match: '\\b(0x[0-9a-fA-F]+|[0-9]+(?:KB|MB)?)\\b',
    },
    { name: 'variable.yara', match: '[$#@!][a-zA-Z_][a-zA-Z0-9_]*' },
    {
      name: 'entity.name.function.yara',
      match: '\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*[:{])',
    },
  ],
};
