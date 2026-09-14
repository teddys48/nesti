import { get, set, del, keys } from "idb-keyval";

export interface CachedNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  version: number;
  archivedAt: number | null;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
  tags: Array<{ id: string; name: string; color: string }>;
  pendingSync?: boolean;
}

export interface OfflineAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE" | "RESTORE";
  noteId: string;
  payload: any;
  timestamp: number;
}

const NOTES_CACHE_PREFIX = "note_cache_";
const PENDING_SYNC_KEY = "pending_offline_sync_queue";

function safeString(val: any, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return fallback;
}

function safeNumber(val: any, fallback = 0): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

function safeNullableNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

export function toPlainNote(note: any): CachedNote {
  if (!note || typeof note !== "object") {
    return {
      id: "",
      userId: "",
      title: "",
      content: "",
      version: 1,
      archivedAt: null,
      deletedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };
  }

  const id = safeString(note.id);
  const userId = safeString(note.userId);
  const title = safeString(note.title);
  const content = safeString(note.content);
  const version = safeNumber(note.version, 1);
  const archivedAt = safeNullableNumber(note.archivedAt);
  const deletedAt = safeNullableNumber(note.deletedAt);
  const createdAt = safeNumber(note.createdAt, Date.now());
  const updatedAt = safeNumber(note.updatedAt, Date.now());

  const tags: Array<{ id: string; name: string; color: string }> = [];
  if (note.tags && Array.isArray(note.tags)) {
    for (const t of note.tags) {
      if (t) {
        tags.push({
          id: safeString(t.id),
          name: safeString(t.name),
          color: safeString(t.color, "#3b82f6"),
        });
      }
    }
  }

  return {
    id,
    userId,
    title,
    content,
    version,
    archivedAt,
    deletedAt,
    createdAt,
    updatedAt,
    tags,
  };
}

export async function cacheNotesLocally(notes: CachedNote[]) {
  if (!notes || !Array.isArray(notes)) return;
  for (const note of notes) {
    if (!note) continue;
    try {
      const cleanNote = toPlainNote(note);
      if (cleanNote.id) {
        await set(`${NOTES_CACHE_PREFIX}${cleanNote.id}`, cleanNote);
      }
    } catch (err) {
      console.warn("Could not cache note in IndexedDB:", err);
    }
  }
}

export async function getCachedNote(id: string): Promise<CachedNote | undefined> {
  try {
    return await get(`${NOTES_CACHE_PREFIX}${id}`);
  } catch (err) {
    console.warn("Failed to get cached note:", err);
    return undefined;
  }
}

export async function getAllCachedNotes(): Promise<CachedNote[]> {
  try {
    const allKeys = await keys();
    const noteKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(NOTES_CACHE_PREFIX));
    const results: CachedNote[] = [];
    for (const k of noteKeys) {
      const val = await get<CachedNote>(k);
      if (val) results.push(toPlainNote(val));
    }
    return results;
  } catch (err) {
    console.warn("Failed to get all cached notes:", err);
    return [];
  }
}

export async function queueOfflineAction(action: Omit<OfflineAction, "id" | "timestamp">) {
  try {
    const queue = (await get<OfflineAction[]>(PENDING_SYNC_KEY)) || [];
    let cleanPayload: any = null;
    if (action.payload && typeof action.payload === "object") {
      cleanPayload = toPlainNote(action.payload);
    } else {
      cleanPayload = action.payload;
    }

    const fullAction: OfflineAction = {
      id: crypto.randomUUID(),
      type: action.type,
      noteId: safeString(action.noteId),
      payload: cleanPayload,
      timestamp: Date.now(),
    };
    queue.push(fullAction);
    await set(PENDING_SYNC_KEY, queue);
  } catch (err) {
    console.error("Failed to queue offline action:", err);
  }
}

export async function getPendingSyncQueue(): Promise<OfflineAction[]> {
  try {
    return (await get<OfflineAction[]>(PENDING_SYNC_KEY)) || [];
  } catch {
    return [];
  }
}

export async function clearPendingSyncQueue() {
  try {
    await del(PENDING_SYNC_KEY);
  } catch {}
}


