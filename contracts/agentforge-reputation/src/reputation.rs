use odra::prelude::*;

/// On-chain agent record
#[odra::odra_type]
pub struct AgentRecord {
    pub owner: Address,
    pub name: String,
    pub score: u8,
    pub tasks_completed: u64,
    pub tasks_failed: u64,
    pub total_earned_motes: u64,
    pub nft_token_id: Option<u64>,
}

/// AgentForge Reputation Registry
#[odra::module]
pub struct AgentForgeReputation {
    agent_count: Var<u64>,
    agents: Mapping<Address, AgentRecord>,
    marketplace: Var<Option<Address>>,
}

#[odra::module]
impl AgentForgeReputation {
    pub fn init(&mut self, marketplace: Address) {
        self.agent_count.set(0u64);
        self.marketplace.set(Some(marketplace));
    }

    /// Register the calling address as an agent
    pub fn register(&mut self, name: String) {
        let caller = self.env().caller();
        let record = AgentRecord {
            owner: caller,
            name,
            score: 50,
            tasks_completed: 0,
            tasks_failed: 0,
            total_earned_motes: 0,
            nft_token_id: None,
        };
        self.agents.set(&caller, record);
        let count = self.agent_count.get_or_default() + 1;
        self.agent_count.set(count);
    }

    /// Called by marketplace on task completion
    pub fn record_completion(&mut self, agent: Address, earned_motes: u64) {
        self.assert_marketplace();
        let mut rec = self.agents.get(&agent).unwrap_or_revert(&self.env());
        rec.tasks_completed += 1;
        rec.total_earned_motes += earned_motes;
        // EMA scoring: move toward 100
        let new_score = ((rec.score as u64) * 9 + 100) / 10;
        rec.score = new_score.min(100) as u8;
        self.agents.set(&agent, rec);
    }

    /// Called by marketplace on task failure
    pub fn record_failure(&mut self, agent: Address) {
        self.assert_marketplace();
        let mut rec = self.agents.get(&agent).unwrap_or_revert(&self.env());
        rec.tasks_failed += 1;
        let new_score = ((rec.score as u64) * 9) / 10;
        rec.score = new_score as u8;
        self.agents.set(&agent, rec);
    }

    /// Agent links their on-chain reputation NFT token
    pub fn link_nft(&mut self, token_id: u64) {
        let caller = self.env().caller();
        let mut rec = self.agents.get(&caller).unwrap_or_revert(&self.env());
        rec.nft_token_id = Some(token_id);
        self.agents.set(&caller, rec);
    }

    pub fn get_agent(&self, agent: Address) -> Option<AgentRecord> {
        self.agents.get(&agent)
    }

    pub fn agent_count(&self) -> u64 {
        self.agent_count.get_or_default()
    }

    fn assert_marketplace(&self) {
        let marketplace = self.marketplace.get().flatten();
        if marketplace != Some(self.env().caller()) {
            self.env().revert(OdraError::user(20));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{AgentForgeReputation, AgentForgeReputationInitArgs};
    use odra::host::Deployer;

    #[test]
    fn register_and_retrieve() {
        let env = odra_test::env();
        let marketplace_addr = env.get_account(0);
        let mut contract = AgentForgeReputation::deploy(
            &env,
            AgentForgeReputationInitArgs { marketplace: marketplace_addr },
        );

        contract.register("CodeCasper".into());
        let rec = contract
            .get_agent(env.get_account(0))
            .expect("agent should exist");
        assert_eq!(rec.name, "CodeCasper");
        assert_eq!(rec.score, 50);
    }
}
