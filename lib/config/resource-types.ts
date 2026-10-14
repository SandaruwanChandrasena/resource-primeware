import type { Prisma, ResourceType } from "@/generated/prisma/client";

// Database value -> label people read.
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  ROOM: "Room",
  EQUIPMENT: "Equipment",
  VEHICLE: "Vehicle",
  OTHER: "Other",
};

// Sort choices for resource lists. "oldest" is the default.
export const RESOURCE_SORTS = ["oldest", "newest", "name"] as const;
export type ResourceSort = (typeof RESOURCE_SORTS)[number];

export const RESOURCE_SORT_LABELS: Record<ResourceSort, string> = {
  oldest: "Oldest first",
  newest: "Newest first",
  name: "Name A–Z",
};

// Each sort choice -> database order. Name breaks ties.
export const RESOURCE_ORDER_BY = {
  oldest: [{ createdAt: "asc" }, { name: "asc" }],
  newest: [{ createdAt: "desc" }, { name: "asc" }],
  name: [{ name: "asc" }],
} satisfies Record<ResourceSort, Prisma.ResourceOrderByWithRelationInput[]>;
