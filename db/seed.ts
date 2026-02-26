// db/seed.ts
import { db } from './index';
import { users, workspaces, boards, lists, tasks } from './schema';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding the database...');

  // 1. Create a Demo User (so you can log in to see the seeded data)
  const userId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await db.insert(users).values({
    id: userId,
    name: 'Demo User',
    email: 'demo@example.com',
    password: hashedPassword,
  });

  console.log('👤 Created Demo User: demo@example.com / password123');

  // 2. Create a Workspace linked to the Demo User
  const workspaceId = crypto.randomUUID();
  await db.insert(workspaces).values({
    id: workspaceId,
    userId: userId, // <-- This was the missing piece!
    name: 'My Workspace',
    slug: 'my-workspace',
    description: 'A place for my projects',
  });

  // 3. Create a Board
  const boardId = crypto.randomUUID();
  await db.insert(boards).values({
    id: boardId,
    name: 'My Board',
    slug: 'my-board',
    workspaceId: workspaceId,
  });

  // 4. Generate unique IDs for our columns
  const todoId = crypto.randomUUID();
  const inProgressId = crypto.randomUUID();
  const doneId = crypto.randomUUID();

  // 5. Insert the Lists
  await db.insert(lists).values([
    { id: todoId, title: 'To Do', order: 0, boardId: boardId },
    { id: inProgressId, title: 'In Progress', order: 1, boardId: boardId },
    { id: doneId, title: 'Done', order: 2, boardId: boardId },
  ]);

  // 6. Insert some dummy Tasks
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
