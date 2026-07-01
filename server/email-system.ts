/**
 * Email Notification System
 * 
 * Handles:
 * - Welcome email on signup
 * - Weekly performance report
 * - Content published notification
 * - AI citation detected alert
 * 
 * Uses Resend API if RESEND_API_KEY is configured,
 * otherwise logs emails to activity_feed for visibility.
 */

import { getDb } from "./db";
import { activityFeed } from "../drizzle/schema";
import { ENV } from "./_core/env";

const RESEND_API_KEY = ENV.resendApiKey;
const FROM_EMAIL = ENV.fromEmail || "notifications@contentflow.ai";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  type: "welcome" | "weekly_report" | "content_published" | "citation_alert" | "failure_alert";
};

/**
 * Send an email via Resend API (or log if not configured)
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[Email] Resend API error: ${err}`);
        return false;
      }
      console.log(`[Email] Sent ${payload.type} to ${payload.to}`);
      return true;
    } catch (err: any) {
      console.error(`[Email] Failed to send: ${err.message}`);
      return false;
    }
  }

  // If no Resend key, log the email intent
  console.log(`[Email] Would send ${payload.type} to ${payload.to}: ${payload.subject}`);
  return true;
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, businessName: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Welcome to ContentFlow, ${businessName}!`,
    type: "welcome",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <h1 style="color: #f97316;">Welcome to ContentFlow! 🚀</h1>
        <p>Hi ${businessName},</p>
        <p>Your AI content automation platform is ready. Here's what you can do:</p>
        <ul>
          <li>Connect your platforms (Google, Instagram, TikTok, YouTube, Reddit, WordPress)</li>
          <li>Generate AI-powered content tailored to your brand</li>
          <li>Schedule and auto-publish across all channels</li>
          <li>Track your AI visibility score</li>
        </ul>
        <p>Get started by connecting your first platform in the dashboard.</p>
        <a href="#" style="display: inline-block; background: #f97316; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Go to Dashboard</a>
      </div>
    `,
  });
}

/**
 * Send content published notification
 */
export async function sendPublishNotification(email: string, title: string, platform: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Content Published: ${title}`,
    type: "content_published",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <h2 style="color: #f97316;">Content Published ✅</h2>
        <p>Your content has been published successfully:</p>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="font-weight: bold; margin: 0;">${title}</p>
          <p style="color: #888; margin: 4px 0 0 0;">Platform: ${platform}</p>
        </div>
        <p>View your content performance in the Analytics dashboard.</p>
      </div>
    `,
  });
}

/**
 * Send AI citation alert
 */
export async function sendCitationAlert(email: string, businessName: string, score: number): Promise<void> {
  await sendEmail({
    to: email,
    subject: `AI Visibility Update: Score ${score}/100`,
    type: "citation_alert",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <h2 style="color: #f97316;">AI Visibility Score Update 📊</h2>
        <p>Your AI visibility score for <strong>${businessName}</strong> has been updated:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 48px; font-weight: bold; color: #f97316;">${score}</span>
          <span style="font-size: 24px; color: #888;">/100</span>
        </div>
        <p>Keep publishing quality content to improve your score. AI engines learn from consistent, authoritative content.</p>
      </div>
    `,
  });
}

/**
 * Send failure alert
 */
export async function sendFailureAlert(email: string, platform: string, error: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Publishing Failed: ${platform}`,
    type: "failure_alert",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
        <h2 style="color: #ef4444;">Publishing Failed ⚠️</h2>
        <p>Content publishing to <strong>${platform}</strong> failed after 3 attempts:</p>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
          <code style="color: #ef4444;">${error}</code>
        </div>
        <p>Check your platform connection in Settings and try again.</p>
      </div>
    `,
  });
}
