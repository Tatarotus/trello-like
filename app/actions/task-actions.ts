"use server"

import { db } from '@/db';
import { tasks, lists } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function updateTaskPosition(taskId: string, newListId: string, newOrder: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const updatedTask = await db.update(tasks)
      .set({ listId: newListId, order: newOrder })
      .where(eq(tasks.id, taskId))
      .returning(); 
    
    return { success: true, task: updatedTask[0] };
  } catch (error) {
    return { success: false, error: "Database update failed" };
  }
}

export async function createTask(title: string, listId: string, order: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const newTask = await db.insert(tasks).values({
      id: crypto.randomUUID(),
      title,
      listId,
      order,
    }).returning();
    
    return { success: true, task: newTask[0] };
  } catch (error) {
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteTask(taskId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await db.delete(tasks).where(eq(tasks.id, taskId));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database delete failed" };
  }
}

export async function updateListTitle(listId: string, newTitle: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await db.update(lists).set({ title: newTitle }).where(eq(lists.id, listId));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database update failed" };
  }
}

export async function createList(title: string, order: number, boardId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const newList = await db.insert(lists).values({
      id: crypto.randomUUID(),
      title,
      order,
      boardId,
    }).returning();
    
    return { success: true, list: newList[0] };
  } catch (error) {
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteList(listId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // Cascading delete: tasks first, then the list
    await db.delete(tasks).where(eq(tasks.listId, listId));
    await db.delete(lists).where(eq(lists.id, listId));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database delete failed" };
  }
}

export async function reorderTasks(items: { id: string; order: number; listId: string }[]) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    db.transaction((tx) => {
      for (const item of items) {
        tx.update(tasks)
          .set({ order: item.order, listId: item.listId })
          .where(eq(tasks.id, item.id))
          .run();
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder tasks:", error);
    return { success: false, error: "Database update failed" };
  }
}
