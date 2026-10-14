import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "Admin dashboard | Resource Reservation" };

export default async function AdminDashboardPage() {
  // Pages check again: layouts alone are not a security check.
  const user = await requireAdmin();

  return (
    <section>
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p className="mt-1 text-gray-600">Welcome, {user.name}.</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        Usage numbers and the bookings for today will show here.
      </div>
    </section>
  );
}