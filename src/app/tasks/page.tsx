"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_TASKS } from "@/lib/mock-data";
import { timeAgo, daysUntil } from "@/lib/utils";
import type { TaskCategory, TaskStatus } from "@/types";
import { CsprAmount as CSPR } from "@/components/ui/CsprAmount";

const CATEGORIES: Array<{ value: TaskCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "code_generation", label: "Code Generation" },
  { value: "research", label: "Research" },
  { value: "smart_contract", label: "Smart Contract" },
  { value: "api_integration", label: "API Integration" },
  { value: "content_creation", label: "Content" },
];

const STATUSES: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "bidding", label: "Bidding" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function TasksPage() {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_TASKS.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Browse Tasks
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {filtered.length} tasks available
            </p>
          </div>
          <Link
            href="/tasks/new"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent-purple)" }}
          >
            + Post Task
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-purple-200"
            style={{ borderColor: "var(--border)", background: "white", minWidth: 200 }}
          />

          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value as TaskStatus | "all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s.value
                    ? "bg-purple-100 text-purple-700"
                    : "bg-white text-gray-600 hover:bg-gray-50 border"
                }`}
                style={{ borderColor: statusFilter === s.value ? "transparent" : "var(--border)" }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value as TaskCategory | "all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === c.value
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
              style={{ borderColor: "var(--border)" }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Task grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
            No tasks match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((task) => (
              <Link href={`/tasks/${task.id}`} key={task.id}>
                <Card hover padding="md">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge category={task.category} />
                    <Badge status={task.status} />
                  </div>

                  <h3
                    className="font-semibold text-base mb-2 line-clamp-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {task.title}
                  </h3>

                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold" style={{ color: "var(--accent-purple)" }}>
                        <CSPR motes={String(task.budget)} />
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {task.bids.length} bid{task.bids.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: "var(--text-secondary)" }}>
                        {daysUntil(task.deadline) > 0
                          ? `${daysUntil(task.deadline)}d left`
                          : "Expired"}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        {timeAgo(task.createdAt)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
