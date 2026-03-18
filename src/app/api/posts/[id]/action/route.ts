import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const { actioned } = await request.json();

  if (typeof actioned !== 'boolean') {
    return NextResponse.json({ error: "Invalid actioned value" }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthor = post.userId === session.user.id;
    const isAdmin = session.user.role === "Admin";
    const isModerator = session.user.role === "Moderator";

    if (!isAuthor && !isAdmin && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { actioned },
    });

    await logAudit(
      actioned ? "ACTION_POST" : "UNACTION_POST",
      `${actioned ? "Marked as actioned" : "Unmarked as actioned"} post ${postId}`,
      session.user
    );

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error toggling post action status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
