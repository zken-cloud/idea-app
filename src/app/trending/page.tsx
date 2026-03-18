import { getTrendingTags } from "@/lib/trends";
import styles from "./page.module.css";
import Link from "next/link";

export default async function TrendingPage() {
  const tags = await getTrendingTags();

  // Find max count to normalize sizes (avoid division by zero)
  const maxCount = Math.max(...tags.map(t => t.count), 1);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Trending Topics</h1>
      <div className={styles.wordCloud}>
        {tags.length === 0 && <p className={styles.noData}>No trending topics yet.</p>}
        {tags.map(({ tag, count }) => {
          // Calculate font size (e.g. 1rem to 3rem)
          const fontSize = 1 + (count / maxCount) * 2;
          
          return (
            <Link key={tag} href={`/?search=${tag}`} className={styles.word}>
              <span style={{ fontSize: `${fontSize}rem` }}>{tag}</span>
              <span className={styles.count}>{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
