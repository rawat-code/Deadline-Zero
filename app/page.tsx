"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles, 
  Brain, 
  MessageSquare, 
  Zap, 
  ChevronRight, 
  X, 
  CheckSquare, 
  BookOpen, 
  ListTodo, 
  Layers, 
  Flame, 
  RefreshCw, 
  Target,
  LogOut,
  RefreshCcw,
  Check
} from "lucide-react";
import { Task, Goal, Habit, WorkBlock, ChatMessage, AIAnalysis } from "../lib/types";
import { defaultTasks, defaultGoals, defaultHabits } from "../lib/seedData";

// Google Calendar OAuth & Firebase Auth Integration
import { initAuth, googleSignIn, logout } from "../lib/firebaseAuth";
import { fetchUpcomingEvents, createCalendarEvent, CalendarEvent } from "../lib/googleCalendar";
import { User } from "firebase/auth";

export default function Home() {
  // Core State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [workBlocks, setWorkBlocks] = useState<WorkBlock[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({
    nextAction: "Perform a 'Prioritize & Plan' scan to detect immediate workload risks.",
    proactiveAlerts: ["Welcome to Deadline Zero! Import default templates or insert your tasks to begin scanning."],
    recoveryPlan: "No critical warnings generated yet. Run diagnostics to prioritize your day."
  });

  // Google Calendar Integration State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState<"tasks" | "schedule" | "calendar" | "habits" | "goals">("tasks");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States (New Task)
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"critical" | "high" | "medium" | "low">("high");
  const [newEffort, setNewEffort] = useState(2);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [tempSubtasks, setTempSubtasks] = useState<string[]>([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);

  // Form States (New Goal / Habit)
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalProgress, setGoalProgress] = useState(10);

  const [showAddHabitForm, setShowAddHabitForm] = useState(false);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitFreq, setHabitFreq] = useState<"daily" | "weekly">("daily");

  // Load Seed Data from Local Storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTasks = localStorage.getItem("dz_tasks");
      const storedGoals = localStorage.getItem("dz_goals");
      const storedHabits = localStorage.getItem("dz_habits");
      const storedBlocks = localStorage.getItem("dz_blocks");
      const storedChat = localStorage.getItem("dz_chat");
      const storedAnalysis = localStorage.getItem("dz_analysis");

      if (storedTasks) setTasks(JSON.parse(storedTasks));
      else setTasks(defaultTasks);

      if (storedGoals) setGoals(JSON.parse(storedGoals));
      else setGoals(defaultGoals);

      if (storedHabits) setHabits(JSON.parse(storedHabits));
      else setHabits(defaultHabits);

      if (storedBlocks) setWorkBlocks(JSON.parse(storedBlocks));

      if (storedChat) {
        setChatMessages(JSON.parse(storedChat));
      } else {
        setChatMessages([
          {
            id: "welcome-1",
            sender: "assistant",
            text: "Hello! I am your Deadline Zero Companion. Tell me what is stressing you out, or click 'Prioritize Workload' to run a deep commitment assessment.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }

      if (storedAnalysis) setAiAnalysis(JSON.parse(storedAnalysis));
    }

    // Set up Google / Firebase auth state change listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        loadCalendarEvents(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync / Load events from Google Calendar
  const loadCalendarEvents = async (token: string) => {
    setIsSyncingCalendar(true);
    try {
      const events = await fetchUpcomingEvents(token);
      setCalendarEvents(events);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to sync Google Calendar events. Your connection might be stale.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSyncingCalendar(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setSuccessMsg("Successfully connected to Google Calendar!");
        setTimeout(() => setSuccessMsg(null), 3000);
        await loadCalendarEvents(result.accessToken);
      }
    } catch (err: any) {
      console.error("Google Calendar Connection Failed", err);
      setErrorMsg("Google authentication failed. Please try again.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setCalendarEvents([]);
      setSuccessMsg("Disconnected from Google Calendar.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportTaskToCalendar = async (task: Task) => {
    if (!googleToken) {
      setErrorMsg("Please connect your Google Calendar first.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const confirmed = window.confirm(
      `Do you want to export the task "${task.title}" to your Google Calendar as a deadline event?`
    );
    if (!confirmed) return;

    setIsSyncingCalendar(true);
    try {
      await createCalendarEvent(googleToken, {
        summary: `🔔 DEADLINE: ${task.title}`,
        description: `Task description: ${task.description || "No description."}\nEstimated effort: ${task.estimatedEffort} hours.`,
        startDateStr: task.dueDate,
        startTimeStr: "09:00", // Default morning of the due date
        endTimeStr: "10:00",   // 1 hour block
      });
      setSuccessMsg(`Successfully exported "${task.title}" to Google Calendar!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadCalendarEvents(googleToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to export event: ${err.message || "Unknown error"}`);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleExportBlockToCalendar = async (block: WorkBlock) => {
    if (!googleToken) {
      setErrorMsg("Please connect your Google Calendar first.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const confirmed = window.confirm(
      `Do you want to schedule "${block.taskTitle}" on your Google Calendar for ${block.date} at ${block.startTime} - ${block.endTime}?`
    );
    if (!confirmed) return;

    setIsSyncingCalendar(true);
    try {
      await createCalendarEvent(googleToken, {
        summary: `⚡ Focus Block: ${block.taskTitle}`,
        description: `Focused execution session suggested by Deadline Zero.\nTopic: ${block.focusFocusTopic}`,
        startDateStr: block.date,
        startTimeStr: block.startTime,
        endTimeStr: block.endTime,
      });
      setSuccessMsg(`Successfully scheduled Focus Block on Google Calendar!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadCalendarEvents(googleToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to export focus block: ${err.message || "Unknown error"}`);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Save changes to localStorage whenever states change
  useEffect(() => {
    if (tasks.length > 0) localStorage.setItem("dz_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (goals.length > 0) localStorage.setItem("dz_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (habits.length > 0) localStorage.setItem("dz_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    if (workBlocks.length > 0) localStorage.setItem("dz_blocks", JSON.stringify(workBlocks));
  }, [workBlocks]);

  useEffect(() => {
    if (chatMessages.length > 0) localStorage.setItem("dz_chat", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (aiAnalysis) localStorage.setItem("dz_analysis", JSON.stringify(aiAnalysis));
  }, [aiAnalysis]);

  // Utility to clear localStorage and reload seed data
  const resetToSeedData = () => {
    if (confirm("Reset application to default template seed data?")) {
      setTasks(defaultTasks);
      setGoals(defaultGoals);
      setHabits(defaultHabits);
      setWorkBlocks([]);
      setChatMessages([
        {
          id: "welcome-1",
          sender: "assistant",
          text: "Hello! I am your Deadline Zero Companion. Tell me what is stressing you out, or click 'Prioritize Workload' to run a deep commitment assessment.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setAiAnalysis({
        nextAction: "Perform a 'Prioritize & Plan' scan to detect immediate workload risks.",
        proactiveAlerts: ["Welcome to Deadline Zero! Import default templates or insert your tasks to begin scanning."],
        recoveryPlan: "No critical warnings generated yet. Run diagnostics to prioritize your day."
      });
      setSuccessMsg("Reset application database successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Helper calculation for completed subtasks of a task
  const getSubtaskStats = (task: Task) => {
    const total = task.subtasks?.length || 0;
    const completed = task.subtasks?.filter(s => s.completed).length || 0;
    const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, ratio };
  };

  // Aggregated Stats
  const urgentTasksCount = useMemo(() => {
    return tasks.filter(t => !t.completed && (t.priority === "critical" || t.priority === "high")).length;
  }, [tasks]);

  const statsProgress = useMemo(() => {
    const active = tasks.length;
    if (active === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / active) * 100);
  }, [tasks]);

  // Add temporary subtask to the draft form
  const addDraftSubtask = () => {
    if (subtaskInput.trim()) {
      setTempSubtasks([...tempSubtasks, subtaskInput.trim()]);
      setSubtaskInput("");
    }
  };

  const removeDraftSubtask = (index: number) => {
    setTempSubtasks(tempSubtasks.filter((_, i) => i !== index));
  };

  // Add a fully customized task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const createdTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || "No additional details provided.",
      dueDate: newDueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: newPriority,
      estimatedEffort: Number(newEffort) || 2,
      subtasks: tempSubtasks.map((st, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: st,
        completed: false
      })),
      completed: false
    };

    setTasks([createdTask, ...tasks]);
    
    // Reset form
    setNewTitle("");
    setNewDesc("");
    setNewDueDate("");
    setNewPriority("high");
    setNewEffort(2);
    setTempSubtasks([]);
    setShowAddTaskForm(false);
    
    setSuccessMsg(`Task "${createdTask.title}" has been registered.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Toggle complete/incomplete state of task
  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        return {
          ...t,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
          // When marking task complete, optionally complete all its subtasks too
          subtasks: t.subtasks.map(st => ({ ...st, completed: nextState ? true : st.completed }))
        };
      }
      return t;
    }));
  };

  // Toggle complete/incomplete state of specific subtask
  const toggleSubtaskComplete = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });

        // If all subtasks are completed, do we mark the main task complete?
        // Let's keep them separate but check if we should auto-advance
        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);

        return {
          ...t,
          subtasks: updatedSubtasks,
          completed: allDone ? true : t.completed,
          completedAt: allDone ? new Date().toISOString() : t.completedAt
        };
      }
      return t;
    }));
  };

  // Delete an entire task
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setWorkBlocks(workBlocks.filter(b => b.taskId !== taskId));
  };

  // Add individual subtask directly to an existing task in-line
  const addInlineSubtask = (taskId: string, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [
            ...t.subtasks,
            { id: `sub-${Date.now()}`, title: subtaskTitle.trim(), completed: false }
          ]
        };
      }
      return t;
    }));
  };

  // Delete subtask from existing task
  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.filter(s => s.id !== subtaskId)
        };
      }
      return t;
    }));
  };

  // Goals
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const newG: Goal = {
      id: `goal-${Date.now()}`,
      title: goalTitle.trim(),
      targetDate: goalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      progress: Number(goalProgress) || 10
    };
    setGoals([...goals, newG]);
    setGoalTitle("");
    setGoalDate("");
    setGoalProgress(10);
    setShowAddGoalForm(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const updateGoalProgress = (id: string, newProg: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, progress: Math.min(Math.max(newProg, 0), 100) } : g));
  };

  // Habits
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    const newH: Habit = {
      id: `habit-${Date.now()}`,
      title: habitTitle.trim(),
      frequency: habitFreq,
      streak: 0,
      completedToday: false
    };
    setHabits([...habits, newH]);
    setHabitTitle("");
    setShowAddHabitForm(false);
  };

  const toggleHabitToday = (id: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const nextState = !h.completedToday;
        return {
          ...h,
          completedToday: nextState,
          streak: nextState ? h.streak + 1 : Math.max(0, h.streak - 1),
          lastCompleted: nextState ? new Date().toISOString().split("T")[0] : undefined
        };
      }
      return h;
    }));
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  // API Call - Prioritize Workload via Server Route
  const handlePrioritizeAI = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prioritize",
          tasks,
          goals,
          habits,
          localTime: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      // Update tasks with suggestions from AI response
      if (data.tasks && Array.isArray(data.tasks)) {
        const updatedTasks = tasks.map(t => {
          const suggestion = data.tasks.find((st: any) => st.id === t.id);
          if (suggestion) {
            // Incorporate newly suggested subtasks if the task didn't have many
            let mergedSubtasks = [...t.subtasks];
            if (suggestion.suggestedSubtasks && mergedSubtasks.length <= 1) {
              suggestion.suggestedSubtasks.forEach((titleStr: string, index: number) => {
                const alreadyExists = mergedSubtasks.some(ms => ms.title.toLowerCase() === titleStr.toLowerCase());
                if (!alreadyExists) {
                  mergedSubtasks.push({
                    id: `sub-suggested-${Date.now()}-${index}`,
                    title: titleStr,
                    completed: false
                  });
                }
              });
            }

            return {
              ...t,
              suggestedPriority: suggestion.suggestedPriority,
              priorityRationale: suggestion.priorityRationale,
              // If recommended to adjust priority, set it safely
              priority: suggestion.suggestedPriority || t.priority,
              subtasks: mergedSubtasks
            };
          }
          return t;
        });
        setTasks(updatedTasks);
      }

      setAiAnalysis({
        nextAction: data.nextAction || "Take prompt action on critical subtasks.",
        proactiveAlerts: data.proactiveAlerts || ["Priority analysis completed. High focus is advised."],
        recoveryPlan: data.recoveryPlan || "Execute step-by-step to bypass upcoming deadlines."
      });

      setSuccessMsg("AI Prioritization complete! Priorities and custom recovery plans synchronized.");
      setTimeout(() => setSuccessMsg(null), 4000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to contact the Deadline Zero analysis server. Using standard client fallbacks.");
      
      // Local manual fallback algorithm so user still gets value
      localManualPrioritize();
    } finally {
      setIsLoading(false);
    }
  };

  // API Call - Schedule Work Blocks via Server Route
  const handleScheduleAI = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          tasks: tasks.filter(t => !t.completed),
          localTime: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.workBlocks && Array.isArray(data.workBlocks)) {
        setWorkBlocks(data.workBlocks);
        setSuccessMsg(`Perfect! Scheduled ${data.workBlocks.length} focused work blocks directly matching your task deadlines.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error("Invalid response format from schedule generator.");
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Scheduling coordinator is offline. Automatically distributing local focus blocks.");
      
      // Local manual scheduling fallback
      localManualSchedule();
    } finally {
      setIsLoading(false);
    }
  };

  // API Call - AI Chat Assistant
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: currentMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const messageToSend = currentMessage;
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: messageToSend,
          tasks,
          goals,
          habits,
          chatHistory: chatMessages.slice(-6), // Send last 6 messages
          localTime: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Chat engine overloaded.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "assistant",
        text: data.replyMessage || "I'm focusing on your tasks. What should we tackle first?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => [...prev, aiMsg]);

      // Apply structured recommendations if returned (like automatic subtask addition)
      if (data.recommendedChanges?.addTasks) {
        const toAdd = data.recommendedChanges.addTasks;
        const newTasksFromChat = toAdd.map((t: any, idx: number) => ({
          id: `task-chat-${Date.now()}-${idx}`,
          title: t.title,
          description: t.description || "Created via chatbot suggestion",
          dueDate: t.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          priority: t.priority || "high",
          estimatedEffort: t.estimatedEffort || 1,
          completed: false,
          subtasks: []
        }));
        setTasks(prev => [...newTasksFromChat, ...prev]);
        setSuccessMsg(`Added ${newTasksFromChat.length} suggested task(s) to your backlog.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }

      if (data.recommendedChanges?.completeTaskId) {
        toggleTaskComplete(data.recommendedChanges.completeTaskId);
      }

    } catch (err) {
      console.error(err);
      
      // Resilient chat response when server-side credentials or endpoints are unavailable
      const fallbackMsgs = [
        "I understand you are managing heavy load. Focus on your top Critical items! What's the immediate blocker on " + (tasks[0]?.title || "your main task") + "?",
        "Proactive notice: Your deadline is closing fast. I recommend breaking your active items into micro-milestones immediately.",
        "Let's beat procrastination together! Let's schedule a 30-minute block to write the initial document draft."
      ];
      const randomFallback = fallbackMsgs[Math.floor(Math.random() * fallbackMsgs.length)];

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "assistant",
        text: `${randomFallback}\n\n*Note: Gemini Engine is running in local resilience mode.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Offline / Resilient Local Logic Fallbacks
  const localManualPrioritize = () => {
    const updated = tasks.map(t => {
      // Logic calculation of urgency based on days remaining
      const today = new Date();
      const due = new Date(t.dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let calcPriority: "critical" | "high" | "medium" | "low" = t.priority;
      let rationale = t.priorityRationale || "";

      if (diffDays <= 1) {
        calcPriority = "critical";
        rationale = `Calculated critical: Due within 24 hours. Estimated effort is ${t.estimatedEffort} hours.`;
      } else if (diffDays <= 3) {
        calcPriority = "high";
        rationale = `Calculated high: Due in ${diffDays} days. High density milestone.`;
      } else if (diffDays <= 7) {
        calcPriority = "medium";
        rationale = `Calculated medium: Due in ${diffDays} days. Set time blocks to prevent backlog pileup.`;
      } else {
        calcPriority = "low";
        rationale = `Calculated low: Due in ${diffDays} days. Plenty of leeway.`;
      }

      return {
        ...t,
        suggestedPriority: calcPriority,
        priorityRationale: rationale
      };
    });

    setTasks(updated);
    setAiAnalysis({
      nextAction: "Complete the highest density items due within 24 hours.",
      proactiveAlerts: [
        "Local Engine Warning: Highly constrained deadlines detected in queue.",
        "Check subtask checkboxes to reduce task density parameters."
      ],
      recoveryPlan: "Draft 1-hour focus segments for critical paths to defend upcoming deadlines."
    });
  };

  const localManualSchedule = () => {
    const activeTasks = tasks.filter(t => !t.completed);
    const mockBlocks: WorkBlock[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    activeTasks.forEach((t, index) => {
      if (index < 4) {
        const startHour = 9 + index * 2;
        const endHour = startHour + 1.5;
        mockBlocks.push({
          taskId: t.id,
          taskTitle: t.title,
          date: todayStr,
          startTime: `${startHour}:00`,
          endTime: `${Math.floor(endHour)}:${(endHour % 1) * 60 === 30 ? "30" : "00"}`,
          focusFocusTopic: `Resolve initial 2 subtasks of: ${t.title}`
        });
      }
    });

    setWorkBlocks(mockBlocks);
    setSuccessMsg("Generated resilient local Work blocks mapping active critical workload.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Check for conflicts between scheduled Work Blocks and real Google Calendar events
  const getSchedulingConflicts = useMemo(() => {
    const conflicts: { blockIndex: number; blockTitle: string; eventTitle: string; time: string }[] = [];
    if (!googleUser || calendarEvents.length === 0 || workBlocks.length === 0) return conflicts;

    workBlocks.forEach((block, idx) => {
      // Parse block start and end times
      const blockStart = new Date(`${block.date}T${block.startTime}:00`);
      const blockEnd = new Date(`${block.date}T${block.endTime}:00`);

      calendarEvents.forEach(event => {
        if (!event.start.dateTime || !event.end.dateTime) return;
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Check for overlap
        if (blockStart < eventEnd && blockEnd > eventStart) {
          conflicts.push({
            blockIndex: idx + 1,
            blockTitle: block.taskTitle,
            eventTitle: event.summary,
            time: `${new Date(event.start.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(event.end.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          });
        }
      });
    });

    return conflicts;
  }, [calendarEvents, workBlocks, googleUser]);

  // Inline subtask input states mapped by Task ID
  const [inlineSubtaskTexts, setInlineSubtaskTexts] = useState<Record<string, string>>({});

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans" id="applet-container">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between" id="app-header">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-400/30 rounded-xl flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10" id="app-icon">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-md font-bold uppercase tracking-widest text-gray-100 flex items-center gap-2" id="brand-title">
              Deadline Zero 
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest">
                ZERO COMPROMISE
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">AI Failure Prevention Companion</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {googleUser ? (
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CALENDAR ACTIVE</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-gray-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              <span>CALENDAR OFFLINE</span>
            </div>
          )}

          <button
            onClick={resetToSeedData}
            title="Reset to Template Data"
            className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-reset-data"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={handlePrioritizeAI}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/10 disabled:opacity-50"
            id="btn-trigger-diagnostics"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isLoading ? "Analyzing..." : "Prioritize Workload"}
          </button>
        </div>
      </header>

      {/* --- SUCCESS & ERROR FEEDS --- */}
      {errorMsg && (
        <div className="mx-6 mt-4 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-xl p-3 flex items-center justify-between" id="banner-error">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mx-6 mt-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl p-3 flex items-center justify-between" id="banner-success">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* --- DASHBOARD WRAPPER --- */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-layout">
        
        {/* --- LEFT COL: MAIN CONTENT (9 columns) --- */}
        <main className="lg:col-span-8 flex flex-col space-y-6" id="main-content-column">
          
          {/* --- TOP ROW: INSIGHTS CARD & CRITICAL STATS --- */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="stats-section">
            <div className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between" id="stat-urgent">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Urgent Demands</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-red-400 font-mono">{urgentTasksCount}</span>
                <span className="text-xs text-gray-400">active critical/high</span>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Deadline pressure is high. Prevent delay risks.
              </div>
            </div>

            <div className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between" id="stat-progress">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Task Saturation</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">{statsProgress}%</span>
                <span className="text-xs text-gray-400">completed</span>
              </div>
              <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-500" 
                  style={{ width: `${statsProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between" id="stat-habit-streak">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Consistency Streak</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">
                  {habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0}
                </span>
                <span className="text-xs text-gray-400">days max habit</span>
              </div>
              <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-400" />
                <span>Maintain routines to minimize friction.</span>
              </div>
            </div>
          </section>

          {/* --- PROACTIVE INSIGHTS WIDGET --- */}
          <section className="bg-gradient-to-r from-cyan-950/20 to-indigo-950/10 border border-cyan-500/20 rounded-2xl p-5 relative overflow-hidden" id="ai-insight-panel">
            <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">PROACTIVE INTERCEPT DIAGNOSTIC</span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded uppercase">Aligned Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7 space-y-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Immediate Next Best Action:</h3>
                <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5 font-mono">
                  &gt; {aiAnalysis.nextAction}
                </p>
              </div>

              <div className="md:col-span-5 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400">Deadline Risk Signals:</h4>
                <ul className="space-y-1.5">
                  {aiAnalysis.proactiveAlerts?.map((alert, index) => (
                    <li key={index} className="text-[11px] text-red-300 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {aiAnalysis.recoveryPlan && (
              <div className="mt-4 pt-3 border-t border-cyan-950/40">
                <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest block mb-1">Rescue Recovery Protocol</span>
                <p className="text-xs text-amber-300 bg-amber-950/20 border border-amber-500/20 p-2 rounded-lg leading-relaxed">
                  {aiAnalysis.recoveryPlan}
                </p>
              </div>
            )}
          </section>

          {/* --- MAIN TABS CONTROLLER --- */}
          <div className="border-b border-white/5 flex items-center justify-between" id="tabs-container">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "tasks" 
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                id="tab-btn-tasks"
              >
                <span className="flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5" />
                  Task Backlog ({tasks.length})
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab("schedule")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "schedule" 
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                id="tab-btn-schedule"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Work Blocks ({workBlocks.length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab("calendar")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "calendar" 
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                id="tab-btn-calendar"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                  Google Calendar {googleUser ? "• Connected" : ""}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("habits")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "habits" 
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                id="tab-btn-habits"
              >
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  Routines & Habits
                </span>
              </button>

              <button
                onClick={() => setActiveTab("goals")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "goals" 
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5" 
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
                id="tab-btn-goals"
              >
                <span className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Active Milestones
                </span>
              </button>
            </div>

            {/* Quick add triggers */}
            <div>
              {activeTab === "tasks" && (
                <button
                  onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white flex items-center gap-1 cursor-pointer"
                  id="btn-toggle-add-task"
                >
                  {showAddTaskForm ? "Cancel Form" : "Add Task +"}
                </button>
              )}
              {activeTab === "goals" && (
                <button
                  onClick={() => setShowAddGoalForm(!showAddGoalForm)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white flex items-center gap-1 cursor-pointer"
                  id="btn-toggle-add-goal"
                >
                  {showAddGoalForm ? "Cancel" : "Add Goal +"}
                </button>
              )}
              {activeTab === "habits" && (
                <button
                  onClick={() => setShowAddHabitForm(!showAddHabitForm)}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white flex items-center gap-1 cursor-pointer"
                  id="btn-toggle-add-habit"
                >
                  {showAddHabitForm ? "Cancel" : "Add Habit +"}
                </button>
              )}
            </div>
          </div>

          {/* --- TAB CONTENT: TASKS BACKLOG --- */}
          {activeTab === "tasks" && (
            <div className="space-y-4" id="tasks-tab-content">
              
              {/* --- ADD TASK EXPANDABLE FORM --- */}
              {showAddTaskForm && (
                <form onSubmit={handleAddTask} className="bg-gray-950 border border-white/10 rounded-2xl p-5 space-y-4" id="add-task-form">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Create Workload Task</span>
                    <button type="button" onClick={() => setShowAddTaskForm(false)} className="text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task Title</label>
                      <input 
                        type="text" 
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Design Security Blueprint"
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        id="input-new-task-title"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</label>
                      <input 
                        type="date" 
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        id="input-new-task-date"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                    <textarea 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Identify precise steps and scope to fulfill commitment before date."
                      rows={2}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                      id="input-new-task-desc"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Effort (Hours)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="100"
                        value={newEffort}
                        onChange={(e) => setNewEffort(Number(e.target.value))}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        id="input-new-task-effort"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority Urgency</label>
                      <select 
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        id="select-new-task-priority"
                      >
                        <option value="critical">Critical (Due within 24 Hours)</option>
                        <option value="high">High (Due within 3 Days)</option>
                        <option value="medium">Medium (Due within 7 Days)</option>
                        <option value="low">Low (Flexible / Optional)</option>
                      </select>
                    </div>
                  </div>

                  {/* Subtask Draft Box */}
                  <div className="border border-white/5 bg-white/5 p-3.5 rounded-xl space-y-2">
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">Actionable Subtasks (30-60m chunks)</label>
                    
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={subtaskInput}
                        onChange={(e) => setSubtaskInput(e.target.value)}
                        placeholder="Draft subtask step..."
                        className="flex-1 bg-[#030712] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        id="input-draft-subtask"
                      />
                      <button 
                        type="button"
                        onClick={addDraftSubtask}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                        id="btn-add-draft-subtask"
                      >
                        Add Step
                      </button>
                    </div>

                    {tempSubtasks.length > 0 && (
                      <ul className="space-y-1 mt-2 max-h-24 overflow-y-auto pr-1">
                        {tempSubtasks.map((st, idx) => (
                          <li key={idx} className="flex items-center justify-between text-xs bg-black/30 px-2.5 py-1 rounded border border-white/5">
                            <span className="text-gray-300 font-mono">{idx + 1}. {st}</span>
                            <button type="button" onClick={() => removeDraftSubtask(idx)} className="text-red-400 hover:text-white">
                              <X className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                      id="btn-submit-task"
                    >
                      Save Task to Backlog
                    </button>
                  </div>
                </form>
              )}

              {/* --- TIGHT TASK LIST VIEW --- */}
              {tasks.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-gray-950/20" id="empty-tasks-placeholder">
                  <ListTodo className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 uppercase tracking-widest">No backlog tasks registered</p>
                  <p className="text-[10px] text-gray-500 mt-1">Generate a mockup scenario using the &quot;Reset Demo&quot; control above.</p>
                </div>
              ) : (
                <div className="space-y-3" id="tasks-list">
                  {tasks.map(task => {
                    const stats = getSubtaskStats(task);
                    const isOverdue = new Date(task.dueDate) < new Date();
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`border rounded-2xl p-4.5 transition-all bg-gray-950/30 ${
                          task.completed 
                            ? "border-emerald-500/10 opacity-70" 
                            : task.priority === "critical" 
                              ? "border-red-500/30 hover:border-red-500/40" 
                              : task.priority === "high" 
                                ? "border-amber-500/20 hover:border-amber-500/30" 
                                : "border-white/5 hover:border-white/10"
                        }`}
                        id={`task-card-${task.id}`}
                      >
                        {/* Task Title Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <button 
                              onClick={() => toggleTaskComplete(task.id)}
                              className="mt-1 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer shrink-0"
                              id={`toggle-complete-${task.id}`}
                            >
                              {task.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                            <div>
                              <h3 className={`text-sm font-bold tracking-tight text-white ${task.completed ? "line-through text-gray-500" : ""}`}>
                                {task.title}
                              </h3>
                              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 max-w-xl">
                                {task.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-1.5 text-right shrink-0">
                            {/* Urgent level label */}
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                              task.priority === "critical"
                                ? "bg-red-950/20 text-red-400 border-red-500/20"
                                : task.priority === "high"
                                  ? "bg-amber-950/20 text-amber-400 border-amber-500/20"
                                  : "bg-gray-900 text-gray-400 border-white/5"
                            }`}>
                              {task.priority}
                            </span>

                            {/* Effort and Days label */}
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                              <Clock className="h-3 w-3 text-cyan-500" />
                              <span>{task.estimatedEffort}h effort</span>
                            </div>

                            <span className={`text-[10px] font-mono ${isOverdue && !task.completed ? "text-red-400" : "text-gray-400"}`}>
                              {isOverdue && !task.completed ? "OVERDUE • " : ""}Due: {task.dueDate}
                            </span>
                          </div>
                        </div>

                        {/* --- VISUAL SUBTASK PROGRESS BAR (As requested by User!) --- */}
                        <div className="mt-3.5 pt-3 border-t border-white/5" id={`subtask-progress-section-${task.id}`}>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1.5">
                            <span className="uppercase tracking-widest">SUBTASK RESOLUTION RATE</span>
                            <span className="text-cyan-400 font-bold bg-cyan-500/5 px-2 py-0.5 rounded">
                              {stats.completed} of {stats.total} steps completed ({stats.ratio}%)
                            </span>
                          </div>

                          {/* The requested Visual Progress Bar */}
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 relative">
                            <div 
                              className={`h-full transition-all duration-500 ease-out ${
                                stats.ratio === 100 
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                                  : task.priority === "critical" 
                                    ? "bg-gradient-to-r from-red-500 to-amber-500" 
                                    : "bg-gradient-to-r from-cyan-500 to-indigo-500"
                              }`} 
                              style={{ width: `${stats.ratio}%` }}
                            />
                          </div>
                        </div>

                        {/* Subtasks collapse list */}
                        {task.subtasks?.length > 0 && (
                          <div className="mt-3.5 bg-black/20 rounded-xl p-3 border border-white/5 space-y-2">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block font-mono">Milestone Steps</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {task.subtasks.map(sub => (
                                <div 
                                  key={sub.id} 
                                  className="flex items-center justify-between bg-[#080d1a] px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/20 transition-all text-xs"
                                >
                                  <label className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0">
                                    <input 
                                      type="checkbox"
                                      checked={sub.completed}
                                      onChange={() => toggleSubtaskComplete(task.id, sub.id)}
                                      className="rounded bg-black border-white/10 text-cyan-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <span className={`text-[11px] truncate ${sub.completed ? "line-through text-gray-500" : "text-gray-300"}`}>
                                      {sub.title}
                                    </span>
                                  </label>
                                  <button 
                                    type="button" 
                                    onClick={() => deleteSubtask(task.id, sub.id)}
                                    className="text-gray-500 hover:text-red-400 ml-1 cursor-pointer shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inline Add Subtask input */}
                        <div className="mt-2.5 flex space-x-2" id={`inline-subtask-form-${task.id}`}>
                          <input 
                            type="text" 
                            placeholder="Add subtask step..." 
                            value={inlineSubtaskTexts[task.id] || ""}
                            onChange={(e) => setInlineSubtaskTexts({
                              ...inlineSubtaskTexts,
                              [task.id]: e.target.value
                            })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addInlineSubtask(task.id, inlineSubtaskTexts[task.id] || "");
                                setInlineSubtaskTexts({ ...inlineSubtaskTexts, [task.id]: "" });
                              }
                            }}
                            className="flex-1 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-cyan-500/30"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              addInlineSubtask(task.id, inlineSubtaskTexts[task.id] || "");
                              setInlineSubtaskTexts({ ...inlineSubtaskTexts, [task.id]: "" });
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/5 cursor-pointer"
                          >
                            Add Step
                          </button>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Rationale feedback if prioritization has run */}
                        {task.priorityRationale && (
                          <div className="mt-3 bg-cyan-950/10 border border-cyan-500/10 rounded-lg p-2 text-[10px] text-cyan-300 font-mono flex items-start gap-1.5">
                            <Sparkles className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong>AI Diagnostic:</strong> {task.priorityRationale}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: CALENDAR SCHEDULE WORK BLOCKS --- */}
          {activeTab === "schedule" && (
            <div className="space-y-4" id="schedule-tab-content">
              <div className="flex items-center justify-between bg-gray-950/30 border border-white/5 rounded-2xl p-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Calendar Work Blocks Generator</h3>
                  <p className="text-xs text-gray-400 mt-1">Map your critical backlog tasks into realistic scheduled study/work focus blocks.</p>
                </div>
                <button
                  onClick={handleScheduleAI}
                  disabled={isLoading || tasks.filter(t => !t.completed).length === 0}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="btn-schedule-generator"
                >
                  {isLoading ? "Assembling Blocks..." : "Generate Focus Schedule"}
                </button>
              </div>

              {workBlocks.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-gray-950/20" id="empty-schedule-placeholder">
                  <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 uppercase tracking-widest">No scheduled work blocks</p>
                  <p className="text-[10px] text-gray-500 mt-1">Click the &quot;Generate Focus Schedule&quot; button above to auto-distribute hours.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="schedule-grid">
                  {workBlocks.map((block, index) => (
                    <div key={index} className="bg-gray-950/40 border border-indigo-500/10 rounded-2xl p-4.5 space-y-3 relative overflow-hidden" id={`block-card-${index}`}>
                      <div className="absolute top-0 right-0 p-2 text-indigo-400/20 font-mono text-[9px] font-bold">
                        BLOCK #{index + 1}
                      </div>

                      <div className="flex items-center space-x-2 text-indigo-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-mono font-bold tracking-wider">{block.date} | {block.startTime} - {block.endTime}</span>
                      </div>

                      <div>
                        <h4 className="text-xs text-gray-400 uppercase font-bold tracking-widest">Target Workload</h4>
                        <p className="text-sm text-white font-semibold mt-0.5">{block.taskTitle}</p>
                      </div>

                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-cyan-400 font-mono font-bold uppercase tracking-widest block mb-0.5">Focus Goal Topic</span>
                        <p className="text-xs text-gray-300 leading-relaxed font-mono">{block.focusFocusTopic}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: GOOGLE CALENDAR SYNC & ACTIONS --- */}
          {activeTab === "calendar" && (
            <div className="space-y-6" id="calendar-tab-content">
              {!googleUser ? (
                <div className="text-center py-16 border border-white/5 bg-gray-950/30 rounded-2xl flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto" id="calendar-connect-card">
                  <div className="h-12 w-12 bg-cyan-500/10 border border-cyan-400/30 rounded-2xl flex items-center justify-center text-cyan-400">
                    <Calendar className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Synchronize Google Calendar</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                      Enable Deadline Zero to schedule focus time-blocks, export due dates, and monitor event conflicts in real-time with permission from your account.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-cyan-500/10 cursor-pointer text-xs uppercase tracking-wider"
                    id="btn-google-connect"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>Connect Google Calendar</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6" id="calendar-active-content">
                  {/* Auth details row */}
                  <div className="bg-gray-950/30 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {googleUser.photoURL ? (
                        <img src={googleUser.photoURL} alt={googleUser.displayName || "User"} className="h-10 w-10 rounded-full border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-cyan-600/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                          {googleUser.displayName ? googleUser.displayName[0] : "U"}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{googleUser.displayName || "Connected User"}</h4>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{googleUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => loadCalendarEvents(googleToken!)}
                        disabled={isSyncingCalendar}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white cursor-pointer"
                        title="Sync Calendar Events"
                      >
                        <RefreshCcw className={`h-4 w-4 ${isSyncingCalendar ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        onClick={handleGoogleLogout}
                        className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer flex items-center gap-1.5"
                        id="btn-google-disconnect"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>

                  {/* Conflict detection alert */}
                  {getSchedulingConflicts.length > 0 && (
                    <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 space-y-2" id="calendar-conflicts-alert">
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider font-mono">PROACTIVE CONFLICT DETECTIONS</span>
                      </div>
                      <div className="space-y-1.5">
                        {getSchedulingConflicts.map((conf, index) => (
                          <p key={index} className="text-[11px] text-gray-300 font-mono">
                            ⚠️ Overlap on Focus Block: <strong>&quot;{conf.blockTitle}&quot;</strong> (Block #{conf.blockIndex}) conflicts with real Google Calendar event <strong>&quot;{conf.eventTitle}&quot;</strong> ({conf.time}).
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Upcoming Events */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">Google Calendar Events</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded">NEXT 10 EVENTS</span>
                      </div>

                      {calendarEvents.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl bg-black/10 text-xs text-gray-500">
                          No upcoming events found on your primary calendar.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1" id="calendar-events-feed">
                          {calendarEvents.map(event => {
                            const isAllDay = !event.start.dateTime;
                            const eventTime = isAllDay
                              ? "All Day Event"
                              : `${new Date(event.start.dateTime!).toLocaleDateString([], { month: "short", day: "numeric" })} • ${new Date(event.start.dateTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                            return (
                              <div key={event.id} className="bg-gray-950/40 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-white/10 transition-all">
                                <div>
                                  <h5 className="text-xs font-bold text-white truncate max-w-[220px]">{event.summary}</h5>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">{eventTime}</span>
                                </div>
                                {event.htmlLink && (
                                  <a
                                    href={event.htmlLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    View ↗
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Export Panel */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">Schedule & Export Actions</span>
                        <span className="text-[10px] text-amber-400 font-mono uppercase">MUTATE PERMISSION</span>
                      </div>

                      <div className="space-y-4">
                        {/* Task due dates export */}
                        <div className="bg-gray-950/20 border border-white/5 rounded-2xl p-4.5 space-y-3">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Export Backlog Deadlines</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">Add individual task deadline markers directly to Google Calendar.</p>
                          
                          {tasks.filter(t => !t.completed).length === 0 ? (
                            <p className="text-[11px] text-gray-500 italic">No active backlog tasks to export.</p>
                          ) : (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {tasks.filter(t => !t.completed).slice(0, 3).map(task => (
                                <div key={task.id} className="bg-black/40 border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                  <div className="min-w-0 pr-2">
                                    <p className="font-semibold text-white truncate">{task.title}</p>
                                    <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">Due: {task.dueDate}</span>
                                  </div>
                                  <button
                                    onClick={() => handleExportTaskToCalendar(task)}
                                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-bold uppercase rounded-lg transition-all shrink-0 cursor-pointer"
                                  >
                                    Export
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Work block focus schedule export */}
                        <div className="bg-gray-950/20 border border-white/5 rounded-2xl p-4.5 space-y-3">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Export Scheduled Focus Blocks</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">Lock in focus time-slots on your calendar matching suggested work hours.</p>

                          {workBlocks.length === 0 ? (
                            <div className="text-[11px] text-gray-500">
                              No focus blocks generated yet. Use the <strong>Work Blocks</strong> tab to calculate a focus schedule.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {workBlocks.slice(0, 3).map((block, idx) => (
                                <div key={idx} className="bg-black/40 border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                  <div className="min-w-0 pr-2">
                                    <p className="font-semibold text-white truncate">{block.taskTitle}</p>
                                    <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">{block.date} | {block.startTime}</span>
                                  </div>
                                  <button
                                    onClick={() => handleExportBlockToCalendar(block)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-lg transition-all shrink-0 cursor-pointer"
                                  >
                                    Schedule
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: HABITS & ROUTINES --- */}
          {activeTab === "habits" && (
            <div className="space-y-4" id="habits-tab-content">
              {showAddHabitForm && (
                <form onSubmit={handleAddHabit} className="bg-gray-950 border border-white/10 rounded-2xl p-4 space-y-3" id="add-habit-form">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Add Daily Routine Habit</span>
                    <button type="button" onClick={() => setShowAddHabitForm(false)} className="text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Habit Description</label>
                      <input 
                        type="text" 
                        required
                        value={habitTitle}
                        onChange={(e) => setHabitTitle(e.target.value)}
                        placeholder="e.g. 60m deep focus"
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        id="input-habit-title"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interval</label>
                      <select
                        value={habitFreq}
                        onChange={(e) => setHabitFreq(e.target.value as any)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        id="select-habit-freq"
                      >
                        <option value="daily">Daily Habit Routine</option>
                        <option value="weekly">Weekly Routine</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button type="submit" className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold uppercase rounded-lg cursor-pointer">
                      Save Routine
                    </button>
                  </div>
                </form>
              )}

              {habits.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No routine habits tracked yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="habits-grid">
                  {habits.map(habit => (
                    <div key={habit.id} className="bg-gray-950/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between" id={`habit-card-${habit.id}`}>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => toggleHabitToday(habit.id)}
                          className="text-gray-400 hover:text-amber-400 transition-all cursor-pointer"
                        >
                          {habit.completedToday ? (
                            <CheckCircle2 className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${habit.completedToday ? "line-through text-gray-500" : "text-white"}`}>{habit.title}</p>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block mt-0.5">{habit.frequency}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="flex items-center gap-1 text-amber-400 font-mono text-xs bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                          <Flame className="h-3.5 w-3.5" />
                          <span>{habit.streak} streak</span>
                        </div>
                        <button onClick={() => deleteHabit(habit.id)} className="text-gray-500 hover:text-red-400 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB CONTENT: ACTIVE GOALS MILESTONES --- */}
          {activeTab === "goals" && (
            <div className="space-y-4" id="goals-tab-content">
              {showAddGoalForm && (
                <form onSubmit={handleAddGoal} className="bg-gray-950 border border-white/10 rounded-2xl p-4 space-y-3" id="add-goal-form">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Add Active Goal Milestone</span>
                    <button type="button" onClick={() => setShowAddGoalForm(false)} className="text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Milestone Objective</label>
                      <input 
                        type="text" 
                        required
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder="e.g. Public Beta Release"
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        id="input-goal-title"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Date</label>
                      <input 
                        type="date" 
                        value={goalDate}
                        onChange={(e) => setGoalDate(e.target.value)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        id="input-goal-date"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Initial Progress (%)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        value={goalProgress}
                        onChange={(e) => setGoalProgress(Number(e.target.value))}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        id="input-goal-progress"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button type="submit" className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold uppercase rounded-lg cursor-pointer">
                      Save Goal
                    </button>
                  </div>
                </form>
              )}

              {goals.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No active goals tracked yet.</p>
              ) : (
                <div className="space-y-3" id="goals-list">
                  {goals.map(goal => (
                    <div key={goal.id} className="bg-gray-950/40 border border-white/5 rounded-2xl p-4.5 space-y-3" id={`goal-card-${goal.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{goal.title}</p>
                          <span className="text-[9px] text-gray-500 font-mono uppercase block mt-0.5">Target Horizon Date: {goal.targetDate}</span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => updateGoalProgress(goal.id, goal.progress - 5)} 
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] rounded border border-white/5 cursor-pointer"
                            >
                              -5%
                            </button>
                            <span className="text-xs font-bold font-mono text-cyan-400 px-1 bg-cyan-500/5 rounded">{goal.progress}%</span>
                            <button 
                              onClick={() => updateGoalProgress(goal.id, goal.progress + 5)} 
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] rounded border border-white/5 cursor-pointer"
                            >
                              +5%
                            </button>
                          </div>
                          <button onClick={() => deleteGoal(goal.id)} className="text-gray-500 hover:text-red-400 cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Goal bar layout */}
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-300" 
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* --- RIGHT COL: CHAT AND GUIDES (4 columns) --- */}
        <aside className="lg:col-span-4 flex flex-col space-y-6" id="right-side-column">
          
          {/* --- CHAT COMPANION BOX --- */}
          <section className="bg-gray-950/50 border border-white/5 rounded-2xl flex flex-col h-[500px]" id="chat-section">
            <div className="border-b border-white/5 p-4 flex items-center justify-between bg-black/20 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">AI Zero Assistant</h4>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Live Procrastination Intercepter</span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" title="Engine Connected" />
            </div>

            {/* Chat message feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5" id="chat-feed">
              {chatMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider mb-1 font-mono">{msg.timestamp}</span>
                  <div 
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-cyan-600 text-black font-semibold rounded-tr-none" 
                        : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono bg-cyan-500/5 border border-cyan-500/10 px-3 py-1.5 rounded-lg w-max animate-pulse">
                  <span>Assistant is thinking...</span>
                </div>
              )}
            </div>

            {/* Chat prompt input */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/5 bg-black/20 rounded-b-2xl" id="chat-form">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="I am procrastinating on pitch slides..."
                  className="flex-1 bg-[#030712] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  id="chat-input-text"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !currentMessage.trim()}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black rounded-xl cursor-pointer"
                  id="chat-submit-btn"
                >
                  <ChevronRight className="h-4 w-4 font-bold" />
                </button>
              </div>
            </form>
          </section>

          {/* --- ACCESSIBILITY GUIDELINES CARD --- */}
          <section className="bg-gray-950/20 border border-white/5 rounded-2xl p-4.5 space-y-3" id="guidelines-section">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              PRIORITIZATION FRAMEWORK
            </h4>
            <ul className="space-y-2.5 text-[11px] text-gray-400 leading-relaxed font-mono">
              <li className="flex items-start gap-1.5">
                <span className="text-red-400 font-extrabold shrink-0">[CRITICAL]</span>
                <span>Deadline &lt; 24h. Overwhelming impact if delayed. Immediate actions needed.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-extrabold shrink-0">[HIGH]</span>
                <span>Deadline &lt; 3 days. Focus calendar blocks in this window.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-300 font-extrabold shrink-0">[MEDIUM]</span>
                <span>Deadline &lt; 7 days. Break into modular daily segments.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-gray-500 font-extrabold shrink-0">[LOW]</span>
                <span>Leeway &gt; 7 days or flexible optional backlogs.</span>
              </li>
            </ul>
          </section>

        </aside>

      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 mt-auto py-6 text-center bg-black/40" id="dashboard-footer">
        <p className="max-w-2xl mx-auto px-4 leading-relaxed font-mono text-[10px] text-gray-500 uppercase tracking-widest">
          Deadline Zero is your failure prevention companion. Formulate workload tasks with estimated efforts, trigger diagnostics, and satisfy commitments.
        </p>
      </footer>
    </div>
  );
}
