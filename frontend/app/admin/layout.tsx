import { Sidebar } from "@/components/admin/Sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session.authenticated || session.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center px-8 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <h1 className="font-semibold text-lg">Painel Administrativo</h1>
        </header>
        <main id="main-content" className="flex-1 p-8">
          {children}
        </main>
        <footer className="h-14 border-t flex items-center px-8 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Marketplace. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
