import {
  EquipmentIcon,
  ResourcesIcon,
  RoomIcon,
  VehicleIcon,
} from "@/components/app-icons";
import type { ResourceType } from "@/generated/prisma/client";

const TYPE_ICONS: Record<ResourceType, typeof RoomIcon> = {
  ROOM: RoomIcon,
  EQUIPMENT: EquipmentIcon,
  VEHICLE: VehicleIcon,
  OTHER: ResourcesIcon,
};

// Size and shape for each place the photo is shown.
const VARIANTS = {
  thumb: { box: "h-9 w-9 rounded-lg", icon: "h-4 w-4" },
  row: { box: "h-14 w-20 rounded-lg", icon: "h-5 w-5" },
  card: { box: "aspect-[16/9] w-full", icon: "h-10 w-10" },
  hero: { box: "h-48 w-full rounded-xl sm:h-56", icon: "h-12 w-12" },
};

export function resourceImageUrl(imageName: string) {
  return `/api/resource-images/${imageName}`;
}

type ResourcePhotoProps = {
  imageName: string | null;
  type: ResourceType;
  variant: keyof typeof VARIANTS;
  muted?: boolean;
};

// The photo, or a soft banner with the type icon when there is no photo.
export default function ResourcePhoto({
  imageName,
  type,
  variant,
  muted = false,
}: ResourcePhotoProps) {
  const { box, icon } = VARIANTS[variant];

  if (imageName) {
    return (
      // Plain <img>: the photo route needs the login cookie, which next/image would not send.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resourceImageUrl(imageName)}
        alt=""
        loading="lazy"
        className={`${box} shrink-0 object-cover ${muted ? "opacity-50 grayscale" : ""}`}
      />
    );
  }

  const Icon = TYPE_ICONS[type];
  return (
    <span
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center ${
        muted
          ? "bg-gray-100 text-gray-400"
          : "bg-linear-to-br from-brand-50 to-brand-100 text-brand-700"
      }`}
    >
      <Icon className={icon} />
    </span>
  );
}
