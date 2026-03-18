"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/storage";
import { logAuditServerAction } from "./audit";
import crypto from "crypto";

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const content = formData.get("content") as string;
  if (!content) {
    throw new Error("Content is required");
  }

  // Word count validation
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount > 200) {
    throw new Error("Content must not exceed 200 words");
  }

  const images = formData.getAll("images") as File[];
  const imageUrls: string[] = [];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  for (const file of images) {
    if (file.size > MAX_SIZE) {
      throw new Error("Image size must be less than 5MB");
    }
    if (file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop() || 'tmp';
      const filename = `${Date.now()}_${crypto.randomUUID()}.${ext}`;
      const mimeType = file.type;
      
      try {
        const url = await uploadFile(buffer, filename, mimeType);
        imageUrls.push(url);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        throw new Error(`Failed to upload image ${file.name}`);
      }
    }
  }

  const post = await prisma.post.create({
    data: {
      content,
      images: imageUrls.length > 0 ? imageUrls.join(",") : null,
      userId: session.user.id,
    },
  });

  await logAuditServerAction("CREATE_POST", `User created post ${post.id}`);

  revalidatePath("/");
  return post;
}

export async function createComment(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const content = formData.get("content") as string;
  const postId = formData.get("postId") as string;
  const parentId = formData.get("parentId") as string | null;

  if (!content) {
    throw new Error("Content is required");
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  if (wordCount > 100) {
    throw new Error("Comment must not exceed 100 words");
  }
  if (!postId) {
    throw new Error("Post ID is required");
  }

  try {
    // Security check: Verify the topological hierarchy before appending (IDOR prevention)
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new Error("Post not found");
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }
      if (parentComment.postId !== postId) {
        throw new Error("Parent comment does not belong to the target post");
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: session.user.id,
        parentId: parentId || null,
      },
    });

    await logAuditServerAction("CREATE_COMMENT", `User created comment ${comment.id} on post ${postId}`);

    revalidatePath("/");
    return comment;
  } catch (error: any) {
    console.error("Error creating comment:", error);
    // Suppress raw database schema exceptions
    throw new Error(error.message || "Failed to process comment payload");
  }
}

export async function vote(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const postId = formData.get("postId") as string | null;
  const commentId = formData.get("commentId") as string | null;
  const type = formData.get("type") as "UPVOTE" | "DOWNVOTE";

  if (!postId && !commentId) {
    throw new Error("Post ID or Comment ID is required");
  }
  if (!type) {
    throw new Error("Vote type is required");
  }

  const userId = session.user.id;

  try {
    // Check if vote exists
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        postId: postId || null,
        commentId: commentId || null,
      },
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // Toggle off
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Change type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });
      }
    } else {
      // Create new
      await prisma.vote.create({
        data: {
          type,
          userId,
          postId: postId || null,
          commentId: commentId || null,
        },
      });
    }

    revalidatePath("/");
  } catch (error) {
    console.error("Error updating vote:", error);
    throw new Error("An unexpected error occurred while saving vote context");
  }
}
