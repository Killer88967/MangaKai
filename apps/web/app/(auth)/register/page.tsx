import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/session";
import { registerAction } from "../actions";

export const metadata: Metadata = {
  title: "Create an account — MangaKai",
};

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  if (await getCurrentUser()) redirect("/");

  const { next } = await searchParams;

  return (
    <AuthForm
      mode="register"
      action={registerAction}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
