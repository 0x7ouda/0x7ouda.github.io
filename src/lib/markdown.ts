import type { Root, RootContent, Blockquote } from 'mdast';
import type { Root as HtmlRoot, Element } from 'hast';

const callouts = new Set([
  'NOTE',
  'TIP',
  'IMPORTANT',
  'WARNING',
  'CAUTION',
  'FINDING',
  'EVIDENCE',
  'DETECTION',
  'RECOMMENDATION',
  'ARTIFACT',
  'SPOILER',
]);

/** Plain Markdown only: no executable imports, JSX, or raw HTML. */
export function remarkResearch() {
  return (tree: Root) => {
    const walk = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type === 'html')
          throw new Error(
            'Use Markdown instead of raw HTML or JSX in publication content.',
          );
        if (node.type === 'blockquote') decorateCallout(node);
        if ('children' in node) walk(node.children as RootContent[]);
      }
    };
    walk(tree.children);
  };
}
function decorateCallout(node: Blockquote) {
  const first = node.children[0];
  if (first?.type !== 'paragraph' || first.children[0]?.type !== 'text') return;
  const match = /^\[!([A-Z]+)\][ \t]*([^\n]*)\n?/.exec(first.children[0].value);
  if (!match || !callouts.has(match[1]!)) return;
  const kind = match[1]!.toLowerCase();
  const title = match[2] || kind;
  first.children[0].value = first.children[0].value.slice(match[0].length);
  if (
    first.children.every(
      (child) => child.type === 'text' && !child.value.trim(),
    )
  )
    node.children.shift();
  node.data = {
    hName: kind === 'spoiler' ? 'details' : 'aside',
    hProperties: {
      className:
        kind === 'spoiler' ? ['spoiler'] : ['callout', `callout-${kind}`],
    },
  };
  node.children.unshift({
    type: 'paragraph',
    children: [{ type: 'text', value: title }],
    data: {
      hName: kind === 'spoiler' ? 'summary' : 'p',
      hProperties: { className: ['callout-title'] },
    },
  });
  if (kind !== 'spoiler')
    node.children.unshift({
      type: 'paragraph',
      children: [{ type: 'text', value: kind }],
      data: { hProperties: { className: ['callout-label'] } },
    });
}

/** Keep local Markdown links/images correct on GitHub Pages project paths. */
export function rehypePublication({ base = '/' }: { base?: string } = {}) {
  const prefix = base.replace(/\/$/, '');
  return (tree: HtmlRoot) => {
    const walk = (nodes: (HtmlRoot | Element)['children']) => {
      for (const node of nodes) {
        if (node.type !== 'element') continue;
        for (const attribute of ['href', 'src']) {
          const value = node.properties[attribute];
          if (typeof value !== 'string') continue;
          if (
            /^(?:javascript|vbscript|data):/i.test(value.trim()) ||
            value.startsWith('//')
          ) {
            throw new Error(
              'Publication links must use a local path or a safe URL.',
            );
          }
          if (
            value.startsWith('/') &&
            prefix &&
            !value.startsWith(`${prefix}/`)
          )
            node.properties[attribute] = `${prefix}${value}`;
        }
        if (node.tagName === 'img') {
          node.properties.loading = 'lazy';
          node.properties.decoding = 'async';
          if (
            String(node.properties.src).endsWith('/images/evidence-chain.svg')
          ) {
            node.properties.width = 1000;
            node.properties.height = 260;
          }
        }
        walk(node.children);
      }
    };
    walk(tree.children);
  };
}
