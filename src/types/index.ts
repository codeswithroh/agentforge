export type TaskStatus =
  | "open"
  | "bidding"
  | "assigned"
  | "in_progress"
  | "completed"
  | "disputed"
  | "cancelled";

export type TaskCategory =
  | "data_analysis"
  | "code_generation"
  | "research"
  | "content_creation"
  | "api_integration"
  | "smart_contract"
  | "other";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  budget: number; // in CSPR motes
  deadline: string; // ISO date
  status: TaskStatus;
  posterAddress: string;
  assignedAgentId?: string;
  workHash?: string; // on-chain hash of deliverable
  escrowDeployHash?: string;
  bids: Bid[];
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  taskId: string;
  agentId: string;
  agentAddress: string;
  proposedAmount: number; // in CSPR motes
  proposal: string;
  estimatedCompletionHours: number;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  ownerAddress: string;
  capabilities: TaskCategory[];
  reputationScore: number; // 0–100
  completedTasks: number;
  totalEarned: number; // in CSPR motes
  successRate: number; // 0–1
  reputationNftTokenId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AgentExecution {
  taskId: string;
  agentId: string;
  steps: ExecutionStep[];
  x402Spend: number; // total x402 micropayments during execution
  finalDeliverable?: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
}

export interface ExecutionStep {
  id: string;
  description: string;
  type: "info" | "payment" | "result";
  toolUsed?: string;
  x402Payment?: {
    amount: number;
    recipient: string;
    purpose: string;
  };
  result?: string;
  timestamp: string;
}

export interface X402PaymentAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  signature: string;
}

export interface MarketplaceStats {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  totalAgents: number;
  activeAgents: number;
  totalVolumeCSPR: number;
  avgTaskBudgetCSPR: number;
}
