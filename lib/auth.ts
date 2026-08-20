import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEMO_MODE, DEMO_ACCOUNT_EMAILS } from "@/lib/demo";

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Defense in depth: block the known seed-data accounts outright when
        // demo mode is off, independent of the login UI. Stops anyone who
        // already knows the (documented, shared) demo password from signing
        // in directly once this goes live with real customer data.
        if (!DEMO_MODE && (DEMO_ACCOUNT_EMAILS as readonly string[]).includes(email)) {
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
        return token;
      }

      // The JWT can outlive its User row (e.g. dev reseed while signed in).
      // Verify it still points at a real, active user on every read, or the
      // session goes stale and any write using session.user.id as a foreign
      // key (like notifications) crashes with an FK violation instead of a
      // clean redirect to sign-in.
      if (token.id) {
        const stillValid = await db.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, active: true },
        });
        if (!stillValid || !stillValid.active) {
          return null;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
      }
      return session;
    },
  },
});

// auth() re-verifies the session's user against the DB on every call (see
// the jwt callback above), so without this, each request calling it from
// multiple places (a layout, a page, getNotifications) pays for that lookup
// once per call instead of once per request.
export const auth = cache(uncachedAuth);
export { handlers, signIn, signOut };
