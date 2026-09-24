"use client";

import Link from "next/link";
import { useActionState } from "react";
import { emptyAuthState, type AuthFormState } from "@/lib/auth-state";

const fieldClass =
  "h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-border-strong focus:border-brand/60 focus:ring-4 focus:ring-brand/10";

interface AuthFormProps {
  mode: "login" | "register";
  action: (
    previous: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
  /** Where to go after success — carried through as a hidden field. */
  next?: string;
}

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, emptyAuthState);
  const registering = mode === "register";

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-xl font-black tracking-[-0.04em] text-white"
          >
            Manga<span className="text-brand">Kai</span>
          </Link>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
            {registering ? "Join MangaKai" : "Welcome back"}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-white">
            {registering ? "Create your account" : "Sign in"}
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
            {registering
              ? "Keep track of what you read and pick it back up across devices."
              : "Pick up where you left off and get back to reading."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <form action={formAction} className="space-y-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}

            {registering ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Display name
                </span>

                <input
                  name="displayName"
                  type="text"
                  required
                  maxLength={50}
                  autoComplete="nickname"
                  placeholder="What should we call you?"
                  className={fieldClass}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Email
              </span>

              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">
                Password
              </span>

              <input
                name="password"
                type="password"
                required
                minLength={8}
                /**
                 * Tells a password manager whether to offer a saved password or to
                 * generate a new one. Getting this wrong is why sign-up forms
                 * sometimes autofill the wrong entry.
                 */
                autoComplete={registering ? "new-password" : "current-password"}
                placeholder={
                  registering ? "At least 8 characters" : "Your password"
                }
                className={fieldClass}
              />
            </label>

            {state.error ? (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-200"
              >
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? registering
                  ? "Creating account…"
                  : "Signing in…"
                : registering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {registering ? "Already have an account? " : "New to MangaKai? "}

          <Link
            href={registering ? "/login" : "/register"}
            className="font-semibold text-brand-hover transition hover:text-white"
          >
            {registering ? "Sign in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
}
