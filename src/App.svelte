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
  // const AI_COUNTS = ['All', '1', '2', '3', '4', '5', '6+'];

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

  let allCompanies = $derived([
    'All',
    ...[...new Set(products.map((p) => p.company).filter((c) => c))].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    ),
  ]);
  let allIngredients = $derived([
    'All',
    ...[
      ...new Set(products.flatMap((p) => p.ingredients.map((i) => i.name).filter((n) => n))),
    ].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
  ]);

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
</script>

<div class="min-h-screen bg-gray-50 font-sans">
  <div class="mx-auto max-w-7xl px-4 py-6">
    <!-- Header -->
    <div class="mb-5">
      <h1 class="text-2xl leading-tight font-bold text-gray-900">What's on Your Seed?</h1>
      <p class="mt-1 text-sm text-gray-500">Crop Protection Network — Seed Treatment Database</p>
    </div>

    <!-- Search -->
    <div class="relative mb-3">
      <Search
        size={16}
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Search by name, active ingredient, or registrant…"
        class="w-full rounded-lg border border-gray-300 bg-white py-2 pr-9 pl-9 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
      {#if searchQuery}
        <button
          onclick={() => (searchQuery = '')}
          class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <!-- Registrant -->
      <div class="flex items-center gap-2">
        <label
          for="company-filter"
          class="text-xs font-medium tracking-wide text-gray-600 uppercase">Registrant</label
        >
        <select
          id="company-filter"
          bind:value={selectedCompany}
          class="max-w-50 rounded border border-gray-300 bg-white py-1 pr-6 pl-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {#each allCompanies as co}
            <option value={co}>{co}</option>
          {/each}
        </select>
      </div>

      <!-- Active Ingredient -->
      <div class="flex items-center gap-2">
        <label
          for="ingredient-filter"
          class="text-xs font-medium tracking-wide text-gray-600 uppercase">Ingredient</label
        >
        <select
          id="ingredient-filter"
          bind:value={selectedIngredient}
          class="max-w-50 rounded border border-gray-300 bg-white py-1 pr-6 pl-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {#each allIngredients as ing}
            <option value={ing}>{ing}</option>
          {/each}
        </select>
      </div>

      <!-- Type toggle buttons -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium tracking-wide text-gray-600 uppercase">Type</span>
        <div class="flex gap-1.5">
          {#each TYPE_DEFS as { code, label }}
            <button
              onclick={() => toggleType(code)}
              title={label}
              aria-pressed={selectedTypes.has(code)}
              class="rounded border px-2 py-0.5 text-xs font-semibold transition-opacity {selectedTypes.has(
                code,
              )
                ? 'opacity-100 ring-2 ring-blue-400 ring-offset-1'
                : 'opacity-60 hover:opacity-100'}"
              class:bg-blue-100={code === 'F'}
              class:text-blue-800={code === 'F'}
              class:border-blue-300={code === 'F'}
              class:bg-amber-100={code === 'I'}
              class:text-amber-800={code === 'I'}
              class:border-amber-300={code === 'I'}
              class:bg-green-100={code === 'N'}
              class:text-green-800={code === 'N'}
              class:border-green-300={code === 'N'}
              class:bg-violet-100={code === 'P'}
              class:text-violet-800={code === 'P'}
              class:border-violet-300={code === 'P'}
              class:bg-red-100={code === 'H'}
              class:text-red-800={code === 'H'}
              class:border-red-300={code === 'H'}
            >
              {label}
            </button>
          {/each}
        </div>

        <!-- Crop -->
        <div class="flex items-center gap-2">
          <label for="crop-filter" class="text-xs font-medium tracking-wide text-gray-600 uppercase"
            >Crop</label
          >
          <select
            id="crop-filter"
            bind:value={selectedCrop}
            class="rounded border border-gray-300 bg-white py-1 pr-6 pl-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {#each CROPS as crop}
              <option value={crop}>{crop}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- # AIs -->
      <!-- <div class="flex items-center gap-2">
				<label for="count-filter" class="font-medium text-gray-600 text-xs uppercase tracking-wide"
					># AIs</label
				>
				<select
					id="count-filter"
					bind:value={selectedCount}
					class="bg-white py-1 pr-6 pl-2 border border-gray-300 focus:border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
				>
					{#each AI_COUNTS as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</div> -->

      <!-- Reset -->
      {#if hasFilters}
        <button
          onclick={resetFilters}
          class="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      {/if}
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {#if loading}
        <div class="flex items-center justify-center py-20 text-sm text-gray-400">Loading…</div>
      {:else if fetchError}
        <div class="flex items-center justify-center py-20 text-sm text-red-600">
          Error loading data: {fetchError}
        </div>
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
              <span class="font-medium text-gray-900">
                {product.productName}
                {#if product.restrictedUse}
                  <span
                    class="ml-1 text-xs font-normal text-red-600"
                    title="Restricted Use Pesticide">RUP</span
                  >
                {/if}
              </span>
            {:else if col.key === 'ingredients'}
              {ingredientNames(product) || '—'}
            {:else if col.key === 'primaryTypes'}
              <div class="flex flex-wrap gap-1">
                {#each product.primaryTypes as t}
                  <TypeBadge type={t} />
                {/each}
                {#if product.primaryTypes.length === 0}
                  <span class="text-xs text-gray-400">—</span>
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
        <div class="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
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
