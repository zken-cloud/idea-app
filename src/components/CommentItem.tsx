"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CommentForm from "./CommentForm";
import VoteButtons from "./VoteButtons";
import styles from "./CommentItem.module.css";

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

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth: number;
  user?: any; // Session user
}

export default function CommentItem({ comment, postId, depth, user }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const router = useRouter();

  const isAuthor = comment.userId === user?.id;
  const isAdmin = user?.role === "Admin";
  const isModerator = user?.role === "Moderator";
  const canDelete = isAuthor || isAdmin || isModerator;

  const handleDelete = async () => {
    // if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh(); // Refresh the Server Component
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("An error occurred while deleting the comment");
    }
  };

  const handleEditSave = async () => {
    const wordCount = editContent.trim() ? editContent.trim().split(/\s+/).length : 0;
    if (wordCount > 100) {
      alert("Comment must not exceed 100 words");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to edit comment");
      }
    } catch (error) {
      console.error("Error editing comment:", error);
      alert("An error occurred while editing the comment");
    }
  };

  return (
    <li id={`comment-${comment.id}`} className={styles.item} style={{ marginLeft: `${depth * 1.5}rem` }}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.userInfo}>
              {comment.user.image && (
                <Image
                  src={comment.user.image}
                  alt={comment.user.name || "User avatar"}
                  width={24}
                  height={24}
                  className={styles.avatar}
                />
              )}
              <span className={styles.userName}>
                {comment.user.name || comment.user.email}
              </span>
            </div>
            <span className={styles.date}>
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          {canDelete && (
            <div className={styles.headerRight}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={styles.menuButton}
                aria-label="Comment menu"
              >
                ⋮
              </button>
              {isMenuOpen && (
                <div className={styles.dropdown}>
                  {isAuthor && (
                    <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className={styles.editButton}>
                      Edit
                    </button>
                  )}
                  <button onClick={handleDelete} className={styles.deleteButton}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className={styles.editSection}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={styles.textarea}
              rows={3}
            />
            <div className={styles.editActions}>
              <span style={{ fontSize: "0.875rem", marginRight: "auto", color: (editContent.trim() ? editContent.trim().split(/\s+/).length : 0) > 100 ? "var(--destructive)" : "var(--muted)" }}>
                {editContent.trim() ? editContent.trim().split(/\s+/).length : 0} / 100 Words
              </span>
              <button 
                onClick={handleEditSave} 
                className={styles.saveButton}
                disabled={(editContent.trim() ? editContent.trim().split(/\s+/).length : 0) > 100}
              >
                Save
              </button>
              <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className={styles.content}>{comment.content}</p>
        )}
        <div className={styles.footer}>
          <button
            onClick={() => setIsReplying(!isReplying)}
            className={styles.replyButton}
          >
            {isReplying ? "Cancel" : "Reply"}
          </button>
          
          <VoteButtons
            commentId={comment.id}
            initialUpvotes={comment.votes.filter((v) => v.type === "UPVOTE").length}
            initialDownvotes={comment.votes.filter((v) => v.type === "DOWNVOTE").length}
            initialUserVote={
              user
              ? (comment.votes.find((v) => v.userId === user.id)?.type as "UPVOTE" | "DOWNVOTE")
              : null
            }
          />
        </div>
        {isReplying && (
          <div className={styles.replyForm}>
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSuccess={() => setIsReplying(false)}
            />
          </div>
        )}
      </div>
    </li>
  );
}
