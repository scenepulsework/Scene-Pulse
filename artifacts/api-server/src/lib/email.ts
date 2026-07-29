import { ReplitConnectors } from "@replit/connectors-sdk";

const FROM_ADDRESS = "ScenePulse <noreply@scenepulse.app>";

/**
 * Send a venue claim verification code to the venue's business contact email.
 * Falls back to a logged warning if the Resend connector is not configured.
 */
export async function sendVerificationCodeEmail(opts: {
  to: string;
  venueName: string;
  code: string;
}): Promise<void> {
  const { to, venueName, code } = opts;
  const connectors = new ReplitConnectors();

  const body = JSON.stringify({
    from: FROM_ADDRESS,
    to: [to],
    subject: `Your ScenePulse verification code for ${venueName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#1a1a1a">Venue verification – ScenePulse</h2>
        <p>Someone requested to claim <strong>${venueName}</strong> on ScenePulse.</p>
        <p>If that was you, enter this code in the app to verify ownership:</p>
        <div style="font-size:2rem;font-weight:700;letter-spacing:0.25em;padding:16px 24px;background:#f5f5f5;border-radius:8px;display:inline-block;margin:8px 0">
          ${code}
        </div>
        <p style="color:#666;font-size:0.875rem">This code expires in 24 hours. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `ScenePulse venue verification\n\nSomeone requested to claim ${venueName}.\n\nYour verification code: ${code}\n\nThis code expires in 24 hours.`,
  });

  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }
}
