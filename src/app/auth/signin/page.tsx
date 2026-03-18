'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./SignIn.module.css";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to Idea App</h1>
      <p className={styles.intro}>
        This is the Idea App, purpose is for CEs to share their ideas, vote for them.
      </p>
      <div className={styles.buttonWrapper}>
        <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className={styles.button}
      >
        Sign in with Google
        </button>
      </div>
    </div>
  );
}
