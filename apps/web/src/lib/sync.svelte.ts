import { api } from "./api";
import { getPendingSyncQueue, clearPendingSyncQueue, type OfflineAction } from "./db";

class NetworkSyncState {
  isOnline = $state<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  isSyncing = $state<boolean>(false);
  lastSyncTime = $state<number | null>(null);

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.processSyncQueue();
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
      });
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const queue = await getPendingSyncQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      for (const action of queue) {
        try {
          if (action.type === "UPDATE") {
            await api.api.notes({ id: action.noteId }).patch(action.payload);
          } else if (action.type === "CREATE") {
            await api.api.notes.post(action.payload);
          } else if (action.type === "DELETE") {
            await api.api.notes({ id: action.noteId }).delete();
          } else if (action.type === "ARCHIVE") {
            await api.api.notes({ id: action.noteId }).archive.post();
          } else if (action.type === "RESTORE") {
            await api.api.notes({ id: action.noteId }).restore.post();
          }
        } catch (err) {
          console.error("Failed to sync action:", action, err);
        }
      }

      await clearPendingSyncQueue();
      this.lastSyncTime = Date.now();
    } catch (err) {
      console.error("Error processing sync queue:", err);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncState = new NetworkSyncState();
