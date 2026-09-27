import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vizzy — AI Creative Studio",
  description:
    "A conversational creative workspace for building illustrated stories, one page at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
