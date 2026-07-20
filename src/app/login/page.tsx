"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-12 mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold">Finanças a Dois</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para continuar controlando seus gastos.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
            placeholder="voce@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-expense">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
