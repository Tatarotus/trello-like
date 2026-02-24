# Trello-like Kanban App

A full-stack Trello clone built with Next.js 15, Drizzle ORM, SQLite, and @dnd-kit.

## Features

- **Drag and Drop**: Reorder tasks within lists or move them between lists with smooth animations.
- **Task Details**: Click a card to open a full detail modal.
- **Rich Task Properties**: 
  - Editable titles and descriptions.
  - Due date tracking.
  - Color-coded labels (Green, Yellow, Red, Blue, Purple).
- **Workspaces & Boards**: Organize your projects into workspaces and multiple boards.
- **Optimistic Updates**: Immediate UI feedback for actions like adding, reordering, and deleting tasks.
- **Responsive Design**: Beautiful, modern UI that works on all screen sizes.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Custom session management
- **Drag & Drop**: @dnd-kit
- **Styling**: Tailwind CSS
- **Icons**: Lucide-style SVGs

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Push the database schema:
   ```bash
   npm run db:push
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

- `npm run db:push`: Update the database schema to match `db/schema.ts`.
- `npm run db:studio`: Open Drizzle Studio to explore and edit your data.
