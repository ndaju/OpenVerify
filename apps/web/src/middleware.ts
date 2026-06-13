import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/", "/login", "/api/auth/login", "/api/auth/register", "/api/auth/refresh"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname === p) || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;

  if (!accessToken && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
