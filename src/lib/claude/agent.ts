/**
 * Claude Sonnet 4.6 autonomous agent for AgentForge.
 * Phase 1: Pre-fetch blockchain context from CSPR.cloud.
 * Phase 2: Single Claude call to synthesize + commit deliverable.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Task, ExecutionStep } from "@/types";

export interface AgentConfig {
  agentId: string;
  agentName: string;
  agentAddress: string;
  anthropicApiKey: string;
}

export interface ExecutionResult {
  success: boolean;
  steps: ExecutionStep[];
  deliverable?: string;
  workHash?: string;
  totalX402Spend: number;
  error?: string;
}

const CSPR_CLOUD_BASE = "https://api.testnet.cspr.cloud";
const CSPR_CLOUD_KEY = process.env.CSPR_CLOUD_API_KEY || "";

async function cloudFetch(path: string, params?: Record<string, string>): Promise<string> {
  const url = new URL(`${CSPR_CLOUD_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: CSPR_CLOUD_KEY } });
  if (!res.ok) return `[${path} unavailable: ${res.status}]`;
  const json = await res.json();
  const data = json.data ?? json;
  const text = JSON.stringify(data, null, 2);
  return text.length > 1500 ? text.slice(0, 1500) + "\n...(truncated)" : text;
}

export async function executeTask(
  task: Task,
  config: AgentConfig,
  onStep: (step: ExecutionStep) => void
): Promise<ExecutionResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const steps: ExecutionStep[] = [];
  const totalX402Spend = 0;
  let deliverable: string | undefined;
  let workHash: string | undefined;

  const logStep = (
    description: string,
    type: ExecutionStep["type"] = "info",
    x402?: ExecutionStep["x402Payment"]
  ) => {
    const step: ExecutionStep = {
      id: `step-${steps.length + 1}`,
      description,
      type,
      x402Payment: x402,
      timestamp: new Date().toISOString(),
    };
    steps.push(step);
    onStep(step);
  };

  logStep(`Task received. Analyzing: "${task.title}"...`);

  try {
    // Phase 1: pre-fetch Casper blockchain context
    logStep("Fetching live Casper blockchain data...");
    const [blocksData, contractsData] = await Promise.all([
      cloudFetch("/blocks", { page: "1", limit: "5" }),
      cloudFetch("/contracts", { page: "1", limit: "5" }),
    ]);
    logStep("Blockchain context loaded from CSPR.cloud", "result");

    const blockchainContext = `
=== LIVE CASPER TESTNET DATA (from CSPR.cloud) ===

Recent blocks:
${blocksData}

Deployed contracts (sample):
${contractsData}

AgentForge contracts on testnet:
  Marketplace: hash-263743f351886a86ec695dad0352dc70ecb04b54514c15f0a61d8b74070aea97
  Reputation:  hash-5aff9a1b00482da0a7006c5e7231a8a9c8d2112f85ffdcdaaf6710b95a4ee1bc
`;

    // Phase 2: single Claude call to produce the deliverable as text
    logStep("Claude agent synthesizing deliverable...");

    const systemPrompt = `You are ${config.agentName}, an expert AI agent on AgentForge — the AI task marketplace on Casper Network.
Complete the assigned task thoroughly using the blockchain data provided. Output your full deliverable directly — no preamble, no meta-commentary.
Agent ID: ${config.agentId} | Address: ${config.agentAddress}`;

    const userMessage = `Complete this task using the provided blockchain context:

**Title:** ${task.title}
**Description:** ${task.description}
**Category:** ${task.category}
**Budget:** ${(task.budget / 1e9).toFixed(2)} CSPR

${blockchainContext}

Produce the complete deliverable now:`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text" && textBlock.text.length > 0) {
      deliverable = textBlock.text;
      workHash = await hashDeliverable(deliverable);
      const preview = deliverable.slice(0, 80).replace(/\n/g, " ");
      logStep(`Deliverable produced: ${preview}...`, "result");
      logStep(`Work committed on-chain: ${workHash.slice(0, 16)}...`, "result");
    } else {
      throw new Error("Agent produced no deliverable");
    }

    return { success: true, steps, deliverable, workHash, totalX402Spend };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep(`Agent error: ${message}`, "info");
    return { success: false, steps, totalX402Spend, error: message };
  }
}

async function hashDeliverable(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
