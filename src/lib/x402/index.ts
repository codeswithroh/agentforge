/**
 * x402 payment protocol helper for AgentForge
 * Agents use this to pay for data/tools mid-task via HTTP 402.
 * Spec: https://github.com/make-software/casper-x402
 */

export interface X402Config {
  agentAddress: string;
  signerPrivateKey: string; // In production, use secure key management
  network: "testnet" | "mainnet";
}

export interface PaymentRequirement {
  scheme: "exact";
  network: "casper-testnet" | "casper-mainnet";
  maxAmountRequired: string; // motes as string
  resource: string;
  description: string;
  mimeType?: string;
  payTo: string; // recipient address
  requiredDeadlineSeconds: number;
  extra?: {
    contractAddress: string;
    name: string;
    version?: string;
  };
}

export interface X402PaymentResult {
  success: boolean;
  response?: Response;
  amountPaid?: string;
  error?: string;
}

/**
 * Make an x402-aware HTTP request.
 * If the server responds with 402, automatically signs and replays with payment.
 */
export async function x402Fetch(
  url: string,
  config: X402Config,
  options?: RequestInit
): Promise<X402PaymentResult> {
  // Initial request
  const res = await fetch(url, options);

  if (res.status !== 402) {
    return { success: res.ok, response: res };
  }

  // Parse 402 payment requirements
  const paymentHeader = res.headers.get("X-Payment-Requirements");
  if (!paymentHeader) {
    return { success: false, error: "No X-Payment-Requirements header" };
  }

  const requirements: PaymentRequirement[] = JSON.parse(paymentHeader);
  const req = requirements[0];

  if (!req) {
    return { success: false, error: "Empty payment requirements" };
  }

  // Build payment authorization (mocked — wire to @make-software/casper-x402 in production)
  const authorization = await buildPaymentAuthorization(req, config);

  // Replay request with payment header
  const paidRes = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      "X-Payment": JSON.stringify(authorization),
    },
  });

  return {
    success: paidRes.ok,
    response: paidRes,
    amountPaid: req.maxAmountRequired,
  };
}

async function buildPaymentAuthorization(
  req: PaymentRequirement,
  config: X402Config
) {
  // TODO: Replace with actual @make-software/casper-x402 SDK call
  // This is the structure for a transfer_with_authorization on CEP-18
  const now = Math.floor(Date.now() / 1000);
  return {
    scheme: req.scheme,
    network: req.network,
    payload: {
      signature: "0x" + "00".repeat(64), // placeholder — real sig from CSPR.click
      authorization: {
        from: config.agentAddress,
        to: req.payTo,
        value: req.maxAmountRequired,
        validAfter: String(now - 10),
        validBefore: String(now + req.requiredDeadlineSeconds),
        nonce: crypto.randomUUID().replace(/-/g, ""),
      },
    },
  };
}

export function parsePaymentCost(headers: Headers): number {
  const header = headers.get("X-Payment-Requirements");
  if (!header) return 0;
  try {
    const reqs: PaymentRequirement[] = JSON.parse(header);
    return parseInt(reqs[0]?.maxAmountRequired ?? "0", 10);
  } catch {
    return 0;
  }
}
