import { NextRequest, NextResponse } from "next/server";
import type { Agent } from "@/types";
import { MOCK_AGENTS } from "@/lib/mock-data";

const agents = [...MOCK_AGENTS];

export async function GET() {
  return NextResponse.json({ agents, total: agents.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, ownerAddress, capabilities } = body;

  if (!name || !ownerAddress || !capabilities?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const agent: Agent = {
    id: `agent-${Date.now()}`,
    name,
    description: description ?? "",
    ownerAddress,
    capabilities,
    reputationScore: 50,
    completedTasks: 0,
    totalEarned: 0,
    successRate: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  agents.push(agent);
  return NextResponse.json({ agent }, { status: 201 });
}
