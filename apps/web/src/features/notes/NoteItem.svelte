<script lang="ts">
  import { Archive, Trash2 } from "lucide-svelte";

  let {
    note,
    selected = false,
    onselect,
  }: {
    note: {
      id: string;
      title: string;
      content: string;
      updatedAt: number;
      archivedAt?: number | null;
      deletedAt?: number | null;
      tags?: Array<{ id: string; name: string; color: string }>;
    };
    selected?: boolean;
    onselect: () => void;
  } = $props();

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function getSnippet(content: string): string {
    if (!content) return "No content";
    // Strip HTML tags for preview snippet
    const text = content.replace(/<[^>]*>/g, "").trim();
    return text || "No content";
  }
</script>

<div
  role="button"
  tabindex="0"
  onclick={onselect}
  onkeydown={(e) => (e.key === "Enter" || e.key === " ") && onselect()}
  class="p-3.5 border-b border-gray-100 dark:border-neutral-800 cursor-pointer transition-all text-left select-none {selected ? 'bg-blue-50/90 dark:bg-indigo-950/60 border-l-4 border-l-blue-600 dark:border-l-indigo-500 shadow-2xs' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/60'}"
>
  <div class="flex items-center justify-between gap-2 mb-1">
    <h4 class="font-semibold text-sm truncate {selected ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}">
      {note.title || "Untitled Note"}
    </h4>
    <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0">
      {formatDate(note.updatedAt)}
    </span>
  </div>

  <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
    {getSnippet(note.content)}
  </p>

  <div class="flex items-center justify-between gap-1">
    {#if note.tags && note.tags.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each note.tags.slice(0, 3) as tag}
          <span
            class="text-[10px] font-medium px-1.5 py-0.5 rounded text-white shadow-2xs"
            style="background-color: {tag.color}"
          >
            {tag.name}
          </span>
        {/each}
        {#if note.tags.length > 3}
          <span class="text-[10px] text-gray-400">+{note.tags.length - 3}</span>
        {/if}
      </div>
    {:else}
      <div></div>
    {/if}

    <div class="flex items-center gap-1">
      {#if note.archivedAt}
        <Archive class="w-3.5 h-3.5 text-amber-500" title="Archived" />
      {/if}
      {#if note.deletedAt}
        <Trash2 class="w-3.5 h-3.5 text-rose-500" title="In Trash" />
      {/if}
    </div>
  </div>
</div>
