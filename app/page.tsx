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
    <main className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white border-b border-gray-200 py-12 mb-8">
        <Container>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900">
              Workspaces
            </h1>
            <p className="text-base text-gray-500 max-w-2xl">
              The high-level container for your boards and projects.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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

          <div className="p-5 bg-white border border-gray-200 rounded-md flex flex-col justify-center min-h-[160px]">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
              New Workspace
            </h2>
            <form action={handleCreateWorkspace} className="flex flex-col gap-3">
              <Input 
                name="name" 
                placeholder="Team name..." 
                required
              />
              <Button type="submit" fullWidth>
                Create
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </main>
  );
}
