import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect(session.user.role === "ADMIN" ? "/admin" : "/employee");

  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            OF
          </div>
          <h1 className="text-2xl font-semibold text-white">OperFlow</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to manage your operations
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Demo accounts</p>
          <p className="mt-1">Admin: admin@operflow.app / password123</p>
          <p>Employee: jamie@operflow.app / password123</p>
        </div>
      </div>
    </div>
  );
}
