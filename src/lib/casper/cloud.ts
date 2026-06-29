/**
 * CSPR.cloud REST API client
 * Base: https://api.testnet.cspr.cloud
 * Auth: Authorization header with CSPR_CLOUD_API_KEY
 */

const BASE = "https://api.testnet.cspr.cloud";
const API_KEY = process.env.CSPR_CLOUD_API_KEY || process.env.NEXT_PUBLIC_CSPR_CLOUD_API_KEY || "";

async function cloudFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: API_KEY },
    next: { revalidate: 30 }, // cache 30s in Next.js
  });
  if (!res.ok) throw new Error(`CSPR.cloud ${path} → ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

// ----------------------------------------------------------------
// Account
// ----------------------------------------------------------------
export async function getAccount(publicKeyHex: string) {
  return cloudFetch<{
    public_key_hex: string;
    account_hash: string;
    main_purse: string;
    balance?: string;
  }>(`/accounts/${publicKeyHex}`);
}

export async function getAccountBalance(publicKeyHex: string): Promise<string> {
  try {
    const account = await getAccount(publicKeyHex);
    return account.balance ?? "0";
  } catch {
    return "0";
  }
}

// ----------------------------------------------------------------
// Deploys / transactions
// ----------------------------------------------------------------
export async function getDeploy(deployHash: string) {
  return cloudFetch<{
    deploy_hash: string;
    account_hash: string;
    cost: string;
    error_message?: string;
    execution_results?: Array<{ result: { Success?: unknown; Failure?: { error_message: string } } }>;
  }>(`/deploys/${deployHash}`);
}

export async function waitForDeploy(
  deployHash: string,
  maxAttempts = 20,
  intervalMs = 3000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const deploy = await getDeploy(deployHash);
      const result = deploy.execution_results?.[0]?.result;
      if (result?.Success !== undefined) return true;
      if (result?.Failure) throw new Error(result.Failure.error_message);
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== `CSPR.cloud /deploys/${deployHash} → 404`) throw e;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// ----------------------------------------------------------------
// Contract / named keys
// ----------------------------------------------------------------
export async function getContractNamedKeys(contractHash: string) {
  return cloudFetch<Array<{ name: string; key: string }>>(`/contracts/${contractHash}/named-keys`);
}

export async function getContractStoredValue(contractHash: string, key: string) {
  return cloudFetch<{ cl_type: string; parsed: unknown }>(
    `/contracts/${contractHash}/named-keys/${encodeURIComponent(key)}/value`
  );
}

// ----------------------------------------------------------------
// Marketplace stats (aggregated from on-chain events)
// ----------------------------------------------------------------
export async function getCSPRRate(): Promise<number> {
  try {
    const data = await cloudFetch<{ price: string }>("/cspr-rate");
    return parseFloat(data.price);
  } catch {
    return 0;
  }
}

// ----------------------------------------------------------------
// Client-side proxy (use in browser via CSPR.click SDK proxy)
// ----------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCloudProxy(clickSDK: any) {
  return clickSDK?.getCsprCloudProxy?.() ?? null;
}

export async function cloudFetchViaProxy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any,
  path: string,
  params?: Record<string, string>
) {
  if (!proxy) return null;
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await proxy.fetch(url.toString());
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json;
}
