import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const common = {
  title: z.string().min(3),
  description: z.string().min(20).max(220),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  author: z.string().default('0x7ouda'),
  draft: z.boolean().default(false),
  tools: z.array(z.string()).default([]),
  category: z.string(),
  cover: z
    .string()
    .regex(/^\/images\/[a-zA-Z0-9/_-]+\.(?:svg|png|webp|avif|jpe?g)$/),
};

const publication = (section: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.md', base: `./content/${section}` }),
    schema: z.object({
      ...common,
      complexity: z
        .enum(['Foundational', 'Intermediate', 'Advanced'])
        .optional(),
      featured: z.boolean().default(false),
      sample: z.boolean().default(false),
      artifacts: z.array(z.string()).default([]),
    }),
  });

export const collections = {
  writeups: publication('writeups'),
  research: publication('research'),
  notes: publication('notes'),
  tools: publication('tools'),
};
