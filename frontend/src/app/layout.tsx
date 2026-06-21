import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nemesis Tracker",
  description: "League of Legends matchup analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
