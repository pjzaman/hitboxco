import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hitbox — Collectibles Reimagined",
  description:
    "Verified. Evolving. Yours. Hitbox is a smart collectibles ecosystem powered by NFC and on-chain provenance.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen bg-surface-0 text-fg antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
