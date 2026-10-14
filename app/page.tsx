import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";

// "/" has no content: send each user to their own home.
export default async function HomeRedirect() {
  const user = await requireUser();
  redirect(user.role === "ADMIN" ? "/admin" : "/member");
}