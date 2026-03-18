import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
        <Link href="/acceptable-use" className={styles.link}>Acceptable Use Policy</Link>
      </div>
      <p className={styles.copy}>&copy; 2026 Idea App. All rights reserved.</p>
    </footer>
  );
}
