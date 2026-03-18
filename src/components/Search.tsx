"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Search.module.css";

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const initialSort = searchParams.get("sort") || "upvotes";
  const [sort, setSort] = useState(initialSort);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "upvotes") params.set("sort", sort);
    router.push(`/?${params.toString()}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSort(newSort);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (newSort !== "upvotes") params.set("sort", newSort);
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      <select
        value={sort}
        onChange={handleSortChange}
        className={`${styles.input} ${styles.select}`}
      >
        <option value="upvotes">Top Rated</option>
        <option value="newest">Newest</option>
      </select>
      <button type="submit" className={styles.button}>
        Search
      </button>
    </form>
  );
}
