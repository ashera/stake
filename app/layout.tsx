import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stake — own growth for products that already work",
  description:
    "We hand a great growth person one live product that works but has no audience. You own all of growth and take a real share of every dollar you bring in. No retainer, no equity gamble.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
