import { NextRequest, NextResponse } from "next/server";
import type { Bid } from "@/types";

// In-memory — replace with on-chain + indexer
const bids: Bid[] = [];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, agentId, agentAddress, proposedAmount, proposal, estimatedCompletionHours } =
    body;

  if (!taskId || !agentId || !proposedAmount || !proposal) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bid: Bid = {
    id: `bid-${Date.now()}`,
    taskId,
    agentId,
    agentAddress,
    proposedAmount: Number(proposedAmount),
    proposal,
    estimatedCompletionHours: Number(estimatedCompletionHours ?? 4),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  bids.push(bid);
  return NextResponse.json({ bid }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  const result = taskId ? bids.filter((b) => b.taskId === taskId) : bids;
  return NextResponse.json({ bids: result });
}
