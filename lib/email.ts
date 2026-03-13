/**
 * Email transport and template builders.
 *
 * Uses Resend as the email provider. When `RESEND_API_KEY` is not set,
 * emails are logged to the console instead — safe for local development.
 *
 * All templates share a branded layout via `layout()`. Edit the colors
 * and logo there to match your brand in one place.
 *
 * @module
 */

import { Resend } from "resend";
import { APP_NAME } from "@/lib/config";
import { env } from "@/lib/env";

import { createLogger } from "@/lib/logger";

const log = createLogger("email");
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const from = env.EMAIL_FROM ?? `${APP_NAME} <noreply@example.com>`;

if (!resend) {
  log.warn("RESEND_API_KEY not set — emails will be logged to console.");
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/** Send an email via Resend, or log to console if no API key is set. */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!resend) {
    log.info({ to, subject }, "Simulated email send");
    log.debug({ html }, "Email HTML content");
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    log.error({ err: error, to, subject }, "Failed to send email");
    throw new Error(`Failed to send email: ${error.message}`);
  }

  log.info({ to, subject }, "Email sent successfully via Resend");
}

/* ─── Shared layout ────────────────────────────────────────────────── */

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px">
              <div style="display:inline-block;background-color:#3b82f6;border-radius:8px;width:32px;height:32px;text-align:center;line-height:32px;font-size:13px;font-weight:700;color:#ffffff">${APP_NAME.charAt(0)}</div>
              <span style="margin-left:10px;font-size:15px;font-weight:600;color:#ffffff;vertical-align:middle;letter-spacing:-0.02em">${APP_NAME}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111113;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:32px">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center">
              <p style="margin:0;font-size:11px;color:#52525b;letter-spacing:0.04em">
                Sent by ${APP_NAME}. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:#a1a1aa">${text}</p>`;
}

function button(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px 0">
  <tr>
    <td style="background-color:#3b82f6;border-radius:8px">
      <a href="${href}" target="_blank" style="display:inline-block;padding:10px 24px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em">${text}</a>
    </td>
  </tr>
</table>`;
}

function codeBlock(code: string): string {
  return `<div style="margin:8px 0 24px 0;padding:16px 24px;background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;text-align:center">
  <span style="font-size:28px;font-weight:700;letter-spacing:0.3em;font-family:'SF Mono',SFMono-Regular,ui-monospace,'DejaVu Sans Mono',Menlo,Consolas,monospace;color:#ffffff">${code}</span>
</div>`;
}

function muted(text: string): string {
  return `<p style="margin:0;font-size:12px;line-height:1.6;color:#52525b">${text}</p>`;
}

/* ─── Templates ────────────────────────────────────────────────────── */

/** Template: password reset link. */
export function passwordResetEmail(url: string) {
  return {
    subject: "Reset your password",
    html: layout(`
      ${heading("Reset your password")}
      ${paragraph("We received a request to reset the password on your account. Click the button below to choose a new password.")}
      ${button("Reset password", url)}
      ${muted("If you didn't request this, you can safely ignore this email. The link expires in 1 hour.")}
    `),
  };
}

/** Template: email verification link. */
export function verificationEmail(url: string) {
  return {
    subject: "Verify your email address",
    html: layout(`
      ${heading("Verify your email")}
      ${paragraph(`Welcome to ${APP_NAME}. Confirm your email address to finish setting up your account.`)}
      ${button("Verify email", url)}
      ${muted("If you did not create this account, you can ignore this email.")}
    `),
  };
}

/** Template: magic-link sign-in. */
export function magicLinkEmail(url: string) {
  return {
    subject: "Your sign-in link",
    html: layout(`
      ${heading("Sign in to ${APP_NAME}")}
      ${paragraph("Use the button below to sign in. No password needed.")}
      ${button("Sign in", url)}
      ${muted("This link expires in 10 minutes. If you didn't request this, you can ignore it.")}
    `),
  };
}

/** Template: one-time passcode (sign-in, password reset, or verification). */
export function otpEmail(otp: string, type: string) {
  const subject =
    type === "sign-in"
      ? "Your sign-in code"
      : type === "forget-password"
        ? "Your password reset code"
        : "Verify your email address";

  const intro =
    type === "sign-in"
      ? `Use this code to finish signing in to ${APP_NAME}:`
      : type === "forget-password"
        ? `Use this code to reset your ${APP_NAME} password:`
        : `Use this code to verify your ${APP_NAME} email address:`;

  return {
    subject,
    html: layout(`
      ${heading(subject)}
      ${paragraph(intro)}
      ${codeBlock(otp)}
      ${muted("This code expires in 10 minutes. If you didn't request this, you can ignore it.")}
    `),
  };
}

/** Template: two-factor authentication code. */
export function twoFactorEmail(otp: string) {
  return {
    subject: "Your two-factor code",
    html: layout(`
      ${heading("Two-factor authentication")}
      ${paragraph("Enter this code to complete your sign-in:")}
      ${codeBlock(otp)}
      ${muted("This code expires in 5 minutes. If you didn't request this, secure your account immediately.")}
    `),
  };
}

/** Template: email change confirmation. */
export function changeEmailConfirmationEmail(newEmail: string, url: string) {
  return {
    subject: "Approve your email change",
    html: layout(`
      ${heading("Email change request")}
      ${paragraph(`We received a request to change your ${APP_NAME} email to:`)}
      <div style="margin:0 0 20px 0;padding:12px 16px;background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px">
        <span style="font-size:14px;font-weight:500;color:#ffffff">${newEmail}</span>
      </div>
      ${button("Approve change", url)}
      ${muted("If you did not request this, ignore this email and your account will stay unchanged.")}
    `),
  };
}

/** Template: account deletion confirmation. */
export function deleteAccountVerificationEmail(url: string) {
  return {
    subject: "Confirm account deletion",
    html: layout(`
      ${heading("Delete your account")}
      ${paragraph(`We received a request to permanently delete your ${APP_NAME} account. This action cannot be undone.`)}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px 0">
        <tr>
          <td style="background-color:#dc2626;border-radius:8px">
            <a href="${url}" target="_blank" style="display:inline-block;padding:10px 24px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em">Delete my account</a>
          </td>
        </tr>
      </table>
      ${muted("If you did not request this, you can safely ignore this email.")}
    `),
  };
}

/** Template: existing user tried to sign up again. */
export function existingUserSignUpEmail() {
  return {
    subject: "Sign-up attempt with your email",
    html: layout(`
      ${heading("Sign-up attempt")}
      ${paragraph(`Someone tried to create a ${APP_NAME} account using this email address.`)}
      ${paragraph("If that was you, try signing in instead. If it was not you, no action is needed — your account is secure.")}
    `),
  };
}

/** Template: organization invitation. */
export function orgInvitationEmail(
  inviterName: string,
  orgName: string,
  inviteLink: string,
) {
  return {
    subject: `You've been invited to join ${orgName}`,
    html: layout(`
      ${heading("You're invited")}
      ${paragraph(`<strong style="color:#ffffff">${inviterName}</strong> invited you to join <strong style="color:#ffffff">${orgName}</strong> on ${APP_NAME}.`)}
      ${button("Accept invitation", inviteLink)}
      ${muted("This invitation expires in 48 hours. If you didn't expect this, you can ignore it.")}
    `),
  };
}
