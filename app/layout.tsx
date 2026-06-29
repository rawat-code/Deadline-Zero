import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deadline Zero",
  description: "Your proactive AI companion to secure deadlines and guarantee commitments with zero compromise.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased bg-[#030712] text-gray-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
