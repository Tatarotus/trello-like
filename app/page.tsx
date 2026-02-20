import { db } from "@/db";
import { createWorkspace, deleteWorkspace } from "./actions/workspace-actions";
import { revalidatePath } from "next/cache";
import { Container } from "./components/ui/Container";
import { BoardCard } from "./components/ui/BoardCard";
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";

export default async function Home() {
  const allWorkspaces = await db.query.workspaces.findMany({
    with: {
      boards: true
    }
  });

  async function handleCreateWorkspace(formData: FormData) {
    "use server"
    const name = formData.get("name") as string;
    if (!name) return;
    await createWorkspace(name);
    revalidatePath("/");
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <div className="bg-white py-16 mb-16 shadow-sm shadow-slate-200">
        <Container>
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 sm:text-7xl">
              Workspaces
            </h1>
            <p className="text-2xl text-slate-500 max-w-2xl font-bold tracking-tight">
              The high-level container for your boards and projects.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
          {allWorkspaces.map((ws) => (
            <BoardCard
              key={ws.id}
              id={ws.id}
              name={ws.name}
              count={ws.boards.length}
              countLabel={ws.boards.length === 1 ? 'board' : 'boards'}
              href={`/workspace/${ws.id}`}
              deleteAction={async () => {
                "use server"
                await deleteWorkspace(ws.id);
                revalidatePath("/");
              }}
              variant="workspace"
            />
          ))}

          <div className="p-10 bg-white rounded-2xl shadow-md flex flex-col justify-center min-h-[200px] hover:shadow-lg transition-all border-none">
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 uppercase tracking-widest">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 text-xl font-black shadow-sm">
                +
              </span>
              New Workspace
            </h2>
            <form action={handleCreateWorkspace} className="flex flex-col gap-6">
              <Input 
                name="name" 
                placeholder="Team name..." 
                required
              />
              <Button type="submit" fullWidth size="lg">
                Add Workspace
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </main>
  );
}
