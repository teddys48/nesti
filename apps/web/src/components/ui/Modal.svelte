<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "lucide-svelte";

  let {
    open = false,
    title = "",
    onclose,
    children,
  }: {
    open: boolean;
    title?: string;
    onclose: () => void;
    children?: Snippet;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
    <div class="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <button
          onclick={onclose}
          class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close modal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 max-h-[80vh] overflow-y-auto">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
