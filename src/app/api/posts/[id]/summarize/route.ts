import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { summarizePost } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Throttle the paid Gemini call (also limits SSRF/abuse surface) per user.
  if (!rateLimit(`summarize:${session.user.id}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const imageUrls = post.images ? post.images.split(',') : [];
    const summary = await summarizePost(post.content, imageUrls);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
