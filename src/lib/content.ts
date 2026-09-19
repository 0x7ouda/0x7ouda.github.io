import { getCollection, type CollectionEntry } from 'astro:content';
import { path } from './site';

const sectionTypes = {
  writeups: 'Writeup',
  research: 'Research',
  notes: 'Note',
  tools: 'Tool',
} as const;
type PublicationCollection = keyof typeof sectionTypes;
export type Post = CollectionEntry<PublicationCollection> & {
  data: { type: (typeof sectionTypes)[PublicationCollection] };
};

export const published = <T extends { data: { draft: boolean; date: Date } }>(
  entry: T,
) => !entry.data.draft && entry.data.date.getTime() <= Date.now();
export async function getPosts(): Promise<Post[]> {
  const groups = await Promise.all([
    getCollection('writeups', published),
    getCollection('research', published),
    getCollection('notes', published),
    getCollection('tools', published),
  ]);
  return groups
    .flat()
    .map((entry) => ({
      ...entry,
      data: { ...entry.data, type: sectionTypes[entry.collection] },
    }))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const postUrl = (entry: Post) =>
  path(
    `${{ Research: 'research', Writeup: 'writeups', Note: 'notes', Tool: 'tools' }[entry.data.type]}/${entry.id}/`,
  );
export const readingTime = (body = '') => {
  const prose = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*`{}]/g, '');
  return Math.max(
    1,
    Math.ceil(prose.split(/\s+/).filter(Boolean).length / 200),
  );
};
export const relatedPosts = (current: Post, posts: Post[], limit = 3) =>
  posts
    .filter((p) => p.id !== current.id)
    .map((p) => ({
      post: p,
      score:
        p.data.tags.filter((tag) => current.data.tags.includes(tag)).length *
          2 +
        Number(p.data.category === current.data.category),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
