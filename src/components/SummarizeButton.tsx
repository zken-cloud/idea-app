"use client";

import { useState } from "react";
import styles from "./SummarizeButton.module.css";

interface SummarizeButtonProps {
  postId: string;
}

export default function SummarizeButton({ postId }: SummarizeButtonProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch(`/api/posts/${postId}/summarize`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error("Summarize Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleSummarize}
        disabled={loading}
        className={styles.button}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {summary && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3>Gemini Summary</h3>
            <p>{summary}</p>
            <button onClick={() => setSummary(null)} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}
