import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16 requires explicit function export — destructured pattern fails static analysis
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/auth|api/signup).*)",
  ],
};
