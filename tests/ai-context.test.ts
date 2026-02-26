import 'dotenv/config';
import { db } from '../db';
import { tasks } from '../db/schema';
import { eq } from 'drizzle-orm';

async function testAiContext() {
  console.log("Testing AI Context fetching...");
  try {
    const task = await db.query.tasks.findFirst({
      with: {
        list: {
          with: {
            board: {
              with: {
                workspace: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      console.log("No tasks found in database to test context.");
      return;
    }

    console.log("✅ Successfully fetched task with full context:");
    console.log(`- Task: ${task.title}`);
    console.log(`- List: ${task.list.title}`);
    console.log(`- Board: ${task.list.board.name}`);
    console.log(`- Workspace: ${task.list.board.workspace.name}`);
    console.log(`- Slug: ${task.list.board.workspace.slug}`);

    if (task.list.board.workspace.slug === undefined) {
      console.error("❌ Slug is undefined! Check schema.");
    } else {
      console.log("✅ Slug is present.");
    }
  } catch (error) {
    console.error("❌ Error fetching task context:", error);
  }
}

testAiContext().then(() => process.exit());
