import { Navbar } from "@/components/ui/Navbar";
import { getUser } from "@/lib/auth";

// Layout das páginas autenticadas: injeta a Navbar com o usuário da sessão.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <>
      <Navbar userEmail={user?.email ?? null} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
