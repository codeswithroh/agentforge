"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MOCK_TASKS, MOCK_AGENTS } from "@/lib/mock-data";
import { formatCSPR, timeAgo, truncateAddress, daysUntil } from "@/lib/utils";

interface ExecutionLog {
  step: number;
  text: string;
  type: "info" | "payment" | "result";
  time: string;
}

const MOCK_EXECUTION_LOGS: ExecutionLog[] = [
  { step: 1, text: "Task received. Analyzing requirements...", type: "info", time: "0s" },
  {
    step: 2,
    text: "Fetching CSPR.cloud API — requesting historical TVL data (30d)",
    type: "info",
    time: "2s",
  },
  {
    step: 3,
    text: "x402 payment sent: 0.5 CSPR → CSPR.cloud premium endpoint",
    type: "payment",
    time: "3s",
  },
  { step: 4, text: "Data received: 720 data points across 12 pools", type: "info", time: "4s" },
  { step: 5, text: "Running anomaly detection with Claude Opus...", type: "info", time: "5s" },
  { step: 6, text: "Detected 3 anomalies: spike on Jun 12, dip on Jun 19, recovery on Jun 25", type: "result", time: "9s" },
  { step: 7, text: "Generating structured JSON report + narrative summary...", type: "info", time: "10s" },
  { step: 8, text: "Deliverable ready. Committing hash to Casper chain...", type: "info", time: "12s" },
  { step: 9, text: "✓ Work hash committed: 3a8f9b2c1d4e5f6a...", type: "result", time: "15s" },
];

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const task = MOCK_TASKS.find((t) => t.id === id) || MOCK_TASKS[0];
  const assignedAgent = task.assignedAgentId
    ? MOCK_AGENTS.find((a) => a.id === task.assignedAgentId)
    : null;

  const [showExecution, setShowExecution] = useState(task.status === "in_progress");
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState(
    task.status === "in_progress" ? MOCK_EXECUTION_LOGS.length : 0
  );

  const handleAcceptBid = async (bidId: string) => {
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSelectedBid(bidId);
    setShowExecution(true);
    setAccepting(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLogs(i);
      if (i >= MOCK_EXECUTION_LOGS.length) clearInterval(interval);
    }, 800);
  };

  const handleApprove = async () => {
    setApproving(true);
    await new Promise((r) => setTimeout(r, 2000));
    setApproving(false);
    router.push("/my/tasks");
  };

  const LOG_COLORS = {
    info: "text-gray-600",
    payment: "text-purple-600 font-medium",
    result: "text-green-700 font-medium",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Task header */}
            <Card>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge category={task.category} />
                <Badge status={task.status} />
              </div>
              <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                {task.title}
              </h1>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {task.description}
              </p>
              <div
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Posted by {truncateAddress(task.posterAddress)} · {timeAgo(task.createdAt)}
              </div>

              {task.workHash && (
                <div
                  className="mt-4 p-3 rounded-lg text-xs font-mono"
                  style={{ background: "var(--pastel-green)", color: "#166534" }}
                >
                  ✓ Work hash on-chain: {task.workHash}
                </div>
              )}
            </Card>

            {/* Agent execution stream */}
            {showExecution && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: visibleLogs < MOCK_EXECUTION_LOGS.length ? "var(--accent-green)" : "#9ca3af" }}
                  />
                  <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Agent Execution Log
                  </h2>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {MOCK_EXECUTION_LOGS.slice(0, visibleLogs).map((log) => (
                    <div key={log.step} className={`flex gap-3 ${LOG_COLORS[log.type]}`}>
                      <span style={{ color: "var(--text-muted)", width: 32, flexShrink: 0 }}>
                        [{log.time}]
                      </span>
                      <span>{log.text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Bids */}
            {task.bids.length > 0 && (
              <Card>
                <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Bids ({task.bids.length})
                </h2>
                <div className="space-y-3">
                  {task.bids.map((bid) => {
                    const agent = MOCK_AGENTS.find((a) => a.id === bid.agentId);
                    return (
                      <div
                        key={bid.id}
                        className={`p-4 rounded-xl border ${
                          selectedBid === bid.id ? "border-purple-300 bg-purple-50" : ""
                        }`}
                        style={{
                          borderColor: selectedBid === bid.id ? undefined : "var(--border)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                              {agent?.name || "Unknown Agent"}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {agent?.reputationScore ?? 0}/100 rep ·{" "}
                              {agent?.completedTasks ?? 0} tasks done ·{" "}
                              ~{bid.estimatedCompletionHours}h
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm" style={{ color: "var(--accent-purple)" }}>
                              {formatCSPR(bid.proposedAmount)}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs mt-2 mb-3" style={{ color: "var(--text-secondary)" }}>
                          {bid.proposal}
                        </p>
                        {bid.status === "pending" && !selectedBid && (
                          <Button
                            size="sm"
                            loading={accepting}
                            onClick={() => handleAcceptBid(bid.id)}
                          >
                            Accept Bid
                          </Button>
                        )}
                        {selectedBid === bid.id && (
                          <Badge variant="green">Accepted</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Budget & timeline */}
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                    ESCROW BUDGET
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--accent-purple)" }}>
                    {formatCSPR(task.budget)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                    DEADLINE
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {daysUntil(task.deadline) > 0
                      ? `${daysUntil(task.deadline)} days left`
                      : "Deadline passed"}
                  </div>
                </div>
                {assignedAgent && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                      ASSIGNED AGENT
                    </div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {assignedAgent.name}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Approve button */}
            {(task.status === "completed" || visibleLogs >= MOCK_EXECUTION_LOGS.length) && (
              <Card>
                <div
                  className="text-xs mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Agent has submitted the deliverable. Review and approve to release escrow.
                </div>
                <Button
                  className="w-full"
                  variant="primary"
                  loading={approving}
                  onClick={handleApprove}
                >
                  {approving ? "Releasing Escrow..." : "✓ Approve & Release Escrow"}
                </Button>
              </Card>
            )}

            {/* Bid stats */}
            <Card>
              <div className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                ACTIVITY
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Bids received</span>
                  <span className="font-medium">{task.bids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Status</span>
                  <Badge status={task.status} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
