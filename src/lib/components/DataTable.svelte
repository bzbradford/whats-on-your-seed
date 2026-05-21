<script lang="ts" generics="TRow">
  import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';
  import type { Snippet } from 'svelte';
  import type { ColDef } from '../types.ts';

  interface Props {
    rows: TRow[];
    columns: ColDef[];
    sortCol: string;
    sortDir: string;
    onSort: (key: string) => void;
    onRowClick?: (row: TRow) => void;
    rowKey: (row: TRow) => string;
    cell: Snippet<[ColDef, TRow]>;
    emptyMessage?: string;
  }

  let {
    rows,
    columns,
    sortCol,
    sortDir,
    onSort,
    onRowClick,
    rowKey,
    cell,
    emptyMessage = 'No results match the current filters.',
  }: Props = $props();
</script>

<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead class="border-b border-gray-200 bg-gray-50">
      <tr>
        {#each columns as col (col.key)}
          <th class="px-4 py-2.5 text-left {col.thClass ?? ''}">
            {#if col.sortable}
              <button
                onclick={() => onSort(col.key)}
                class="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
              >
                {col.label}
                {#if sortCol === col.key}
                  {#if sortDir === 'asc'}<ChevronUp size={14} />{:else}<ChevronDown
                      size={14}
                    />{/if}
                {:else}
                  <ChevronsUpDown size={14} class="text-gray-400" />
                {/if}
              </button>
            {:else}
              <span class="font-semibold text-gray-700">{col.label}</span>
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#if rows.length === 0}
        <tr>
          <td colspan={columns.length} class="px-4 py-12 text-center text-gray-400">
            {emptyMessage}
          </td>
        </tr>
      {:else}
        {#each rows as row (rowKey(row))}
          <tr
            class="cursor-pointer transition-colors hover:bg-blue-50"
            onclick={() => onRowClick?.(row)}
          >
            {#each columns as col (col.key)}
              <td class="px-4 py-2.5 {col.tdClass ?? ''}">
                {@render cell(col, row)}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
