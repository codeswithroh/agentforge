use odra::prelude::*;
use odra::casper_types::U512;

/// Task status stored on-chain
#[odra::odra_type]
pub enum TaskStatus {
    Open,
    Bidding,
    Assigned,
    InProgress,
    Completed,
    Disputed,
    Cancelled,
}

/// Minimal on-chain task record
#[odra::odra_type]
pub struct TaskRecord {
    pub poster: Address,
    pub title: String,
    pub description_hash: String,
    pub budget_motes: U512,
    pub deadline: u64,
    pub status: TaskStatus,
    pub assigned_agent: Option<Address>,
    pub work_hash: Option<String>,
}

/// AgentForge Marketplace — escrow, task assignment, work verification
#[odra::module]
pub struct AgentForgeMarketplace {
    task_count: Var<u64>,
    tasks: Mapping<u64, TaskRecord>,
    escrow: Mapping<u64, U512>,
}

#[odra::module]
impl AgentForgeMarketplace {
    /// Initialise contract
    pub fn init(&mut self) {
        self.task_count.set(0u64);
    }

    /// Post a task; CSPR attached to the deploy is held in the contract purse
    pub fn post_task(
        &mut self,
        title: String,
        description_hash: String,
        budget_motes: U512,
        deadline: u64,
    ) -> u64 {
        let id = self.task_count.get_or_default() + 1;
        self.task_count.set(id);

        let record = TaskRecord {
            poster: self.env().caller(),
            title,
            description_hash,
            budget_motes,
            deadline,
            status: TaskStatus::Open,
            assigned_agent: None,
            work_hash: None,
        };

        self.tasks.set(&id, record);
        self.escrow.set(&id, budget_motes);
        id
    }

    /// Poster picks a winning bid and assigns the agent
    pub fn assign_agent(&mut self, task_id: u64, agent: Address) {
        let mut task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        self.assert_poster(&task);
        task.status = TaskStatus::InProgress;
        task.assigned_agent = Some(agent);
        self.tasks.set(&task_id, task);
    }

    /// Assigned agent submits their work hash on-chain
    pub fn submit_work(&mut self, task_id: u64, work_hash: String) {
        let mut task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        let agent = task.assigned_agent.unwrap_or_revert(&self.env());
        if self.env().caller() != agent {
            self.env().revert(OdraError::user(10));
        }
        task.work_hash = Some(work_hash);
        task.status = TaskStatus::Completed;
        self.tasks.set(&task_id, task);
    }

    /// Poster approves work — releases CSPR escrow to the agent
    pub fn approve_and_release(&mut self, task_id: u64) {
        let task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        self.assert_poster(&task);
        let agent = task.assigned_agent.unwrap_or_revert(&self.env());
        let amount = self.escrow.get(&task_id).unwrap_or(U512::zero());
        self.env().transfer_tokens(&agent, &amount);
        self.escrow.set(&task_id, U512::zero());
    }

    /// Getter
    pub fn get_task(&self, task_id: u64) -> Option<TaskRecord> {
        self.tasks.get(&task_id)
    }

    pub fn task_count(&self) -> u64 {
        self.task_count.get_or_default()
    }

    // ----------------------------------------------------------------
    fn assert_poster(&self, task: &TaskRecord) {
        if self.env().caller() != task.poster {
            self.env().revert(OdraError::user(11));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::AgentForgeMarketplace;
    use odra::host::{Deployer, NoArgs};
    use odra::casper_types::U512;

    #[test]
    fn post_and_retrieve() {
        let env = odra_test::env();
        let mut contract = AgentForgeMarketplace::deploy(&env, NoArgs);

        let id = contract.post_task(
            "Analyse Casper TVL".into(),
            "QmAbc123".into(),
            U512::from(50_000_000_000u64),
            9_999_999_999,
        );

        assert_eq!(id, 1);
        let task = contract.get_task(1).expect("should exist");
        assert_eq!(task.title, "Analyse Casper TVL");
    }
}
