import Link from "next/link";
import { CalendarIcon } from "@/components/layout/app-icons";

type AppLogoProps = { href?: string; hideTextOnMobile?: boolean };

// Short app name on ONE line, so it never wraps next to the bell.
export default function AppLogo({
  href,
  hideTextOnMobile = false,
}: AppLogoProps) {
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
        <CalendarIcon className="h-[18px] w-[18px]" />
      </span>
      <span
        className={`whitespace-nowrap text-base font-semibold tracking-tight text-gray-900 ${hideTextOnMobile ? "hidden sm:inline" : ""}`}
      >
        Resource<span className="text-brand-600">Hub</span>
      </span>
    </>
  );

  if (!href) return <div className="flex items-center gap-2">{content}</div>;
  return (
    <Link href={href} className="flex items-center gap-2">
      {content}
    </Link>
  );
}
