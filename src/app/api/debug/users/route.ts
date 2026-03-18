import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json({ users: users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, image: u.image })) });
}
