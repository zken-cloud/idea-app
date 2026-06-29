import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const isAdmin = session.user?.role === "Admin" || session.user?.email === "admin@local";
  const isModerator = session.user?.role === "Moderator";

  if (!isAdmin && !isModerator) {
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

  const summaryRecipients = await prisma.summaryRecipient.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <AdminDashboard initialUsers={users} initialAuditLogs={auditLogs} initialRecipients={summaryRecipients} isAdmin={isAdmin} />
    </div>
  );
}
