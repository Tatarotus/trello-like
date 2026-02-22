"use server"

import { db } from '@/db';
import { workspaces, boards, lists, tasks } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function createWorkspace(name: string, description?: string) {
  try {
    const newWorkspace = await db
      .insert(workspaces)
      .values({
        id: crypto.randomUUID(),
        name,
        description,
      })
      .returning();
    
    return { success: true, workspace: newWorkspace[0] };
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteWorkspace(workspaceId: string) {
  try {
    // 1. Find all boards belonging to this workspace
    const workspaceBoards = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.workspaceId, workspaceId));
      
    const boardIds = workspaceBoards.map(b => b.id);

    if (boardIds.length > 0) {
      // 2. Find all lists belonging to these boards
      const boardLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(inArray(lists.boardId, boardIds));
        
      const listIds = boardLists.map(l => l.id);

      if (listIds.length > 0) {
        // 3. Delete all tasks in these lists
        await db.delete(tasks).where(inArray(tasks.listId, listIds));
      }

      // 4. Delete all lists in these boards
      await db.delete(lists).where(inArray(lists.boardId, boardIds));
      
      // 5. Delete the boards
      await db.delete(boards).where(eq(boards.workspaceId, workspaceId));
    }

    // 6. Finally, delete the workspace itself
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    return { success: false, error: "Database delete failed" };
  }
}
