<script lang="ts">
  let {
    value = $bindable(""),
    placeholder = "",
    type = "text",
    label = "",
    error = "",
    disabled = false,
    id = "",
    class: customClass = "",
    oninput,
    ...rest
  }: {
    value?: string;
    placeholder?: string;
    type?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    id?: string;
    class?: string;
    oninput?: (e: Event) => void;
    [key: string]: any;
  } = $props();

  const inputId = $derived(id || `input-${Math.random().toString(36).substring(2, 9)}`);
</script>

<div class="w-full flex flex-col gap-1.5">
  {#if label}
    <label for={inputId} class="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
      {label}
    </label>
  {/if}
  <input
    id={inputId}
    {type}
    {placeholder}
    {disabled}
    bind:value
    {oninput}
    class="w-full px-3.5 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 rounded-lg shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-neutral-950 {error ? 'border-rose-500 focus:ring-rose-500' : ''} {customClass}"
    {...rest}
  />
  {#if error}
    <span class="text-xs text-rose-500">{error}</span>
  {/if}
</div>
