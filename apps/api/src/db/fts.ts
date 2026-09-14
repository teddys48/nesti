import { rawSqlite } from "./index";

export function initFts5() {
  rawSqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      id UNINDEXED,
      user_id UNINDEXED,
      title,
      content
    );
  `);
}

export function syncNoteToFts(note: { id: string; userId: string; title: string; content: string }) {
  // Delete existing entry if present, then insert
  rawSqlite.run("DELETE FROM notes_fts WHERE id = ?", [note.id]);
  rawSqlite.run(
    "INSERT INTO notes_fts(id, user_id, title, content) VALUES (?, ?, ?, ?)",
    [note.id, note.userId, note.title, note.content]
  );
}

export function deleteNoteFromFts(id: string) {
  rawSqlite.run("DELETE FROM notes_fts WHERE id = ?", [id]);
}

export function searchNotesFts(userId: string, queryText: string): string[] {
  if (!queryText.trim()) return [];

  // Format queryText to support simple keyword or phrase queries
  const sanitized = queryText
    .replace(/[^\w\s"']/g, "")
    .trim();

  if (!sanitized) return [];

  const sqlQuery = `
    SELECT id FROM notes_fts 
    WHERE user_id = ? AND notes_fts MATCH ? 
    ORDER BY rank LIMIT 100
  `;

  try {
    const stmt = rawSqlite.prepare(sqlQuery);
    const rows = stmt.all(userId, sanitized) as { id: string }[];
    return rows.map((r) => r.id);
  } catch (err) {
    // Fallback if syntax invalid in FTS query
    const fallbackQuery = `"${sanitized.replace(/"/g, '""')}"*`;
    try {
      const stmt = rawSqlite.prepare(sqlQuery);
      const rows = stmt.all(userId, fallbackQuery) as { id: string }[];
      return rows.map((r) => r.id);
    } catch {
      return [];
    }
  }
}
