import Link from "next/link";
import { db } from "@/db";
import { createBoard, deleteBoard } from "../../actions/board-actions";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { workspaces } from "@/db/schema";
import { Container } from "../../components/ui/Container";
import { BoardCard } from "../../components/ui/BoardCard";
import { WorkspaceHeader } from "../../components/ui/WorkspaceHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    with: {
      boards: true
    }
  });

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
        <h1 className="text-3xl font-black text-slate-800">Workspace not found</h1>
        <Link href="/" className="text-blue-600 hover:underline mt-4 font-bold">Go back to Workspaces</Link>
      </div>
    );
  }

  async function handleCreateBoard(formData: FormData) {
    "use server"
    const name = formData.get("name") as string;
    if (!name) return;
    await createBoard(name, workspaceId);
    revalidatePath(`/workspace/${workspaceId}`);
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <WorkspaceHeader 
        name={workspace.name} 
        description={workspace.description || "Project management and team collaboration."}
        backHref="/"
        backLabel="All Workspaces"
      />

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
          {workspace.boards.map((board) => (
            <BoardCard
              key={board.id}
              id={board.id}
              name={board.name}
              href={`/board/${board.id}`}
              deleteAction={async () => {
                "use server"
                await deleteBoard(board.id);
                revalidatePath(`/workspace/${workspaceId}`);
              }}
              variant="board"
            />
          ))}

          <div className="p-8 bg-white rounded-2xl shadow-md flex flex-col justify-center min-h-[180px] hover:shadow-lg transition-all border-none">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-4 uppercase tracking-widest">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-lg font-black shadow-sm">
                +
              </span>
              New Board
            </h2>
            <form action={handleCreateBoard} className="flex flex-col gap-4">
              <Input 
                name="name" 
                placeholder="Board name..." 
                required
              />
              <Button type="submit" fullWidth>
                Add Board
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </main>
  );
}
