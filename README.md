# Notes Web Application

Production-ready, self-hostable web-based notes application built with Svelte 5, Bun, ElysiaJS, SQLite (FTS5), Drizzle ORM, and Tailwind CSS.

Designed for simplicity, performance, security, and exceptional self-hosting experience.

---

## Features

- **Rich Text Editor**: TipTap editor supporting Headings (H1-H3), Bold, Italic, Strikethrough, Links, Bullet/Ordered Lists, Blockquotes, Inline Code, and Code Blocks.
- **Autosave**: Real-time local state updates with ~750ms debounced API save, version concurrency checking, and save status indicator (`Saving...`, `Saved`, `Offline`, `Failed to save`).
- **SQLite FTS5 Full-Text Search**: Fast full-text search over titles and content using SQLite FTS5 with BM25 ranking.
- **Revision History**: Automatic revision snapshots captured during major edit intervals with visual preview and one-click snapshot restoration.
- **Soft-Delete & Trash**: Soft-delete notes into Trash before permanent removal, with unarchive and restore capabilities.
- **Tag Management**: User-scoped tag creation, custom color selection, and instant note filtering.
- **Optimistic UI**: Immediate UI state transitions for note status changes (Archive, Trash, Restore, Tags) with automatic rollback on error.
- **Offline Resilience**: IndexedDB caching via PWA engine. Edits made while offline queue locally and automatically synchronize when connectivity is restored.
- **Authentication**: Argon2id password hashing, secure HttpOnly SameSite session cookies, change password, and complete account deletion.
- **Dark / Light / System Theme**: Dynamic theme switching with local storage persistence.

---

## Monorepo Architecture

```text
notes/
├── apps/
│   ├── web/           # Svelte 5 + Vite + Tailwind CSS + TipTap + Eden Client
│   └── api/           # ElysiaJS + Bun + Drizzle ORM + SQLite FTS5
├── packages/
│   ├── api/           # Shared Eden Treaty type safety exports
│   └── config/        # Base TypeScript standards
├── deploy/
│   ├── Dockerfile     # Multi-stage Bun production image
│   └── compose.yml    # Docker Compose with persistent volume
├── .github/
│   └── workflows/
│       ├── ci.yml     # Automated lint, build & backend test suite
│       └── release.yml# GHCR Docker image release pipeline
└── README.md
```

---

## Quickstart (Local Development)

### Requirements
- [Bun](https://bun.sh) (v1.1+)

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-username/notes.git
cd notes
bun install
```

### 2. Run Development Servers
```bash
# Run both API (port 3000) and Web App (port 5173 with API proxy)
bun run dev
```

Or run individually:
```bash
bun run dev:api    # Backend API server on http://localhost:3000
bun run dev:web    # Frontend dev server on http://localhost:5173
```

---

## Docker Deployment (Self-Hosting)

Deploy the complete single-container web & API stack with persistent SQLite storage:

```bash
# Clone repository
git clone https://github.com/your-username/notes.git
cd notes

# Launch via Docker Compose
docker compose -f deploy/compose.yml up -d
```

The app will be available at **`http://localhost:3000`**.

---

## Environment Variables

Copy `.env.example` to `.env` or pass variables to your Docker environment:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development` or `production`) |
| `PORT` | `3000` | Server HTTP port |
| `DATABASE_URL` | `./notes.db` (Local) / `/data/notes.db` (Docker) | SQLite database file location |
| `SESSION_SECRET` | - | Secret string for session validation |

---

## Database & Backup Instructions

The application uses **SQLite** with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and Foreign Key enforcement enabled (`PRAGMA foreign_keys = ON;`).

### Persistent Storage Location
In Docker deployments, database files are stored in the mounted volume:
```text
/data/notes.db
/data/notes.db-wal
/data/notes.db-shm
```

### Hot Backup Strategy
To perform a safe hot backup of a running SQLite database without stopping the container:

```bash
# Execute safe backup inside running docker container
docker exec notes-app sqlite3 /data/notes.db ".backup '/data/backup-notes.db'"

# Copy backup file to host machine
docker cp notes-app:/data/backup-notes.db ./backup-notes-$(date +%F).db
```

### Database Restore Strategy
To restore from a backup file:

1. Stop the application:
   ```bash
   docker compose -f deploy/compose.yml down
   ```
2. Replace `/data/notes.db` with your backup file:
   ```bash
   cp ./backup-notes-2026-09-14.db ./deploy/data/notes.db
   ```
3. Restart container:
   ```bash
   docker compose -f deploy/compose.yml up -d
   ```

---

## Automated Testing & Verification

Run the comprehensive integration test suite:

```bash
# Run backend integration tests (Auth, Notes, FTS, Tags, Revisions)
bun run test

# Run frontend build verification
bun run build
```

---

## License

[MIT](LICENSE)
