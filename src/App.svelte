<script lang="ts">
  import { onMount } from 'svelte';
  import TypeBadge from './lib/components/TypeBadge.svelte';
  import DetailDialog from './lib/components/DetailDialog.svelte';
  import DataTable from './lib/components/DataTable.svelte';
  import { Search, X, RotateCcw } from 'lucide-svelte';
  import type { Product, ColDef } from './lib/types.ts';

  let products = $state<Product[]>([]);
  let loading = $state(true);
  let fetchError = $state<string | null>(null);
  let searchQuery = $state('');
  let selectedCrop = $state('All');
  let selectedTypes = $state<Set<string>>(new Set());
  let selectedCount = $state('All');
  let selectedCompany = $state('All');
  let selectedIngredient = $state('All');
  let sortCol = $state('productName');
  let sortDir = $state<'asc' | 'desc'>('asc');
  let selectedProduct = $state<Product | null>(null);
  let dialogOpen = $state(false);

  const CROPS = ['All', 'Alfalfa', 'Corn', 'Cotton', 'Small Grains', 'Soybean'];
  const TYPE_DEFS = [
    { code: 'F', label: 'Fungicide' },
    { code: 'I', label: 'Insecticide' },
    { code: 'N', label: 'Nematicide' },
    { code: 'P', label: 'PGR' },
    // { code: 'H', label: 'Herbicide' } // no herbicides in the list currently
  ];

  // All available columns in default display order.
  // Add/remove entries here to expose new columns; toggle visibility via visibleColumnKeys.
  const ALL_COLUMNS: ColDef[] = [
    { key: 'company', label: 'Registrant', sortable: true, tdClass: 'text-gray-600' },
    { key: 'productName', label: 'Product Name', sortable: true },
    {
      key: 'ingredients',
      label: 'Active Ingredients',
      tdClass: 'text-gray-600 max-w-xs',
      sortable: true,
    },
    {
      key: 'ingredientCount',
      label: 'AIs',
      sortable: true,
      tdClass: 'text-center text-gray-600',
    },
    { key: 'primaryTypes', label: 'Type', sortable: true },
    { key: 'crops', label: 'Crops', tdClass: 'text-gray-600 max-w-[180px]' },
  ];

  let visibleColumnKeys = $state<string[]>([
    'company',
    'productName',
    'ingredients',
    'primaryTypes',
    'crops',
    'ingredientCount',
  ]);

  let visibleColumns = $derived(ALL_COLUMNS.filter((c) => visibleColumnKeys.includes(c.key)));

  // Filter values
  let sortedCompanies = $derived(
    [...new Set(products.map((p) => p.company).filter((c) => c))].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    ),
  );
  let allCompanies = $derived(['All', ...sortedCompanies]);
  let sortedIngredients = $derived(
    [...new Set(products.flatMap((p) => p.ingredients.map((i) => i.name).filter((n) => n)))].sort(
      (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()),
    ),
  );
  let allIngredients = $derived(['All', ...sortedIngredients]);

  let filtered = $derived.by(() => {
    let result = products;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
          p.company.toLowerCase().includes(q),
      );
    }

    if (selectedCrop !== 'All') {
      result = result.filter((p) => p.crops.includes(selectedCrop));
    }

    if (selectedTypes.size > 0) {
      result = result.filter((p) => p.primaryTypes.some((t) => selectedTypes.has(t)));
    }

    if (selectedCount !== 'All') {
      const n = selectedCount === '6+' ? 6 : parseInt(selectedCount);
      result = result.filter((p) =>
        selectedCount === '6+' ? p.ingredientCount >= n : p.ingredientCount === n,
      );
    }

    if (selectedCompany !== 'All') {
      result = result.filter((p) => p.company === selectedCompany);
    }

    if (selectedIngredient !== 'All') {
      result = result.filter((p) => p.ingredients.some((i) => i.name === selectedIngredient));
    }

    return [...result].sort((a, b) => {
      const av = getSortValue(a, sortCol);
      const bv = getSortValue(b, sortCol);
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  let hasFilters = $derived(
    searchQuery.trim() !== '' ||
      selectedCrop !== 'All' ||
      selectedTypes.size > 0 ||
      selectedCount !== 'All' ||
      selectedCompany !== 'All' ||
      selectedIngredient !== 'All',
  );

  function setSort(col: string) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = 'asc';
    }
  }

  function toggleType(code: string) {
    const next = new Set(selectedTypes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    selectedTypes = next;
  }

  function resetFilters() {
    searchQuery = '';
    selectedCrop = 'All';
    selectedTypes = new Set();
    selectedCount = 'All';
    selectedCompany = 'All';
    selectedIngredient = 'All';
  }

  function openDetail(row: Product) {
    selectedProduct = row;
    dialogOpen = true;
  }

  function ingredientNames(product: Product): string {
    return product.ingredients.map((i) => i.name).join(', ');
  }

  // Returns a scalar sort key for fields that are arrays in the data model.
  // Array-valued fields sort by their first element; everything else sorts by
  // the raw value (number) or its lowercased string representation.
  function getSortValue(product: Product, col: string): string | number {
    switch (col) {
      case 'ingredients':
        return product.ingredients[0]?.name ?? '';
      case 'primaryTypes':
        return product.primaryTypes[0] ?? '';
      case 'crops':
        return product.crops[0] ?? '';
      default: {
        const val = (product as unknown as Record<string, unknown>)[col];
        return typeof val === 'number' ? val : String(val ?? '').toLowerCase();
      }
    }
  }

  onMount(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      products = (await res.json()) as Product[];
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  });
</script>

