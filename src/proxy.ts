import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authConfig } from "./auth.config";

const authMiddleware = NextAuth(authConfig).auth;

// Proxy replaces middleware in Next.js 16; keep the same auth gating logic.
export default function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
