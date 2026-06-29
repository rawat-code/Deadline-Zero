import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini client with proper configuration
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Resilient helper to execute model generation calls with automatic sequential fallbacks
 * to handle model-specific spikes, high demand, or 503 service unavailabilities.
 * It uses ONLY fully supported, non-deprecated models.
 */
async function generateContentWithFallback(aiInstance: GoogleGenAI, params: {
  model: string;
  contents: any;
  config: any;
}) {
  const modelsToTry = [
    params.model,              // 1. Requested model
    "gemini-3.5-flash",        // 2. Recommended standard Gemini 3.5 Flash
    "gemini-flash-latest",     // 3. Stable alias mapping
    "gemini-3.1-pro-preview",  // 4. Robust high-capacity pro model
    "gemini-3.1-flash-lite",   // 5. Low latency lite backup
    "gemini-2.5-flash"         // 6. Older standard flash backup
  ].filter((m): m is string => typeof m === "string" && m !== "");

  // Remove duplicates while preserving order
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      console.log(`[Gemini Resilient Engine] Attempting request with model: ${model}`);
      return await aiInstance.models.generateContent({
        ...params,
        model: model,
      });
    } catch (error: any) {
      lastError = error;
      console.warn(`[Gemini Resilient Engine] Model ${model} failed. Error details:`, error.message || error);
      
      // If it's an API Key or permission error, fail-fast without falling back to other models
      const isAuthOrPermissionError = 
        error.status === 403 || 
        error.statusCode === 403 ||
        error.status === 401 ||
        error.statusCode === 401 ||
        (error.message && (
          error.message.includes("API_KEY") || 
          error.message.toLowerCase().includes("api key") || 
          error.message.toLowerCase().includes("invalid api key") ||
          error.message.toLowerCase().includes("unauthorized") ||
          error.message.toLowerCase().includes("forbidden")
        ));

      if (isAuthOrPermissionError) {
        console.log(`[Gemini Resilient Engine] Auth/Permission error detected on ${model}. Aborting fallbacks.`);
        throw error;
      }
      
      console.log(`[Gemini Resilient Engine] Transitioning to next available fallback model...`);
    }
  }

  console.error("[Gemini Resilient Engine] All resilient models in sequence failed.");
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured on the server." },
        { status: 500 }
      );
    }

    const { action, tasks, goals, habits, message, chatHistory, localTime } = await req.json();

    if (action === "prioritize") {
      const prompt = `
        You are Deadline Zero, an elite productivity engine.
        Current Local Time: ${localTime || new Date().toISOString()}
        
        Analyze the following tasks, goals, and habits.
        
        Tasks:
        ${JSON.stringify(tasks, null, 2)}
        
        Goals:
        ${JSON.stringify(goals, null, 2)}
        
        Habits:
        ${JSON.stringify(habits, null, 2)}

        Provide an intelligent prioritization for each task. You must:
        1. Categorize each task's priority: 'critical', 'high', 'medium', or 'low' based on:
           - Proximity of the deadline relative to current time.
           - Estimated effort required.
           - Impact on active goals.
        2. Propose concrete actionable subtasks (break large tasks into smaller steps of 30-60 mins).
        3. Give a clear rationale explaining WHY the priority was chosen.
        4. Recommend the single most important 'Next Action' the user should take immediately.
        5. Generate a 'Recovery Plan' if any deadlines are within 24 hours or in jeopardy.
      `;

      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                description: "List of prioritized tasks with added metadata",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "The original task ID" },
                    suggestedPriority: { 
                      type: Type.STRING, 
                      description: "Priority: critical (within 24h/urgent), high (within 3 days), medium (within 7 days), low (flexible)" 
                    },
                    priorityRationale: { type: Type.STRING, description: "Brief justification focusing on deadlines and effort" },
                    estimatedEffort: { type: Type.NUMBER, description: "Estimated active hours to complete" },
                    suggestedSubtasks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Actionable concrete subtasks (30-60m chunks)"
                    }
                  },
                  required: ["id", "suggestedPriority", "priorityRationale", "suggestedSubtasks"]
                }
              },
              nextAction: { 
                type: Type.STRING, 
                description: "The single most important, micro-action the user should take RIGHT NOW" 
              },
              recoveryPlan: { 
                type: Type.STRING, 
                description: "A step-by-step rescue plan if critical deadlines are near. Keep it short and high-impact." 
              },
              proactiveAlerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Urgent context-aware risk alerts (e.g. 'Task X will require 5h but you only have 3h before the deadline!')"
              }
            },
            required: ["tasks", "nextAction"]
          },
          systemInstruction: "You are Deadline Zero, an ultra-practical productivity coach. You focus purely on execution and risk mitigation, never generic motivation."
        }
      });

      const responseText = response.text || "{}";
      return NextResponse.json(JSON.parse(responseText));

    } else if (action === "schedule") {
      const prompt = `
        You are Deadline Zero. 
        Current Local Time: ${localTime || new Date().toISOString()}
        
        We need to schedule time blocks for the following tasks over the next few days.
        Tasks to schedule:
        ${JSON.stringify(tasks, null, 2)}

        Create an optimal daily calendar schedule (Work Blocks). 
        Rules:
        1. Schedule work blocks for 'critical' and 'high' tasks first.
        2. Keep work blocks realistic (e.g., 1 to 2.5 hours long).
        3. Avoid over-scheduling (maximum 6 hours of high-focus work blocks per day).
        4. Suggest specific calendar dates and times (e.g., "YYYY-MM-DD" and start/end "HH:MM").
        5. Allocate the blocks to respect the task's deadline.
      `;

      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              workBlocks: {
                type: Type.ARRAY,
                description: "Suggested focused work blocks mapped to tasks",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING, description: "The task ID" },
                    taskTitle: { type: Type.STRING, description: "Title of the task" },
                    date: { type: Type.STRING, description: "Date of block in YYYY-MM-DD" },
                    startTime: { type: Type.STRING, description: "Start time in HH:MM" },
                    endTime: { type: Type.STRING, description: "End time in HH:MM" },
                    focusFocusTopic: { type: Type.STRING, description: "Specific deliverable for this block" }
                  },
                  required: ["taskId", "taskTitle", "date", "startTime", "endTime", "focusFocusTopic"]
                }
              },
              schedulingInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Proactive calendar conflict detections or density warnings"
              }
            },
            required: ["workBlocks"]
          },
          systemInstruction: "You are Deadline Zero's scheduling coordinator. You map high-priority tasks into highly realistic time-blocks."
        }
      });

      const responseText = response.text || "{}";
      return NextResponse.json(JSON.parse(responseText));

    } else if (action === "chat") {
      const prompt = `
        You are Deadline Zero, an intelligent productivity companion.
        Current Local Time: ${localTime || new Date().toISOString()}
        
        The user wants to consult you. They might be overwhelmed, procrastinating, or seeking planning help.
        
        Context:
        Active Tasks: ${JSON.stringify(tasks, null, 2)}
        Active Goals: ${JSON.stringify(goals, null, 2)}
        Active Habits: ${JSON.stringify(habits, null, 2)}
        
        Recent conversation history:
        ${JSON.stringify(chatHistory || [], null, 2)}
        
        User's direct message: "${message}"

        Provide a supportive, execution-focused response. 
        Your rules:
        1. Be ultra-practical, objective, and action-oriented. No generic fluff.
        2. Help them overcome friction by suggesting a ridiculous first step (e.g. 'Open the document and write 1 sentence').
        3. Identify any deadline risks and address them immediately.
        4. If they ask to add, edit, complete, or re-schedule tasks/goals through natural language, suggest modifications in the structured 'recommendedChanges' section.
        5. ALWAYS conclude your conversational message with "Next Action: [Single most important micro-action]".
      `;

      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyMessage: { 
                type: Type.STRING, 
                description: "Your direct chat reply. Keep it clean and highly actionable, with bullet points. ALWAYS end with 'Next Action: ...'" 
              },
              recommendedChanges: {
                type: Type.OBJECT,
                description: "Any structured updates to the user's task or goal lists resulting from their request",
                properties: {
                  addTasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        dueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                        priority: { type: Type.STRING, description: "critical/high/medium/low" },
                        estimatedEffort: { type: Type.NUMBER, description: "hours" }
                      },
                      required: ["title"]
                    }
                  },
                  completeTaskId: { type: Type.STRING, description: "Id of task to mark complete if user said they finished it" }
                }
              }
            },
            required: ["replyMessage"]
          },
          systemInstruction: "You are Deadline Zero. Your supreme goal is to get the user executing their tasks right now."
        }
      });

      const responseText = response.text || "{}";
      return NextResponse.json(JSON.parse(responseText));

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (err: any) {
    console.error("Gemini API Route Error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during AI processing." },
      { status: 500 }
    );
  }
}
