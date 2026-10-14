import { getCurrentUser } from "@/lib/auth-guard";
import { readResourceImage } from "@/lib/resource-images";

// Sends one resource photo. Logged-in users only (the proxy checks too).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  if (!(await getCurrentUser()))
    return Response.json({ error: "Not logged in" }, { status: 401 });

  const { name } = await params;
  const image = await readResourceImage(name);
  if (!image) return Response.json({ error: "Not found" }, { status: 404 });

  // Names are random and never reused, so the browser can keep it for long.
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
