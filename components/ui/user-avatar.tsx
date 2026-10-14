import { getInitials } from "@/lib/config/user-display";

// Size of the circle and its initials for each place it is shown.
const SIZES = {
  md: "h-9 w-9 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function userImageUrl(imageName: string) {
  return `/api/user-images/${imageName}`;
}

type UserAvatarProps = {
  name: string;
  imageName: string | null;
  size: keyof typeof SIZES;
  // A chosen file not saved yet (blob: URL), shown instead of the saved photo.
  previewUrl?: string | null;
  className?: string;
};

// The profile photo, or the initials when there is no photo (D77).
export default function UserAvatar({
  name,
  imageName,
  size,
  previewUrl,
  className = "",
}: UserAvatarProps) {
  const src = previewUrl ?? (imageName ? userImageUrl(imageName) : null);
  const box = `${SIZES[size]} shrink-0 rounded-full ${className}`;

  if (src) {
    return (
      // Plain <img>: the photo route needs the login cookie (same as D69).
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${box} object-cover`} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${box} flex items-center justify-center bg-brand-100 font-semibold text-brand-700`}
    >
      {getInitials(name)}
    </span>
  );
}
