<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { syncState } from "$lib/sync.svelte";
  import { cacheNotesLocally, getAllCachedNotes, queueOfflineAction } from "$lib/db";
  import Header from "$components/common/Header.svelte";
  import Sidebar from "$components/common/Sidebar.svelte";
  import NoteList from "$features/notes/NoteList.svelte";
  import NoteEditor from "$features/notes/NoteEditor.svelte";
  import RevisionDrawer from "$features/notes/RevisionDrawer.svelte";
  import TagModal from "$features/tags/TagModal.svelte";
  import SettingsModal from "$features/settings/SettingsModal.svelte";
  import LoginView from "$features/auth/LoginView.svelte";
  import SetupAdminView from "$features/auth/SetupAdminView.svelte";
  import type { SaveStatus } from "$features/notes/SaveStatusIndicator.svelte";
  import { FileText, Plus } from "lucide-svelte";

  // Auth & Screen State
  let user = $state<{ id: string; username: string; role?: string } | null>(null);
  let needsSetup = $state(false);
  let isCheckingAuth = $state(true);

  // Data State
  let notes = $state<any[]>([]);
  let tags = $state<any[]>([]);
  let selectedNoteId = $state<string | null>(null);
  let activeStatus = $state<"active" | "archived" | "trash">("active");
  let selectedTagId = $state<string | null>(null);
  let searchQuery = $state("");
  let isLoadingNotes = $state(false);

  // Editor & Autosave State
  let saveStatus = $state<SaveStatus>("saved");
  let autosaveTimer: ReturnType<typeof setTimeout>;

  // Modals & Mobile Sidebar State
  let showTagModal = $state(false);
  let showSettingsModal = $state(false);
  let showRevisionDrawer = $state(false);
  let showMobileSidebar = $state(false);
  let revisionsList = $state<any[]>([]);

  // Active Note Derived State
  const selectedNote = $derived(
    notes.find((n) => n.id === selectedNoteId) || null
  );

  onMount(async () => {
    await checkAuth();
  });

  async function checkAuth() {
    isCheckingAuth = true;
    try {
      // Check setup status (if DB has any users)
      const setupRes = await api.api.auth['setup-status'].get();
      if (setupRes.data && setupRes.data.hasUsers === false) {
        needsSetup = true;
        user = null;
        return;
      } else {
        needsSetup = false;
      }

      const res = await api.api.auth.session.get();
      if (res.data && 'user' in res.data) {
        user = res.data.user;
        await loadInitialData();
      } else {
        user = null;
      }
    } catch {
      user = null;
    } finally {
      isCheckingAuth = false;
    }
  }

  async function handleSetupAdmin(username: string, password: string) {
    try {
      const res = await api.api.auth.register.post({ username, password });
      if (res.error) {
        return (res.error.value as any)?.error?.message || "Setup failed";
      }
      if (res.data && 'user' in res.data) {
        user = res.data.user;
        needsSetup = false;
        await loadInitialData();
      }
    } catch (err: any) {
      return err.message || "Setup failed";
    }
  }

  async function loadInitialData() {
    await Promise.all([fetchTags(), fetchNotes()]);
  }

  async function fetchTags() {
    if (!syncState.isOnline) return;
    try {
      const res = await api.api.tags.get();
      if (res.data && Array.isArray(res.data)) {
        tags = res.data;
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  }

  async function fetchNotes() {
    isLoadingNotes = true;
    try {
      if (!syncState.isOnline) {
        const cached = await getAllCachedNotes();
        notes = cached;
        if (!selectedNoteId && notes.length > 0) {
          selectedNoteId = notes[0].id;
        }
        isLoadingNotes = false;
        return;
      }

      const res = await api.api.notes.get({
        query: {
          status: activeStatus,
          tagId: selectedTagId || undefined,
          search: searchQuery || undefined,
        },
      });

      if (res.data && 'items' in res.data) {
        const fetchedItems = res.data.items;
        try {
          await cacheNotesLocally(fetchedItems);
        } catch (cErr) {
          console.warn("Local caching failed non-fatally:", cErr);
        }
        notes = fetchedItems;
        if (!selectedNoteId && notes.length > 0) {
          selectedNoteId = notes[0].id;
        }
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      isLoadingNotes = false;
    }
  }

  // Handle Note Local & Autosave Update
  function handleEditorChange(updated: { title: string; content: string; tagIds: string[] }) {
    if (!selectedNoteId) return;
    const targetNoteId = selectedNoteId;

    // 1. Immediate local state update
    notes = notes.map((n) => {
      if (n.id === targetNoteId) {
        return {
          ...n,
          title: updated.title,
          content: updated.content,
          tags: tags.filter((t) => updated.tagIds.includes(t.id)),
          updatedAt: Date.now(),
        };
      }
      return n;
    });

    saveStatus = "saving";
    clearTimeout(autosaveTimer);

    // 2. Debounced API sync (~750ms)
    autosaveTimer = setTimeout(async () => {
      if (!syncState.isOnline) {
        await queueOfflineAction({
          type: "UPDATE",
          noteId: targetNoteId,
          payload: updated,
        });
        saveStatus = "offline";
        return;
      }

      try {
        const noteObj = notes.find((n) => n.id === targetNoteId);
        const currentVersion = noteObj?.version || 1;
        const res = await api.api.notes({ id: targetNoteId }).patch({
          title: updated.title,
          content: updated.content,
          tagIds: updated.tagIds,
          version: currentVersion,
        });

        if (res.data) {
          notes = notes.map((n) => (n.id === targetNoteId ? { ...n, ...res.data } : n));
          saveStatus = "saved";
        } else {
          saveStatus = "failed";
          // Self-healing recovery: if version mismatch occurred, fetch latest note from server
          try {
            const refreshed = await api.api.notes({ id: targetNoteId }).get();
            if (refreshed.data && 'id' in refreshed.data) {
              notes = notes.map((n) => (n.id === targetNoteId ? refreshed.data : n));
            }
          } catch {
            // ignore
          }
        }
      } catch {
        saveStatus = "failed";
      }
    }, 750);
  }

  // Note CRUD Actions with Optimistic UI updates
  async function handleCreateNote() {
    const tempId = crypto.randomUUID();
    const newNoteObj = {
      id: tempId,
      userId: user?.id || "",
      title: "Untitled Note",
      content: "",
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };

    // Optimistic insert
    notes = [newNoteObj, ...notes];
    selectedNoteId = tempId;

    if (!syncState.isOnline) {
      await queueOfflineAction({
        type: "CREATE",
        noteId: tempId,
        payload: { title: "Untitled Note", content: "" },
      });
      return;
    }

    try {
      const res = await api.api.notes.post({
        title: "Untitled Note",
        content: "",
      });
      if (res.data && 'id' in res.data) {
        // Replace temp note with server note
        notes = notes.map((n) => (n.id === tempId ? res.data : n));
        selectedNoteId = res.data.id;
      }
    } catch (err) {
      console.error("Failed to create note on server:", err);
    }
  }

  async function handleArchiveNote() {
    if (!selectedNoteId) return;
    const targetId = selectedNoteId;

    // Optimistic update
    notes = notes.filter((n) => n.id !== targetId);
    selectedNoteId = notes.length > 0 ? notes[0].id : null;

    try {
      await api.api.notes({ id: targetId }).archive.post();
    } catch (err) {
      fetchNotes();
    }
  }

  async function handleUnarchiveNote() {
    if (!selectedNoteId) return;
    const targetId = selectedNoteId;

    notes = notes.filter((n) => n.id !== targetId);
    selectedNoteId = notes.length > 0 ? notes[0].id : null;

    try {
      await api.api.notes({ id: targetId }).unarchive.post();
    } catch (err) {
      fetchNotes();
    }
  }

  async function handleTrashNote() {
    if (!selectedNoteId) return;
    const targetId = selectedNoteId;

    notes = notes.filter((n) => n.id !== targetId);
    selectedNoteId = notes.length > 0 ? notes[0].id : null;

    try {
      await api.api.notes({ id: targetId }).delete();
    } catch (err) {
      fetchNotes();
    }
  }

  async function handleRestoreNote() {
    if (!selectedNoteId) return;
    const targetId = selectedNoteId;

    notes = notes.filter((n) => n.id !== targetId);
    selectedNoteId = notes.length > 0 ? notes[0].id : null;

    try {
      await api.api.notes({ id: targetId }).restore.post();
    } catch (err) {
      fetchNotes();
    }
  }

  async function handleDeletePermanent() {
    if (!selectedNoteId) return;
    const targetId = selectedNoteId;

    notes = notes.filter((n) => n.id !== targetId);
    selectedNoteId = notes.length > 0 ? notes[0].id : null;

    try {
      await api.api.notes({ id: targetId }).permanent.delete();
    } catch (err) {
      fetchNotes();
    }
  }

  // Tag Actions
  async function handleCreateTag(name: string, color: string) {
    try {
      const res = await api.api.tags.post({ name, color });
      if (res.data) {
        tags = [...tags, res.data];
      }
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  }

  async function handleDeleteTag(tagId: string) {
    tags = tags.filter((t) => t.id !== tagId);
    try {
      await api.api.tags({ id: tagId }).delete();
      await fetchNotes();
    } catch (err) {
      fetchTags();
    }
  }

  // Revisions Actions
  async function handleOpenRevisions() {
    if (!selectedNoteId) return;
    try {
      const res = await api.api.notes({ id: selectedNoteId }).revisions.get();
      if (res.data && Array.isArray(res.data)) {
        revisionsList = res.data;
        showRevisionDrawer = true;
      }
    } catch (err) {
      console.error("Failed to fetch revisions:", err);
    }
  }

  async function handleRestoreRevision(revisionId: string) {
    if (!selectedNoteId) return;
    try {
      const res = await api.api.notes({ id: selectedNoteId }).revisions({ revisionId }).restore.post();
      if (res.data) {
        notes = notes.map((n) => (n.id === selectedNoteId ? res.data : n));
        showRevisionDrawer = false;
      }
    } catch (err) {
      console.error("Failed to restore revision:", err);
    }
  }

  // Auth Handlers
  async function handleLogin(u: string, p: string) {
    const res = await api.api.auth.login.post({ username: u, password: p });
    if (res.error) {
      return (res.error.value as any)?.error?.message || "Login failed";
    }
    await checkAuth();
  }

  async function handleRegister(u: string, p: string) {
    const res = await api.api.auth.register.post({ username: u, password: p });
    if (res.error) {
      return (res.error.value as any)?.error?.message || "Registration failed";
    }
    await checkAuth();
  }

  async function handleLogout() {
    await api.api.auth.logout.post();
    user = null;
  }

  async function handleChangePassword(curr: string, next: string): Promise<boolean> {
    const res = await api.api.auth["change-password"].post({
      currentPassword: curr,
      newPassword: next,
    });
    return !res.error;
  }

  async function handleDeleteAccount() {
    await api.api.auth.account.delete();
    user = null;
  }

  // Keyboard Shortcuts
  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      handleCreateNote();
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if isCheckingAuth}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
    <div class="animate-pulse font-semibold text-gray-400">Loading Notes...</div>
  </div>
{:else if needsSetup}
  <SetupAdminView onsubmit={handleSetupAdmin} />
{:else if !user}
  <LoginView onsubmit={handleLogin} />
{:else}
  <!-- Main Application Workspace Shell -->
  <div class="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-neutral-950">
    <Header
      {user}
      onlogout={handleLogout}
      onopenSettings={() => showSettingsModal = true}
      ontoggleSidebar={() => showMobileSidebar = !showMobileSidebar}
    />

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Desktop & Mobile Sidebar -->
      <div class="hidden md:block h-full">
        <Sidebar
          {activeStatus}
          {selectedTagId}
          {tags}
          onselectStatus={(st) => { activeStatus = st; fetchNotes(); }}
          onselectTag={(tId) => { selectedTagId = tId; fetchNotes(); }}
          onnewNote={handleCreateNote}
          onopenTagModal={() => showTagModal = true}
        />
      </div>

      {#if showMobileSidebar}
        <div class="md:hidden absolute inset-0 z-40 flex">
          <div class="w-64 h-full z-50 bg-white dark:bg-neutral-900 shadow-2xl">
            <Sidebar
              {activeStatus}
              {selectedTagId}
              {tags}
              onselectStatus={(st) => { activeStatus = st; showMobileSidebar = false; fetchNotes(); }}
              onselectTag={(tId) => { selectedTagId = tId; showMobileSidebar = false; fetchNotes(); }}
              onnewNote={() => { handleCreateNote(); showMobileSidebar = false; }}
              onopenTagModal={() => { showTagModal = true; showMobileSidebar = false; }}
            />
          </div>
          <button
            onclick={() => showMobileSidebar = false}
            class="flex-1 bg-black/40 backdrop-blur-xs"
            aria-label="Close Mobile Navigation Overlay"
          ></button>
        </div>
      {/if}

      <!-- Note List Column -->
      <NoteList
        {notes}
        {selectedNoteId}
        {searchQuery}
        loading={isLoadingNotes}
        onselectNote={(id) => selectedNoteId = id}
        onsearch={(q) => { searchQuery = q; fetchNotes(); }}
        class={selectedNote ? 'hidden md:flex' : 'flex'}
      />

      <!-- Main Editor Canvas -->
      {#if selectedNote}
        {#key selectedNote.id}
          <NoteEditor
            note={selectedNote}
            availableTags={tags}
            {saveStatus}
            onchange={handleEditorChange}
            onarchive={handleArchiveNote}
            onunarchive={handleUnarchiveNote}
            ontrash={handleTrashNote}
            onrestore={handleRestoreNote}
            ondeletePermanent={handleDeletePermanent}
            onopenRevisions={handleOpenRevisions}
            onback={() => selectedNoteId = null}
          />
        {/key}
      {:else}
        <div class="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-gray-600 bg-white dark:bg-neutral-900 select-none">
          <FileText class="w-16 h-16 mb-4 stroke-[1.2]" />
          <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">No Note Selected</h3>
          <p class="text-xs text-gray-400 mt-1 mb-4">Select a note from the list or create a brand new note.</p>
          <button
            onclick={handleCreateNote}
            class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus class="w-4 h-4" />
            <span>Create New Note</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Modals & Drawers -->
  <TagModal
    open={showTagModal}
    {tags}
    onclose={() => showTagModal = false}
    oncreateTag={handleCreateTag}
    ondeleteTag={handleDeleteTag}
  />

  <SettingsModal
    open={showSettingsModal}
    currentUser={user}
    onclose={() => showSettingsModal = false}
    onchangePassword={handleChangePassword}
    ondeleteAccount={handleDeleteAccount}
  />

  <RevisionDrawer
    open={showRevisionDrawer}
    revisions={revisionsList}
    onclose={() => showRevisionDrawer = false}
    onrestoreRevision={handleRestoreRevision}
  />
{/if}
