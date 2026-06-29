"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store";
import { MOCK_AGENTS, MOCK_TASKS } from "@/lib/mock-data";
import { formatCSPR, timeAgo } from "@/lib/utils";
import type { TaskCategory } from "@/types";

const ALL_CAPABILITIES: TaskCategory[] = [
  "data_analysis",
  "code_generation",
  "research",
  "smart_contract",
  "api_integration",
  "content_creation",
];

export default function MyAgentPage() {
  const { isConnected } = useStore();
  const myAgent = MOCK_AGENTS[0]; // Demo: show first agent as "mine"
  const myTasks = MOCK_TASKS.filter((t) => t.assignedAgentId === myAgent.id);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: myAgent.name,
    description: myAgent.description,
    capabilities: myAgent.capabilities as TaskCategory[],
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setIsEditing(false);
  };

  const toggleCap = (cap: TaskCategory) => {
    setForm((f) => ({
      ...f,
      capabilities: f.capabilities.includes(cap)
        ? f.capabilities.filter((c) => c !== cap)
        : [...f.capabilities, cap],
    }));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Connect your wallet
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connect your Casper wallet to register or manage your AI agent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              My Agent
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Manage your registered AI agent and view earnings
            </p>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Reputation */}
            <Card>
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3"
                  style={{ background: "var(--accent-purple)" }}
                >
                  {myAgent.name.slice(0, 2)}
                </div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {myAgent.name}
                </div>
                {myAgent.reputationNftTokenId && (
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mt-2"
                    style={{ background: "var(--pastel-yellow)", color: "#92400e" }}
                  >
                    🏆 Reputation NFT #{myAgent.reputationNftTokenId}
                  </div>
                )}
                <div
                  className="text-4xl font-bold mt-4"
                  style={{ color: "var(--accent-green)" }}
                >
                  {myAgent.reputationScore}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  reputation score
                </div>
              </div>
            </Card>

            {/* Earnings */}
            <Card>
              <div className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                EARNINGS SUMMARY
              </div>
              <div className="space-y-3">
                {[
                  { label: "Total Earned", value: formatCSPR(myAgent.totalEarned) },
                  { label: "Completed Tasks", value: myAgent.completedTasks },
                  { label: "Success Rate", value: `${Math.round(myAgent.successRate * 100)}%` },
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
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Edit or view profile */}
            <Card>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-purple-200"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                      Capabilities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_CAPABILITIES.map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => toggleCap(cap)}
                          className={`transition-opacity ${
                            form.capabilities.includes(cap) ? "opacity-100" : "opacity-40"
                          }`}
                        >
                          <Badge category={cap} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button loading={saving} onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Profile
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                    {myAgent.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {myAgent.capabilities.map((cap) => (
                      <Badge key={cap} category={cap as TaskCategory} />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Recent tasks */}
            <Card>
              <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Recent Assignments
              </h2>
              {myTasks.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No tasks assigned yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "var(--bg-primary)" }}
                    >
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {task.title}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge status={task.status} />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {timeAgo(task.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="font-semibold text-sm" style={{ color: "var(--accent-purple)" }}>
                        {formatCSPR(task.budget)}
                      </div>
                    </div>
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
