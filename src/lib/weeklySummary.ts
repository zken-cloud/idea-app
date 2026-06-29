import { prisma } from "@/lib/db";

export interface WeeklySummary {
  subject: string;
  html: string;
  newIdeas: number;
  newComments: number;
}

function netScore(votes: { type: string }[]): number {
  let up = 0;
  let down = 0;
  for (const v of votes) {
    if (v.type === "UPVOTE") up++;
    else down++;
  }
  return up - down;
}

function esc(s: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return s.replace(/[&<>"]/g, (c) => map[c]);
}

export async function buildWeeklySummary(): Promise<WeeklySummary> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newIdeas, newComments, weekPosts] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.post.findMany({
      where: { createdAt: { gte: weekAgo } },
      include: {
        user: { select: { name: true, email: true } },
        votes: { select: { type: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  const topIdeas = weekPosts
    .map((p) => ({
      content: p.content,
      author: p.user?.name || p.user?.email || "Unknown",
      comments: p._count.comments,
      score: netScore(p.votes),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const dateStr = new Date().toISOString().slice(0, 10);

  const rows = topIdeas.length
    ? topIdeas
        .map(
          (t, i) =>
            `<tr>
               <td style="padding:8px;border-bottom:1px solid #eee;">${i + 1}</td>
               <td style="padding:8px;border-bottom:1px solid #eee;">${esc(t.content.slice(0, 120))}${
              t.content.length > 120 ? "&hellip;" : ""
            }<br><span style="color:#888;font-size:12px;">by ${esc(t.author)}</span></td>
               <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${
                 t.score >= 0 ? "+" : ""
               }${t.score}</td>
               <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${t.comments}</td>
             </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="padding:12px;color:#888;">No new ideas were posted this week.</td></tr>`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#222;">
    <h2 style="margin-bottom:4px;">Idea App &mdash; Weekly Summary</h2>
    <p style="color:#888;margin-top:0;">Week ending ${dateStr}</p>
    <table style="width:100%;margin:16px 0;border-collapse:separate;border-spacing:8px 0;">
      <tr>
        <td style="background:#f5f7fa;border-radius:8px;padding:14px;text-align:center;width:50%;">
          <div style="font-size:24px;font-weight:bold;">${newIdeas}</div>
          <div style="color:#888;font-size:13px;">New ideas</div>
        </td>
        <td style="background:#f5f7fa;border-radius:8px;padding:14px;text-align:center;width:50%;">
          <div style="font-size:24px;font-weight:bold;">${newComments}</div>
          <div style="color:#888;font-size:13px;">New comments</div>
        </td>
      </tr>
    </table>
    <h3 style="margin-bottom:8px;">Top ideas this week</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;color:#888;font-size:12px;">
          <th style="padding:8px;">#</th><th style="padding:8px;">Idea</th>
          <th style="padding:8px;text-align:center;">Score</th><th style="padding:8px;text-align:center;">Comments</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;">
      <a href="https://idea.cedemo.app/" style="background:#4a5568;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open Idea App</a>
    </p>
    <p style="color:#aaa;font-size:12px;margin-top:24px;">You're receiving this because you're an admin of Idea App.</p>
  </div>`;

  return { subject: `Idea App — Weekly Summary (${dateStr})`, html, newIdeas, newComments };
}
