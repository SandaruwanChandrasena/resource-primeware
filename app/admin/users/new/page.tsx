import UserForm from "@/components/user-form";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "Add user | Resource Reservation" };

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add user</h1>
        <p className="mt-1 text-sm text-gray-500">Create an account. Give the person their email and password.</p>
      </div>
      <UserForm />
    </section>
  );
}