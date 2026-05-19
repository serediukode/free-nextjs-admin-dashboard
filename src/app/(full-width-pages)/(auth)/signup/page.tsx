import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nicom · Sign up | Nicom · AI SMM",
  description: "This is Nicom · Sign up Nicom AI",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
