import { Resend } from "resend";
import { env } from "./env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY is not set. Email sending is unavailable.",
      );
    }
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * The "from" address shown to recipients.
 *
 * During development you can use Resend's shared test domain:
 *   "Dastack <onboarding@resend.dev>"
 *
 * In production, replace with your verified domain:
 *   "Dastack <noreply@create.dagrate.xyz>"
 *
 * https://resend.com/docs/dashboard/domains/introduction
 */
const FROM = env.EMAIL_FROM ?? "Dastack <onboarding@resend.dev>";

// ─── sendMagicLinkEmail ────────────────────────────────────────────────────────

/**
 * Sends a magic-link sign-in email.
 * Called automatically by Better Auth's magicLink plugin.
 */
export async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: "Your sign-in link",
      html: magicLinkTemplate({ url }),
    });
  } catch (err) {
    console.error("[email] Failed to send magic link:", err);
    throw err;
  }
}

// ─── HTML template ─────────────────────────────────────────────────────────────

function magicLinkTemplate({ url }: { url: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your sign-in link</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#ededed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                da<span style="color:#737373;">stack</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#171717;border:1px solid #262626;border-radius:16px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#ffffff;">
                Sign in to dastack
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.6;">
                Click the button below to sign in. This link expires in&nbsp;<strong style="color:#ededed;">5&nbsp;minutes</strong> and can only be used once.
              </p>

              <!-- CTA Button -->
              <a href="${url}"
                 style="display:inline-block;background:#ffffff;color:#0a0a0a;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;">
                Sign in to dastack
              </a>

              <!-- Divider -->
              <hr style="margin:32px 0;border:none;border-top:1px solid #262626;" />

              <p style="margin:0 0 8px;font-size:13px;color:#525252;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#404040;word-break:break-all;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#404040;">
                If you didn't request this, you can safely ignore this email.<br />
                &copy; ${new Date().getFullYear()} dastack
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

// ─── sendVerificationEmail ─────────────────────────────────────────────────────

/**
 * Sends an email-verification link.
 * Called by Better Auth when a new user signs up with email+password.
 */
export async function sendVerificationEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: "Verify your email address",
      html: verificationEmailTemplate({ url }),
    });
  } catch (err) {
    console.error("[email] Failed to send verification email:", err);
    throw err;
  }
}

// ─── sendPasswordResetEmail ────────────────────────────────────────────────────

/**
 * Sends a password-reset link.
 * Called by Better Auth when a user requests a password reset.
 */
export async function sendPasswordResetEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: "Reset your password",
      html: passwordResetTemplate({ url }),
    });
  } catch (err) {
    console.error("[email] Failed to send password reset email:", err);
    throw err;
  }
}

// ─── Additional templates ──────────────────────────────────────────────────────

function verificationEmailTemplate({ url }: { url: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#ededed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                da<span style="color:#737373;">stack</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#171717;border:1px solid #262626;border-radius:16px;padding:40px 36px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#ffffff;">
                Verify your email
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.6;">
                Click the button below to verify your email address and activate your account.
              </p>
              <a href="${url}"
                 style="display:inline-block;background:#ffffff;color:#0a0a0a;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;">
                Verify email &rarr;
              </a>
              <hr style="margin:32px 0;border:none;border-top:1px solid #262626;" />
              <p style="margin:0 0 8px;font-size:13px;color:#525252;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#404040;word-break:break-all;">
                ${url}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#404040;">
                If you didn&rsquo;t create an account, you can safely ignore this email.<br />
                &copy; ${new Date().getFullYear()} dastack
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

function passwordResetTemplate({ url }: { url: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#ededed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                da<span style="color:#737373;">stack</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#171717;border:1px solid #262626;border-radius:16px;padding:40px 36px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#ffffff;">
                Reset your password
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.6;">
                Someone requested a password reset for your account. Click the button below to choose a new password. This link expires in&nbsp;<strong style="color:#ededed;">1&nbsp;hour</strong>.
              </p>
              <a href="${url}"
                 style="display:inline-block;background:#ffffff;color:#0a0a0a;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;">
                Reset password &rarr;
              </a>
              <hr style="margin:32px 0;border:none;border-top:1px solid #262626;" />
              <p style="margin:0 0 8px;font-size:13px;color:#525252;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#404040;word-break:break-all;">
                ${url}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#404040;">
                If you didn&rsquo;t request this, you can safely ignore this email.<br />
                &copy; ${new Date().getFullYear()} dastack
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
