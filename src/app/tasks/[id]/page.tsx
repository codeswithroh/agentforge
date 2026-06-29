"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store";
import { useClickRef } from "@/providers/CsprClickProvider";
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
  { step: 2, text: "Fetching CSPR.cloud API — requesting historical TVL data (30d)", type: "info", time: "2s" },
  { step: 3, text: "x402 payment sent: 0.5 CSPR → CSPR.cloud premium endpoint", type: "payment", time: "3s" },
  { step: 4, text: "Data received: 720 data points across 12 pools", type: "info", time: "4s" },
  { step: 5, text: "Running anomaly detection with Claude Opus 4.8...", type: "info", time: "5s" },
  { step: 6, text: "Detected 3 anomalies: spike Jun 12, dip Jun 19, recovery Jun 25", type: "result", time: "9s" },
  { step: 7, text: "Generating structured JSON report + narrative summary...", type: "info", time: "10s" },
  { step: 8, text: "Deliverable ready. Committing hash to Casper testnet...", type: "info", time: "12s" },
  { step: 9, text: "✓ Work hash committed: 3a8f9b2c1d4e5f6a7b8c9d0e1f2a3b4c", type: "result", time: "15s" },
];

const LOG_COLORS = {
  info: "text-gray-600",
  payment: "text-purple-600 font-medium",
  result: "text-green-700 font-medium",
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { walletAddress } = useStore();
  const { clickSDK } = useClickRef();

  const task = MOCK_TASKS.find((t) => t.id === id) || MOCK_TASKS[0];
  const assignedAgent = task.assignedAgentId
    ? MOCK_AGENTS.find((a) => a.id === task.assignedAgentId)
    : null;

  const [showExecution, setShowExecution] = useState(task.status === "in_progress");
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveTxStatus, setApproveTxStatus] = useState("");
  const [visibleLogs, setVisibleLogs] = useState(
    task.status === "in_progress" ? MOCK_EXECUTION_LOGS.length : 0
  );

  const handleAcceptBid = async (bidId: string) => {
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 1200));
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
    if (!walletAddress || !clickSDK) {
      alert("Connect wallet to approve.");
      return;
    }

    setApproving(true);

    try {
      const contractHash = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH;

      if (contractHash) {
        // Real on-chain release via contract call
        const { buildApproveReleaseTransaction } = await import("@/lib/casper/transactions");
        const txJSON = buildApproveReleaseTransaction({
          senderPublicKey: walletAddress,
          contractHash,
          taskId: parseInt(task.id.replace("task-", "")) || 1,
        });

        setApproveTxStatus("Waiting for wallet signature...");
        const result = await clickSDK.send(
          txJSON,
          walletAddress,
          (status: string) => setApproveTxStatus(`Transaction ${status}...`)
        );

        if (result?.cancelled) {
          setApproving(false);
          setApproveTxStatus("");
          return;
        }
        if (result?.error) throw new Error(result.error);
      } else {
        // Contracts not yet deployed — simulate with delay
        setApproveTxStatus("Releasing escrow (simulation)...");
        await new Promise((r) => setTimeout(r, 2000));
      }

      router.push("/my/tasks");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error: ${msg}`);
    } finally {
      setApproving(false);
      setApproveTxStatus("");
    }
  };

  const executionDone = visibleLogs >= MOCK_EXECUTION_LOGS.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
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
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Posted by {truncateAddress(task.posterAddress)} · {timeAgo(task.createdAt)}
              </div>

              {task.escrowDeployHash && (
                <a
                  href={`https://testnet.cspr.live/deploy/${task.escrowDeployHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-purple-600 hover:underline"
                >
                  ↗ View escrow deposit on CSPR.live
                </a>
              )}

              {task.workHash && (
                <div
                  className="mt-4 p-3 rounded-lg text-xs font-mono"
                  style={{ background: "var(--pastel-green)", color: "#166534" }}
                >
                  ✓ Work hash on-chain: {task.workHash}
                </div>
              )}
            </Card>

            {/* Live execution stream */}
            {showExecution && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: executionDone ? "#9ca3af" : "var(--accent-green)" }}
                  />
                  <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Agent Execution Log
                  </h2>
                  {executionDone && (
                    <span className="text-xs text-green-600 ml-auto">Complete</span>
                  )}
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
                        className={`p-4 rounded-xl border ${selectedBid === bid.id ? "border-purple-300 bg-purple-50" : ""}`}
                        style={{ borderColor: selectedBid === bid.id ? undefined : "var(--border)" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                              {agent?.name || "Unknown Agent"}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {agent?.reputationScore}/100 rep · {agent?.completedTasks} tasks · ~{bid.estimatedCompletionHours}h
                            </div>
                          </div>
                          <div className="font-semibold text-sm" style={{ color: "var(--accent-purple)" }}>
                            {formatCSPR(bid.proposedAmount)}
                          </div>
                        </div>
                        <p className="text-xs mt-2 mb-3" style={{ color: "var(--text-secondary)" }}>
                          {bid.proposal}
                        </p>
                        {bid.status === "pending" && !selectedBid && (
                          <Button size="sm" loading={accepting} onClick={() => handleAcceptBid(bid.id)}>
                            Accept Bid
                          </Button>
                        )}
                        {selectedBid === bid.id && <Badge variant="green">Accepted</Badge>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>ESCROW BUDGET</div>
                  <div className="text-2xl font-bold" style={{ color: "var(--accent-purple)" }}>
                    {formatCSPR(task.budget)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>DEADLINE</div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {daysUntil(task.deadline) > 0 ? `${daysUntil(task.deadline)} days left` : "Expired"}
                  </div>
                </div>
                {assignedAgent && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>ASSIGNED AGENT</div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {assignedAgent.name}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {(task.status === "completed" || executionDone) && (
              <Card>
                <div className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                  Agent has submitted the deliverable. Approve to release CSPR escrow on-chain.
                </div>
                {approveTxStatus && (
                  <div className="text-xs mb-3 flex items-center gap-1.5" style={{ color: "var(--accent-green)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {approveTxStatus}
                  </div>
                )}
                <Button className="w-full" loading={approving} onClick={handleApprove}>
                  ✓ Approve & Release Escrow
                </Button>
              </Card>
            )}

            <Card>
              <div className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>ACTIVITY</div>
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
