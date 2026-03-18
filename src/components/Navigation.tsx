import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import styles from "./Navigation.module.css";

export default async function Navigation() {
  const session = await getServerSession(authOptions);

  return (
    <nav className={styles.nav}>
      <div className={styles.links}>
        <Link href="/" className={styles.link}>Home</Link>
        {session && <Link href="/trending" className={styles.link}>Trending</Link>}
        {(session?.user?.role === "Admin" || session?.user?.role === "Moderator") && (
          <Link href="/admin" className={styles.link}>Admin</Link>
        )}
      </div>
      <div className={styles.auth}>
        {session && (
          <div className={styles.userInfo}>
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User profile"}
                width={32}
                height={32}
                className={styles.avatar}
              />
            )}
            <span className={styles.user}>{session.user?.name || session.user?.email}</span>
            <Link href="/api/auth/signout" className={styles.link}>Sign Out</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
