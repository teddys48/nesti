<script lang="ts">
  import NoteItem from "./NoteItem.svelte";
  import SearchBar from "../search/SearchBar.svelte";
  import { FileText, Inbox } from "lucide-svelte";

  let {
    notes = [],
    selectedNoteId = null,
    searchQuery = "",
    loading = false,
    onselectNote,
    onsearch,
    class: customClass = "",
  }: {
    notes: any[];
    selectedNoteId: string | null;
    searchQuery?: string;
    loading?: boolean;
    onselectNote: (id: string) => void;
    onsearch: (query: string) => void;
    class?: string;
  } = $props();
</script>

<div class="w-full md:w-80 border-r border-gray-200 dark:border-neutral-800 flex flex-col h-full bg-white dark:bg-neutral-900 shrink-0 {customClass}">
  <div class="p-3 border-b border-gray-200 dark:border-neutral-800">
    <SearchBar value={searchQuery} {onsearch} />
  </div>

  <div class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800">
    {#if loading}
      <div class="p-4 space-y-3">
        {#each Array(4) as _}
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4"></div>
            <div class="h-3 bg-gray-100 dark:bg-neutral-800/60 rounded w-full"></div>
            <div class="h-3 bg-gray-100 dark:bg-neutral-800/60 rounded w-1/2"></div>
          </div>
        {/each}
      </div>
    {:else if notes.length === 0}
      <div class="flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-gray-500 h-64">
        <Inbox class="w-10 h-10 mb-2 stroke-[1.5]" />
        <p class="text-sm font-medium">No notes found</p>
        <p class="text-xs text-gray-400 mt-1">Create a new note or adjust search filters.</p>
      </div>
    {:else}
      {#each notes as note (note.id)}
        <NoteItem
          {note}
          selected={Boolean(selectedNoteId && String(selectedNoteId) === String(note.id))}
          onselect={() => onselectNote(note.id)}
        />
      {/each}
    {/if}
  </div>
</div>
