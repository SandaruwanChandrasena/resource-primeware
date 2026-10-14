import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "Admin dashboard | Resource Reservation" };

export default async function AdminDashboardPage() {
  // Pages check again: layouts alone are not a security check.
  const user = await requireAdmin();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back, {user.name}.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Usage numbers and the bookings for today will show here.
      </div>
    </section>
  );
}