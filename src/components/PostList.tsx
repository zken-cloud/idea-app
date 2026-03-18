import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PostItem from "./PostItem";
import styles from "./PostList.module.css";

const prisma = new PrismaClient();

interface PostListProps {
  searchQuery?: string;
  sort?: string;
}

export default async function PostList({ searchQuery, sort = "upvotes" }: PostListProps) {
  const session = await getServerSession(authOptions);
  
  console.log("PostList: searchQuery =", searchQuery);
  
  const whereClause = searchQuery
    ? {
        OR: [
          { content: { contains: searchQuery, mode: "insensitive" as const } },
          { user: { name: { contains: searchQuery, mode: "insensitive" as const } } },
        ],
        ...(sort === "actioned" ? { actioned: true } : {}),
      }
    : sort === "actioned"
    ? { actioned: true }
    : undefined;
    
  console.log("PostList: whereClause =", JSON.stringify(whereClause));

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      votes: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          votes: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (sort === "upvotes") {
    posts.sort((a, b) => {
      const aUpvotes = a.votes.filter(v => v.type === "UPVOTE").length;
      const bUpvotes = b.votes.filter(v => v.type === "UPVOTE").length;
      if (aUpvotes !== bUpvotes) {
        return bUpvotes - aUpvotes;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  if (posts.length === 0) {
    return (
      <p className={styles.noPosts}>
        {searchQuery ? `No posts found matching "${searchQuery}"` : "No posts yet. Be the first to post!"}
      </p>
    );
  }

  return (
    <div className={styles.list}>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} user={session?.user} />
      ))}
    </div>
  );
}
