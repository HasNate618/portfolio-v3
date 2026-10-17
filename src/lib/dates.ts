const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2024-08" to "Aug 2024".
 *
 * Site dates stay ISO in site.ts and get words at the point of display, so the
 * knowledge base, the résumé page and the chat prompt cannot drift apart. The
 * chat prompt used to print the raw string, which read "2024 08 to 2028 05".
 */
export function monthYear(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}
