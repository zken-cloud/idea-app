'use client';

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Settings.module.css";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session?.user?.role === "Admin") {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Admin Settings</h1>
        <p>Welcome, Admin. You are logged in.</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Settings</h1>
        <p>User Settings placeholder.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setIsSubmitting(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Login</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="username" className={styles.label}>Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
