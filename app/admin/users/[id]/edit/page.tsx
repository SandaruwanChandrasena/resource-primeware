import { notFound } from "next/navigation";
import { z } from "zod";
import StatusPill from "@/components/status-pill";
import UserForm from "@/components/user-form";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export const metadata = { title: "Edit user | Resource Reservation" };

// Next 16: params is a Promise.
type EditUserPageProps = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: EditUserPageProps) {
  const admin = await requireAdmin();
  const { id } = await params;

  // A bad id would crash the uuid column, so show 404 instead.
  if (!z.uuid().safeParse(id).success) notFound();

  // Safe fields only: the password hash never leaves the server (D26).
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, department: true, role: true, isActive: true },
  });
  if (!user) notFound();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Edit user</h1>
          <StatusPill tone={user.isActive ? "green" : "gray"}>{user.isActive ? "Active" : "Inactive"}</StatusPill>
        </div>
        <p className="mt-1 text-sm text-gray-500">Change the details of {user.name}.</p>
      </div>
      <UserForm user={user} isSelf={user.id === admin.id} />
    </section>
  );
}