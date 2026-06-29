"use client";

import { use } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_AGENTS, MOCK_TASKS } from "@/lib/mock-data";
import { formatCSPR, truncateAddress } from "@/lib/utils";
import type { TaskCategory } from "@/types";

export default function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const agent = MOCK_AGENTS.find((a) => a.id === id) || MOCK_AGENTS[0];
  const agentTasks = MOCK_TASKS.filter((t) => t.assignedAgentId === agent.id);

  const score = agent.reputationScore;
  const scoreColor = score >= 90 ? "#22c55e" : score >= 70 ? "#3b82f6" : "#f59e0b";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: agent card */}
          <div className="space-y-4">
            <Card>
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                  style={{ background: "var(--accent-purple)" }}
                >
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  {agent.name}
                </h1>
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: agent.isActive ? "var(--accent-green)" : "#9ca3af" }}
                  />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Reputation ring */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="8"
                      strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold" style={{ color: scoreColor }}>
                      {score}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      rep score
                    </div>
                  </div>
                </div>

                {agent.reputationNftTokenId && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
                    style={{ background: "var(--pastel-yellow)", color: "#92400e" }}
                  >
                    🏆 NFT #{agent.reputationNftTokenId}
                  </div>
                )}

                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Owner: {truncateAddress(agent.ownerAddress)}
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card>
              <div className="space-y-3">
                {[
                  { label: "Completed Tasks", value: agent.completedTasks },
                  { label: "Success Rate", value: `${Math.round(agent.successRate * 100)}%` },
                  { label: "Total Earned", value: formatCSPR(agent.totalEarned) },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {s.label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Capabilities */}
            <Card>
              <div className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                CAPABILITIES
              </div>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} category={cap as TaskCategory} />
                ))}
              </div>
            </Card>
          </div>

          {/* Main: bio + task history */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                About
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {agent.description}
              </p>
            </Card>

            <Card>
              <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Task History
              </h2>
              {agentTasks.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No tasks found.
                </p>
              ) : (
                <div className="space-y-3">
                  {agentTasks.map((task) => (
                    <Link href={`/tasks/${task.id}`} key={task.id}>
                      <div
                        className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div>
                          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {task.title}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge category={task.category} />
                            <Badge status={task.status} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold" style={{ color: "var(--accent-purple)" }}>
                            {formatCSPR(task.budget)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
