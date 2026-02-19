"use server"

// import { db } from '../db';
// import { tasks } from '../db/schema';
import { db } from '@/db';
import { tasks } from '@/db/schema';
// import { db } from '../../db';
// import { tasks } from '../../db/schema';
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
