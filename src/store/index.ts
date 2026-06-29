import { create } from "zustand";
import type { Task, Agent, MarketplaceStats } from "@/types";

interface AppState {
  walletAddress: string | null;
  isConnected: boolean;
  tasks: Task[];
  agents: Agent[];
  stats: MarketplaceStats | null;
  selectedTask: Task | null;

  setWallet: (address: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  setAgents: (agents: Agent[]) => void;
  setStats: (stats: MarketplaceStats) => void;
  setSelectedTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useStore = create<AppState>((set) => ({
  walletAddress: null,
  isConnected: false,
  tasks: [],
  agents: [],
  stats: null,
  selectedTask: null,

  setWallet: (address) =>
    set({ walletAddress: address, isConnected: !!address }),
  setTasks: (tasks) => set({ tasks }),
  setAgents: (agents) => set({ agents }),
  setStats: (stats) => set({ stats }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
}));
