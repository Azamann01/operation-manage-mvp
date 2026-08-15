"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur"
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">
          Email
        </Label>
        <Input
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
  );
}
