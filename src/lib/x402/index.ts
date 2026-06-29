/**
 * x402 payment protocol helper for AgentForge
 * Uses @make-software/casper-x402 for real on-chain micropayments.
 */

import {
  ExactCasperScheme,
  NETWORK_CASPER_TESTNET,
  createClientCasperSigner,
} from "@make-software/casper-x402";

export { NETWORK_CASPER_TESTNET };

// Minimal local type matching x402 spec
interface PaymentRequirements {
  scheme: string;
  network: string;
  maxTimeoutSeconds: number;
  asset: string;
  payTo: string;
  amount: string;
  extra?: { name?: string; version?: string; [k: string]: unknown };
  [k: string]: unknown;
}

export interface X402Config {
  agentKeyPath: string; // path to PEM secret key
  network: "testnet" | "mainnet";
}

export interface X402PaymentResult {
  success: boolean;
  response?: Response;
  amountPaid?: string;
  error?: string;
}

/**
 * Make an x402-aware HTTP request from a server-side agent.
 * If the server responds with 402, signs with the agent's key and replays.
 */
export async function x402Fetch(
  url: string,
  config: X402Config,
  options?: RequestInit
): Promise<X402PaymentResult> {
  const res = await fetch(url, options);

  if (res.status !== 402) {
    return { success: res.ok, response: res };
  }

  const paymentHeader = res.headers.get("X-Payment-Requirements") || res.headers.get("x-payment-requirements");
  if (!paymentHeader) {
    return { success: false, error: "No X-Payment-Requirements header in 402 response" };
  }

  let requirements: PaymentRequirements[];
  try {
    requirements = JSON.parse(paymentHeader);
  } catch {
    return { success: false, error: "Failed to parse X-Payment-Requirements" };
  }

  const req = requirements[0];
  if (!req) {
    return { success: false, error: "Empty payment requirements" };
  }

  let paymentHeader402: string;
  try {
    const signer = await createClientCasperSigner(config.agentKeyPath);
    const scheme = new ExactCasperScheme(signer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = await scheme.createPaymentPayload(1, req as any);
    paymentHeader402 = JSON.stringify(payload);
  } catch (e) {
    return { success: false, error: `Failed to sign x402 payment: ${e}` };
  }

  const paidRes = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      "X-PAYMENT": paymentHeader402,
    },
  });

  return {
    success: paidRes.ok,
    response: paidRes,
    amountPaid: req.amount,
  };
}

export function parsePaymentCost(headers: Headers): number {
  const header = headers.get("X-Payment-Requirements") || headers.get("x-payment-requirements");
  if (!header) return 0;
  try {
    const reqs: PaymentRequirements[] = JSON.parse(header);
    return parseInt(reqs[0]?.amount ?? "0", 10);
  } catch {
    return 0;
  }
}
