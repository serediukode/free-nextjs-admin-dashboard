import type { NextAuthConfig } from "next-auth";

// Edge-safe config (used by middleware). No Node-only imports.
export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async authorized({ request, auth }) {
      const pathname = request.nextUrl.pathname;
      const isLoggedIn = Boolean(auth?.user);
      const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/signup");
      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.url));
        }
        return true;
      }
      if (pathname.startsWith("/api/auth")) return true;
      if (pathname === "/api/signup") return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
