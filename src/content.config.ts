import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),                 // override; else derived from filename
    tagline: z.string(),                          // one-line card summary (<= ~120 chars)
    year: z.string(),                             // "2026" or "2025–26"
    order: z.number().default(100),               // sort key within a tier (lower = first)
    tier: z.enum(['featured', 'archive']),
    category: z.enum(['trading', 'ai-systems', 'iot', 'web', 'other']),
    status: z.enum(['shipped', 'active', 'wip', 'archived', 'private']),
    stack: z.array(z.string()),                   // ["Python","Docker",...]
    role: z.string().optional(),                  // "Solo build"
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    isPrivate: z.boolean().default(false),        // repo not public — show lock, no repo link
    metrics: z.array(z.object({
      label: z.string(), value: z.string(),
      tone: z.enum(['neutral','up','down','accent']).default('neutral'),
    })).optional(),
    draft: z.boolean().default(false),            // exclude from build entirely
  }),
});

export const collections = { projects };
