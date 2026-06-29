use odra::prelude::*;
use odra::{casper_types::U512, Address};

/// Task status enum stored on-chain
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

/// On-chain task record
#[odra::odra_type]
pub struct TaskRecord {
    pub id: u64,
    pub poster: Address,
    pub title: String,
    pub description_hash: String, // IPFS/hash of full description
    pub budget_motes: U512,
    pub deadline: u64, // unix timestamp
    pub status: TaskStatus,
    pub assigned_agent: Option<Address>,
    pub work_hash: Option<String>, // hash of deliverable committed by agent
}

/// AgentForge Marketplace smart contract
#[odra::module]
pub struct AgentForgeMarketplace {
    task_count: odra::Var<u64>,
    tasks: odra::Mapping<u64, TaskRecord>,
    escrow: odra::Mapping<u64, U512>, // task_id -> locked CSPR
}

#[odra::module]
impl AgentForgeMarketplace {
    pub fn init(&mut self) {
        self.task_count.set(0);
    }

    /// Post a new task; caller must attach CSPR equal to budget
    pub fn post_task(
        &mut self,
        title: String,
        description_hash: String,
        budget_motes: U512,
        deadline: u64,
    ) -> u64 {
        // In production: verify attached value >= budget_motes
        let id = self.task_count.get_or_default() + 1;
        self.task_count.set(id);

        let task = TaskRecord {
            id,
            poster: self.env().caller(),
            title,
            description_hash,
            budget_motes,
            deadline,
            status: TaskStatus::Open,
            assigned_agent: None,
            work_hash: None,
        };

        self.tasks.set(&id, task);
        self.escrow.set(&id, budget_motes);
        id
    }

    /// Mark task as bidding (called when first bid arrives)
    pub fn mark_bidding(&mut self, task_id: u64) {
        let mut task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        self.assert_caller_is_poster(&task);
        task.status = TaskStatus::Bidding;
        self.tasks.set(&task_id, task);
    }

    /// Assign task to an agent (poster selects winning bid)
    pub fn assign_agent(&mut self, task_id: u64, agent: Address) {
        let mut task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        self.assert_caller_is_poster(&task);
        task.status = TaskStatus::InProgress;
        task.assigned_agent = Some(agent);
        self.tasks.set(&task_id, task);
    }

    /// Agent submits work hash on-chain
    pub fn submit_work(&mut self, task_id: u64, work_hash: String) {
        let mut task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        // Only assigned agent can call this
        let assigned = task.assigned_agent.clone().unwrap_or_revert(&self.env());
        if self.env().caller() != assigned {
            self.env().revert(ExecutionError::NotAnOwner);
        }
        task.work_hash = Some(work_hash);
        task.status = TaskStatus::Completed;
        self.tasks.set(&task_id, task);
    }

    /// Poster approves work — releases escrow to agent
    pub fn approve_and_release(&mut self, task_id: u64) {
        let mut task = self.tasks.get(&task_id).unwrap_or_revert(&self.env());
        self.assert_caller_is_poster(&task);
        let agent = task.assigned_agent.clone().unwrap_or_revert(&self.env());
        let amount = self.escrow.get(&task_id).unwrap_or(U512::zero());

        // Transfer CSPR from escrow to agent
        self.env().transfer_tokens(&agent, &amount);
        self.escrow.set(&task_id, U512::zero());
        task.status = TaskStatus::Completed;
        self.tasks.set(&task_id, task);
    }

    /// Get task by ID
    pub fn get_task(&self, task_id: u64) -> Option<TaskRecord> {
        self.tasks.get(&task_id)
    }

    /// Get total task count
    pub fn task_count(&self) -> u64 {
        self.task_count.get_or_default()
    }

    fn assert_caller_is_poster(&self, task: &TaskRecord) {
        if self.env().caller() != task.poster {
            self.env().revert(ExecutionError::NotAnOwner);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    #[test]
    fn post_and_retrieve_task() {
        let env = HostEnv::default();
        let mut contract = AgentForgeMarketplaceHostRef::deploy(&env, NoArgs);

        let id = contract.post_task(
            String::from("Test task"),
            String::from("QmXyz"),
            U512::from(50_000_000_000u64),
            9999999999,
        );

        assert_eq!(id, 1);
        let task = contract.get_task(1).expect("task should exist");
        assert_eq!(task.title, "Test task");
        assert!(matches!(task.status, TaskStatus::Open));
    }
}
