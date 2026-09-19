import type { APIContext } from 'astro';
import sharp from 'sharp';
import { getPosts } from '../../lib/content';
import { escapeXml } from '../../lib/site';
export async function getStaticPaths() {
  return [
    {
      params: { id: 'default' },
      props: {
        title: 'Follow the evidence. Find the story.',
        label: 'INDEPENDENT CYBERSECURITY RESEARCH',
      },
    },
    ...(await getPosts()).map((post) => ({
      params: { id: post.id },
      props: {
        title: post.data.title,
        label: `${post.data.type.toUpperCase()} / ${post.data.category.toUpperCase()}`,
      },
    })),
  ];
}
export async function GET({ props }: APIContext) {
  const words = String(props.title).split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + word).length > 28) {
      lines.push(line.trim());
      line = '';
    }
    line += `${word} `;
  }
  if (line) lines.push(line.trim());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#101510"/><circle cx="1080" cy="270" r="240" fill="none" stroke="#35452c"/><circle cx="1080" cy="270" r="175" fill="none" stroke="#465838"/><circle cx="1080" cy="270" r="110" fill="#1f2d19" stroke="#596f47"/><path d="m1030 250 45 35-45 35m60 0h50" fill="none" stroke="#b0d394" stroke-width="12"/><path d="M65 90h1070M65 544h1070" stroke="#34402c"/><text x="65" y="65" fill="#eaece3" font-size="30" font-family="monospace">&gt; 0x7ouda_</text><text x="65" y="150" fill="#b0d394" font-size="14" font-family="monospace" letter-spacing="3">${escapeXml(String(props.label))}</text>${lines
    .slice(0, 4)
    .map(
      (text, i) =>
        `<text x="60" y="${245 + i * 73}" fill="#eaece3" font-family="sans-serif" font-size="60" font-weight="500" letter-spacing="-2">${escapeXml(text)}</text>`,
    )
    .join(
      '',
    )}<text x="65" y="585" fill="#a7b399" font-family="monospace" font-size="15">DIGITAL FORENSICS · THREAT HUNTING · TECHNICAL INVESTIGATION</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
}
