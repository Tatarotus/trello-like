# Sam's Kanban Board

Description
-----------

**Sam's Kanban-Board** is a modern, responsive web application designed to simulate the core functionality of Kanban-style project management tool created by Toyota. Built on top of the robust Next.js framework, it provides a seamless interface for users to organize tasks, manage projects, and visualize workflows.

The primary problem this application solves is providing a lightweight, customizable, and self-hostable project management dashboard. It aims to reduce the friction of task tracking by leveraging an intuitive drag-and-drop interface.

The target audience includes developers, small teams, and individuals looking for a personal task management system that can be easily extended or integrated into existing TypeScript-based ecosystems. The core idea revolves around hierarchical organization---Workspaces contain Boards, Boards contain Lists, and Lists contain Tasks---all manipulated through optimistic UI updates and server actions.

Features
--------

-   **Workspaces & Boards Management:** Create and navigate between isolated workspaces and distinct project boards.

-   **Kanban Interface:** Interactive, visually structured lists and task cards.

-   **Drag-and-Drop Operations:** Smooth task reordering and list-to-list movement powered by `@dnd-kit`.

-   **Server Actions:** Secure, API-less data mutations for tasks, boards, and workspaces using Next.js Server Actions.

-   **Type-Safe Database ORM:** Structured data modeling for `User`, `Board`, `List`, and `Task` entities using Drizzle ORM.

-   **Tailwind CSS Integration:** Rapid, utility-first styling for consistent UI components.

Tech Stack
----------

-   **Languages:** TypeScript, JavaScript, CSS

-   **Frameworks:** Next.js (v16.1.6, App Router), React (v19.2.3)

-   **Libraries:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, Tailwind CSS

-   **Database:** SQLite (`better-sqlite3`),  Drizzle ORM (`drizzle-orm`)

-   **Tools:** ESLint, PostCSS, Drizzle Kit

Architecture Overview
---------------------

The application follows a modern Next.js App Router architecture, strictly separating Server Components, Client Components, and Server Actions.

-   **UI Component Segregation:** Components are modularized inside `app/components/`. Generic, reusable interface elements (Buttons, Inputs, Containers) reside in `app/components/ui/`, while domain-specific components (`TaskCard.tsx`, `KanbanBoard.tsx`) are kept at the root of the components directory.

-   **Data Mutation Paradigm:** Instead of traditional REST API routes, the application heavily utilizes Next.js Server Actions located in the `app/actions/` directory. This encapsulates business logic for `board-actions`, `task-actions`, and `workspace-actions` directly on the server, tightly coupled with the database ORMs.

-   **Routing:** The routing is dynamic and structured hierarchically. `app/workspace/[workspaceId]` handles workspace-level views, while `app/board/[boardId]` handles the rendering of the specific Kanban boards.

-   **Database Layer:** Interestingly, the codebase contains configurations for both **Prisma** (with a generated client for Models like `Board`, `List`, `Task`, `User`) and **Drizzle ORM**. This suggests a migration pattern or a dual-ORM approach depending on the deployment target (SQLite via Drizzle vs. Postgres via Prisma).

Installation
------------

### Prerequisites

-   Node.js (v20 or higher recommended)

-   Docker & Docker Compose (for production deployment)

-   npm, yarn, pnpm, or bun


### Step-by-step installation instructions

1.  **Clone the repository** (assuming you have access):

    Bash

    ```
    git clone https://github.com/Tatarotus/trello-like.git
    cd trello-like

    ```

2.  **Install dependencies**:

    Bash

    ```
    npm install

    ```


3.  **Database setup and seeding**: We use Drizzle ORM to manage the database. Run the following commands to push the schema to your database and seed it with initial data:

    Bash

    ```
    npm run db:push


    # (Optional) Seed the database with initial workspaces/boards
    ```
    npm run db:seed

    ```
    npm run db:push

    ```
Usage
-----

### How to run in development

To start the local Next.js development server with hot-module reloading:

Bash

```
npm run dev

```

Navigate to `http://localhost:3000` in your browser.

### How to build for production

Build and Start the Application

Make sure you have Docker and Docker Compose installed.

Bash

