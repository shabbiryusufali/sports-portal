import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// ⚠️ This file must remain Edge-compatible.
// Do NOT import Prisma, PrismaAdapter, bcrypt, or any Node.js-only modules here.
export const authConfig = {
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize() runs only in the Node.js runtime (API route), never on the Edge.
      // The actual implementation lives in auth.ts — this entry just declares the
      // credential shape so NextAuth knows the provider exists.
      authorize: () => null,
    }),
  ],
  session: { strategy: "jwt" } as const,
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    // This callback DOES run in middleware (Edge), so keep it light.
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      if (token?.email) session.user.email = token.email as string;
      return session;
    },
  },
} satisfies NextAuthConfig;