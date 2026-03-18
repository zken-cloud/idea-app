"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CommentForm from "./CommentForm";
import CommentSection from "./CommentSection";
import VoteButtons from "./VoteButtons";
import SummarizeButton from "./SummarizeButton";
import styles from "./PostItem.module.css";

interface PostItemProps {
  post: any; // Ideally Use proper type
  user?: any; // Session user
}

export default function PostItem({ post, user }: PostItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isActioned, setIsActioned] = useState(post.actioned || false);
  const router = useRouter();

  const isAuthor = post.userId === user?.id;
  const isAdmin = user?.role === "Admin";
  const isModerator = user?.role === "Moderator";
  const canDelete = isAuthor || isAdmin || isModerator;

  const handleDelete = async () => {
    // if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh(); // Refresh the Server Component (PostList)
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An error occurred while deleting the post");
    }
  };

  const handleEditSave = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to edit post");
      }
    } catch (error) {
      console.error("Error editing post:", error);
      alert("An error occurred while editing the post");
    }
  };

  const handleToggleActioned = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actioned: !isActioned }),
      });

      if (response.ok) {
        setIsActioned(!isActioned);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to toggle action status");
      }
    } catch (error) {
      console.error("Error toggling action status:", error);
      alert("An error occurred while toggling the action status");
    }
  };

  return (
    <div className={`${styles.post} ${isActioned ? styles.postActioned : ""}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.userInfo}>
            {post.user.image && (
              <Image
                src={post.user.image}
                alt={post.user.name || "User avatar"}
                width={32}
                height={32}
                className={styles.avatar}
              />
            )}
            <span className={styles.userName}>{post.user.name || post.user.email}</span>
          </div>
          <span className={styles.date}>
            {new Date(post.createdAt).toLocaleString()}
          </span>
        </div>
        {canDelete && (
          <div className={styles.headerRight}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles.menuButton}
              aria-label="Post menu"
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
            rows={4}
          />
          <div className={styles.editActions}>
            <button onClick={handleEditSave} className={styles.saveButton}>Save</button>
            <button onClick={() => { setIsEditing(false); setEditContent(post.content); }} className={styles.cancelButton}>Cancel</button>
          </div>
        </div>
      ) : (
        <p className={styles.content}>{post.content}</p>
      )}
      {post.images && (
        <div className={styles.images}>
          {post.images.split(',').map((url: string, index: number) => (
            <img 
              key={index} 
              src={url} 
              alt={`Post image ${index + 1}`} 
              className={styles.image} 
              onClick={() => setSelectedImage(url)}
            />
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.stat}>{post._count?.comments || 0} Comments</span>
          
          <VoteButtons
            postId={post.id}
            initialUpvotes={post.votes?.filter((v: any) => v.type === "UPVOTE").length || 0}
            initialDownvotes={post.votes?.filter((v: any) => v.type === "DOWNVOTE").length || 0}
            initialUserVote={
              user
                ? (post.votes?.find((v: any) => v.userId === user.id)?.type as "UPVOTE" | "DOWNVOTE")
                : null
            }
          />
        </div>
        <div className={styles.footerRight}>
          <SummarizeButton postId={post.id} />
          {canDelete && (
            <button
              onClick={handleToggleActioned}
              className={`${styles.actionButton} ${isActioned ? styles.actionButtonActive : ""}`}
            >
              {isActioned ? "Actioned" : "Mark as Actioned"}
            </button>
          )}
        </div>
      </div>
      
      <hr className={styles.divider} />
      
      <div className={styles.commentSection}>
        <CommentForm postId={post.id} />
        <CommentSection
          postId={post.id}
          comments={post.comments}
          user={user}
        />
      </div>

      {selectedImage && (
        <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedImage(null)}>
              ✕
            </button>
            <img src={selectedImage} alt="Enlarged post image" className={styles.modalImage} />
          </div>
        </div>
      )}
    </div>
  );
}
