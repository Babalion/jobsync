import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Proxy replaces middleware in Next.js 16; keep the same auth gating logic.
export default auth;

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
