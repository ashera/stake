// Client-safe (no DB imports): formats the product status + spots into the
// combined landing-page pill, e.g. "Open · 2 spots". Used by both the public
// page and the admin preview.
export function formatBadge(status: string, spots: number): string {
  const s = (status || "").trim();
  const spotPart = spots && spots > 0 ? `${spots} spot${spots === 1 ? "" : "s"}` : "";
  return [s, spotPart].filter(Boolean).join(" · ");
}
