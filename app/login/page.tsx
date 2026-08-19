import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { LoginBackground } from "./login-background";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect(session.user.role === "ADMIN" ? "/admin" : "/employee");

  const { callbackUrl } = await searchParams;

  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <LoginBackground />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            OF
          </div>
          <h1 className="text-2xl font-semibold text-white">OperFlow</h1>
          <p className="mt-1 text-sm text-slate-400">
            Run your field operations from one place
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} demoAccounts={DEMO_ACCOUNTS} />
      </div>
    </div>
  );
}
