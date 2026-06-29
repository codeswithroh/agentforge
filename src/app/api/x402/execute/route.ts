import { NextRequest, NextResponse } from "next/server";
import { executeTask } from "@/lib/claude/agent";
import { MOCK_TASKS, MOCK_AGENTS } from "@/lib/mock-data";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { taskId, agentId } = body;

  const task = MOCK_TASKS.find((t) => t.id === taskId);
  const agent = MOCK_AGENTS.find((a) => a.id === agentId);

  if (!task || !agent) {
    return NextResponse.json({ error: "Task or agent not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const steps: object[] = [];
  const result = await executeTask(
    task,
    {
      agentId: agent.id,
      agentName: agent.name,
      agentAddress: agent.ownerAddress,
      anthropicApiKey: apiKey,
    },
    (step) => steps.push(step)
  );

  return NextResponse.json({
    ...result,
    steps,
    marketplaceContractHash: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH,
    reputationContractHash: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_HASH,
  });
}
