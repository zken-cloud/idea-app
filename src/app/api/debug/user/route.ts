import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@zken.altostrat.com" },
  });
  const users = await prisma.user.findMany();
  return NextResponse.json({ user, totalUsers: users.length, users: users.map(u => ({ email: u.email, role: u.role })) });
}
