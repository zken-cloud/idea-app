'use client';

import { signOut } from "next-auth/react";
import styles from "./SignOut.module.css";

export default function SignOutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sign Out</h1>
      <p className={styles.description}>Are you sure you want to sign out?</p>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className={styles.button}
      >
        Sign Out
      </button>
    </div>
  );
}
