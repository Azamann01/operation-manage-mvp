"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  const ip = await getClientIp();

  if (isRateLimited(ip)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      recordFailedAttempt(ip);
      return { error: "Invalid email or password." };
    }
    throw err;
  }
}
