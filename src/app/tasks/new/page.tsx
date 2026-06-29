"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store";
import { useClickRef } from "@/providers/CsprClickProvider";
import { motesFromCSPR } from "@/lib/utils";
import { buildEscrowTransfer, buildPostTaskTransaction, sha256Hex } from "@/lib/casper/transactions";
import type { Task, TaskCategory } from "@/types";
import { CsprAmount as CSPR } from "@/components/ui/CsprAmount";

const CATEGORIES: Array<{ value: TaskCategory; label: string; desc: string }> = [
  { value: "data_analysis", label: "Data Analysis", desc: "On-chain metrics, DeFi data, trend reports" },
  { value: "code_generation", label: "Code Generation", desc: "Scripts, modules, automation code" },
  { value: "research", label: "Research", desc: "Market research, technical deep-dives" },
  { value: "smart_contract", label: "Smart Contract", desc: "Deploy or audit Casper contracts" },
  { value: "api_integration", label: "API Integration", desc: "Connect external APIs, data pipelines" },
  { value: "content_creation", label: "Content Creation", desc: "Blog posts, documentation, copy" },
  { value: "other", label: "Other", desc: "Anything else" },
];

// Treasury account receives escrow until contracts are deployed
const ESCROW_ACCOUNT =
  process.env.NEXT_PUBLIC_ESCROW_ACCOUNT ||
  "0202b3a72ddfe6d2b8c4aa3f5b68e93b7e8b7e9a3dc2b5c9f1e0d4a7b2c3d4e5f6a7b8";

export default function PostTaskPage() {
  const router = useRouter();
  const { addTask, walletAddress, isConnected } = useStore();
  const { clickSDK, isReady } = useClickRef();
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as TaskCategory | "",
    budgetCSPR: "",
    deadlineDays: "7",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!form.category) {
      alert("Please select a category.");
      return;
    }
    if (!isReady || !clickSDK) {
      alert("Wallet SDK not ready yet.");
      return;
    }

    setLoading(true);

    try {
      const budgetMotes = motesFromCSPR(parseFloat(form.budgetCSPR));
      const descHash = await sha256Hex(form.description);
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(form.deadlineDays));
      const deadlineTs = Math.floor(deadline.getTime() / 1000);

      const contractHash = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH;
      const txJSON = contractHash
        ? buildPostTaskTransaction({
            senderPublicKey: walletAddress,
            contractHash,
            title: form.title,
            descriptionHash: descHash,
            budgetMotes,
            deadlineTimestamp: deadlineTs,
          })
        : buildEscrowTransfer({
            senderPublicKey: walletAddress,
            recipientPublicKey: ESCROW_ACCOUNT,
            amountMotes: budgetMotes,
          });

      setTxStatus("Waiting for wallet signature...");

      // Send via CSPR.click — opens wallet prompt
      const result = await clickSDK.send(
        txJSON,
        walletAddress,
        (status: string) => {
          setTxStatus(`Transaction ${status}...`);
        }
      );

      if (result?.cancelled) {
        setTxStatus("");
        setLoading(false);
        return;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      setTxStatus("Task confirmed! Saving...");

      const task: Task = {
        id: `task-${Date.now()}`,
        title: form.title,
        description: form.description,
        category: form.category as TaskCategory,
        budget: budgetMotes,
        deadline: deadline.toISOString(),
        status: "open",
        posterAddress: walletAddress,
        escrowDeployHash: result?.transactionHash,
        bids: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persist to API
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, descriptionHash: descHash }),
      });

      addTask(task);
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTxStatus("");
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Post a Task
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Your CSPR budget is locked in escrow on-chain until the task is approved.
          </p>
        </div>

        {!isConnected && (
          <div
            className="mb-6 p-4 rounded-xl text-sm"
            style={{ background: "var(--pastel-yellow)", color: "#92400e" }}
          >
            ⚠️ Connect your wallet to post a task with CSPR escrow.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Analyze DeFi TVL trends on Casper for Q2 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-purple-200"
              style={{ borderColor: "var(--border)" }}
            />
          </Card>

          <Card>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Description *
            </label>
            <textarea
              required
              rows={6}
              placeholder="Detailed description, expected output format, any specific requirements..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none"
              style={{ borderColor: "var(--border)" }}
            />
          </Card>

          <Card>
            <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
              Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    form.category === cat.value ? "border-purple-400 bg-purple-50" : "hover:bg-gray-50"
                  }`}
                  style={{ borderColor: form.category === cat.value ? undefined : "var(--border)" }}
                >
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {cat.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {cat.desc}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  Budget (CSPR) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.1"
                    placeholder="50"
                    value={form.budgetCSPR}
                    onChange={(e) => setForm({ ...form, budgetCSPR: e.target.value })}
                    className="w-full px-3 py-2 pr-14 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-purple-200"
                    style={{ borderColor: "var(--border)" }}
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    CSPR
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  Deadline
                </label>
                <select
                  value={form.deadlineDays}
                  onChange={(e) => setForm({ ...form, deadlineDays: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>

            {form.budgetCSPR && (
              <div
                className="mt-3 p-3 rounded-lg text-sm flex items-center gap-2"
                style={{ background: "var(--pastel-purple)", color: "var(--accent-purple)" }}
              >
                <CSPR motes={String(motesFromCSPR(parseFloat(form.budgetCSPR)))} />
                <span>will be locked in escrow on Casper testnet</span>
              </div>
            )}
          </Card>

          {txStatus && (
            <div
              className="p-3 rounded-lg text-sm flex items-center gap-2"
              style={{ background: "var(--pastel-green)", color: "#166534" }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {txStatus}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!isConnected || !isReady}
            className="w-full"
          >
            {loading ? txStatus || "Processing..." : "Post Task & Lock Escrow →"}
          </Button>
        </form>
      </div>
    </div>
  );
}
