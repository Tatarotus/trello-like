import KanbanBoard from "./components/KanbanBoard";
import { db } from "../db";

export default async function Home() {
  // Drizzle's relational query fetches the lists and their nested tasks instantly
  const lists = await db.query.lists.findMany({
    with: { 
      tasks: { 
        orderBy: (tasks, { asc }) => [asc(tasks.order)] 
      } 
    },
    orderBy: (lists, { asc }) => [asc(lists.order)],
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">BetterTrello (Drizzle Edition)</h1>
      </header>
      
      <div className="p-6">
        <KanbanBoard initialLists={lists} />
      </div>
    </main>
  );
}
