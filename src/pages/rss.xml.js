import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  notes.sort((a, b) => b.data.date - a.data.date);
  return rss({
    title: 'Chetra — Notes',
    description:
      "Writeups on the systems behind the work: the anti-overfit gate design, and why the risk ladder never negotiates.",
    site: context.site,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.date,
      link: `/notes/${note.id}/`,
    })),
  });
}
