import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { summarizePost } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;

  console.log("Summarize API called for post:", postId);
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("Summarize API: Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      console.log("Summarize API: Post not found:", postId);
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.log("Summarize API: Generating summary for post:", postId);
    const imageUrls = post.images ? post.images.split(',') : [];
    const summary = await summarizePost(post.content, imageUrls);
    console.log("Summarize API: Summary generated");

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Summarization API Error:", error);
    const errorMessage = error.message || "Failed to generate summary";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
