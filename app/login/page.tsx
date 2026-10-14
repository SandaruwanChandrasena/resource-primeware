import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";
import AppLogo from "@/components/layout/app-logo";
import LoginForm from "@/components/forms/login-form";

export const metadata = { title: "Sign in | Resource Reservation" };

export default async function LoginPage() {
  // Already logged in? Go to your home page.
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/member");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <AppLogo />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            Use the account your admin gave you.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-gray-500">
          No account? Ask your admin.
        </p>
      </div>
    </main>
  );
}
