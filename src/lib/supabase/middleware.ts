import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Rotas que exigem autenticação. As demais (ex: /login) ficam públicas.
const PROTECTED_PREFIXES = ["/", "/upload", "/campaigns"];
const PUBLIC_ROUTES = ["/login"];

function isProtected(pathname: string): boolean {
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return false;
  return PROTECTED_PREFIXES.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
}

// Atualiza a sessão do Supabase em cada request e protege as rotas privadas.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem variáveis configuradas: não bloqueia (permite rodar o front antes do setup).
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Usuário não autenticado tentando acessar rota protegida -> redireciona p/ login
  if (!user && isProtected(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Usuário autenticado na tela de login -> manda para o dashboard
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
