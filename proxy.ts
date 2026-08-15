import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isEmployeeRoute = pathname.startsWith("/employee");

  if ((isAdminRoute || isEmployeeRoute) && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && session?.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/employee", req.url));
  }

  if (isEmployeeRoute && !["EMPLOYEE", "ADMIN"].includes(session?.user.role ?? "")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*"],
};
