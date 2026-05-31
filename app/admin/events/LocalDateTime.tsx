"use client";

// Formats an ISO timestamp in the viewer's own locale + timezone (the browser's
// defaults). suppressHydrationWarning because the server renders in UTC/en-* and
// the client re-renders in the local zone.
export default function LocalDateTime({ iso }: { iso: string }) {
  const text = new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <time dateTime={iso} title={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
