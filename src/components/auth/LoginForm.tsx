"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { login, signup, type AuthState } from "@/app/login/actions";

const initialState: AuthState = {};

function SubmitButton({ mode }: { mode: "login" | "signup" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white font-medium text-ink-950 transition-all hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : mode === "login" ? (
        "Entrar"
      ) : (
        "Criar conta"
      )}
    </button>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useFormState(action, initialState);

  const inputClass =
    "h-11 w-full rounded-xl border border-ink-700 bg-ink-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink-300">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@empresa.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink-300">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm text-brand-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {state.message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <SubmitButton mode={mode} />

      <p className="text-center text-sm text-ink-400">
        {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="font-medium text-brand-500 transition-colors hover:text-brand-400"
        >
          {mode === "login" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </form>
  );
}
