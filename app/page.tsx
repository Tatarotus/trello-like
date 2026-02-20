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
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Refined Header Proportions */}
      <div className="bg-white border-b border-slate-200 py-12 mb-12 shadow-sm">
        <Container>
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Workspaces
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl font-medium">
              Manage your teams, boards, and projects in one place.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
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

          {/* Consistent Standard Card Styling */}
          <div className="p-6 bg-white rounded-xl border-2 border-dashed border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px]">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-lg font-bold">
                +
              </span>
              New Workspace
            </h2>
            <form action={handleCreateWorkspace} className="flex flex-col gap-4">
              <Input 
                name="name" 
                placeholder="Team name..." 
                required
              />
              <Button type="submit" fullWidth>
                Add Workspace
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </main>
  );
}
