import KanbanBoard from "../../components/KanbanBoard";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Container } from "../../components/ui/Container";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;

  // Drizzle's relational query fetches the lists and their nested tasks instantly
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
    with: {
      workspace: true,
      lists: {
        with: {
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.order)]
          }
        },
        orderBy: (lists, { asc }) => [asc(lists.order)]
      }
    }
  });

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-800">Board not found</h1>
        <Link href="/" className="text-blue-600 hover:underline mt-4">Go back to Workspaces</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100/50 flex flex-col h-screen overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex flex-col gap-1">
          <Link 
            href={`/workspace/${board.workspaceId}`} 
            className="group flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
            {board.workspace?.name}
          </Link>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{board.name}</h1>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
           <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600 uppercase">S</div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600 uppercase">G</div>
           </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden relative">
        <KanbanBoard initialLists={board.lists} boardId={boardId} />
      </div>
    </main>
  );
}
