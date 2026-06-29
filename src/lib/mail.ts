// Sends email via the Gmail API using keyless domain-wide delegation (DWD).
// Flow (no service-account keys stored anywhere):
//   1. The Cloud Run runtime SA gets its own access token from the metadata server.
//   2. That token authorizes an IAM Credentials signJwt call AS the dedicated
//      notifier SA (NOTIFIER_SA_EMAIL), producing a signed assertion that
//      impersonates GMAIL_SENDER with the gmail.send scope.
//   3. The assertion is exchanged for a delegated access token, used to send.
// The notifier SA is authorized for this impersonation in Workspace DWD.

const NOTIFIER_SA = process.env.NOTIFIER_SA_EMAIL || "";
const SENDER = process.env.GMAIL_SENDER || "";
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

async function getRuntimeAccessToken(): Promise<string> {
  const res = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!res.ok) throw new Error(`metadata token failed: ${res.status}`);
  return (await res.json()).access_token as string;
}

async function getDelegatedToken(): Promise<string> {
  const runtimeToken = await getRuntimeAccessToken();
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    iss: NOTIFIER_SA,
    sub: SENDER,
    scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });

  const signRes = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${NOTIFIER_SA}:signJwt`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${runtimeToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    }
  );
  if (!signRes.ok) throw new Error(`signJwt failed: ${signRes.status} ${await signRes.text()}`);
  const { signedJwt } = await signRes.json();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });
  if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  return (await tokenRes.json()).access_token as string;
}

// RFC 2047 encoded-word so non-ASCII subjects (e.g. the em-dash) render
// correctly instead of mojibake. Plain ASCII passes through unchanged.
function encodeSubject(subject: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function buildRawMessage(to: string[], subject: string, html: string): string {
  const headers = [
    `From: Idea App <${SENDER}>`,
    `To: ${to.join(", ")}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ];
  const raw = headers.join("\r\n") + "\r\n\r\n" + html;
  return Buffer.from(raw, "utf-8").toString("base64url");
}

export async function sendAdminEmail(to: string[], subject: string, html: string): Promise<void> {
  if (!NOTIFIER_SA || !SENDER) {
    throw new Error("NOTIFIER_SA_EMAIL and GMAIL_SENDER must be configured");
  }
  const token = await getDelegatedToken();
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: buildRawMessage(to, subject, html) }),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${res.status} ${await res.text()}`);
}
