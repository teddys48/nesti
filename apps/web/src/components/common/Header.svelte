<script lang="ts">
  import { Sun, Moon, Laptop, Wifi, WifiOff, LogOut, Settings, User } from "lucide-svelte";
  import { themeState, type ThemeMode } from "$lib/theme.svelte";
  import { syncState } from "$lib/sync.svelte";
  import Button from "../ui/Button.svelte";

  let {
    user,
    onlogout,
    onopenSettings,
    ontoggleSidebar,
  }: {
    user?: { username: string } | null;
    onlogout?: () => void;
    onopenSettings?: () => void;
    ontoggleSidebar?: () => void;
  } = $props();

  function cycleTheme() {
    const modes: ThemeMode[] = ["system", "light", "dark"];
    const nextIndex = (modes.indexOf(themeState.currentMode) + 1) % modes.length;
    themeState.setTheme(modes[nextIndex]);
  }
</script>

<header class="h-14 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
  <div class="flex items-center gap-3">
    <button
      onclick={ontoggleSidebar}
      class="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
      aria-label="Toggle Navigation Sidebar"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <div class="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-gray-100">
      <span class="bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm font-extrabold">N</span>
      <span>Nesti</span>
    </div>
  </div>

  <div class="flex items-center gap-3">
    <!-- Network Sync Status -->
    <div class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full {syncState.isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}">
      {#if syncState.isOnline}
        <Wifi class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Online</span>
      {:else}
        <WifiOff class="w-3.5 h-3.5" />
        <span>Offline</span>
      {/if}
    </div>

    <!-- Theme Switcher Button -->
    <button
      onclick={cycleTheme}
      class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      title="Current theme: {themeState.currentMode}"
    >
      {#if themeState.currentMode === "dark"}
        <Moon class="w-4 h-4 text-indigo-400" />
      {:else if themeState.currentMode === "light"}
        <Sun class="w-4 h-4 text-amber-500" />
      {:else}
        <Laptop class="w-4 h-4" />
      {/if}
    </button>

    {#if user}
      <button
        onclick={onopenSettings}
        class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        title="Settings"
      >
        <Settings class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-neutral-800">
        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">{user.username}</span>
        <Button variant="ghost" size="sm" onclick={onlogout} title="Logout">
          <LogOut class="w-4 h-4" />
        </Button>
      </div>
    {/if}
  </div>
</header>
