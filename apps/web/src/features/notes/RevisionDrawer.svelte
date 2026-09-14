<script lang="ts">
  import Modal from "../../components/ui/Modal.svelte";
  import Button from "../../components/ui/Button.svelte";
  import { History, RotateCcw, Clock } from "lucide-svelte";

  let {
    open = false,
    revisions = [],
    onclose,
    onrestoreRevision,
  }: {
    open: boolean;
    revisions: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: number;
    }>;
    onclose: () => void;
    onrestoreRevision: (revisionId: string) => void;
  } = $props();

  let selectedRevisionId = $state<string | null>(null);

  $effect(() => {
    if (revisions && revisions.length > 0 && !selectedRevisionId) {
      selectedRevisionId = revisions[0].id;
    }
  });

  const selectedRev = $derived(
    revisions.find((r) => r.id === selectedRevisionId) || revisions[0]
  );

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString();
  }
</script>

<Modal {open} title="Version History" {onclose}>
  <div class="space-y-4">
    {#if revisions.length === 0}
      <div class="py-8 text-center text-gray-400 text-sm">
        <History class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No revision snapshots available yet.</p>
        <p class="text-xs text-gray-400 mt-1">Revisions are automatically captured as you make major edits.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Revisions List Column -->
        <div class="border-r border-gray-200 dark:border-neutral-800 pr-2 space-y-1.5 max-h-96 overflow-y-auto">
          <div class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Snapshots</div>
          {#each revisions as rev}
            <button
              onclick={() => selectedRevisionId = rev.id}
              class="w-full text-left p-2.5 rounded-lg border text-xs transition-colors {selectedRevisionId === rev.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'}"
            >
              <div class="flex items-center gap-1.5 text-gray-500 mb-1">
                <Clock class="w-3 h-3" />
                <span>{formatDate(rev.createdAt)}</span>
              </div>
              <div class="truncate font-medium">{rev.title || "Untitled"}</div>
            </button>
          {/each}
        </div>

        <!-- Preview Column -->
        <div class="md:col-span-2 flex flex-col justify-between min-h-[300px] bg-gray-50 dark:bg-neutral-950 p-4 rounded-xl border border-gray-200 dark:border-neutral-800">
          {#if selectedRev}
            <div class="space-y-3 overflow-y-auto max-h-72">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-400">Captured: {formatDate(selectedRev.createdAt)}</span>
              </div>
              <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedRev.title || "Untitled Note"}</h4>
              <div class="prose dark:prose-invert text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {@html selectedRev.content || "<p>Empty revision content</p>"}
              </div>
            </div>

            <div class="pt-4 mt-2 border-t border-gray-200 dark:border-neutral-800 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onclick={() => selectedRev && onrestoreRevision(selectedRev.id)}
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>Restore Snapshot</span>
              </Button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</Modal>
