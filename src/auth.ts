import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { verifyUser } from "@/lib/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;
        const user = await verifyUser(email, password);
        if (!user) return null;
        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
});
