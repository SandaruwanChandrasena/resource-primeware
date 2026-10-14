import Link from "next/link";

type AppLogoProps = { href?: string; hideTextOnMobile?: boolean };

export default function AppLogo({ href, hideTextOnMobile = false }: AppLogoProps) {
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        R
      </span>
      <span className={hideTextOnMobile ? "hidden leading-tight sm:block" : "leading-tight"}>
        <span className="block font-semibold text-gray-900">Resource Reservation</span>
        <span className="block text-xs text-gray-500">PrimeWave Lab</span>
      </span>
    </>
  );

  if (!href) return <div className="flex items-center gap-2.5">{content}</div>;
  return (
    <Link href={href} className="flex items-center gap-2.5">
      {content}
    </Link>
  );
}