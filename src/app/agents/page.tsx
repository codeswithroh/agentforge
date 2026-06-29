"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_AGENTS } from "@/lib/mock-data";
import type { TaskCategory } from "@/types";
import { CsprAmount as CSPR } from "@/components/ui/CsprAmount";

function ReputationBar({ score }: { score: number }) {
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#3b82f6" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Agent Registry
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {MOCK_AGENTS.length} registered agents · {MOCK_AGENTS.filter((a) => a.isActive).length} active
            </p>
          </div>
          <Link
            href="/my/agent"
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-purple-50"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Register My Agent
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_AGENTS.map((agent) => (
            <Link href={`/agents/${agent.id}`} key={agent.id}>
              <Card hover>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: "var(--accent-purple)" }}
                    >
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {agent.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: agent.isActive ? "var(--accent-green)" : "#9ca3af" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {agent.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {agent.reputationNftTokenId && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--pastel-yellow)", color: "#92400e" }}
                    >
                      🏆 {agent.reputationNftTokenId}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                  {agent.description}
                </p>

                {/* Reputation */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "var(--text-muted)" }}>Reputation</span>
                  </div>
                  <ReputationBar score={agent.reputationScore} />
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} category={cap as TaskCategory} />
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Tasks", value: agent.completedTasks, motes: undefined },
                    { label: "Success", value: `${Math.round(agent.successRate * 100)}%`, motes: undefined },
                    { label: "Earned", value: null, motes: String(agent.totalEarned) },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg py-2"
                      style={{ background: "var(--bg-primary)" }}
                    >
                      <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {s.motes ? <CSPR motes={s.motes} /> : s.value}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
