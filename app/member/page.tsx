import { requireMember } from "@/lib/security/auth-guard";

export const metadata = { title: "My home | Resource Reservation" };

export default async function MemberHomePage() {
  // Pages check again: layouts alone are not a security check.
  const user = await requireMember();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {user.department ?? "No department"}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Your upcoming bookings will show here.
      </div>
    </section>
  );
}
