import { Crosshair, UploadCloud, Filter, GitBranch } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const features = [
  { icon: UploadCloud, label: "Importação de leads via CSV em segundos" },
  { icon: Filter, label: "Higienização: remove inativos e duplicados" },
  { icon: GitBranch, label: "Pipeline com status: enviado, pendente ou falha" },
];

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-screen bg-ink-950 lg:grid-cols-2">
      {/* Coluna de branding (visível no desktop) */}
      <div className="glow-bg relative hidden flex-col justify-between overflow-hidden border-r border-ink-800 bg-ink-950 p-12 lg:flex">
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">
            <Crosshair className="h-5 w-5" />
          </span>
          <span className="font-serif text-xl font-semibold text-white">
            Supra V4
          </span>
        </div>

        <div className="relative max-w-lg">
          <span className="kicker mb-6">Prospecção · WhatsApp</span>
          <h1 className="font-serif text-6xl font-semibold leading-[1.02] text-white">
            Leads que <span className="accent-italic">se convertem</span>{" "}
            sozinhos.
          </h1>
          <p className="mt-6 max-w-md text-ink-400">
            Importe sua lista, dispare campanhas e acompanhe cada resposta. Você
            só fala com quem realmente importa.
          </p>

          <ul className="mt-10 flex flex-col gap-4">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-ink-300">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="kicker relative">Supra · V4</p>
      </div>

      {/* Coluna do formulário */}
      <div className="flex items-center justify-center bg-ink-900 px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Marca (mobile) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Crosshair className="h-5 w-5" />
            </span>
            <span className="font-serif text-xl font-semibold text-white">
              Supra V4
            </span>
          </div>

          <span className="kicker mb-5">Bem-vindo de volta</span>
          <h2 className="font-serif text-4xl font-semibold text-white">
            Entrar
          </h2>
          <p className="mt-2 text-ink-400">
            Acesse sua conta para gerenciar suas campanhas.
          </p>

          {!configured && (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              Supabase ainda não configurado. Preencha o{" "}
              <code className="font-mono">.env.local</code> para habilitar o
              login.
            </div>
          )}

          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
