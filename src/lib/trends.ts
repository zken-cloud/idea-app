import { prisma } from "@/lib/db";

export async function getTrendingTags(limit = 20) {
  // Fetch posts from last 7 days? Or all time if database is small.
  // Let's fetch all posts for now since it's a demo.
  const posts = await prisma.post.findMany({
    select: { content: true },
  });

  const wordCounts: { [key: string]: number } = {};
  
  // Very basic stop words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
    "to", "of", "in", "for", "with", "on", "at", "by", "this", "that",
    "it", "i", "you", "he", "she", "they", "we", "my", "your", "his",
    "her", "their", "our", "as", "at", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "can", "could", "will", "would",
    "should", "may", "might", "must", "if", "then", "else"
  ]);

  posts.forEach(post => {
    // Regex to split by non-word characters and filter out empty strings
    const words = post.content
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  // Convert to array and sort
  const sortedTags = Object.entries(wordCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return sortedTags;
}
