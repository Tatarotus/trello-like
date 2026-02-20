// db/seed.ts
import { db } from './index';
import { workspaces, boards, lists, tasks } from './schema';
import crypto from 'crypto';

async function seed() {
  console.log('🌱 Seeding the database...');

  // 1. Create a Workspace
  const workspaceId = crypto.randomUUID();
  await db.insert(workspaces).values({
    id: workspaceId,
    name: 'My Workspace',
    description: 'A place for my projects',
  });

  // 2. Create a Board
  const boardId = crypto.randomUUID();
  await db.insert(boards).values({
    id: boardId,
    name: 'My Board',
    workspaceId: workspaceId,
  });

  // 3. Generate unique IDs for our columns
  const todoId = crypto.randomUUID();
  const inProgressId = crypto.randomUUID();
  const doneId = crypto.randomUUID();

  // 4. Insert the Lists
  await db.insert(lists).values([
    { id: todoId, title: 'To Do', order: 0, boardId: boardId },
    { id: inProgressId, title: 'In Progress', order: 1, boardId: boardId },
    { id: doneId, title: 'Done', order: 2, boardId: boardId },
  ]);

  // 5. Insert some dummy Tasks
  await db.insert(tasks).values([
    { id: crypto.randomUUID(), title: 'Set up SQLite and Drizzle', order: 0, listId: doneId },
    { id: crypto.randomUUID(), title: 'Build the drag-and-drop UI', order: 0, listId: inProgressId },
    { id: crypto.randomUUID(), title: 'Implement optimistic updates', order: 0, listId: todoId },
    { id: crypto.randomUUID(), title: 'Add a form to create new tasks', order: 1, listId: todoId },
  ]);

  console.log('✅ Database seeded successfully!');
}

// Execute the function
seed().catch((e) => {
  console.error('❌ Seeding failed:\n', e);
  process.exit(1);
});
