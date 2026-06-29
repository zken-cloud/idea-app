import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildWeeklySummary } from "@/lib/weeklySummary";
import { sendAdminEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

function isAdmin(session: { user?: { role?: string | null; email?: string | null } } | null): boolean {
  return !!session && (session.user?.role === "Admin" || session.user?.email === "admin@local");
}

// On-demand summary send, triggered by an admin from the dashboard. Uses the
// same recipient resolution and summary content as the weekly cron job, but is
// gated by an admin session instead of the cron secret.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configured = await prisma.summaryRecipient.findMany({ select: { email: true } });
    let recipients: string[];
    if (configured.length > 0) {
      recipients = configured.map((r) => r.email);
    } else {
      const admins = await prisma.user.findMany({
        where: { role: "Admin" },
        select: { email: true },
      });
      recipients = admins
        .map((a) => a.email)
        .filter((e): e is string => !!e && e !== "admin@local" && e.includes("@"));
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients configured" }, { status: 400 });
    }

    const summary = await buildWeeklySummary();
    await sendAdminEmail(recipients, summary.subject, summary.html);

    return NextResponse.json({
      sent: true,
      recipients: recipients.length,
      newIdeas: summary.newIdeas,
      newComments: summary.newComments,
    });
  } catch (error) {
    console.error("On-demand summary failed:", error);
    return NextResponse.json({ error: "Failed to send summary" }, { status: 500 });
  }
}
