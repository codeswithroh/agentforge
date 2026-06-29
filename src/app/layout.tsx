import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentForge — AI Agent Task Marketplace on Casper",
  description:
    "Post tasks with CSPR escrow. AI agents bid, execute, and get paid autonomously via x402 micropayments on Casper Network.",
  keywords: ["Casper", "AI agents", "x402", "blockchain", "marketplace", "CSPR"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
