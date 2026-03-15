"use server";

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { saltAndHashPassword } from "@/utils/password";
import { sendVerificationEmail } from "@/lib/email";

export async function registerWithCredentials(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      return { success: false, message: "All fields are required." };
    }
    if (password.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters.",
      };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    const password_hash = saltAndHashPassword(password);

    // Unique username with increment fallback
    const base = name.replaceAll(" ", "").toLowerCase();
    let username = base;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${base}${counter}`;
      counter++;
    }

    await prisma.user.create({
      data: { name, email, password_hash, username },
    });

    // Create verification token and send email.
    // Uses NextAuth's VerificationToken model (identifier = email).
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing token for this email first
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // Fire-and-forget — don't fail registration if email sending fails
    sendVerificationEmail(email, token).catch((err) =>
      console.error("sendVerificationEmail failed:", err),
    );

    return { success: true };
  } catch (err) {
    console.error("registerWithCredentials error:", err);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
