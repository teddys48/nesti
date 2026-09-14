<script lang="ts">
  import { CheckCircle2, Loader2, AlertCircle, WifiOff } from "lucide-svelte";

  export type SaveStatus = "saved" | "saving" | "failed" | "offline";

  let { status = "saved" }: { status: SaveStatus } = $props();
</script>

<div class="flex items-center gap-1.5 text-xs font-medium transition-all">
  {#if status === "saving"}
    <span class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
      <Loader2 class="w-3.5 h-3.5 animate-spin" />
      <span>Saving...</span>
    </span>
  {:else if status === "saved"}
    <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 class="w-3.5 h-3.5" />
      <span>Saved</span>
    </span>
  {:else if status === "offline"}
    <span class="flex items-center gap-1 text-slate-500 dark:text-slate-400">
      <WifiOff class="w-3.5 h-3.5" />
      <span>Saved locally (Offline)</span>
    </span>
  {:else if status === "failed"}
    <span class="flex items-center gap-1 text-rose-600 dark:text-rose-400">
      <AlertCircle class="w-3.5 h-3.5" />
      <span>Failed to save</span>
    </span>
  {/if}
</div>
