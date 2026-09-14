<script lang="ts">
  import Modal from "../../components/ui/Modal.svelte";
  import Input from "../../components/ui/Input.svelte";
  import Button from "../../components/ui/Button.svelte";
  import { Shield, KeyRound, Trash2, CheckCircle2, UserPlus, Users, UserX, User, ShieldCheck } from "lucide-svelte";
  import { api } from "../../lib/api";

  let {
    open = false,
    currentUser = null,
    onclose,
    onchangePassword,
    ondeleteAccount,
  }: {
    open: boolean;
    currentUser?: { id: string; username: string; role?: string } | null;
    onclose: () => void;
    onchangePassword: (current: string, next: string) => Promise<boolean>;
    ondeleteAccount: () => void;
  } = $props();

  // Tab State
  let activeTab = $state<"users" | "account">("users");

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let passwordError = $state("");
  let passwordSuccess = $state(false);
  let isSubmitting = $state(false);
  let showConfirmDelete = $state(false);

  // Admin User Management State
  let usersList = $state<Array<{ id: string; username: string; role: string; createdAt: number }>>([]);
  let isLoadingUsers = $state(false);
  let newUsername = $state("");
  let newPasswordInput = $state("");
  let newRole = $state("user");
  let adminError = $state("");
  let adminSuccess = $state("");
  let isCreatingUser = $state(false);

  $effect(() => {
    if (open) {
      if (currentUser?.role === "admin") {
        fetchUsers();
      } else {
        activeTab = "account";
      }
    }
  });

  async function fetchUsers() {
    isLoadingUsers = true;
    try {
      const res = await api.api.auth.admin.users.get();
      if (res.data && 'users' in res.data) {
        usersList = res.data.users as any;
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      isLoadingUsers = false;
    }
  }

  async function handleAdminCreateUser(e: Event) {
    e.preventDefault();
    adminError = "";
    adminSuccess = "";

    if (!newUsername.trim() || !newPasswordInput) return;
    if (newPasswordInput.length < 6) {
      adminError = "Password must be at least 6 characters long";
      return;
    }

    isCreatingUser = true;
    try {
      const res = await api.api.auth.admin.users.post({
        username: newUsername.trim(),
        password: newPasswordInput,
        role: newRole,
      });

      if (res.error) {
        adminError = (res.error.value as any)?.error?.message || "Failed to create user";
      } else {
        adminSuccess = `User "${newUsername.trim()}" created successfully!`;
        newUsername = "";
        newPasswordInput = "";
        newRole = "user";
        fetchUsers();
      }
    } catch (err: any) {
      adminError = err.message || "Failed to create user";
    } finally {
      isCreatingUser = false;
    }
  }

  async function handleDeleteUser(targetId: string, targetName: string) {
    if (!confirm(`Are you sure you want to delete user "${targetName}"?`)) return;
    try {
      const res = await api.api.auth.admin.users({ id: targetId }).delete();
      if (res.error) {
        alert((res.error.value as any)?.error?.message || "Failed to delete user");
      } else {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  }

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

<Modal {open} title="Settings" {onclose}>
  <div class="space-y-5">
    <!-- Admin Navigation Tabs -->
    {#if currentUser?.role === "admin"}
      <div class="flex p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
        <button
          onclick={() => activeTab = "users"}
          class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-all {activeTab === 'users' ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
        >
          <Users class="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onclick={() => activeTab = "account"}
          class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-all {activeTab === 'account' ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
        >
          <KeyRound class="w-4 h-4" />
          <span>Account Security</span>
        </button>
      </div>
    {/if}

    <!-- TAB 1: User Management (Admin Only) -->
    {#if currentUser?.role === "admin" && activeTab === "users"}
      <div class="space-y-5">
        {#if adminSuccess}
          <div class="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 shrink-0" />
            <span>{adminSuccess}</span>
          </div>
        {/if}

        {#if adminError}
          <div class="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
            {adminError}
          </div>
        {/if}

        <!-- Add User Form -->
        <form onsubmit={handleAdminCreateUser} class="space-y-3.5 bg-gray-50 dark:bg-neutral-950/60 p-4 rounded-xl border border-gray-200/80 dark:border-neutral-800">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Create New Account</span>
            </h4>
            <span class="text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md">
              ADMIN ROLE
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Username" placeholder="New username" bind:value={newUsername} required />
            <Input type="password" label="Password" placeholder="Min 6 characters" bind:value={newPasswordInput} required />
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-3 text-xs">
              <span class="font-medium text-gray-600 dark:text-gray-400">Assign Role:</span>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="role" value="user" bind:group={newRole} class="text-indigo-600 focus:ring-indigo-500" />
                <span class="text-gray-700 dark:text-gray-300">User</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="role" value="admin" bind:group={newRole} class="text-indigo-600 focus:ring-indigo-500" />
                <span class="text-indigo-600 dark:text-indigo-400 font-semibold">Admin</span>
              </label>
            </div>

            <Button type="submit" variant="primary" size="sm" disabled={isCreatingUser}>
              {isCreatingUser ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>

        <!-- Existing Users List -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span>All Registered Users ({usersList.length})</span>
          </div>

          {#if isLoadingUsers}
            <div class="text-xs text-gray-400 p-4 text-center animate-pulse">Loading user directory...</div>
          {:else if usersList.length === 0}
            <div class="text-xs text-gray-400 p-4 text-center border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl">
              No users found.
            </div>
          {:else}
            <div class="divide-y divide-gray-100 dark:divide-neutral-800/80 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-2xs">
              {#each usersList as u}
                <div class="p-3 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-neutral-850 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center uppercase">
                      {u.username.substring(0, 2)}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-sm text-gray-900 dark:text-gray-100">{u.username}</span>
                        <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider {u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400'}">
                          {u.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {#if u.id !== currentUser.id}
                    <button
                      onclick={() => handleDeleteUser(u.id, u.username)}
                      class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete User"
                    >
                      <UserX class="w-4 h-4" />
                    </button>
                  {:else}
                    <span class="text-[10px] italic text-gray-400">Current User</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- TAB 2: Account Security (All Users) -->
    {#if currentUser?.role !== "admin" || activeTab === "account"}
      <div class="space-y-6">
        <!-- Change Password Section -->
        <form onsubmit={handlePasswordSubmit} class="space-y-3.5">
          <div class="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-neutral-800 pb-2">
            <KeyRound class="w-4 h-4 text-indigo-500" />
            <span>Change Password</span>
          </div>

          {#if passwordSuccess}
            <div class="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 class="w-4 h-4 shrink-0" />
              <span>Password changed successfully!</span>
            </div>
          {/if}

          <Input type="password" label="Current Password" bind:value={currentPassword} required />
          <Input type="password" label="New Password" bind:value={newPassword} required />
          <Input type="password" label="Confirm New Password" bind:value={confirmPassword} error={passwordError} required />

          <div class="flex justify-end pt-1">
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>

        <!-- Danger Zone: Delete Account -->
        <div class="border-t border-rose-200 dark:border-rose-950/60 pt-4 space-y-3">
          <div class="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            <Shield class="w-4 h-4" />
            <span>Danger Zone</span>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Deleting your account will permanently remove all your notes, tags, and revisions. This action cannot be undone.
          </p>

          {#if !showConfirmDelete}
            <Button variant="danger" size="sm" onclick={() => showConfirmDelete = true}>
              <Trash2 class="w-4 h-4" />
              <span>Delete My Account</span>
            </Button>
          {:else}
            <div class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3">
              <p class="text-xs font-semibold text-rose-700 dark:text-rose-300">Are you absolutely sure you want to delete your account?</p>
              <div class="flex items-center gap-2">
                <Button variant="danger" size="sm" onclick={ondeleteAccount}>Yes, Delete Account</Button>
                <Button variant="ghost" size="sm" onclick={() => showConfirmDelete = false}>Cancel</Button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</Modal>

