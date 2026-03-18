"use client";

import { useState } from "react";
import { vote } from "@/lib/actions";
import styles from "./VoteButtons.module.css";

interface VoteButtonsProps {
  postId?: string;
  commentId?: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: "UPVOTE" | "DOWNVOTE" | null;
}

export default function VoteButtons({
  postId,
  commentId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (type: "UPVOTE" | "DOWNVOTE") => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    if (postId) formData.append("postId", postId);
    if (commentId) formData.append("commentId", commentId);
    formData.append("type", type);

    // Optimistic UI update
    const previousVote = userVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    if (userVote === type) {
      // Toggle off
      setUserVote(null);
      if (type === "UPVOTE") setUpvotes(upvotes - 1);
      else setDownvotes(downvotes - 1);
    } else {
      // Change or new vote
      setUserVote(type);
      if (type === "UPVOTE") {
        setUpvotes(upvotes + 1);
        if (previousVote === "DOWNVOTE") setDownvotes(downvotes - 1);
      } else {
        setDownvotes(downvotes + 1);
        if (previousVote === "UPVOTE") setUpvotes(upvotes - 1);
      }
    }

    try {
      await vote(formData);
    } catch (err) {
      // Rollback on error
      setUserVote(previousVote);
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
      console.error("Failed to vote:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => handleVote("UPVOTE")}
        className={`${styles.button} ${userVote === "UPVOTE" ? styles.activeUp : ""}`}
        disabled={isSubmitting}
        title="Upvote"
      >
        <span className={styles.icon}>👍</span>
        <span className={styles.count}>{upvotes}</span>
      </button>
      <button
        type="button"
        onClick={() => handleVote("DOWNVOTE")}
        className={`${styles.button} ${userVote === "DOWNVOTE" ? styles.activeDown : ""}`}
        disabled={isSubmitting}
        title="Downvote"
      >
        <span className={styles.icon}>🫤</span>
        <span className={styles.count}>{downvotes}</span>
      </button>
    </div>
  );
}
