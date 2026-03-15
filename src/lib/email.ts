import nodemailer from "nodemailer";

// ── Guard: fail loudly at startup if required vars are missing ──────────────
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT ?? 587);
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true"; // true = port 465 SSL
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FROM =
  process.env.EMAIL_FROM ?? `"Sports Portal" <no-reply@sportsportal.app>`;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// ── Build transporter ───────────────────────────────────────────────────────
// Required .env vars:
//   EMAIL_HOST=smtp.gmail.com          (or your SMTP host)
//   EMAIL_PORT=587                     (587 = STARTTLS, 465 = SSL)
//   EMAIL_SECURE=false                 (true only for port 465)
//   EMAIL_USER=you@gmail.com
//   EMAIL_PASS=your-app-password       (Gmail: use an App Password, not your account password)
//   EMAIL_FROM="Sports Portal" <you@gmail.com>
//   NEXT_PUBLIC_BASE_URL=https://yourdomain.com

function createTransporter() {
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "[email] Missing EMAIL_HOST / EMAIL_USER / EMAIL_PASS — emails will not send.\n" +
        "Add these to your .env file.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    // Prevents self-signed cert errors in some hosting environments
    tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });
}

const transporter = createTransporter();

// ── Shared send helper ──────────────────────────────────────────────────────
async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!transporter) {
    console.error(
      `[email] Tried to send "${options.subject}" to ${options.to} but transporter is not configured.`,
    );
    throw new Error("Email is not configured. See server logs.");
  }

  try {
    const info = await transporter.sendMail({ from: FROM, ...options });
    console.log(
      `[email] Sent "${options.subject}" to ${options.to} — messageId: ${info.messageId}`,
    );
  } catch (err) {
    console.error(
      `[email] Failed to send "${options.subject}" to ${options.to}:`,
      err,
    );
    throw err;
  }
}

// ── HTML template ───────────────────────────────────────────────────────────
function htmlWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#070710;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#eeeef8;">
  <div style="max-width:520px;margin:40px auto;background:#0d0d1c;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <span style="font-size:20px;font-weight:900;letter-spacing:-0.05em;color:#eeeef8;">
        SPORTS<span style="color:#00ff87;">PORTAL</span>
      </span>
    </div>
    <div style="padding:32px;">${body}</div>
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.07);font-size:12px;color:#3a3a5c;">
      &copy; ${new Date().getFullYear()} Sports Portal. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

const BTN = `display:inline-block;background:#00ff87;color:#070710;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;`;
const DIVIDER = `height:1px;background:rgba(255,255,255,0.07);margin:24px 0;`;
const SMALL = `font-size:12px;color:#3a3a5c;margin:0 0 8px;`;
const P = `margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b6b9a;`;
const H2 = `margin:0 0 12px;font-size:20px;color:#eeeef8;font-weight:800;`;

// ── Public API ──────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${BASE_URL}/auth/verify-email?token=${token}`;
  await sendMail({
    to,
    subject: "Verify your Sports Portal email",
    text: `Please verify your email by visiting: ${url}\n\nThis link expires in 24 hours.`,
    html: htmlWrapper(
      "Verify your email",
      `<h2 style="${H2}">Verify your email address</h2>
       <p style="${P}">Thanks for signing up! Click the button below to confirm your email address and activate your account.</p>
       <a href="${url}" style="${BTN}">Verify Email</a>
       <div style="${DIVIDER}"></div>
       <p style="${SMALL}">This link expires in <strong style="color:#6b6b9a;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
       <p style="${SMALL}">Or copy and paste this URL into your browser:<br/><span style="color:#00ff87;">${url}</span></p>`,
    ),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`;
  await sendMail({
    to,
    subject: "Reset your Sports Portal password",
    text: `You requested a password reset. Visit the link below (expires in 1 hour):\n\n${url}\n\nIf you didn't request this, ignore this email.`,
    html: htmlWrapper(
      "Reset your password",
      `<h2 style="${H2}">Reset your password</h2>
       <p style="${P}">We received a request to reset the password for the account linked to <strong style="color:#eeeef8;">${to}</strong>.</p>
       <a href="${url}" style="${BTN}">Reset Password</a>
       <div style="${DIVIDER}"></div>
       <p style="${SMALL}">This link expires in <strong style="color:#6b6b9a;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
       <p style="${SMALL}">Or copy and paste this URL into your browser:<br/><span style="color:#00ff87;">${url}</span></p>`,
    ),
  });
}
