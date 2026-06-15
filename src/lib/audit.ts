import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function logAudit(
  action: string,
  details: string,
  user: { id: string; name?: string | null; email?: string | null }
) {
  return prisma.auditLog.create({
    data: {
      action,
      details,
      userId: user.id || "",
      userName: user.name || "",
      userEmail: user.email || "",
    },
  });
}

export async function logAuditServerAction(action: string, details: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized: Audit log failed");
  }
  return logAudit(action, details, session.user as any);
}
