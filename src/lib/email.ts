import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM =
  process.env.EMAIL_FROM ?? `"Sports Portal" <no-reply@sportsportal.app>`;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function htmlWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e4e4e7;">
  <div style="max-width:520px;margin:40px auto;background:#111115;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
    <div style="background:#111115;padding:28px 32px;border-bottom:1px solid #27272a;">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.05em;color:#fff;">
        SPORTS<span style="color:#00ff87;">PORTAL</span>
      </span>
    </div>
    <div style="padding:32px;">
      ${body}
    </div>
    <div style="padding:20px 32px;border-top:1px solid #27272a;font-size:12px;color:#52525b;">
      &copy; ${new Date().getFullYear()} Sports Portal. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// Inline button styles — <style> blocks are stripped by most email clients
const BTN = `display:inline-block;background:#00ff87;color:#0a0a0f;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;`;
const DIVIDER = `height:1px;background:#27272a;margin:24px 0;`;
const SMALL = `font-size:12px;color:#52525b;margin:0 0 8px;`;
const P = `margin:0 0 16px;font-size:14px;line-height:1.6;color:#a1a1aa;`;
const H2 = `margin:0 0 12px;font-size:20px;color:#fff;`;

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${BASE_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Verify your Sports Portal email",
    text: `Please verify your email by visiting: ${url}\n\nThis link expires in 24 hours.`,
    html: htmlWrapper(
      "Verify your email",
      `<h2 style="${H2}">Verify your email address</h2>
       <p style="${P}">Thanks for signing up! Click the button below to confirm your email address and activate your account.</p>
       <a href="${url}" style="${BTN}">Verify Email</a>
       <div style="${DIVIDER}"></div>
       <p style="${SMALL}">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
       <p style="${SMALL}">Or copy and paste this URL into your browser:<br/>${url}</p>`,
    ),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your Sports Portal password",
    text: `You requested a password reset. Visit the link below (expires in 1 hour):\n\n${url}\n\nIf you didn't request this, ignore this email.`,
    html: htmlWrapper(
      "Reset your password",
      `<h2 style="${H2}">Reset your password</h2>
       <p style="${P}">We received a request to reset the password for the account linked to <strong>${to}</strong>.</p>
       <a href="${url}" style="${BTN}">Reset Password</a>
       <div style="${DIVIDER}"></div>
       <p style="${SMALL}">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
       <p style="${SMALL}">Or copy and paste this URL into your browser:<br/>${url}</p>`,
    ),
  });
}
