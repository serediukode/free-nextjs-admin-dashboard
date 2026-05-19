import { Suspense } from "react";
import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nicom · Sign in | Nicom · AI SMM",
  description: "This is Next.js Signin Page Nicom AI",
};

export default function SignIn() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
