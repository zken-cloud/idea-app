"use client";

import { useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import styles from "./CommentSection.module.css";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  parentId: string | null;
  children?: Comment[];
  votes: {
    id: string;
    type: string;
    postId: string | null;
    commentId: string | null;
    userId: string;
  }[];
}

interface FlattenedComment extends Comment {
  depth: number;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  user?: any; // Session user
}

export default function CommentSection({ postId, comments, user }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('#comment-')) {
        const parts = hash.split('#comment-');
        const commentId = parts[1];
        if (commentId && comments.some((c) => c.id === commentId)) {
          setIsExpanded(true);
          setTimeout(() => {
            const element = document.getElementById(`comment-${commentId}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
        }
      }
    };

    // Run on mount and dependency change
    handleHashChange();

    // Listen for hash changes (if user clicks another link while on same page)
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [comments]);

  // 1. Build tree
  const commentMap = new Map<string, Comment>();
  const topLevelComments: Comment[] = [];

  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, children: [] });
  });

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.children!.push(commentMap.get(comment.id)!);
      }
    } else {
      topLevelComments.push(commentMap.get(comment.id)!);
    }
  });

  // 2. Flatten tree (DFS)
  const flattenTree = (nodes: Comment[], depth = 0): FlattenedComment[] => {
    const result: FlattenedComment[] = [];
    nodes.forEach((node) => {
      result.push({ ...node, depth });
      if (node.children) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    });
    return result;
  };

  const flatComments = flattenTree(topLevelComments);
  const totalComments = flatComments.length;
  const showFolding = totalComments > 5;
  const displayedComments = isExpanded ? flatComments : flatComments.slice(0, 5);

  if (totalComments === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>Comments ({totalComments})</span>
        {showFolding && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.foldButton}
          >
            {isExpanded ? "Show less" : `Show all ${totalComments}`}
          </button>
        )}
      </div>
      <ul className={styles.list}>
        {displayedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            depth={comment.depth}
            user={user}
          />
        ))}
      </ul>
    </div>
  );
}
