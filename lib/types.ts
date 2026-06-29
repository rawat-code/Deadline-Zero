export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: "critical" | "high" | "medium" | "low";
  suggestedPriority?: "critical" | "high" | "medium" | "low";
  priorityRationale?: string;
  estimatedEffort: number; // hours
  subtasks: Subtask[];
  completed: boolean;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100
}

export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  completedToday: boolean;
}

export interface WorkBlock {
  taskId: string;
  taskTitle: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  focusFocusTopic: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AIAnalysis {
  nextAction: string;
  proactiveAlerts: string[];
  recoveryPlan?: string;
}
