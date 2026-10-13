import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";
import LoginForm from "@/components/login-form";

export const metadata = { title: "Sign in | Resource Reservation" };

export default async function LoginPage() {
  // Already logged in? Go to your home page.
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/member");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-gray-900 shadow">
        <h1 className="text-2xl font-bold">Resource Reservation</h1>
        <p className="mb-6 mt-1 text-sm text-gray-600">Sign in with the account your admin gave you.</p>
        <LoginForm />
      </div>
    </main>
  );
}