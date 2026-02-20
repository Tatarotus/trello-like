"use server"

import { db } from '@/db';
import { boards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createBoard(name: string, workspaceId: string) {
  try {
    const newBoard = await db
      .insert(boards)
      .values({
        id: crypto.randomUUID(),
        name,
        workspaceId,
      })
      .returning();
    
    return { success: true, board: newBoard[0] };
  } catch (error) {
    console.error("Failed to create board:", error);
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteBoard(boardId: string) {
  try {
    await db.delete(boards).where(eq(boards.id, boardId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete board:", error);
    return { success: false, error: "Database delete failed" };
  }
}
