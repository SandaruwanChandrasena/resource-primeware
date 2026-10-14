import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Photos are files on disk (not in git); the database keeps only the file name.
// One shared place for all photo safety checks (D69, D77).
export type ImageFolder = "resource-images" | "user-images";

export const MAX_IMAGE_MB = 2;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;
type ImageExt = keyof typeof CONTENT_TYPES;

// Only our own random names, so "../" tricks are impossible.
const IMAGE_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

function folderPath(folder: ImageFolder) {
  return path.join(process.cwd(), "uploads", folder);
}

// Check the first bytes of the file, not the name or type the browser sent.
function detectExt(bytes: Uint8Array): ImageExt | null {
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export type SaveImageResult = { name: string } | { error: string };

export async function saveImage(
  folder: ImageFolder,
  file: File,
): Promise<SaveImageResult> {
  if (file.size > MAX_IMAGE_BYTES)
    return { error: `Photo is too big (max ${MAX_IMAGE_MB} MB).` };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectExt(bytes);
  if (!ext) return { error: "Photo must be a JPG, PNG or WebP image." };

  // A new random name: never the user's file name.
  const name = `${randomUUID()}.${ext}`;
  await mkdir(folderPath(folder), { recursive: true });
  await writeFile(path.join(folderPath(folder), name), bytes);
  return { name };
}

export async function deleteImage(
  folder: ImageFolder,
  name: string | null | undefined,
) {
  if (!name || !IMAGE_NAME.test(name)) return;
  // Already gone is fine.
  await unlink(path.join(folderPath(folder), name)).catch(() => {});
}

export async function readImage(folder: ImageFolder, name: string) {
  if (!IMAGE_NAME.test(name)) return null;
  try {
    const bytes = await readFile(path.join(folderPath(folder), name));
    return {
      bytes,
      contentType: CONTENT_TYPES[name.split(".").pop() as ImageExt],
    };
  } catch {
    return null;
  }
}

// Shared by both photo routes: logged-in check is done by the caller.
export async function imageResponse(folder: ImageFolder, name: string) {
  const image = await readImage(folder, name);
  if (!image) return Response.json({ error: "Not found" }, { status: 404 });

  // Names are random and never reused, so the browser can keep it for long.
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
