<script lang="ts">
  import Input from "../../components/ui/Input.svelte";
  import Button from "../../components/ui/Button.svelte";

  let {
    onsubmit,
    onswitchToLogin,
  }: {
    onsubmit: (username: string, password: string) => Promise<string | void>;
    onswitchToLogin: () => void;
  } = $props();

  let username = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let error = $state("");
  let isSubmitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = "";

    if (password !== confirmPassword) {
      error = "Passwords do not match";
      return;
    }

    if (password.length < 6) {
      error = "Password must be at least 6 characters";
      return;
    }

    isSubmitting = true;
    try {
      const err = await onsubmit(username.trim(), password);
      if (err) error = err;
    } catch (err: any) {
      error = err.message || "Registration failed";
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Account</h1>
      <p class="text-xs text-gray-500 dark:text-gray-400">Start organizing your notes securely</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      {#if error}
        <div class="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs rounded-lg border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      {/if}

      <Input
        label="Username"
        placeholder="Choose a username"
        bind:value={username}
        required
      />

      <Input
        type="password"
        label="Password"
        placeholder="At least 6 characters"
        bind:value={password}
        required
      />

      <Input
        type="password"
        label="Confirm Password"
        placeholder="Repeat password"
        bind:value={confirmPassword}
        required
      />

      <Button type="submit" variant="primary" class="w-full justify-center shadow-md py-2.5" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Register Account"}
      </Button>
    </form>

    <div class="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-neutral-800">
      Already have an account?
      <button onclick={onswitchToLogin} class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1">
        Sign in
      </button>
    </div>
  </div>
</div>
