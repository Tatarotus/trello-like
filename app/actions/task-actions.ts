"use server"

import { db } from '@/db';
import { tasks, lists } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function updateTaskPosition(
  taskId: string, 
  newListId: string, 
  newOrder: number
) {
  try {
    // This is equivalent to: 
    // UPDATE tasks SET list_id = ?, order = ? WHERE id = ? RETURNING *;
    const updatedTask = await db
      .update(tasks)
      .set({ 
        listId: newListId, 
        order: newOrder 
      })
      .where(eq(tasks.id, taskId))
      .returning(); // .returning() ensures we get the updated row back immediately
    
    return { success: true, task: updatedTask[0] };
  } catch (error) {
    console.error("Failed to update task position:", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function createTask(title: string, listId: string, order: number) {
  try {
    const newTask = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(), // Native Node.js unique ID generator
        title,
        listId,
        order,
      })
      .returning();
    
    return { success: true, task: newTask[0] };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await db
      .delete(tasks)
      .where(eq(tasks.id, taskId));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "Database delete failed" };
  }
}

export async function updateListTitle(listId: string, newTitle: string) {
  try {
    await db
      .update(lists)
      .set({ title: newTitle })
      .where(eq(lists.id, listId));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update list title:", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function createList(title: string, order: number, boardId: string) {
  try {
    const newList = await db
      .insert(lists)
      .values({
        id: crypto.randomUUID(),
        title,
        order,
        boardId,
      })
      .returning();
    
    return { success: true, list: newList[0] };
  } catch (error) {
    console.error("Failed to create list:", error);
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteList(listId: string) {
  try {
    // 1. Delete all tasks belonging to this list first
    await db.delete(tasks).where(eq(tasks.listId, listId));
    
    // 2. Delete the list itself
    await db.delete(lists).where(eq(lists.id, listId));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete list:", error);
    return { success: false, error: "Database delete failed" };
  }
}
