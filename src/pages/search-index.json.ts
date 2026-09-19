import { getPosts, postUrl } from '../lib/content';
export async function GET() {
  const posts = (await getPosts()).map((post) => ({
    url: postUrl(post),
    title: post.data.title,
    description: post.data.description,
    type: post.data.type,
    tags: [
      ...post.data.tags,
      ...post.data.tools,
      ...post.data.artifacts,
      post.data.category,
    ],
    author: post.data.author,
    text: post.body || '',
  }));
  return Response.json(posts);
}
