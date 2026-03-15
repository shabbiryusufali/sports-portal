import NextAuth from "next-auth";
import { authConfig } from "@/api/auth/auth.config";

// Only imports the Edge-safe config — no Prisma, no DB, no bcrypt.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|auth/).*)"],
};
