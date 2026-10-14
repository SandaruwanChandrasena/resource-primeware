// Rows-per-page choices for tables. 10 is the default.
export const PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

// Card grids use 12, 24, 48: they fill rows of 2, 3 or 4 cards.
export const CARD_PAGE_SIZES = [12, 24, 48] as const;
export const DEFAULT_CARD_PAGE_SIZE = 12;

// Page buttons to show, e.g. 1 … 4 5 6 … 12. "gap" = the dots.
export function getPageNumbers(
  current: number,
  totalPages: number,
): (number | "gap")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("gap");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("gap");
  pages.push(totalPages);
  return pages;
}
