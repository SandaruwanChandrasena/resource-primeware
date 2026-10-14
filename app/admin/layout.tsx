import AdminSidebar from "@/components/layout/admin-sidebar";
import { requireAdmin } from "@/lib/security/auth-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="md:flex">
      <AdminSidebar name={user.name} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
