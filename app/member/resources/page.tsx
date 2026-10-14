import Link from "next/link";
import {
  EquipmentIcon,
  ResourcesIcon,
  RoomIcon,
  VehicleIcon,
} from "@/components/app-icons";
import type { ResourceType } from "@/generated/prisma/client";
import { requireMember } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { RESOURCE_TYPE_LABELS } from "@/lib/resource-types";

export const metadata = { title: "Resources | Resource Reservation" };

const TYPE_ICONS: Record<ResourceType, typeof RoomIcon> = {
  ROOM: RoomIcon,
  EQUIPMENT: EquipmentIcon,
  VEHICLE: VehicleIcon,
  OTHER: ResourcesIcon,
};

export default async function MemberResourcesPage() {
  await requireMember();

  // Only active resources can be booked (D50).
  const resources = await db.resource.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      location: true,
      capacity: true,
      description: true,
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Book a resource</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a room, equipment or vehicle, then choose a time.
        </p>
      </div>

      {resources.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No resources are available right now.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const TypeIcon = TYPE_ICONS[r.type];
            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <TypeIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      {RESOURCE_TYPE_LABELS[r.type]}
                    </p>
                    <p className="truncate font-semibold">{r.name}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {r.location}
                  {r.capacity ? ` · ${r.capacity} people` : ""}
                </p>
                {r.description && (
                  <p className="text-sm text-gray-600">{r.description}</p>
                )}
                <Link
                  href={`/member/resources/${r.id}`}
                  className="mt-auto self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Book
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