```
docker compose up --build -d
```

This will:
Build the production image
Start the container in detached mode
Expose the app on port 8090
Persist SQLite data using a Docker volume
To start the production server after building:

### Example URL Routing

-   **Home:** `http://localhost:8090/`

-   **Workspace View:** `http://localhost:8090/workspace/123`

-   **Board View:** `http://localhost:8090/board/456`

Configuration
-------------

-   **`package.json`**: Defines dependencies, build scripts, and marks the project as `private: true`.

-   **`next.config.ts`**: The main configuration file for Next.js behaviors.

-   **`drizzle.config.ts`**: Configures Drizzle Kit to use `sqlite` dialect, pointing to `./db/schema.ts` and outputting to `./drizzle` utilizing `sqlite.db`.

-   **`eslint.config.mjs`**: ESLint configuration extending Next.js core web vitals and TypeScript recommended rules.

-   **`postcss.config.mjs`**: Configures PostCSS to utilize the `@tailwindcss/postcss` plugin for processing Tailwind styles.

-   **`Dockerfile`**: Docker configuration for building and running the application.

-   **`docker-compose.yml`**: Docker Compose configuration for running the application in a containerized environment.

Scripts
-------

The following NPM scripts are available in `package.json`:

-   `npm run dev`: Starts the Next.js development server.

-   `npm run build`: Compiles the application for production deployment.

-   `npm run start`: Starts the compiled Next.js production server.

-   `npm run lint`: Runs ESLint to check for code quality and formatting issues.

Testing
-------

Currently, there is no automated testing suite configured for this project.

Deployment
----------


### How to deploy using Docker

Make sure your server or machine has:

Docker

Docker Compose (v2+)

You can verify:

```bash
docker --version
docker compose version
```

```bash
git clone https://github.com/Tatarotus/trello-like.git
cd trello-like
```

The database will be stored inside the container at: /app/data/sqlite.db

#### Build the Docker Image
```bash
docker compose up --build -d
```
This will:
Build the production image
Start the container
Expose the app on port 8090
Persist database data across restarts

Access the Application
Open your browser:
Home: http://localhost:8090/
Workspace View: http://localhost:8090/workspace/123
Board View: http://localhost:8090/board/456
If deploying on a VPS, replace localhost with your server IP or domain.

**Deploying to a Node Server (VPS):**

Bash

```
npm install
npm run build
# Using a process manager like PM2
pm2 start npm --name "trello-like" -- run start

```

Project Structure
-----------------

Plaintext

```
.
├── app/
│   ├── actions/
│   │   ├── board-actions.ts
│   │   ├── task-actions.ts
│   │   └── workspace-actions.ts
│   ├── board/
│   │   └── [boardId]/
│   │       └── page.tsx
│   ├── components/
│   │   ├── KanbanBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── ui/
│   │       ├── BoardCard.tsx
│   │       ├── Button.tsx
│   │       ├── Container.tsx
│   │       ├── Input.tsx
│   │       └── WorkspaceHeader.tsx
│   ├── workspace/
│   │   └── [workspaceId]/
│   │       └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── drizzle.config.ts
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
└── prisma.config.ts

```

Roadmap
-------

The following features and improvements are missing and represent future development goals:

-   **Authentication & Authorization:** Implementation of user login (e.g., NextAuth.js or Clerk) to map the existing `User` model to actual authenticated sessions.

-   **Automated Testing:** Setup of unit tests (Vitest/Jest) for Server Actions and end-to-end tests (Playwright/Cypress) for drag-and-drop interactions.


-   **API Routes:** If external integrations are required, standard REST API routes (`app/api/...`) should be introduced alongside existing Server Actions.

Contributing
------------

1.  Create a feature branch from `main` (e.g., `git checkout -b feature/new-board-ui`).

2.  Ensure you run `npm run lint` before committing.

3.  Commit your changes with clear, descriptive commit messages.

4.  Push the branch and open a Pull Request.

*Note: Since the project is still marked as `private: true` in `package.json`, contributions are likely restricted to internal team members.*

License
-------

This project is private. No open-source license is provided. All rights reserved by the repository owner unless stated otherwise.
