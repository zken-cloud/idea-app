import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function isAdmin(session: { user?: { role?: string | null; email?: string | null } } | null): boolean {
  return !!session && (session.user?.role === "Admin" || session.user?.email === "admin@local");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const recipients = await prisma.summaryRecipient.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(recipients);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  try {
    const recipient = await prisma.summaryRecipient.create({ data: { email: normalized } });
    return NextResponse.json(recipient);
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "That email is already on the list" }, { status: 409 });
    }
    console.error("Failed to add recipient:", error);
    return NextResponse.json({ error: "Failed to add recipient" }, { status: 500 });
  }
}
