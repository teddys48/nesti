<script lang="ts">
  import Modal from "../../components/ui/Modal.svelte";
  import Input from "../../components/ui/Input.svelte";
  import Button from "../../components/ui/Button.svelte";
  import { Shield, KeyRound, Trash2, CheckCircle2 } from "lucide-svelte";

  let {
    open = false,
    onclose,
    onchangePassword,
    ondeleteAccount,
  }: {
    open: boolean;
    onclose: () => void;
    onchangePassword: (current: string, next: string) => Promise<boolean>;
    ondeleteAccount: () => void;
  } = $props();

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let passwordError = $state("");
  let passwordSuccess = $state(false);
  let isSubmitting = $state(false);
  let showConfirmDelete = $state(false);

  async function handlePasswordSubmit(e: Event) {
    e.preventDefault();
    passwordError = "";
    passwordSuccess = false;

    if (newPassword !== confirmPassword) {
      passwordError = "New passwords do not match";
      return;
    }

    if (newPassword.length < 6) {
      passwordError = "Password must be at least 6 characters long";
      return;
    }

    isSubmitting = true;
    try {
      const ok = await onchangePassword(currentPassword, newPassword);
      if (ok) {
        passwordSuccess = true;
        currentPassword = "";
        newPassword = "";
        confirmPassword = "";
      } else {
        passwordError = "Failed to update password. Check current password.";
      }
    } catch (err: any) {
      passwordError = err.message || "Failed to update password";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal {open} title="Account Settings" {onclose}>
  <div class="space-y-6">
    <!-- Change Password Section -->
    <form onsubmit={handlePasswordSubmit} class="space-y-3">
      <div class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-neutral-800 pb-2">
        <KeyRound class="w-4 h-4 text-indigo-500" />
        <span>Change Password</span>
      </div>

      {#if passwordSuccess}
        <div class="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4" />
          <span>Password changed successfully!</span>
        </div>
      {/if}

      <Input type="password" label="Current Password" bind:value={currentPassword} required />
      <Input type="password" label="New Password" bind:value={newPassword} required />
      <Input type="password" label="Confirm New Password" bind:value={confirmPassword} error={passwordError} required />

      <div class="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>

    <!-- Danger Zone: Delete Account -->
    <div class="border-t border-rose-200 dark:border-rose-950/50 pt-4 space-y-3">
      <div class="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
        <Shield class="w-4 h-4" />
        <span>Danger Zone</span>
      </div>

      <p class="text-xs text-gray-500 dark:text-gray-400">
        Deleting your account will permanently remove all your notes, tags, and revisions. This action cannot be undone.
      </p>

      {#if !showConfirmDelete}
        <Button variant="danger" size="sm" onclick={() => showConfirmDelete = true}>
          <Trash2 class="w-4 h-4" />
          <span>Delete Account</span>
        </Button>
      {:else}
        <div class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg space-y-3">
          <p class="text-xs font-semibold text-rose-700 dark:text-rose-300">Are you absolutely sure?</p>
          <div class="flex items-center gap-2">
            <Button variant="danger" size="sm" onclick={ondeleteAccount}>Yes, Delete Everything</Button>
            <Button variant="ghost" size="sm" onclick={() => showConfirmDelete = false}>Cancel</Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</Modal>
