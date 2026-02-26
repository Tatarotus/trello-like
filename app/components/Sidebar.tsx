import Link from "next/link";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { workspaces, users } from "@/db/schema";
import { logout } from "../actions/auth-actions";

export async function Sidebar() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({ 
    where: eq(users.id, session.userId) 
  });
  
  const userWorkspaces = await db.query.workspaces.findMany({
    where: eq(workspaces.userId, session.userId),
    with: { boards: true }
  });

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-gray-50 shrink-0 h-screen justify-between">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-5 border-b border-gray-200 flex items-center h-14 shrink-0 bg-white">
          <Link href="/" className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Projects
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {userWorkspaces.map((ws) => (
            <div key={ws.id} className="space-y-1">
              <Link 
                href={`/${ws.slug}`} 
                className="block px-2 py-1.5 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-200/50 transition-colors"
              >
                {ws.name}
              </Link>
              
              {ws.boards.length > 0 && (
                <div className="ml-2 space-y-0.5 border-l border-gray-200 pl-2">
                  {ws.boards.map(board => (
                    <Link 
                      key={board.id} 
                      href={`/${ws.slug}/${board.slug}`} 
                      className="block px-2 py-1.5 text-sm text-gray-600 rounded-md hover:bg-gray-200/50 hover:text-gray-900 transition-colors truncate"
                    >
                      {board.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="text-sm font-medium text-gray-900 truncate">
            {user?.name}
          </span>
        </div>
        <form action={logout}>
          <button 
            type="submit" 
            className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100 transition" 
            aria-label="Log out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
