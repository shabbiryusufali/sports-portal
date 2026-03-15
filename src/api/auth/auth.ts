import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/utils/password";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Override the Credentials provider with the real authorize() implementation.
    // This file only runs in the Node.js runtime (API routes), never on the Edge.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("authorize: missing credentials");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.error("authorize: no user found for email", email);
            return null;
          }

          if (!user.password_hash) {
            console.error(
              "authorize: user has no password (OAuth-only account)",
            );
            return null;
          }

          const valid = await verifyPassword(email, password);
          if (!valid) {
            console.error("authorize: password mismatch for", email);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (err) {
          console.error("authorize: unexpected error", err);
          return null;
        }
      },
    }),
  ],
});
