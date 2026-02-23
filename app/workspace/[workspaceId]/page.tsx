import Link from "next/link";
import { db } from "@/db";
import { createBoard, deleteBoard } from "../../actions/board-actions";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { workspaces } from "@/db/schema";
import { Container } from "../../components/ui/Container";
import { BoardCard } from "../../components/ui/BoardCard";
import { WorkspaceHeader } from "../../components/ui/WorkspaceHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const session = await getSession();
  const { workspaceId } = await params;

  const workspace = await db.query.workspaces.findFirst({
    where: and(eq(workspaces.id, workspaceId), eq(workspaces.userId, session!.userId)),
    with: { boards: true }
  });

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-xl font-medium text-gray-900">Workspace not found</h1>
        <Link href="/" className="text-gray-500 hover:text-gray-900 mt-2 text-sm">Go back to Workspaces</Link>
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
    <main className="min-h-screen bg-gray-50 pb-24 font-sans">
      <WorkspaceHeader 
        name={workspace.name} 
        description={workspace.description || "Project management and team collaboration."}
        backHref="/"
        backLabel="All Workspaces"
      />

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
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

          <div className="p-5 bg-white border border-gray-200 rounded-md flex flex-col justify-center min-h-[140px]">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
              New Board
            </h2>
            <form action={handleCreateBoard} className="flex flex-col gap-3">
              <Input 
                name="name" 
                placeholder="Board name..." 
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
