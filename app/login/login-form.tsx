"use client";

import { useActionState, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";
import type { DemoAccount } from "@/lib/demo";

const DEMO_ICONS = { shield: ShieldCheck, wrench: Wrench } as const;

export function LoginForm({
  callbackUrl,
  demoAccounts,
}: {
  callbackUrl?: string;
  demoAccounts: DemoAccount[];
}) {
  const hasDemo = demoAccounts.length > 0;
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(!hasDemo);

  function signInAsDemo(account: DemoAccount) {
    if (pending) return;
    setActiveDemo(account.email);
    if (emailRef.current) emailRef.current.value = account.email;
    if (passwordRef.current) passwordRef.current.value = account.password;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-4">
      {!showEmailForm && (
        <div className="animate-in fade-in slide-in-from-bottom-1 space-y-5 duration-300">
          <div className="grid gap-2.5">
            {demoAccounts.map((account) => {
              const Icon = DEMO_ICONS[account.icon];
              const isActive = pending && activeDemo === account.email;
              return (
                <button
                  key={account.email}
                  type="button"
                  disabled={pending}
                  onClick={() => signInAsDemo(account)}
                  className="group flex items-center gap-3.5 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left shadow-lg shadow-black/20 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-indigo-950/40 disabled:pointer-events-none disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 transition-colors group-hover:bg-indigo-500/25">
                    {isActive ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Icon className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      Continue as {account.role}
                    </p>
                    <p className="truncate text-xs text-slate-500">{account.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-500">No signup required</p>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="h-px flex-1 bg-slate-800" />
            or
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <Lock className="h-3.5 w-3.5" />
            Sign in with email
          </button>
        </div>
      )}

      {/* Always mounted (even while the demo view is showing) so the demo
          buttons' formRef.requestSubmit() always has a real form to submit —
          only visibility toggles, never whether it's in the DOM. */}
      <div
        className={
          showEmailForm
            ? "animate-in fade-in slide-in-from-bottom-1 space-y-4 duration-300"
            : "hidden"
        }
      >
        {hasDemo && (
          <button
            type="button"
            onClick={() => setShowEmailForm(false)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to demo options
          </button>
        )}
        <form
          ref={formRef}
          action={formAction}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur"
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <Input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
            />
          </div>
          {state?.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
