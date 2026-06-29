/**
 * Transaction builders for AgentForge smart contract interactions.
 * Uses casper-js-sdk v5 (real API) + CSPR.click send() for signing.
 */

import {
  PublicKey,
  NativeTransferBuilder,
  ContractCallBuilder,
  Args,
  CLValue,
} from "casper-js-sdk";

const CHAIN_NAME = "casper-test";

// ----------------------------------------------------------------
// Native CSPR transfer (escrow deposit before contracts deployed)
// ----------------------------------------------------------------
export function buildEscrowTransfer(params: {
  senderPublicKey: string;
  recipientPublicKey: string;
  amountMotes: number;
}) {
  const sender = PublicKey.fromHex(params.senderPublicKey);
  const target = PublicKey.fromHex(params.recipientPublicKey);

  return new NativeTransferBuilder()
    .from(sender)
    .target(target)
    .amount(String(params.amountMotes))
    .id(Date.now())
    .chainName(CHAIN_NAME)
    .payment(100_000_000)
    .build()
    .toJSON();
}

// ----------------------------------------------------------------
// Contract call: post_task
// ----------------------------------------------------------------
export function buildPostTaskTransaction(params: {
  senderPublicKey: string;
  contractHash: string; // "hash-abc123..."
  title: string;
  descriptionHash: string;
  budgetMotes: number;
  deadlineTimestamp: number;
}) {
  const sender = PublicKey.fromHex(params.senderPublicKey);
  const args = Args.fromMap({
    title: CLValue.newCLString(params.title),
    description_hash: CLValue.newCLString(params.descriptionHash),
    budget_motes: CLValue.newCLUint64(BigInt(params.budgetMotes)),
    deadline: CLValue.newCLUint64(BigInt(params.deadlineTimestamp)),
  });

  return new ContractCallBuilder()
    .from(sender)
    .byHash(params.contractHash)
    .entryPoint("post_task")
    .runtimeArgs(args)
    .payment(2_500_000_000)
    .chainName(CHAIN_NAME)
    .build()
    .toJSON();
}

// ----------------------------------------------------------------
// Contract call: assign_agent
// ----------------------------------------------------------------
export function buildAssignAgentTransaction(params: {
  senderPublicKey: string;
  contractHash: string;
  taskId: number;
  agentPublicKey: string;
}) {
  const sender = PublicKey.fromHex(params.senderPublicKey);
  const agentKey = PublicKey.fromHex(params.agentPublicKey);
  const args = Args.fromMap({
    task_id: CLValue.newCLUint64(BigInt(params.taskId)),
    agent: CLValue.newCLPublicKey(agentKey),
  });

  return new ContractCallBuilder()
    .from(sender)
    .byHash(params.contractHash)
    .entryPoint("assign_agent")
    .runtimeArgs(args)
    .payment(1_500_000_000)
    .chainName(CHAIN_NAME)
    .build()
    .toJSON();
}

// ----------------------------------------------------------------
// Contract call: approve_and_release
// ----------------------------------------------------------------
export function buildApproveReleaseTransaction(params: {
  senderPublicKey: string;
  contractHash: string;
  taskId: number;
}) {
  const sender = PublicKey.fromHex(params.senderPublicKey);
  const args = Args.fromMap({
    task_id: CLValue.newCLUint64(BigInt(params.taskId)),
  });

  return new ContractCallBuilder()
    .from(sender)
    .byHash(params.contractHash)
    .entryPoint("approve_and_release")
    .runtimeArgs(args)
    .payment(1_500_000_000)
    .chainName(CHAIN_NAME)
    .build()
    .toJSON();
}

// ----------------------------------------------------------------
// Contract call: submit_work
// ----------------------------------------------------------------
export function buildSubmitWorkTransaction(params: {
  senderPublicKey: string;
  contractHash: string;
  taskId: number;
  workHash: string;
}) {
  const sender = PublicKey.fromHex(params.senderPublicKey);
  const args = Args.fromMap({
    task_id: CLValue.newCLUint64(BigInt(params.taskId)),
    work_hash: CLValue.newCLString(params.workHash),
  });

  return new ContractCallBuilder()
    .from(sender)
    .byHash(params.contractHash)
    .entryPoint("submit_work")
    .runtimeArgs(args)
    .payment(1_500_000_000)
    .chainName(CHAIN_NAME)
    .build()
    .toJSON();
}

// ----------------------------------------------------------------
// SHA-256 hash of content (browser-safe)
// ----------------------------------------------------------------
export async function sha256Hex(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
