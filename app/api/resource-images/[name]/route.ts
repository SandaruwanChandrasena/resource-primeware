import { getCurrentUser } from "@/lib/security/auth-guard";
import { imageResponse } from "@/lib/services/image-files";

// Sends one resource photo. Logged-in users only (the proxy checks too).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  if (!(await getCurrentUser()))
    return Response.json({ error: "Not logged in" }, { status: 401 });

  const { name } = await params;
  return imageResponse("resource-images", name);
}
