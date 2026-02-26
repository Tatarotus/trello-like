import KanbanBoard from "../../components/KanbanBoard";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { boards, workspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { BoardHeader } from "../../components/ui/BoardHeader";

export default async function BoardPage({ params }: { params: Promise<{ workspaceSlug: string, boardSlug: string }> }) {
  const { workspaceSlug, boardSlug } = await params;
  const session = await getSession();

  if (!session) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
              <h1 className="text-xl font-medium text-gray-900">Unauthorized</h1>
              <Link href="/login" className="text-gray-500 hover:text-gray-900 mt-2 text-sm">Login to continue</Link>
          </div>
      );
  }

  // Find workspace first to ensure user owns it
  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.slug, workspaceSlug), eq(workspaces.userId, session.userId))
  });

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-xl font-medium text-gray-900">Workspace not found</h1>
        <Link href="/" className="text-gray-500 hover:text-gray-900 mt-2 text-sm">Go back to Workspaces</Link>
      </div>
    );
  }

  const board = await db.query.boards.findFirst({
    where: and(eq(boards.slug, boardSlug), eq(boards.workspaceId, workspace.id)),
    with: {
      lists: {
        with: {
          tasks: {
            where: (tasks, { isNull }) => isNull(tasks.parentId),
            with: {
              children: true
            },
            orderBy: (tasks, { asc }) => [asc(tasks.order)]
          }
        },
        orderBy: (lists, { asc }) => [asc(lists.order)]
      }
    }
  });

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-xl font-medium text-gray-900">Board not found</h1>
        <Link href={`/${workspaceSlug}`} className="text-gray-500 hover:text-gray-900 mt-2 text-sm">Back to Workspace</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden font-sans">
      <BoardHeader 
        boardId={board.id}
        boardName={board.name}
        boardSlug={board.slug}
        workspaceName={workspace.name}
        workspaceSlug={workspace.slug}
      />
      
      <div className="flex-1 overflow-hidden relative">
        <KanbanBoard initialLists={board.lists} boardId={board.id} />
      </div>
    </main>
  );
}
