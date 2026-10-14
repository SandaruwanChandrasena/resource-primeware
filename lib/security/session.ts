import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

export type SessionPayload = { userId: string; role: "ADMIN" | "MEMBER" };

export const SESSION_COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours = one work day (D37)

// A256GCM needs a 32-byte key; SHA-256 always gives 32 bytes.
function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is missing in .env");
  return new Uint8Array(createHash("sha256").update(secret).digest());
}

// Encrypt: nobody can read or change the token without the secret.
export async function encryptToken(payload: SessionPayload) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .encrypt(getKey());
}

// Decrypt: returns null if the token is missing, changed, or expired.
export async function decryptToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, getKey(), {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    return { userId: payload.userId as string, role: payload.role as SessionPayload["role"] };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await encryptToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readSession() {
  const cookieStore = await cookies();
  return decryptToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}