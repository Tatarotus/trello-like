"use server"

import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { createTask } from './task-actions';

const SAMBA_KEY = process.env.SAMBA_KEY;
const SAMBA_API_URL = "https://api.sambanova.ai/v1/chat/completions";

const MODELS = [
  "Meta-Llama-3.3-70B-Instruct",
  "Qwen3-32B",
  "DeepSeek-R1-Distill-Llama-70B"
];

function extractJSON(content: string) {
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  cleaned = cleaned.replace(/```json\n?|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonSnippet = cleaned.substring(start, end + 1);
      try {
        return JSON.parse(jsonSnippet);
      } catch (e2) {
        throw new Error("AI returned malformed JSON.");
      }
    }
    throw new Error("Could not find valid JSON in AI response.");
  }
}

async function callSambaAI(systemPrompt: string, userPrompt: string) {
  if (!SAMBA_KEY) throw new Error("SAMBA_KEY is not configured.");

  let lastError: any = null;
  for (const model of MODELS) {
    try {
      const response = await fetch(SAMBA_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SAMBA_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream: false,
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        }),
      });

      if (response.status === 429) continue;
      if (!response.ok) continue;

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw new Error(lastError?.message || "AI models unavailable.");
}

async function getTaskContext(taskId: string) {
  return await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      list: {
        with: {
          board: {
            with: {
              workspace: {
                with: {
                  boards: true
                }
              }
            }
          }
        }
      }
    }
  });
}

function formatContextPrompt(task: any) {
  const workspace = task.list.board.workspace;
  const board = task.list.board;
  const otherBoards = workspace.boards
    .filter((b: any) => b.id !== board.id)
    .map((b: any) => b.name)
    .join(', ');
  
  return `Workspace Context:
- Name: ${workspace.name}
- Slug: ${workspace.slug}
- Description: ${workspace.description || "N/A"}
- Other Boards in Workspace: ${otherBoards || "None"}

Board Context:
- Name: ${board.name}

Task Context:
- Title: ${task.title}
- Current Description: ${task.description || "None"}
- Current Labels: ${task.labels?.join(', ') || "None"}
- Due Date: ${task.dueDate || "Not set"}`;
}

/**
 * Returns proposed optimization data WITHOUT saving to database.
 */
export async function aiMakeTaskPerfect(taskId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const task = await getTaskContext(taskId);
    if (!task) return { success: false, error: "Task not found" };

    const systemPrompt = `You are a project optimization expert. Use the provided workspace and board context to tailor your suggestions. Propose a professional title, expanded description, 3-5 labels, and 4-6 sub-tasks.
Respond with NOTHING except a JSON object:
{
  "title": "Optimized Title",
  "description": "Expanded description...",
  "labels": ["label1", "label2", ...],
  "subtasks": ["subtask 1", "subtask 2", ...],
  "suggestedDueDate": "YYYY-MM-DD"
}`;

    const userPrompt = formatContextPrompt(task);
    const response = await callSambaAI(systemPrompt, userPrompt);
    const data = extractJSON(response);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns rewritten content WITHOUT saving to database.
 */
export async function aiRewriteTask(taskId: string, tone: 'professional' | 'concise' | 'friendly') {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const task = await getTaskContext(taskId);
    if (!task) return { success: false, error: "Task not found" };

    const systemPrompt = `Rewrite this task to be ${tone}. Use the provided workspace and board context for tone and relevance. Respond with NOTHING except JSON: { "title": "...", "description": "..." }`;
    const userPrompt = formatContextPrompt(task);
    const response = await callSambaAI(systemPrompt, userPrompt);
    const data = extractJSON(response);

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function aiWriteStatusUpdate(taskId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const task = await getTaskContext(taskId);
    if (!task) return { success: false, error: "Task not found" };

    const systemPrompt = `Write a professional status update. Use the workspace and board context to make it relevant to the project. Respond with NOTHING except JSON: { "update": "markdown text" }`;
    const userPrompt = formatContextPrompt(task);
    const response = await callSambaAI(systemPrompt, userPrompt);
    const data = extractJSON(response);

    return { success: true, update: data.update };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns suggested tags WITHOUT saving to database.
 */
export async function aiSuggestTags(taskId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const task = await getTaskContext(taskId);
    if (!task) return { success: false, error: "Task not found" };

    const systemPrompt = `Suggest 4-7 relevant labels. Map urgency to "Red", "Yellow", "Green", "Blue", or "Purple". Use workspace/board context for relevance. Respond with NOTHING except JSON: {"tags": ["Tag1", ...]}`;
    const userPrompt = formatContextPrompt(task);
    const response = await callSambaAI(systemPrompt, userPrompt);
    const { tags } = extractJSON(response);

    return { success: true, tags };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Helper to batch create subtasks (called only when user saves).
 */
export async function createBatchSubtasks(parentId: string, listId: string, titles: string[]) {
    const session = await getSession();
    if (!session) return { success: false };

    const created = [];
    for (let i = 0; i < titles.length; i++) {
        const res = await createTask(titles[i], listId, i, parentId);
        if (res.success && res.task) created.push(res.task);
    }
    return { success: true, subtasks: created };
}
