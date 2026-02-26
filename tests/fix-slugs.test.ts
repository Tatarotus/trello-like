import 'dotenv/config';
import { db } from '../db';
import { workspaces, boards } from '../db/schema';
import { eq } from 'drizzle-orm';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

async function fixSlugs() {
  console.log("Fixing missing slugs...");
  
  // Workspaces
  const existingWorkspaces = await db.query.workspaces.findMany();
  for (const w of existingWorkspaces) {
    if (!w.slug) {
      const slug = `${slugify(w.name)}-${Math.random().toString(36).substring(2, 7)}`;
      console.log(`Setting slug for workspace ${w.name} to ${slug}`);
      await db.update(workspaces).set({ slug }).where(eq(workspaces.id, w.id));
    }
  }

  // Boards
  const existingBoards = await db.query.boards.findMany();
  for (const b of existingBoards) {
    if (!b.slug) {
      const slug = `${slugify(b.name)}-${Math.random().toString(36).substring(2, 7)}`;
      console.log(`Setting slug for board ${b.name} to ${slug}`);
      await db.update(boards).set({ slug }).where(eq(boards.id, b.id));
    }
  }
}

fixSlugs().then(() => {
  console.log("✅ Slugs updated.");
  process.exit();
});
