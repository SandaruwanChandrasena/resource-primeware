import type { Role } from "@/generated/prisma/client";

// "Nimal Perera" -> "NP"
export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// Database value -> label people read.
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MEMBER: "Member",
};

// Sort choices for the users list. "oldest" is the default.
export const USER_SORTS = ["oldest", "newest", "name"] as const;
export type UserSort = (typeof USER_SORTS)[number];

export const USER_SORT_LABELS: Record<UserSort, string> = {
  oldest: "Oldest first",
  newest: "Newest first",
  name: "Name A–Z",
};