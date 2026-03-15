"use server";

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// requestPasswordReset
// ---------------------------------------------------------------------------
// Always returns success so we never leak whether an email is registered.
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, message: "Please enter a valid email address." };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Silently succeed if email is not registered — prevents email enumeration.
    if (!user) return { success: true };

    // Invalidate any existing tokens for this email.
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { email: user.email, token, expires },
    });

    await sendPasswordResetEmail(user.email, token);

    return { success: true };
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return {
      success: false,
      message: "Could not send reset email. Please try again.",
    };
  }
}
