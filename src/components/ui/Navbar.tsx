"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  Megaphone,
  MessageCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signout } from "@/app/login/actions";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload de Lista", icon: UploadCloud },
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export function Navbar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ink-800 bg-ink-950/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Marca */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
        >
          <Logo size={36} withName priority />
        </Link>

        {/* Navegação desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-ink-400 hover:bg-ink-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Usuário + logout (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          {userEmail && (
            <span className="max-w-[180px] truncate text-sm text-ink-400">
              {userEmail}
            </span>
          )}
          <form action={signout}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-ink-700 px-3 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>

        {/* Botão do menu mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-200 hover:bg-ink-800 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Painel mobile: desce do topo, altura máxima de 50vh (sem overlay full-screen) */}
      {mobileOpen && (
        <div className="md:hidden">
          <div className="animate-slide-down max-h-[50vh] overflow-y-auto border-t border-ink-800 bg-ink-900 px-4 py-4 shadow-soft-lg">
            <div className="flex flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                    isActive(href)
                      ? "bg-brand-500/10 text-brand-400"
                      : "text-ink-200 hover:bg-ink-800"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}

              <div className="mt-2 border-t border-ink-800 pt-2">
                {userEmail && (
                  <p className="px-4 py-1 text-xs text-ink-500">{userEmail}</p>
                )}
                <form action={signout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-ink-200 transition-colors hover:bg-ink-800"
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
