# GEMINI.md – Code Agent Instructions
**Project:** Trello Killer (AI-Powered Infinite-Nesting Project Board)

## 1. Project Vision & Goal
Build the **best Trello alternative** that solves its biggest pain points natively:
- **Infinite nesting** (tasks → subtasks → sub-subtasks… unlimited depth)
- **Multiple native views** on every board (Kanban, List, Calendar, Timeline/Gantt)
- **Built-in AI assistant** (Sambanova free models) that can break down tasks, summarize comments, auto-tag, generate descriptions with functions like Make This Task Perfect, Professional, Concise, Friendly and Write Status Update.
- **Native time tracking** (estimated vs actual)
- **Command menu** (Cmd/Ctrl+K) for everything

**Phase 1 priority (right now):**
1. Infinite Nesting (already started)
2. AI Integration (already started)
3. Polish Kanban + Task Detail Modal (already done)
4. Time tracking
5. Cmd+K palette

Never lose sight of “**make Trello feel outdated**”.

## 2. Tech Stack & Core Libraries
- **Framework**: Next.js 15+ (App Router, Server Actions, React Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind + shadcn/ui (see `app/components/ui/`)
- **Database**: Drizzle ORM + SQLite (`db/schema.ts`, `sqlite.db`)
- **Auth**: Custom session (`lib/session.ts`) + server actions
- **AI**: Sambanova (free models list DeepSeek-R1-0528
DeepSeek-R1-Distill-Llama-70B
DeepSeek-V3-0324
DeepSeek-V3.1
DeepSeek-V3.1-Terminus
DeepSeek-V3.1-cb
DeepSeek-V3.2
E5-Mistral-7B-Instruct
Llama-3.3-Swallow-70B-Instruct-v0.4
Llama-4-Maverick-17B-128E-Instruct
Meta-Llama-3.1-8B-Instruct
Meta-Llama-3.3-70B-Instruct
Qwen3-235B
Qwen3-32B
Whisper-Large-v3
gpt-oss-120b 
- **UI Components**: `KanbanBoard.tsx`, `TaskCard.tsx`, `TaskDetailModal.tsx`, `Sidebar.tsx`
- **Other**: Server Actions for **all** mutations (no client-side API routes for writes)

## 3. Codebase Structure (Key Folders Only)
app/
├── actions/              # ALL Server Actions (auth, board, task, workspace, ai)
├── [workspaceId]/        # Dynamic workspace pages
├── board/[boardId]/      # Board view (Kanban + future views)
├── components/
│   ├── ui/               # shadcn components (Button, Input, etc.)
│   └── KanbanBoard.tsx, TaskCard.tsx, TaskDetailModal.tsx
├── layout.tsx, globals.css
db/
├── schema.ts             # Drizzle tables (workspaces, boards, tasks, subtasks)
├── index.ts
lib/session.ts


**Golden Rule**: All data mutations **MUST** go through `app/actions/*.ts`. Never mutate directly in components.

## 4. Core Domain Model (Always Respect)
- Workspace → Board → Task (with recursive children)
- Every Task can have:
  - `children: Task[]` (infinite depth)
  - `description`, `labels`, `assignees`, `dueDate`, `timeEstimate`, `timeTracked`
  - `comments` (future)
- Use recursive components for nesting (already in TaskCard / TaskDetailModal).

## 5. Strict Development Rules (Agent MUST Follow)
### Always
- Use **Server Actions** for create/update/delete (revalidatePath, redirect where needed).
- Prefer **Server Components** (RSC) unless interactivity is required.
- All new UI components go in `app/components/ui/` and follow shadcn style.
- TypeScript: strict, no `any`, proper interfaces in `db/schema.ts` and actions.
- Tailwind: use existing design tokens, keep classes clean.
- Comments: JSDoc on all public functions + clear inline comments on complex nesting logic.

### Never
- Do not create client-side fetch for mutations.
- Do not use `useEffect` for data fetching when RSC + Server Actions can do it.
- Do not add new dependencies without updating `package.json` and asking first.
- Do not break infinite nesting (recursive `children` field).

## 6. AI Integration Rules (Gemini)
- All AI logic lives in `app/actions/ai-actions.ts`
- Only use completions https://api.sambanova.ai/v1/chat/completions
- Expose clear functions like:
  - `breakDownTask(taskId, depth?)`
  - `summarizeComments(taskId)`
  - `suggestLabels(description)`
  - `generateDescription(title)`
- Always return structured data (not just text).
- Never expose raw  API keys in client code.

## 7. Implementation Guidelines (How I Should Work)
1. **Read first**: Always explore relevant files before writing new code (`ls`, `cat`, `grep`).
2. **Plan**: Show a short plan before coding (files to change, DB migration if needed, UI flow).
3. **Test**: After changes, run `npm run build` and manual test steps.
4. **Infinite Nesting**: Every task operation must handle `children` recursively.
5. **UI Polish**: Match shadcn + modern minimal aesthetic (dark mode friendly).
6. **Commit style**: Follow existing commits (e.g., “gemini-cli: …”, “feat: infinite nesting”)

## 8. Current TODO & Priorities
See `todo.md` for full list.  
**Immediate focus areas**:
- Finish infinite nesting UI (drag-drop children, collapse/expand)
- Fully integrate `ai-actions.ts` into TaskDetailModal
- Add time tracking fields + timer UI
- Implement Cmd+K command menu

## 9. Useful Commands
```bash
npm run dev          # start dev server
npm run build        # type check + build
npx drizzle-kit push # DB migrations


REMEMBER: Run all tests and verify the server before committing.

