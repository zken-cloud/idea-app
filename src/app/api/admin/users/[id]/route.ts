import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.email === "admin@local") {
      return NextResponse.json(
        { error: "Cannot delete local admin" },
        { status: 403 }
      );
    }

    // Delete related posts and comments first if DB doesn't cascade
    // Normally handled by Prisma cascades, but just in case:
    await prisma.comment.deleteMany({ where: { userId: id } });
    await prisma.post.deleteMany({ where: { userId: id } });

    const deletedUser = await prisma.user.delete({
      where: { id },
    });

    await logAudit(
      "DELETE_USER",
      `Deleted user ${deletedUser.email}`,
      session.user
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
