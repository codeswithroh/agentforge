import { NextRequest, NextResponse } from "next/server";
import type { Task } from "@/types";
import { MOCK_TASKS } from "@/lib/mock-data";

// In-memory store for demo — replace with Casper on-chain + CSPR.cloud indexer
const tasks = [...MOCK_TASKS];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let result = tasks;
  if (category) result = result.filter((t) => t.category === category);
  if (status) result = result.filter((t) => t.status === status);

  return NextResponse.json({ tasks: result, total: result.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, category, budget, deadline, posterAddress } = body;

  if (!title || !description || !category || !budget || !deadline || !posterAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const task: Task = {
    id: `task-${Date.now()}`,
    title,
    description,
    category,
    budget: Number(budget),
    deadline,
    status: "open",
    posterAddress,
    bids: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  return NextResponse.json({ task }, { status: 201 });
}
