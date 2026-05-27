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

<div class="table-wrapper">
  <table class="data-table">
    <thead class="table-head">
      <tr>
        {#each columns as col (col.key)}
          <th class="col-header {col.thClass ?? ''}">
            {#if col.sortable}
              <button class="sort-btn" onclick={() => onSort(col.key)}>
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
              <span class="col-label">{col.label}</span>
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="table-body">
      {#if rows.length === 0}
        <tr>
          <td colspan={columns.length} class="empty-cell">
            {emptyMessage}
          </td>
        </tr>
      {:else}
        {#each rows as row (rowKey(row))}
          <tr class="data-row" onclick={() => onRowClick?.(row)}>
            {#each columns as col (col.key)}
              <td class="data-cell {col.tdClass ?? ''}">
                {@render cell(col, row)}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  @reference "../../app.css";

  .table-wrapper {
    @apply overflow-x-auto;
  }
  .data-table {
    @apply w-full text-sm;
  }
  .table-head {
    @apply border-b border-gray-200 bg-gray-50;
  }
  .col-header {
    @apply px-4 py-2.5 text-left;
  }
  .sort-btn {
    @apply flex items-center gap-1 font-semibold text-gray-700;
    &:hover {
      @apply text-gray-900;
    }
  }
  .col-label {
    @apply font-semibold text-gray-700;
  }
  .table-body {
    @apply divide-y divide-gray-100;
  }
  .empty-cell {
    @apply px-4 py-12 text-center text-gray-400;
  }
  .data-row {
    @apply cursor-pointer transition-colors;
    &:hover {
      @apply bg-blue-50;
    }
  }
  .data-cell {
    @apply px-4 py-2.5;
  }
</style>
