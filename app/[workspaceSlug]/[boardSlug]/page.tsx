import KanbanBoard from "../../components/KanbanBoard";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { boards, workspaces } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";

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
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <Link 
            href={`/${workspaceSlug}`} 
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {workspace.name}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">{board.name}</h1>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="h-4 w-[1px] bg-gray-200 mx-2 hidden sm:block"></div>
           <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[10px] font-medium text-gray-700">S</div>
              <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] font-medium text-gray-600">G</div>
           </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden relative">
        <KanbanBoard initialLists={board.lists} boardId={board.id} />
      </div>
    </main>
  );
}
