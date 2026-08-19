/**
 * Demo mode gates two things at once:
 *  - whether the one-click "Continue as Admin/Employee" buttons are shown (and
 *    whether their credentials ever reach the client at all — see app/login/page.tsx)
 *  - whether prisma/seed.ts is allowed to run its destructive reset+reseed
 *
 * Defaults to disabled. A production deploy must not set DEMO_MODE=true once
 * real customer data exists.
 */
export const DEMO_MODE = process.env.DEMO_MODE === "true";

// Emails created by prisma/seed.ts. Used by lib/auth.ts to refuse sign-in for
// these specific accounts whenever DEMO_MODE is off, even if someone already
// knows the (documented, shared) demo password — the UI gate alone doesn't
// stop a direct POST to the credentials endpoint.
export const DEMO_ACCOUNT_EMAILS = [
  "admin@operflow.app",
  "jamie@operflow.app",
  "priya@operflow.app",
  "liam@operflow.app",
] as const;

export type DemoAccount = {
  role: "Admin" | "Employee";
  name: string;
  email: string;
  password: string;
  description: string;
  icon: "shield" | "wrench";
};

// Only populated when DEMO_MODE is on. app/login/page.tsx (a Server Component)
// passes this to the client LoginForm as a prop — the client component has no
// hardcoded credentials of its own, so when DEMO_MODE is off these plaintext
// passwords never appear in any HTML or JS sent to the browser.
export const DEMO_ACCOUNTS: DemoAccount[] = DEMO_MODE
  ? [
      {
        role: "Admin",
        name: "Sam Whitfield",
        email: "admin@operflow.app",
        password: "password123",
        description: "Full access — jobs, customers, team, reports",
        icon: "shield",
      },
      {
        role: "Employee",
        name: "Jamie Carter",
        email: "jamie@operflow.app",
        password: "password123",
        description: "Field view — assigned jobs and updates",
        icon: "wrench",
      },
    ]
  : [];
