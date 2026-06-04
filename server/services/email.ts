/**
 * Transactional email service using Resend.
 * Set RESEND_API_KEY in environment variables.
 */
import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — emails will be skipped");
    return null;
  }
  return new Resend(apiKey);
}

const FROM_ADDRESS = "ContentFlow AI <noreply@contentflow.ai>";

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Welcome to ContentFlow AI 🚀",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
          <h1 style="color:#f97316;margin-bottom:8px;">Welcome to ContentFlow AI</h1>
          <p style="color:#a1a1aa;">Hi ${name},</p>
          <p style="color:#a1a1aa;">Your account is ready. Start by connecting your social platforms and generating your first piece of AI-optimized content.</p>
          <a href="${process.env.APP_URL ?? "https://contentflow.ai"}/dashboard" 
             style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
            Go to Dashboard
          </a>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">ContentFlow AI — Automate Your Content. Dominate Every Platform.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send welcome email:", err);
  }
}

export async function sendBillingReceiptEmail(
  to: string,
  name: string,
  plan: string,
  amount: number,
  invoiceUrl?: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `ContentFlow AI — Payment Receipt for ${plan} Plan`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
          <h1 style="color:#f97316;">Payment Confirmed</h1>
          <p style="color:#a1a1aa;">Hi ${name}, your payment was successful.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0;">
            <tr><td style="color:#71717a;padding:8px 0;">Plan</td><td style="color:#fff;text-align:right;">${plan}</td></tr>
            <tr><td style="color:#71717a;padding:8px 0;">Amount</td><td style="color:#f97316;text-align:right;font-weight:600;">$${(amount / 100).toFixed(2)}</td></tr>
          </table>
          ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Invoice</a>` : ""}
          <p style="color:#52525b;font-size:12px;margin-top:32px;">ContentFlow AI — Thank you for your business.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send billing receipt:", err);
  }
}

export async function sendUsageAlertEmail(
  to: string,
  name: string,
  used: number,
  limit: number,
  plan: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  const pct = Math.round((used / limit) * 100);
  const isAtLimit = used >= limit;
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: isAtLimit
        ? "ContentFlow AI — You've reached your generation limit"
        : `ContentFlow AI — You've used ${pct}% of your monthly generations`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
          <h1 style="color:#f97316;">${isAtLimit ? "Generation Limit Reached" : `${pct}% of Limit Used`}</h1>
          <p style="color:#a1a1aa;">Hi ${name},</p>
          <p style="color:#a1a1aa;">
            ${isAtLimit
              ? `You've used all <strong>${limit}</strong> AI generations on your ${plan} plan this month.`
              : `You've used <strong>${used}</strong> of <strong>${limit}</strong> AI generations on your ${plan} plan.`}
          </p>
          ${isAtLimit
            ? `<p style="color:#a1a1aa;">Upgrade your plan to continue generating content without interruption.</p>`
            : ""}
          <a href="${process.env.APP_URL ?? "https://contentflow.ai"}/billing" 
             style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
            ${isAtLimit ? "Upgrade Plan" : "View Usage"}
          </a>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">ContentFlow AI</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send usage alert:", err);
  }
}

export async function sendPaymentFailedEmail(to: string, name: string, plan: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "ContentFlow AI — Payment Failed",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
          <h1 style="color:#ef4444;">Payment Failed</h1>
          <p style="color:#a1a1aa;">Hi ${name},</p>
          <p style="color:#a1a1aa;">We were unable to process your payment for the <strong>${plan}</strong> plan. Please update your payment method to avoid service interruption.</p>
          <a href="${process.env.APP_URL ?? "https://contentflow.ai"}/billing" 
             style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
            Update Payment Method
          </a>
          <p style="color:#52525b;font-size:12px;margin-top:32px;">ContentFlow AI</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send payment failed email:", err);
  }
}
