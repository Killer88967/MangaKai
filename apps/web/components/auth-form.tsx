"use client";

import Link from "next/link";
import { useActionState } from "react";
import { emptyAuthState, type AuthFormState } from "@/lib/auth-state";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10";

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
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        {registering ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {registering
          ? "Save what you are reading and pick it back up anywhere."
          : "Sign in to pick up where you left off."}
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {registering ? (
          <label className="block">
            <span className="mb-1.5 block text-sm text-zinc-300">Name</span>
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
          <span className="mb-1.5 block text-sm text-zinc-300">Email</span>
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
          <span className="mb-1.5 block text-sm text-zinc-300">Password</span>
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
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="mt-6 text-center text-sm text-zinc-400">
        {registering ? "Already have an account? " : "New to MangaKai? "}
        <Link
          href={registering ? "/login" : "/register"}
          className="font-medium text-violet-400 hover:text-violet-300"
        >
          {registering ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
