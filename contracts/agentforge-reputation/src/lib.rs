use odra::prelude::*;
use odra::Address;

/// Agent reputation record (on-chain NFT-linked)
#[odra::odra_type]
pub struct AgentReputation {
    pub owner: Address,
    pub name: String,
    pub score: u8,          // 0–100
    pub tasks_completed: u64,
    pub tasks_failed: u64,
    pub total_earned_motes: u64,
    pub nft_token_id: Option<u64>,
}

/// AgentForge Reputation Registry
#[odra::module]
pub struct AgentReputationRegistry {
    agent_count: odra::Var<u64>,
    agents: odra::Mapping<Address, AgentReputation>,
    marketplace_contract: odra::Var<Option<Address>>,
}

#[odra::module]
impl AgentReputationRegistry {
    pub fn init(&mut self, marketplace: Address) {
        self.agent_count.set(0);
        self.marketplace_contract.set(Some(marketplace));
    }

    /// Register a new agent
    pub fn register(&mut self, name: String) {
        let caller = self.env().caller();
        let rep = AgentReputation {
            owner: caller,
            name,
            score: 50, // neutral starting score
            tasks_completed: 0,
            tasks_failed: 0,
            total_earned_motes: 0,
            nft_token_id: None,
        };
        self.agents.set(&caller, rep);
        let count = self.agent_count.get_or_default() + 1;
        self.agent_count.set(count);
    }

    /// Record completed task — only callable by marketplace contract
    pub fn record_completion(&mut self, agent: Address, earned_motes: u64) {
        self.assert_caller_is_marketplace();
        let mut rep = self.agents.get(&agent).unwrap_or_revert(&self.env());
        rep.tasks_completed += 1;
        rep.total_earned_motes += earned_motes;
        // Scoring: move toward 100 on success, slow decay otherwise
        let new_score = (rep.score as u64 * 9 + 100) / 10;
        rep.score = new_score.min(100) as u8;
        self.agents.set(&agent, rep);
    }

    /// Record failed task — only callable by marketplace contract
    pub fn record_failure(&mut self, agent: Address) {
        self.assert_caller_is_marketplace();
        let mut rep = self.agents.get(&agent).unwrap_or_revert(&self.env());
        rep.tasks_failed += 1;
        let new_score = (rep.score as u64 * 9 + 0) / 10;
        rep.score = new_score as u8;
        self.agents.set(&agent, rep);
    }

    /// Mint or update reputation NFT metadata (simplified)
    pub fn mint_reputation_nft(&mut self, token_id: u64) {
        let caller = self.env().caller();
        let mut rep = self.agents.get(&caller).unwrap_or_revert(&self.env());
        rep.nft_token_id = Some(token_id);
        self.agents.set(&caller, rep);
    }

    pub fn get_agent(&self, agent: Address) -> Option<AgentReputation> {
        self.agents.get(&agent)
    }

    pub fn agent_count(&self) -> u64 {
        self.agent_count.get_or_default()
    }

    fn assert_caller_is_marketplace(&self) {
        let marketplace = self.marketplace_contract.get().flatten();
        if marketplace != Some(self.env().caller()) {
            self.env().revert(ExecutionError::NotAnOwner);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv, HostRef};

    #[test]
    fn register_and_retrieve_agent() {
        let env = HostEnv::default();
        let marketplace_addr = env.get_account(0);
        let mut contract =
            AgentReputationRegistryHostRef::deploy(&env, InitArgs { marketplace: marketplace_addr });

        contract.register(String::from("CodeCasper"));
        let rep = contract
            .get_agent(env.get_account(0))
            .expect("agent should exist");
        assert_eq!(rep.name, "CodeCasper");
        assert_eq!(rep.score, 50);
    }
}
