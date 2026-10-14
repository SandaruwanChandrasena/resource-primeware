import type { ResourceType } from "@/generated/prisma/client";

// Database value -> label people read.
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  ROOM: "Room",
  EQUIPMENT: "Equipment",
  VEHICLE: "Vehicle",
  OTHER: "Other",
};