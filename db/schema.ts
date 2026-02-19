// db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  listId: text('list_id').references(() => lists.id),
});

// This setup gives you Prisma-like nested queries (relations)
export const listsRelations = relations(lists, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  list: one(lists, {
    fields: [tasks.listId],
    references: [lists.id],
  }),
}));
