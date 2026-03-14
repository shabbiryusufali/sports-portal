import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Transporter
// ---------------------------------------------------------------------------
// Configure via environment variables so no secrets are hard-coded.
//
// Required env vars:
//   EMAIL_HOST     – SMTP host  (e.g. smtp.gmail.com)
//   EMAIL_PORT     – SMTP port  (e.g. 587)
//   EMAIL_SECURE   – "true" for port 465 / TLS, otherwise STARTTLS
//   EMAIL_USER     – SMTP username / "from" address
//   EMAIL_PASS     – SMTP password or app-password
//   EMAIL_FROM     – Display name + address, e.g. "Sports Portal <no-reply@example.com>"
//   NEXT_PUBLIC_BASE_URL – Public origin, e.g. https://sportsportal.vercel.app
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? `"Sports Portal" <no-reply@sportsportal.app>`;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function htmlWrapper(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e4e4e7; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #111115; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
    .header { background: #111115; padding: 28px 32px; border-bottom: 1px solid #27272a; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.05em; color: #fff; }
    .logo span { color: #00ff87; }
    .body { padding: 32px; }
    h2 { margin: 0 0 12px; font-size: 20px; color: #fff; }
    p { margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #a1a1aa; }
    .btn { display: inline-block; background: #00ff87; color: #0a0a0f; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; }
    .divider { height: 1px; background: #27272a; margin: 24px 0; }
    .small { font-size: 12px; color: #52525b; }
    .footer { padding: 20px 32px; border-top: 1px solid #27272a; font-size: 12px; color: #52525b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">SPORTS<span>PORTAL</span></div>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Sports Portal. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

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
      `
      <h2>Verify your email address</h2>
      <p>Thanks for signing up! Click the button below to confirm your email address and activate your account.</p>
      <a href="${url}" class="btn">Verify Email</a>
      <div class="divider"></div>
      <p class="small">This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
      <p class="small">Or copy and paste this URL into your browser:<br/>${url}</p>
    `,
    ),
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

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
      `
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for the account linked to <strong>${to}</strong>.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <div class="divider"></div>
      <p class="small">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
      <p class="small">Or copy and paste this URL into your browser:<br/>${url}</p>
    `,
    ),
  });
}