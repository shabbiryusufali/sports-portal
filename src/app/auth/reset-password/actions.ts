"use server";

import { prisma } from "@/lib/db";
import { saltAndHashPassword } from "@/utils/password";

// ---------------------------------------------------------------------------
// validateResetToken  — called on page load to check if the token is still valid
// ---------------------------------------------------------------------------
export async function validateResetToken(
  token: string,
): Promise<{ valid: boolean; email?: string }> {
  if (!token) return { valid: false };

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record) return { valid: false };
  if (record.expires < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return { valid: false };
  }

  return { valid: true, email: record.email };
}

// ---------------------------------------------------------------------------
// resetPassword  — apply the new password and burn the token
// ---------------------------------------------------------------------------
export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!token) return { success: false, message: "Invalid or missing token." };

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters.",
      };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, message: "Passwords do not match." };
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) {
      return {
        success: false,
        message: "This reset link is invalid or has already been used.",
      };
    }

    if (record.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return {
        success: false,
        message: "This reset link has expired. Please request a new one.",
      };
    }

    const password_hash = saltAndHashPassword(newPassword);

    await prisma.user.update({
      where: { email: record.email },
      data: { password_hash },
    });

    // Burn the token so it cannot be reused.
    await prisma.passwordResetToken.delete({ where: { token } });

    return { success: true };
  } catch (err) {
    console.error("resetPassword error:", err);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
