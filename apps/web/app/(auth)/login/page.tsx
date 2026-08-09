import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/session";
import { loginAction } from "../actions";

export const metadata: Metadata = {
  title: "Sign in — MangaKai",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Someone already signed in has nothing to do here.
  if (await getCurrentUser()) redirect("/");

  const { next } = await searchParams;

  return (
    <AuthForm
      mode="login"
      action={loginAction}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
