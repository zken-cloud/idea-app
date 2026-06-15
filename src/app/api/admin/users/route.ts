import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "Admin" && session.user?.email !== "admin@local")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, role } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role },
      create: { name, email, role },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CREATE_USER",
        details: `Created/Updated user ${email} (${role})`,
        userId: session.user.id || "admin",
        userName: session.user.name || "Admin",
        userEmail: session.user.email || 'admin@local',
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to create/update user:", error);
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "Admin" && session.user?.email !== "admin@local")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });

  return NextResponse.json(users);
}