<div class="page">
  <div class="page-content">
    <!-- Header -->
    <div class="app-header">
      <h1 class="app-title">What's on Your Seed?</h1>
      <p class="app-subtitle">Crop Protection Network — Seed Treatment Database</p>
    </div>

    <!-- Search -->
    <div class="search-wrapper">
      <span class="search-icon" aria-hidden="true">
        <Search size={16} />
      </span>
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Search by name, active ingredient, or registrant…"
        class="search-input"
      />
      {#if searchQuery}
        <button onclick={() => (searchQuery = '')} class="search-clear" aria-label="Clear search">
          <X size={14} />
        </button>
      {/if}
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <!-- Registrant -->
      <div class="filter-group">
        <label for="company-filter" class="filter-label">Registrant</label>
        <select id="company-filter" bind:value={selectedCompany} class="filter-select max-w-50">
          {#each allCompanies as co}
            <option value={co}>{co}</option>
          {/each}
        </select>
      </div>

      <!-- Active Ingredient -->
      <div class="filter-group">
        <label for="ingredient-filter" class="filter-label">Ingredient</label>
        <select
          id="ingredient-filter"
          bind:value={selectedIngredient}
          class="filter-select max-w-50"
        >
          {#each allIngredients as ing}
            <option value={ing}>{ing}</option>
          {/each}
        </select>
      </div>

      <!-- Type toggle buttons -->
      <div class="filter-group">
        <span class="filter-label">Type</span>
        <div class="type-buttons">
          {#each TYPE_DEFS as { code, label }}
            <button
              onclick={() => toggleType(code)}
              title={label}
              data-type={code}
              aria-pressed={selectedTypes.has(code)}
              class="type-btn"
            >
              {label}
            </button>
          {/each}
        </div>

        <!-- Crop -->
        <div class="filter-group">
          <label for="crop-filter" class="filter-label">Crop</label>
          <select id="crop-filter" bind:value={selectedCrop} class="filter-select">
            {#each CROPS as crop}
              <option value={crop}>{crop}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Reset -->
      {#if hasFilters}
        <button onclick={resetFilters} class="reset-btn">
          <RotateCcw size={12} />
          Reset
        </button>
      {/if}
    </div>

    <!-- Table -->
    <div class="table-card">
      {#if loading}
        <div class="loading-state">Loading…</div>
      {:else if fetchError}
        <div class="error-state">Error loading data: {fetchError}</div>
      {:else}
        <DataTable
          rows={filtered}
          columns={visibleColumns}
          {sortCol}
          {sortDir}
          onSort={setSort}
          onRowClick={openDetail}
          rowKey={(p: Product) => p.regNum + p.productName}
        >
          {#snippet cell(col: ColDef, product: Product)}
            {#if col.key === 'company'}
              {product.company || '—'}
            {:else if col.key === 'productName'}
              <span class="product-name">
                {product.productName}
                {#if product.restrictedUse}
                  <span class="rup-badge" title="Restricted Use Pesticide">RUP</span>
                {/if}
              </span>
            {:else if col.key === 'ingredients'}
              {ingredientNames(product) || '—'}
            {:else if col.key === 'primaryTypes'}
              <div class="type-cell">
                {#each product.primaryTypes as t}
                  <TypeBadge type={t} />
                {/each}
                {#if product.primaryTypes.length === 0}
                  <span class="empty-type">—</span>
                {/if}
              </div>
            {:else if col.key === 'crops'}
              {product.crops.join(', ') || '—'}
            {:else if col.key === 'ingredientCount'}
              {product.ingredientCount}
            {/if}
          {/snippet}
        </DataTable>

        <!-- Footer count -->
        <div class="table-footer">
          {#if hasFilters}
            Showing {filtered.length} of {products.length} products
          {:else}
            {products.length} products total
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<DetailDialog bind:open={dialogOpen} product={selectedProduct} />

<style>
  @reference "./app.css";

  .page {
    @apply min-h-screen bg-gray-50 font-sans;
  }
  .page-content {
    @apply mx-auto max-w-7xl px-4 py-6;
  }
  .app-header {
    @apply mb-5;
  }
  .app-title {
    @apply text-2xl leading-tight font-bold text-gray-900;
  }
  .app-subtitle {
    @apply mt-1 text-sm text-gray-500;
  }
  .search-wrapper {
    @apply relative mb-3;
  }
  .search-icon {
    @apply pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400;
  }
  .search-input {
    @apply w-full rounded-lg border border-gray-300 bg-white py-2 pr-9 pl-9 text-sm shadow-sm;
    &::placeholder {
      @apply text-gray-400;
    }
    &:focus {
      @apply border-blue-500 ring-1 ring-blue-500 outline-none;
    }
  }
  .search-clear {
    @apply absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-gray-400;
    &:hover {
      @apply text-gray-600;
    }
  }
  .filters-row {
    @apply mb-4 flex flex-wrap items-center gap-4;
  }
  .filter-group {
    @apply flex items-center gap-2;
  }
  .filter-label {
    @apply text-xs font-medium tracking-wide text-gray-600 uppercase;
  }
  .filter-select {
    display: unset;
    @apply rounded border border-gray-300 bg-white py-1 pr-6 pl-2 text-sm;
    &:focus {
      @apply border-blue-500 ring-1 ring-blue-500 outline-none;
    }
  }
  .type-buttons {
    @apply flex gap-1.5;
  }
  .type-btn {
    @apply rounded border px-2 py-0.5 text-xs font-semibold opacity-60 transition-opacity;
    &:hover {
      @apply opacity-100;
    }
    &[aria-pressed='true'] {
      @apply opacity-100 ring-2 ring-blue-400 ring-offset-1;
    }
    &[data-type='F'] {
      @apply border-blue-300 bg-blue-100 text-blue-800;
    }
    &[data-type='I'] {
      @apply border-amber-300 bg-amber-100 text-amber-800;
    }
    &[data-type='N'] {
      @apply border-green-300 bg-green-100 text-green-800;
    }
    &[data-type='P'] {
      @apply border-violet-300 bg-violet-100 text-violet-800;
    }
    &[data-type='H'] {
      @apply border-red-300 bg-red-100 text-red-800;
    }
  }
  .reset-btn {
    @apply ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors;
    &:hover {
      @apply bg-gray-200 text-gray-700;
    }
  }
  .table-card {
    @apply overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm;
  }
  .loading-state {
    @apply flex items-center justify-center py-20 text-sm text-gray-400;
  }
  .error-state {
    @apply flex items-center justify-center py-20 text-sm text-red-600;
  }
  .product-name {
    @apply font-medium text-gray-900;
  }
  .rup-badge {
    @apply ml-1 text-xs font-normal text-red-600;
  }
  .type-cell {
    @apply flex flex-wrap gap-1;
  }
  .empty-type {
    @apply text-xs text-gray-400;
  }
  .table-footer {
    @apply border-t border-gray-100 px-4 py-2 text-xs text-gray-400;
  }
</style>
