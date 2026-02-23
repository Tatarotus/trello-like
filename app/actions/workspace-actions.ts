"use server"

import { db } from '@/db';
import { workspaces, boards, lists, tasks } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function createWorkspace(name: string, description?: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const newWorkspace = await db.insert(workspaces).values({
      id: crypto.randomUUID(),
      userId: session.userId,
      name,
      description,
    }).returning();
    return { success: true, workspace: newWorkspace[0] };
  } catch (error) {
    return { success: false, error: "Database insert failed" };
  }
}

export async function deleteWorkspace(workspaceId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // SECURITY: Ensure the workspace belongs to the logged-in user!
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.userId, session.userId))
    });

    if (!workspace) return { success: false, error: "Unauthorized or not found" };

    // ... (Keep your existing cascading delete logic here for boards, lists, tasks)
    
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database delete failed" };
  }
}
