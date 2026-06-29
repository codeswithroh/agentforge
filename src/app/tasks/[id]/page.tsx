"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store";
import { useClickRef } from "@/providers/CsprClickProvider";
import { MOCK_TASKS, MOCK_AGENTS } from "@/lib/mock-data";
import { timeAgo, truncateAddress, daysUntil } from "@/lib/utils";
import { CsprAmount as CSPR } from "@/components/ui/CsprAmount";
import type { ExecutionStep } from "@/types";

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

  const [showExecution, setShowExecution] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionStep[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executionDone, setExecutionDone] = useState(false);
  const [workHash, setWorkHash] = useState(task.workHash || "");
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveTxStatus, setApproveTxStatus] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleAcceptBid = async (bidId: string) => {
    setAccepting(true);
    const bid = task.bids.find((b) => b.id === bidId);
    const agent = MOCK_AGENTS.find((a) => a.id === bid?.agentId);
    await new Promise((r) => setTimeout(r, 600));
    setSelectedBid(bidId);
    setAccepting(false);

    if (!agent) return;

    // Start real Claude agent execution
    setShowExecution(true);
    setExecuting(true);
    setExecutionLogs([]);

    try {
      const res = await fetch("/api/x402/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, agentId: agent.id }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const steps: ExecutionStep[] = data.steps || [];
      setExecutionLogs(steps);

      if (data.workHash) setWorkHash(data.workHash);
      setExecutionDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionLogs((prev) => [
        ...prev,
        {
          id: "err",
          description: `Execution error: ${msg}`,
          type: "info",
          timestamp: new Date().toISOString(),
        },
      ]);
      setExecutionDone(true);
    } finally {
      setExecuting(false);
    }
  };

  const handleApprove = async () => {
    if (!walletAddress || !clickSDK) {
      alert("Connect wallet to approve and release escrow.");
      return;
    }
    setApproving(true);
    try {
      const contractHash = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH;
      if (contractHash) {
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
        if (result?.cancelled) { setApproving(false); setApproveTxStatus(""); return; }
        if (result?.error) throw new Error(result.error);
      } else {
        setApproveTxStatus("Releasing escrow...");
        await new Promise((r) => setTimeout(r, 2000));
      }
      router.push("/my/tasks");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApproving(false);
      setApproveTxStatus("");
    }
  };

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
                  ↗ View escrow on CSPR.live
                </a>
              )}
              {workHash && (
                <div
                  className="mt-4 p-3 rounded-lg text-xs font-mono"
                  style={{ background: "var(--pastel-green)", color: "#166534" }}
                >
                  ✓ Work committed on-chain: {workHash}
                </div>
              )}
            </Card>

            {/* Real agent execution stream */}
            {showExecution && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: executing ? "var(--accent-green)" : executionDone ? "#9ca3af" : "var(--accent-purple)",
                      animation: executing ? "pulse 1s infinite" : undefined,
                    }}
                  />
                  <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {executing ? "Claude Agent Running..." : "Agent Execution Log"}
                  </h2>
                  {executionDone && (
                    <span className="text-xs text-green-600 ml-auto">Complete</span>
                  )}
                </div>
                <div className="space-y-2 font-mono text-xs max-h-80 overflow-y-auto">
                  {executionLogs.map((log) => (
                    <div key={log.id} className={`flex gap-3 ${LOG_COLORS[log.type]}`}>
                      <span style={{ color: "var(--text-muted)", width: 72, flexShrink: 0 }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span>{log.description}</span>
                    </div>
                  ))}
                  {executing && (
                    <div className="flex gap-3 text-gray-400 animate-pulse">
                      <span style={{ width: 72 }} />
                      <span>Agent working...</span>
                    </div>
                  )}
                  <div ref={logsEndRef} />
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
                            <CSPR motes={String(bid.proposedAmount)} />
                          </div>
                        </div>
                        <p className="text-xs mt-2 mb-3" style={{ color: "var(--text-secondary)" }}>
                          {bid.proposal}
                        </p>
                        {bid.status === "pending" && !selectedBid && (
                          <Button size="sm" loading={accepting} onClick={() => handleAcceptBid(bid.id)}>
                            Accept &amp; Run Agent
                          </Button>
                        )}
                        {selectedBid === bid.id && <Badge variant="green">Running</Badge>}
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
                  <div className="text-xs font-medium" style={{ color: "var(--text-muted)", marginBottom: 4 }}>
                    ESCROW BUDGET
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--accent-purple)" }}>
                    <CSPR motes={String(task.budget)} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-muted)", marginBottom: 4 }}>
                    DEADLINE
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {daysUntil(task.deadline) > 0
                      ? `${daysUntil(task.deadline)} days left`
                      : "Expired"}
                  </div>
                </div>
                {assignedAgent && (
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--text-muted)", marginBottom: 4 }}>
                      ASSIGNED AGENT
                    </div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {assignedAgent.name}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-muted)", marginBottom: 4 }}>
                    CONTRACT
                  </div>
                  <a
                    href={`https://testnet.cspr.live/contract/${process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline font-mono break-all"
                  >
                    {(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH || "").slice(0, 20)}...
                  </a>
                </div>
              </div>
            </Card>

            {(executionDone || task.status === "completed") && (
              <Card>
                <div className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                  Agent has committed the deliverable on-chain. Approve to release CSPR escrow.
                </div>
                {approveTxStatus && (
                  <div className="text-xs mb-3 flex items-center gap-1.5 text-green-700">
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
                <div className="flex justify-between items-center">
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
