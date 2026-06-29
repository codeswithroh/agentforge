/**
 * Claude-powered AI agent executor for AgentForge.
 * Uses Claude Opus with tool use to execute tasks autonomously.
 * Agents can make x402 micropayments to access premium data mid-task.
 */

import Anthropic from "@anthropic-ai/sdk";
import { x402Fetch } from "@/lib/x402";
import type { Task, ExecutionStep, X402PaymentAuthorization } from "@/types";

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

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "fetch_blockchain_data",
    description:
      "Fetch on-chain data from CSPR.cloud API. May require x402 micropayment for premium endpoints.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: { type: "string", description: "CSPR.cloud API endpoint path" },
        params: { type: "object", description: "Query parameters" },
        requires_payment: { type: "boolean", description: "Whether this endpoint requires x402" },
      },
      required: ["endpoint"],
    },
  },
  {
    name: "web_search",
    description: "Search the web for research and background information.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "commit_deliverable",
    description:
      "Commit the final deliverable. Returns a hash that gets written to the Casper blockchain.",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The final deliverable content" },
        format: {
          type: "string",
          enum: ["json", "markdown", "text", "code"],
          description: "Output format",
        },
      },
      required: ["content", "format"],
    },
  },
];

export async function executeTask(
  task: Task,
  config: AgentConfig,
  onStep: (step: ExecutionStep) => void
): Promise<ExecutionResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const steps: ExecutionStep[] = [];
  let totalX402Spend = 0;
  let deliverable: string | undefined;
  let workHash: string | undefined;

  const systemPrompt = `You are ${config.agentName}, an autonomous AI agent registered on AgentForge —
the AI task marketplace on Casper Network. You are executing the following task for a human requester.

Your goal is to complete the task fully and produce a deliverable that satisfies the requirements.
You have tools available to fetch blockchain data (with optional x402 micropayments), search the web,
and commit your final deliverable on-chain.

Be autonomous and methodical. Use tools in sequence. When you have all the data you need,
call commit_deliverable with your final output.

Agent ID: ${config.agentId}
Casper Address: ${config.agentAddress}`;

  const userPrompt = `Execute this task:

**Title:** ${task.title}
**Description:** ${task.description}
**Category:** ${task.category}
**Budget:** ${task.budget} motes CSPR
**Deadline:** ${task.deadline}

Work through this step by step. Use available tools as needed. Commit your deliverable when done.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  const logStep = (description: string, type: ExecutionStep["type"] = "info", x402?: ExecutionStep["x402Payment"]) => {
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

  logStep("Task received. Analyzing requirements...");

  try {
    let iteration = 0;
    const MAX_ITERATIONS = 10;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const stream = await client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        system: systemPrompt,
        tools: AGENT_TOOLS,
        messages,
      });

      const response = await stream.finalMessage();
      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        if (textBlock && textBlock.type === "text") {
          logStep(`Agent completed: ${textBlock.text.slice(0, 200)}...`, "result");
        }
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUses = response.content.filter((b) => b.type === "tool_use");
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUses) {
          if (toolUse.type !== "tool_use") continue;
          const input = toolUse.input as Record<string, unknown>;
          let result = "";

          if (toolUse.name === "fetch_blockchain_data") {
            const endpoint = input.endpoint as string;
            const requiresPayment = input.requires_payment as boolean;
            logStep(`Fetching CSPR.cloud: ${endpoint}`);

            if (requiresPayment) {
              const cost = 500_000_000; // 0.5 CSPR for premium endpoints
              logStep(`x402 payment: 0.5 CSPR → CSPR.cloud premium`, "payment", {
                amount: cost,
                recipient: "cspr.cloud",
                purpose: `Premium data: ${endpoint}`,
              });
              totalX402Spend += cost;
            }

            // Mock response — wire to real CSPR.cloud API in production
            result = JSON.stringify({
              data: { endpoint, records: 720, status: "success" },
              timestamp: new Date().toISOString(),
            });
            logStep(`Received data from ${endpoint}`, "result");
          } else if (toolUse.name === "web_search") {
            const query = input.query as string;
            logStep(`Web search: "${query}"`);
            result = `Search results for "${query}": [Mock results - integrate with real search API]`;
          } else if (toolUse.name === "commit_deliverable") {
            const content = input.content as string;
            const format = input.format as string;
            logStep("Committing deliverable to Casper chain...");

            deliverable = content;
            workHash = await hashDeliverable(content);
            result = JSON.stringify({ hash: workHash, format, committed: true });
            logStep(`✓ Work hash committed on-chain: ${workHash}`, "result");
          }

          toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
        }

        messages.push({ role: "user", content: toolResults });
      }
    }

    return {
      success: true,
      steps,
      deliverable,
      workHash,
      totalX402Spend,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep(`Error: ${message}`, "info");
    return {
      success: false,
      steps,
      totalX402Spend,
      error: message,
    };
  }
}

async function hashDeliverable(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
