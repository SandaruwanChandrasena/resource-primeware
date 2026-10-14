import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Photos are files on disk (not in git); the database keeps only the file name.
const IMAGE_DIR = path.join(process.cwd(), "uploads", "resource-images");
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

export async function saveResourceImage(file: File): Promise<SaveImageResult> {
  if (file.size > MAX_IMAGE_BYTES)
    return { error: `Photo is too big (max ${MAX_IMAGE_MB} MB).` };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectExt(bytes);
  if (!ext) return { error: "Photo must be a JPG, PNG or WebP image." };

  // A new random name: never the user's file name.
  const name = `${randomUUID()}.${ext}`;
  await mkdir(IMAGE_DIR, { recursive: true });
  await writeFile(path.join(IMAGE_DIR, name), bytes);
  return { name };
}

export async function deleteResourceImage(name: string | null | undefined) {
  if (!name || !IMAGE_NAME.test(name)) return;
  // Already gone is fine.
  await unlink(path.join(IMAGE_DIR, name)).catch(() => {});
}

export async function readResourceImage(name: string) {
  if (!IMAGE_NAME.test(name)) return null;
  try {
    const bytes = await readFile(path.join(IMAGE_DIR, name));
    return {
      bytes,
      contentType: CONTENT_TYPES[name.split(".").pop() as ImageExt],
    };
  } catch {
    return null;
  }
}
