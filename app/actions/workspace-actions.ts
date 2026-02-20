"use server"

import { db } from '@/db';
import { workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    // Note: in a real app, we should handle cascading deletion of boards, lists, and tasks
    // SQLite doesn't always automatically do it without PRAGMA foreign_keys = ON;
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    return { success: false, error: "Database delete failed" };
  }
}
