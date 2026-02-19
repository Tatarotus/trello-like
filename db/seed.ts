// db/seed.ts
import { db } from './index';
import { lists, tasks } from './schema';
import crypto from 'crypto';

async function seed() {
  console.log('🌱 Seeding the database...');

  // 1. Generate unique IDs for our columns
  const todoId = crypto.randomUUID();
  const inProgressId = crypto.randomUUID();
  const doneId = crypto.randomUUID();

  // 2. Insert the Lists
  await db.insert(lists).values([
    { id: todoId, title: 'To Do', order: 0 },
    { id: inProgressId, title: 'In Progress', order: 1 },
    { id: doneId, title: 'Done', order: 2 },
  ]);

  // 3. Insert some dummy Tasks
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
