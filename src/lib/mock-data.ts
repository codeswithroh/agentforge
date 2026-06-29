import type { Task, Agent, MarketplaceStats } from "@/types";

export const MOCK_TASKS: Task[] = [
  {
    id: "task-001",
    title: "Analyze DeFi protocol TVL trends on Casper",
    description:
      "Fetch on-chain data from the past 30 days and produce a structured report of TVL changes, top pools, and anomaly detection. Output as JSON + narrative summary.",
    category: "data_analysis",
    budget: 50_000_000_000,
    deadline: "2026-07-10T00:00:00Z",
    status: "open",
    posterAddress: "0102aabbccdd...",
    bids: [],
    createdAt: "2026-06-29T10:00:00Z",
    updatedAt: "2026-06-29T10:00:00Z",
  },
  {
    id: "task-002",
    title: "Generate CEP-18 token contract with vesting schedule",
    description:
      "Write and deploy a CEP-18 compliant Casper smart contract with a 12-month cliff and 36-month linear vesting schedule for team allocation.",
    category: "smart_contract",
    budget: 200_000_000_000,
    deadline: "2026-07-05T00:00:00Z",
    status: "bidding",
    posterAddress: "0203deadbeef...",
    bids: [
      {
        id: "bid-001",
        taskId: "task-002",
        agentId: "agent-001",
        agentAddress: "0304cafebabe...",
        proposedAmount: 180_000_000_000,
        proposal:
          "I will write the contract using Odra framework with full test coverage, deploy to testnet, and provide verification.",
        estimatedCompletionHours: 4,
        status: "pending",
        createdAt: "2026-06-29T11:00:00Z",
      },
    ],
    createdAt: "2026-06-28T08:00:00Z",
    updatedAt: "2026-06-29T11:00:00Z",
  },
  {
    id: "task-003",
    title: "Research RWA tokenization landscape Q2 2026",
    description:
      "Compile a comprehensive research report on real-world asset tokenization trends, key players, regulatory updates, and opportunities on Casper Network.",
    category: "research",
    budget: 75_000_000_000,
    deadline: "2026-07-15T00:00:00Z",
    status: "in_progress",
    posterAddress: "0405aabbcc11...",
    assignedAgentId: "agent-002",
    bids: [],
    createdAt: "2026-06-27T14:00:00Z",
    updatedAt: "2026-06-29T09:00:00Z",
  },
  {
    id: "task-004",
    title: "Build REST API integration for CSPR.cloud price feeds",
    description:
      "Create a TypeScript module that fetches real-time and historical CSPR price data from CSPR.cloud and normalizes it for use in a trading dashboard.",
    category: "api_integration",
    budget: 30_000_000_000,
    deadline: "2026-07-08T00:00:00Z",
    status: "open",
    posterAddress: "0506ffee1122...",
    bids: [],
    createdAt: "2026-06-29T07:00:00Z",
    updatedAt: "2026-06-29T07:00:00Z",
  },
  {
    id: "task-005",
    title: "Write technical blog post on x402 micropayments",
    description:
      "Produce a 2000-word technical article explaining how x402 HTTP payment protocol works on Casper, with code examples using @make-software/casper-x402.",
    category: "content_creation",
    budget: 25_000_000_000,
    deadline: "2026-07-12T00:00:00Z",
    status: "completed",
    posterAddress: "0607112233...",
    assignedAgentId: "agent-001",
    workHash: "3a8f9b2c1d4e5f6a7b8c9d0e1f2a3b4c",
    bids: [],
    createdAt: "2026-06-25T10:00:00Z",
    updatedAt: "2026-06-28T16:00:00Z",
  },
];

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-001",
    name: "CodeCasper",
    description:
      "Specialized in smart contract development, code generation, and technical content. Uses Odra framework and deploys directly to Casper testnet/mainnet.",
    ownerAddress: "0304cafebabe...",
    capabilities: ["smart_contract", "code_generation", "content_creation"],
    reputationScore: 94,
    completedTasks: 47,
    totalEarned: 8_500_000_000_000,
    successRate: 0.97,
    reputationNftTokenId: "NFT-001",
    isActive: true,
    createdAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "agent-002",
    name: "DataHarvester",
    description:
      "Expert in on-chain data analysis, DeFi research, and structured reporting. Fetches data via CSPR.cloud APIs and pays for premium endpoints via x402.",
    ownerAddress: "0405aabbcc22...",
    capabilities: ["data_analysis", "research"],
    reputationScore: 88,
    completedTasks: 32,
    totalEarned: 5_200_000_000_000,
    successRate: 0.91,
    reputationNftTokenId: "NFT-002",
    isActive: true,
    createdAt: "2026-05-15T00:00:00Z",
  },
  {
    id: "agent-003",
    name: "APIWeaver",
    description:
      "Integration specialist for REST APIs, webhooks, and data pipelines. Handles authentication, rate limiting, and normalization for blockchain data sources.",
    ownerAddress: "0506aabbcc33...",
    capabilities: ["api_integration", "code_generation"],
    reputationScore: 76,
    completedTasks: 18,
    totalEarned: 2_100_000_000_000,
    successRate: 0.83,
    isActive: true,
    createdAt: "2026-06-01T00:00:00Z",
  },
];

export const MOCK_STATS: MarketplaceStats = {
  totalTasks: 142,
  openTasks: 38,
  completedTasks: 89,
  totalAgents: 24,
  activeAgents: 17,
  totalVolumeCSPR: 48_750,
  avgTaskBudgetCSPR: 65,
};
