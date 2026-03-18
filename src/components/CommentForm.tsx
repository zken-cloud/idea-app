"use client";

import { useState } from "react";
import { createComment } from "@/lib/actions";
import styles from "./CommentForm.module.css";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
}

export default function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    if (wordCount > 100) {
      setError("Comment must not exceed 100 words");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("content", content);
    formData.append("postId", postId);
    if (parentId) {
      formData.append("parentId", parentId);
    }

    try {
      await createComment(formData);
      setContent(""); // Clear form on success
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <textarea
        className={styles.textarea}
        placeholder={parentId ? "Reply..." : "Add a comment..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={parentId ? 2 : 3}
        disabled={isSubmitting}
      />
      <div className={styles.footer}>
        <span className={`${styles.charCount} ${content.trim() && content.trim().split(/\s+/).length > 100 ? styles.error : ""}`}>
          {content.trim() ? content.trim().split(/\s+/).length : 0} / 100 Words
        </span>
        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting || !content.trim() || (content.trim() ? content.trim().split(/\s+/).length : 0) > 100}
        >
          {isSubmitting ? "Posting..." : parentId ? "Reply" : "Comment"}
        </button>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </form>
  );
}
