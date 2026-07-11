import 'server-only'

// Email sending is env-gated: without RESEND_API_KEY + WELCOME_FROM_EMAIL set,
// every send is a no-op that logs, so signup works in dev and in prod-before-SMTP.
// Wire real creds (Resend account + verified sender domain) to turn it on.
// ponytail: single provider, plain fetch — no SDK dep until a second email type needs one.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

type SendResult = { sent: boolean; skipped?: string; error?: string }

async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.WELCOME_FROM_EMAIL // e.g. "HomeOS <hello@yourdomain.com>"
  if (!apiKey || !from) {
    console.info(`[email] skipped (no RESEND_API_KEY/WELCOME_FROM_EMAIL) → ${subject} to ${to}`)
    return { sent: false, skipped: 'not-configured' }
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[email] send failed (${res.status}): ${body}`)
      return { sent: false, error: `${res.status}` }
    }
    return { sent: true }
  } catch (e) {
    console.error('[email] send threw', e)
    return { sent: false, error: 'threw' }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function welcomeHtml(name: string): string {
  // name comes from signup metadata (user-controlled) — escape before interpolating.
  const safeName = escapeHtml(name?.trim() ?? '')
  const greeting = safeName ? `Hi ${safeName},` : 'Welcome,'
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gethomeos.vercel.app'
  return `<!doctype html>
<div style="font-family:Georgia,'Times New Roman',serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0A2E4D;background:#F8F6F2">
  <p style="font-size:22px;letter-spacing:-0.01em;margin:0 0 8px">Welcome to HomeOS</p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#3a4a58;margin:0 0 20px">
    ${greeting} your home finally has a memory. HomeOS keeps track of your systems,
    documents, maintenance, and projects — and answers questions about your specific home.
  </p>
  <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#3a4a58;margin:0 0 24px">
    The best first step: add one system or upload a document, so HomeOS starts learning your home.
  </p>
  <a href="${appUrl}" style="display:inline-block;background:#0A2E4D;color:#fff;text-decoration:none;
     font-family:system-ui,sans-serif;font-size:14px;font-weight:600;padding:12px 22px;border-radius:12px">
    Open HomeOS
  </a>
  <p style="font-family:system-ui,sans-serif;font-size:12px;color:#8a97a3;margin:28px 0 0">
    You're receiving this because you created a HomeOS account.
  </p>
</div>`
}

/** Fire-and-forget welcome email. Never throws — callers should not await-block signup on it. */
export async function sendWelcomeEmail(to: string, name: string): Promise<SendResult> {
  return sendEmail(to, 'Welcome to HomeOS', welcomeHtml(name))
}
