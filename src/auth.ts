import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { verifyPassword } from "./utils/password";
import { getUserFromDb } from "./utils/db";
import { ZodError } from "zod";
import { prisma } from "./lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google,
    Facebook,
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          let user = null;

          const { email, password } = credentials as {
            email: string;
            password: string;
          };

          // logic to salt and hash password
          if (!(await verifyPassword(email, password))) {
            return null;
          }

          // logic to verify if the user exists
          user = await getUserFromDb(email);

          if (!user) {
            return null;
          }

          // return JSON object with the user data
          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            // Return `null` to indicate that the credentials are invalid
            return null;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig);
