import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

// Reusable hook: change some URL params and keep the others.
// A value of undefined (or "") removes that param.
export function useUrlQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() =>
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      }),
    );
  }

  return { update, pending };
}
