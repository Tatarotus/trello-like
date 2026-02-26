import 'dotenv/config';
import { db } from '../db';
import { workspaces } from '../db/schema';
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
  const existing = await db.query.workspaces.findMany();
  for (const w of existing) {
    if (!w.slug) {
      const slug = `${slugify(w.name)}-${Math.random().toString(36).substring(2, 7)}`;
      console.log(`Setting slug for ${w.name} to ${slug}`);
      await db.update(workspaces).set({ slug }).where(eq(workspaces.id, w.id));
    }
  }
}

fixSlugs().then(() => {
  console.log("✅ Slugs updated.");
  process.exit();
});
