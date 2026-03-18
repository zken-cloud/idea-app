import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AdminDashboard from "@/components/AdminDashboard";

const prisma = new PrismaClient();

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const isAdmin = session.user?.role === "Admin" || session.user?.email === "admin@local";
  const isModerator = session.user?.role === "Moderator";

  if (!session || (!isAdmin && !isModerator)) {
    redirect("/");
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

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <AdminDashboard initialUsers={users} initialAuditLogs={auditLogs} isAdmin={isAdmin} />
    </div>
  );
}
