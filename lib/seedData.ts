import { Task, Goal, Habit } from "./types";

export const defaultTasks: Task[] = [
  {
    id: "task-1",
    title: "Finalize Investor Pitch Deck",
    description: "Prepare and refine the product pitch deck for the upcoming Demo Day presentation.",
    dueDate: "2026-06-29", // 1 day from local time 2026-06-28
    priority: "critical",
    estimatedEffort: 4,
    completed: false,
    subtasks: [
      { id: "sub-1-1", title: "Draft problem and solution slides", completed: true },
      { id: "sub-1-2", title: "Verify TAM & financial projection numbers", completed: false },
      { id: "sub-1-3", title: "Design the visual layout and animations", completed: false },
      { id: "sub-1-4", title: "Perform a dry run presentation", completed: false }
    ],
    priorityRationale: "Due tomorrow with 4 hours of estimated work. High strategic impact for fundraising."
  },
  {
    id: "task-2",
    title: "Implement Auth API Proxy Server",
    description: "Refactor backend routes to safely process secrets and remove sensitive credentials from client.",
    dueDate: "2026-06-30", // 2 days from local time
    priority: "high",
    estimatedEffort: 3,
    completed: false,
    subtasks: [
      { id: "sub-2-1", title: "Define secure session schema", completed: true },
      { id: "sub-2-2", title: "Create API route handlers", completed: true },
      { id: "sub-2-3", title: "Update environment variables across environments", completed: false }
    ],
    priorityRationale: "Important security requirement before release. Only 1/3 subtasks remaining."
  },
  {
    id: "task-3",
    title: "Polish Dashboard Charts & Analytics",
    description: "Optimize rendering performance and add responsiveness to the workspace completion charts.",
    dueDate: "2026-07-03", // 5 days away
    priority: "medium",
    estimatedEffort: 5,
    completed: false,
    subtasks: [
      { id: "sub-3-1", title: "Integrate recharts responsive container", completed: false },
      { id: "sub-3-2", title: "Set custom dark theme gradients", completed: false }
    ],
    priorityRationale: "Medium priority feature. Not immediately due, but vital for aesthetic appeal."
  },
  {
    id: "task-4",
    title: "Write End-User Guides",
    description: "Document core features and write step-by-step tutorials for onboarding new users.",
    dueDate: "2026-07-08", // 10 days away
    priority: "low",
    estimatedEffort: 2,
    completed: true,
    subtasks: [
      { id: "sub-4-1", title: "Draft onboarding quickstart guide", completed: true },
      { id: "sub-4-2", title: "Publish FAQ section", completed: true }
    ],
    priorityRationale: "All subtasks finished. Task complete."
  }
];

export const defaultGoals: Goal[] = [
  {
    id: "goal-1",
    title: "Launch Beta Release",
    targetDate: "2026-07-15",
    progress: 65
  },
  {
    id: "goal-2",
    title: "Achieve 500 Active Users",
    targetDate: "2026-08-31",
    progress: 25
  }
];

export const defaultHabits: Habit[] = [
  {
    id: "habit-1",
    title: "60m Deep Work Session",
    frequency: "daily",
    streak: 12,
    completedToday: false
  },
  {
    id: "habit-2",
    title: "Daily Standup Update",
    frequency: "daily",
    streak: 24,
    completedToday: true
  },
  {
    id: "habit-3",
    title: "Review Upcoming Deadlines",
    frequency: "daily",
    streak: 5,
    completedToday: false
  }
];
