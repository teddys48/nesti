<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Link from "@tiptap/extension-link";
  import {
    Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Code, Terminal, Link as LinkIcon,
    Archive, ArchiveRestore, Trash2, RotateCcw, History, Tag, X, ChevronLeft
  } from "lucide-svelte";
  import SaveStatusIndicator, { type SaveStatus } from "./SaveStatusIndicator.svelte";
  import Button from "../../components/ui/Button.svelte";

  let {
    note,
    availableTags = [],
    saveStatus = "saved",
    onchange,
    onarchive,
    onunarchive,
    ontrash,
    onrestore,
    ondeletePermanent,
    onopenRevisions,
    onback,
  }: {
    note: {
      id: string;
      title: string;
      content: string;
      version: number;
      archivedAt?: number | null;
      deletedAt?: number | null;
      tags?: Array<{ id: string; name: string; color: string }>;
    };
    availableTags: Array<{ id: string; name: string; color: string }>;
    saveStatus: SaveStatus;
    onchange: (updated: { title: string; content: string; tagIds: string[] }) => void;
    onarchive: () => void;
    onunarchive: () => void;
    ontrash: () => void;
    onrestore: () => void;
    ondeletePermanent: () => void;
    onopenRevisions: () => void;
    onback?: () => void;
  } = $props();

  let element: HTMLDivElement;
  let editor: Editor | null = $state(null);
  let title = $state("");
  let selectedTagIds = $state<string[]>([]);
  let showTagDropdown = $state(false);

  // Sync state when note prop changes
  $effect(() => {
    if (note) {
      title = note.title || "";
      selectedTagIds = note.tags ? note.tags.map((t) => t.id) : [];
      if (editor && editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || "");
      }
    }
  });

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
        }),
      ],
      content: note?.content || "",
      onUpdate: () => {
        triggerChange();
      },
    });
  });

  onDestroy(() => {
    if (editor) editor.destroy();
  });

  function triggerChange() {
    if (!editor) return;
    onchange({
      title,
      content: editor.getHTML(),
      tagIds: selectedTagIds,
    });
  }

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
    } else {
      selectedTagIds = [...selectedTagIds, tagId];
    }
    triggerChange();
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }
</script>

<div class="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
  <!-- Top Editor Toolbar & Actions Header -->
  <div class="p-3 border-b border-gray-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-neutral-900/50">
    <div class="flex items-center gap-2">
      {#if onback}
        <Button variant="ghost" size="sm" onclick={onback} class="md:hidden" title="Back to Notes List">
          <ChevronLeft class="w-4 h-4" />
          <span>Back</span>
        </Button>
      {/if}
      <SaveStatusIndicator status={saveStatus} />
    </div>

    <!-- Note Action Buttons -->
    <div class="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" onclick={onopenRevisions} title="Version History">
        <History class="w-4 h-4" />
        <span class="hidden sm:inline">History</span>
      </Button>

      {#if note.deletedAt}
        <Button variant="outline" size="sm" onclick={onrestore}>
          <RotateCcw class="w-4 h-4 text-emerald-600" />
          <span>Restore</span>
        </Button>
        <Button variant="danger" size="sm" onclick={ondeletePermanent}>
          <Trash2 class="w-4 h-4" />
          <span>Delete Permanently</span>
        </Button>
      {:else if note.archivedAt}
        <Button variant="outline" size="sm" onclick={onunarchive}>
          <ArchiveRestore class="w-4 h-4" />
          <span>Unarchive</span>
        </Button>
        <Button variant="ghost" size="sm" onclick={ontrash}>
          <Trash2 class="w-4 h-4 text-rose-500" />
        </Button>
      {:else}
        <Button variant="ghost" size="sm" onclick={onarchive} title="Archive Note">
          <Archive class="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onclick={ontrash} title="Move to Trash">
          <Trash2 class="w-4 h-4 text-rose-500" />
        </Button>
      {/if}
    </div>
  </div>

  <!-- Formatting Toolbar -->
  {#if editor}
    <div class="px-3 py-1.5 border-b border-gray-100 dark:border-neutral-800/80 flex flex-wrap items-center gap-1 bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400 text-xs">
      <button
        onclick={() => editor?.chain().focus().toggleBold().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Bold"
      >
        <Bold class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleItalic().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Italic"
      >
        <Italic class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleStrike().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('strike') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Strikethrough"
      >
        <Strikethrough class="w-3.5 h-3.5" />
      </button>

      <span class="w-px h-4 bg-gray-200 dark:bg-neutral-800 mx-1"></span>

      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Heading 1"
      >
        <Heading1 class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Heading 2"
      >
        <Heading2 class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Heading 3"
      >
        <Heading3 class="w-3.5 h-3.5" />
      </button>

      <span class="w-px h-4 bg-gray-200 dark:bg-neutral-800 mx-1"></span>

      <button
        onclick={() => editor?.chain().focus().toggleBulletList().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Bullet List"
      >
        <List class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleOrderedList().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Ordered List"
      >
        <ListOrdered class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleBlockquote().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('blockquote') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Blockquote"
      >
        <Quote class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleCode().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('code') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Inline Code"
      >
        <Code class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('codeBlock') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Code Block"
      >
        <Terminal class="w-3.5 h-3.5" />
      </button>
      <button
        onclick={setLink}
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 {editor.isActive('link') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-bold' : ''}"
        title="Link"
      >
        <LinkIcon class="w-3.5 h-3.5" />
      </button>
    </div>
  {/if}

  <!-- Main Note Content Canvas -->
  <div class="flex-1 overflow-y-auto px-4 sm:px-8 md:px-10 py-6 w-full max-w-5xl space-y-4">
    <!-- Title Input -->
    <input
      type="text"
      placeholder="Note Title"
      bind:value={title}
      oninput={triggerChange}
      class="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700"
    />

    <!-- Tags Row -->
    <div class="flex flex-wrap items-center gap-1.5 relative">
      {#each availableTags.filter(t => selectedTagIds.includes(t.id)) as tag}
        <span
          class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded text-white shadow-2xs"
          style="background-color: {tag.color}"
        >
          {tag.name}
          <button onclick={() => toggleTag(tag.id)} class="hover:opacity-80">
            <X class="w-3 h-3" />
          </button>
        </span>
      {/each}

      <div class="relative">
        <button
          onclick={() => showTagDropdown = !showTagDropdown}
          class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-0.5 rounded border border-dashed border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <Tag class="w-3 h-3" />
          <span>Add Tag</span>
        </button>

        {#if showTagDropdown}
          <div class="absolute left-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl p-2 z-30 max-h-48 overflow-y-auto">
            {#if availableTags.length === 0}
              <p class="text-xs text-gray-400 p-1">No tags created yet.</p>
            {:else}
              {#each availableTags as tag}
                <button
                  onclick={() => toggleTag(tag.id)}
                  class="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: {tag.color}"></span>
                    <span>{tag.name}</span>
                  </div>
                  {#if selectedTagIds.includes(tag.id)}
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- TipTap Canvas Container -->
    <div bind:this={element} class="min-h-[400px] text-gray-800 dark:text-gray-200 leading-relaxed"></div>
  </div>
</div>
