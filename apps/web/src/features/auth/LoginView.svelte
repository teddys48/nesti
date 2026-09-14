<script lang="ts">
  import Input from "../../components/ui/Input.svelte";
  import Button from "../../components/ui/Button.svelte";
  import { Lock, User } from "lucide-svelte";

  let {
    onsubmit,
    onswitchToRegister,
  }: {
    onsubmit: (username: string, password: string) => Promise<string | void>;
    onswitchToRegister: () => void;
  } = $props();

  let username = $state("");
  let password = $state("");
  let error = $state("");
  let isSubmitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = "";
    if (!username.trim() || !password) return;

    isSubmitting = true;
    try {
      const err = await onsubmit(username.trim(), password);
      if (err) error = err;
    } catch (err: any) {
      error = err.message || "Login failed";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
  <div class="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 space-y-6">
    <div class="text-center space-y-2">
      <div class="w-12 h-12 bg-indigo-600 text-white rounded-xl mx-auto flex items-center justify-center text-xl font-bold shadow-md">
        N
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome to Nesti</h1>
      <p class="text-xs text-gray-500 dark:text-gray-400">Sign in to access your notes on Nesti</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      {#if error}
        <div class="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs rounded-lg border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      {/if}

      <Input
        label="Username"
        placeholder="Enter your username"
        bind:value={username}
        required
      />

      <Input
        type="password"
        label="Password"
        placeholder="Enter your password"
        bind:value={password}
        required
      />

      <Button type="submit" variant="primary" class="w-full justify-center shadow-md py-2.5" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>

    <div class="text-center text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-neutral-800">
      Self-hosted Nesti App • Admin manages user accounts
    </div>
  </div>
</div>
