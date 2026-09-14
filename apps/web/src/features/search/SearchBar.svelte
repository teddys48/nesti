<script lang="ts">
  import { Search, X } from "lucide-svelte";

  let {
    value = $bindable(""),
    onsearch,
  }: {
    value?: string;
    onsearch?: (query: string) => void;
  } = $props();

  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onsearch?.(value);
    }, 250);
  }

  function clearSearch() {
    value = "";
    onsearch?.("");
  }
</script>

<div class="relative w-full">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
    <Search class="w-4 h-4" />
  </div>
  <input
    type="text"
    placeholder="Search notes (FTS5 full text)..."
    {value}
    oninput={handleInput}
    class="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 dark:bg-neutral-800 border-none rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
  />
  {#if value}
    <button
      onclick={clearSearch}
      class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
    >
      <X class="w-4 h-4" />
    </button>
  {/if}
</div>
