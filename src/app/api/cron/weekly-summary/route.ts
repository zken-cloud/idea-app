import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWeeklySummary } from "@/lib/weeklySummary";
import { sendAdminEmail } from "@/lib/mail";

// Triggered weekly by Cloud Scheduler. Protected by a shared secret header
// (X-Cron-Secret) rather than a user session — this route is excluded from the
// auth middleware matcher.
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Optional secret-gated test override: POST {"to": "addr"} (or an array) to
    // send only to that address instead of all admins.
    let recipients: string[];
    const override = await request.json().catch(() => null);
    if (override?.to) {
      recipients = Array.isArray(override.to) ? override.to : [override.to];
    } else {
      // Admin-configured recipient list takes precedence; fall back to all
      // Admin-role users when the list is empty.
      const configured = await prisma.summaryRecipient.findMany({ select: { email: true } });
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
    }

    if (recipients.length === 0) {
      return NextResponse.json({ sent: false, reason: "no admin recipients" });
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
    console.error("Weekly summary failed:", error);
    return NextResponse.json({ error: "Failed to send weekly summary" }, { status: 500 });
  }
}
