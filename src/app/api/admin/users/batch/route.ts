import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "Admin" && session.user?.email !== "admin@local")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json(); // Array of users

  if (!Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(
      data.map((user: any) => 
        prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            role: user.role,
          },
          create: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        })
      )
    );
    
    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "BATCH_USER_UPLOAD",
        details: `Uploaded ${data.length} users via CSV`,
        userId: session.user.id || "admin",
        userName: session.user.name || "Admin",
        userEmail: session.user.email || 'admin@local',
      }
    });

    return NextResponse.json({ count: result.length });
  } catch (error) {
    console.error("Failed to batch upload users:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
