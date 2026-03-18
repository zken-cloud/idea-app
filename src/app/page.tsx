import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";
import Search from "@/components/Search";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  console.log("Home page: fetching session...");
  const session = await getServerSession(authOptions);
  console.log("Home page: session fetched", session ? "yes" : "no");

  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q : undefined;
  const sort = typeof params?.sort === "string" ? params.sort : "upvotes";

  if (!session) {
    console.log("Home page: no session, redirecting...");
    redirect("/api/auth/signin");
  }

  console.log("Home page: session exists, rendering...");

  return (
    <div className="container">
      <main className="main">
        <h1>Got an idea?</h1>

        <Search />

        <PostForm />

        <hr className="divider" />

        <PostList searchQuery={q} sort={sort} />
      </main>
    </div>
  );
}
