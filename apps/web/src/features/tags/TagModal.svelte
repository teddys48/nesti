<script lang="ts">
  import Modal from "../../components/ui/Modal.svelte";
  import Input from "../../components/ui/Input.svelte";
  import Button from "../../components/ui/Button.svelte";
  import { Plus, Trash2, Tag } from "lucide-svelte";

  let {
    open = false,
    tags = [],
    onclose,
    oncreateTag,
    ondeleteTag,
  }: {
    open: boolean;
    tags: Array<{ id: string; name: string; color: string }>;
    onclose: () => void;
    oncreateTag: (name: string, color: string) => void;
    ondeleteTag: (id: string) => void;
  } = $props();

  let newTagName = $state("");
  let newTagColor = $state("#3b82f6");

  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4",
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b"
  ];

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    oncreateTag(newTagName.trim(), newTagColor);
    newTagName = "";
  }
</script>

<Modal {open} title="Manage Tags" {onclose}>
  <div class="space-y-6">
    <!-- Create Tag Form -->
    <form onsubmit={handleSubmit} class="space-y-3 bg-gray-50 dark:bg-neutral-950 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800">
      <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Create New Tag</div>
      <div class="flex items-center gap-2">
        <Input placeholder="Tag Name" bind:value={newTagName} class="flex-1" />
        <Button type="submit" variant="primary" size="sm" disabled={!newTagName.trim()}>
          <Plus class="w-4 h-4" />
          <span>Add</span>
        </Button>
      </div>

      <!-- Color Palette Picker -->
      <div class="flex items-center gap-1.5 pt-1">
        <span class="text-xs text-gray-400 mr-1">Color:</span>
        {#each colors as c}
          <button
            type="button"
            aria-label="Select color {c}"
            onclick={() => newTagColor = c}
            class="w-5 h-5 rounded-full transition-transform hover:scale-110 {newTagColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : ''}"
            style="background-color: {c}"
          ></button>
        {/each}
      </div>
    </form>

    <!-- Tag List -->
    <div class="space-y-2">
      <div class="text-xs font-semibold uppercase tracking-wider text-gray-400">Your Tags</div>
      {#if tags.length === 0}
        <p class="text-xs text-gray-400 italic py-2">No tags created yet.</p>
      {:else}
        <div class="divide-y divide-gray-100 dark:divide-neutral-800">
          {#each tags as tag}
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full shadow-2xs" style="background-color: {tag.color}"></span>
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{tag.name}</span>
              </div>
              <Button variant="ghost" size="sm" onclick={() => ondeleteTag(tag.id)}>
                <Trash2 class="w-3.5 h-3.5 text-rose-500" />
              </Button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</Modal>
