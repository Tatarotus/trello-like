"use server"

import { db } from '@/db';
import { boards, workspaces, lists, tasks } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function createBoard(name: string, workspaceId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // SECURITY: Ensure the user owns the workspace they are adding a board to
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.userId, session.userId))
    });

    if (!workspace) return { success: false, error: "Unauthorized" };

    const newBoard = await db.insert(boards).values({
      id: crypto.randomUUID(),
      name,
      workspaceId,
    }).returning();
    
    return { success: true, board: newBoard[0] };
  } catch (error) {
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteBoard(boardId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // SECURITY: Verify the board belongs to a workspace owned by the user
    const board = await db.query.boards.findFirst({
      where: eq(boards.id, boardId),
      with: { workspace: true }
    });

    if (!board || board.workspace?.userId !== session.userId) {
      return { success: false, error: "Unauthorized or not found" };
    }

    // CASCADING DELETE: Delete tasks inside the board's lists
    const boardLists = await db.select({ id: lists.id }).from(lists).where(eq(lists.boardId, boardId));
    const listIds = boardLists.map(l => l.id);

    if (listIds.length > 0) {
      await db.delete(tasks).where(inArray(tasks.listId, listIds));
      await db.delete(lists).where(inArray(lists.boardId, [boardId]));
    }

    // Delete the board itself
    await db.delete(boards).where(eq(boards.id, boardId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete board:", error);
    return { success: false, error: "Database delete failed" };
  }
}
