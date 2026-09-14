<script lang="ts">
  import { FileText, Archive, Trash2, Plus, Tag as TagIcon, Search, Settings } from "lucide-svelte";
  import Button from "../ui/Button.svelte";

  let {
    activeStatus = "active",
    selectedTagId = null,
    tags = [],
    onselectStatus,
    onselectTag,
    onnewNote,
    onopenTagModal,
  }: {
    activeStatus: "active" | "archived" | "trash";
    selectedTagId: string | null;
    tags: Array<{ id: string; name: string; color: string }>;
    onselectStatus: (status: "active" | "archived" | "trash") => void;
    onselectTag: (tagId: string | null) => void;
    onnewNote: () => void;
    onopenTagModal: () => void;
  } = $props();
</script>

<aside class="w-64 bg-gray-50/50 dark:bg-neutral-900/50 border-r border-gray-200 dark:border-neutral-800 flex flex-col h-full select-none">
  <div class="p-4">
    <Button variant="primary" class="w-full justify-center shadow-md" onclick={onnewNote}>
      <Plus class="w-4 h-4" />
      <span>New Note</span>
    </Button>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-2 space-y-6">
    <!-- Views Section -->
    <div>
      <div class="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Views
      </div>
      <div class="space-y-1">
        <button
          onclick={() => { onselectTag(null); onselectStatus("active"); }}
          class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors {activeStatus === 'active' && !selectedTagId ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}"
        >
          <div class="flex items-center gap-2.5">
            <FileText class="w-4 h-4" />
            <span>All Notes</span>
          </div>
        </button>

        <button
          onclick={() => { onselectTag(null); onselectStatus("archived"); }}
          class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors {activeStatus === 'archived' && !selectedTagId ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}"
        >
          <div class="flex items-center gap-2.5">
            <Archive class="w-4 h-4" />
            <span>Archive</span>
          </div>
        </button>

        <button
          onclick={() => { onselectTag(null); onselectStatus("trash"); }}
          class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors {activeStatus === 'trash' && !selectedTagId ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}"
        >
          <div class="flex items-center gap-2.5">
            <Trash2 class="w-4 h-4" />
            <span>Trash</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Tags Section -->
    <div>
      <div class="flex items-center justify-between px-3 mb-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tags</span>
        <button
          onclick={onopenTagModal}
          class="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-800"
          title="Manage Tags"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="space-y-1">
        {#if tags.length === 0}
          <p class="px-3 py-2 text-xs text-gray-400 italic">No tags yet</p>
        {:else}
          {#each tags as tag}
            <button
              onclick={() => onselectTag(tag.id)}
              class="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {selectedTagId === tag.id ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'}"
            >
              <span class="w-2.5 h-2.5 rounded-full" style="background-color: {tag.color}"></span>
              <span class="truncate">{tag.name}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </nav>
</aside>
