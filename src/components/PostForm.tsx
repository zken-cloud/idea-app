"use client";

import { useState, useRef } from "react";
import { createPost } from "@/lib/actions";
import styles from "./PostForm.module.css";

export default function PostForm() {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > 200;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    if (isOverLimit) {
      setError("Content must not exceed 200 words");
      return;
    }

    if (images) {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      for (let i = 0; i < images.length; i++) {
        if (images[i].size > MAX_SIZE) {
          setError("Image size must be less than 5MB");
          return;
        }
      }
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("content", content);
    
    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    try {
      await createPost(formData);
      setContent(""); // Clear form on success
      setImages(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <textarea
        className={styles.textarea}
        placeholder="What's on your mind? (Max 200 words)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        disabled={isSubmitting}
      />
      <div className={styles.footer}>
        <span className={`${styles.wordCount} ${isOverLimit ? styles.error : ""}`}>
          {wordCount} / 200 words
        </span>
        <div className={styles.inputGroup}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(e.target.files)}
            className={styles.hiddenFileInput}
            ref={fileInputRef}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className={styles.summarizeStyleButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            {images && images.length > 0 
              ? `${images.length} file${images.length > 1 ? 's' : ''} chosen` 
              : "Choose Files"}
          </button>
        </div>
        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting || isOverLimit || (!content.trim() && !images)}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </form>
  );
}
