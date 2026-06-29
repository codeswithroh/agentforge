"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, truncateAddress } from "@/lib/utils";
import { useStore } from "@/store";

const NAV_LINKS = [
  { href: "/tasks", label: "Browse Tasks" },
  { href: "/agents", label: "Agents" },
  { href: "/my/tasks", label: "My Tasks" },
  { href: "/my/agent", label: "My Agent" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { walletAddress, isConnected, setWallet } = useStore();

  const handleConnect = () => {
    // Mock wallet connection — will wire to CSPR.click in next step
    setWallet("0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20");
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--accent-purple)" }}
          >
            AF
          </div>
          <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            AgentForge
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname?.startsWith(link.href)
                  ? "text-purple-700 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/tasks/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-purple)" }}
          >
            + Post Task
          </Link>

          {isConnected && walletAddress ? (
            <button
              onClick={() => setWallet(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--accent-green)" }}
              />
              {truncateAddress(walletAddress, 4)}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:bg-purple-50 hover:border-purple-200"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
