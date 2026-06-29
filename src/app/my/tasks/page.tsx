"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store";
import { MOCK_TASKS } from "@/lib/mock-data";
import { formatCSPR, timeAgo, daysUntil } from "@/lib/utils";

export default function MyTasksPage() {
  const { walletAddress, isConnected } = useStore();

  // In real app, filter by walletAddress. For demo use mock data.
  const myTasks = MOCK_TASKS.slice(0, 3);

  const stats = {
    total: myTasks.length,
    open: myTasks.filter((t) => t.status === "open").length,
    inProgress: myTasks.filter((t) => ["bidding", "assigned", "in_progress"].includes(t.status)).length,
    completed: myTasks.filter((t) => t.status === "completed").length,
    totalEscrow: myTasks.reduce((sum, t) => sum + t.budget, 0),
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Connect your wallet
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Connect your Casper wallet to see your posted tasks.
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
              My Tasks
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Tasks you have posted as a requester
            </p>
          </div>
          <Link href="/tasks/new">
            <Button>+ Post New Task</Button>
          </Link>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Tasks", value: stats.total, color: "var(--pastel-purple)" },
            { label: "In Progress", value: stats.inProgress, color: "var(--pastel-blue)" },
            { label: "Completed", value: stats.completed, color: "var(--pastel-green)" },
            {
              label: "Total Escrow",
              value: formatCSPR(stats.totalEscrow).split(" ")[0],
              color: "var(--pastel-yellow)",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: s.color }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-4">
          {myTasks.map((task) => (
            <Card key={task.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge category={task.category} />
                    <Badge status={task.status} />
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {task.title}
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{task.bids.length} bids</span>
                    <span>{timeAgo(task.createdAt)}</span>
                    <span>
                      {daysUntil(task.deadline) > 0 ? `${daysUntil(task.deadline)}d left` : "Expired"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-sm" style={{ color: "var(--accent-purple)" }}>
                      {formatCSPR(task.budget)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      escrow
                    </div>
                  </div>
                  <Link href={`/tasks/${task.id}`}>
                    <Button variant="outline" size="sm">
                      View →
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
