import PasswordChangeForm from "@/components/forms/password-change-form";
import ProfileDetails from "@/components/ui/profile-details";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/security/auth-guard";

export const metadata = { title: "My profile | Resource Reservation" };

export default async function MemberProfilePage() {
  const { id } = await requireMember();

  // Safe fields only: the password hash never leaves the server (D26).
  const user = await db.user.findUniqueOrThrow({
    where: { id },
    select: {
      name: true,
      email: true,
      phone: true,
      department: true,
      imageName: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account details, photo and password.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ProfileDetails user={user} />
        <PasswordChangeForm />
      </div>
    </section>
  );
}
