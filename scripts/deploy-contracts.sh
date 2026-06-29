#!/bin/bash
# Deploy AgentForge contracts to Casper testnet
# Run AFTER funding the deployer key at https://testnet.cspr.live/tools/faucet
# Public key: 0159f29f862518dcb55ea0d247e195d89874a949a9dbe3e908fe9f4320538c508e

set -e

KEYS_DIR="$(cd "$(dirname "$0")/.." && pwd)/keys"
NODE_URL="https://rpc.testnet.casperlabs.io/rpc"
CHAIN="casper-test"
PAYMENT="200000000000"  # 200 CSPR

echo "=== Deploying AgentForge Marketplace ==="
MARKETPLACE_DEPLOY=$(casper-client put-deploy \
  --node-address "$NODE_URL" \
  --chain-name "$CHAIN" \
  --secret-key "$KEYS_DIR/secret_key.pem" \
  --payment-amount "$PAYMENT" \
  --session-path contracts/agentforge-marketplace/wasm/AgentForgeMarketplace.wasm \
  2>&1)

echo "$MARKETPLACE_DEPLOY"
MARKETPLACE_DEPLOY_HASH=$(echo "$MARKETPLACE_DEPLOY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['deploy_hash'])" 2>/dev/null || echo "parse-failed")
echo "Marketplace deploy hash: $MARKETPLACE_DEPLOY_HASH"

echo ""
echo "=== Waiting ~2 min for marketplace to finalize... ==="
sleep 120

echo "=== Fetching marketplace contract hash ==="
ACCOUNT_HASH=$(casper-client account-address --public-key "$KEYS_DIR/public_key.pem" | python3 -c "import sys; print(sys.stdin.read().strip())")
MARKETPLACE_CONTRACT=$(casper-client get-state-root-hash --node-address "$NODE_URL" | python3 -c "
import subprocess, json, sys
r = json.loads(sys.stdin.read())
root = r['result']['state_root_hash']
" 2>/dev/null || echo "")

echo "=== Deploying AgentForge Reputation ==="
REPUTATION_DEPLOY=$(casper-client put-deploy \
  --node-address "$NODE_URL" \
  --chain-name "$CHAIN" \
  --secret-key "$KEYS_DIR/secret_key.pem" \
  --payment-amount "$PAYMENT" \
  --session-path contracts/agentforge-reputation/wasm/AgentForgeReputation.wasm \
  2>&1)

echo "$REPUTATION_DEPLOY"
REPUTATION_DEPLOY_HASH=$(echo "$REPUTATION_DEPLOY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['deploy_hash'])" 2>/dev/null || echo "parse-failed")
echo "Reputation deploy hash: $REPUTATION_DEPLOY_HASH"

echo ""
echo "=== Done! Check deploys at: ==="
echo "  https://testnet.cspr.live/deploy/$MARKETPLACE_DEPLOY_HASH"
echo "  https://testnet.cspr.live/deploy/$REPUTATION_DEPLOY_HASH"
echo ""
echo "After deploy finalization, update .env.local with:"
echo "  NEXT_PUBLIC_MARKETPLACE_CONTRACT_HASH=<hash from named keys>"
echo "  NEXT_PUBLIC_REPUTATION_CONTRACT_HASH=<hash from named keys>"
