<script>
  import { onMount } from 'svelte';
  import TypeBadge from './lib/components/TypeBadge.svelte';
  import DetailDialog from './lib/components/DetailDialog.svelte';
  import { Search, X, ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw } from 'lucide-svelte';

  let products = $state([]);
  let loading = $state(true);
  let fetchError = $state(null);

  let searchQuery = $state('');
  let selectedCrop = $state('All');
  let selectedTypes = $state(new Set());
  let selectedCount = $state('All');
  let sortCol = $state('productName');
  let sortDir = $state('asc');

  let selectedProduct = $state(null);
  let dialogOpen = $state(false);

  const CROPS = ['All', 'Alfalfa', 'Corn', 'Cotton', 'Small Grains', 'Soybean'];
  const TYPE_DEFS = [
    { code: 'F', label: 'Fungicide' },
    { code: 'I', label: 'Insecticide' },
    { code: 'N', label: 'Nematicide' },
    { code: 'P', label: 'PGR' },
    { code: 'H', label: 'Herbicide' },
  ];
  const AI_COUNTS = ['All', '1', '2', '3', '4', '5', '6+'];

  onMount(async () => {
    try {
      const res = await fetch('/data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      products = await res.json();
    } catch (e) {
      fetchError = e.message;
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
          p.company.toLowerCase().includes(q)
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
        selectedCount === '6+' ? p.ingredientCount >= n : p.ingredientCount === n
      );
    }

    return [...result].sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      av = String(av ?? '').toLowerCase();
      bv = String(bv ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  let hasFilters = $derived(
    searchQuery.trim() !== '' ||
      selectedCrop !== 'All' ||
      selectedTypes.size > 0 ||
      selectedCount !== 'All'
  );

  function setSort(col) {
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = 'asc';
    }
  }

  function toggleType(code) {
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
  }

  function openDetail(p) {
    selectedProduct = p;
    dialogOpen = true;
  }
</script>

<div class="bg-gray-50 min-h-screen font-sans">
  <div class="mx-auto px-4 py-6 max-w-7xl">

    <!-- Header -->
    <div class="mb-5">
      <h1 class="font-bold text-gray-900 text-2xl leading-tight">
        What's on Your Seed?
      </h1>
      <p class="mt-1 text-gray-500 text-sm">
        Crop Protection Network — Seed Treatment Database
      </p>
    </div>

    <!-- Search -->
    <div class="relative mb-3">
      <Search size={16} class="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Search by trade name, active ingredient, or company…"
        class="bg-white shadow-sm py-2 pr-9 pl-9 border border-gray-300 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full placeholder:text-gray-400 text-sm"
      />
      {#if searchQuery}
        <button
          onclick={() => (searchQuery = '')}
          class="top-1/2 right-2.5 absolute p-0.5 rounded text-gray-400 hover:text-gray-600 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4 mb-4">

      <!-- Crop -->
      <div class="flex items-center gap-2">
        <label for="crop-filter" class="font-medium text-gray-600 text-xs uppercase tracking-wide">Crop</label>
        <select
          id="crop-filter"
          bind:value={selectedCrop}
          class="bg-white py-1 pr-6 pl-2 border border-gray-300 focus:border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        >
          {#each CROPS as crop}
            <option value={crop}>{crop}</option>
          {/each}
        </select>
      </div>

      <!-- # AIs -->
      <div class="flex items-center gap-2">
        <label for="count-filter" class="font-medium text-gray-600 text-xs uppercase tracking-wide"># AIs</label>
        <select
          id="count-filter"
          bind:value={selectedCount}
          class="bg-white py-1 pr-6 pl-2 border border-gray-300 focus:border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        >
          {#each AI_COUNTS as c}
            <option value={c}>{c}</option>
          {/each}
        </select>
      </div>

      <!-- Type toggle buttons -->
      <div class="flex items-center gap-2">
        <span class="font-medium text-gray-600 text-xs uppercase tracking-wide">Type</span>
        <div class="flex gap-1.5">
          {#each TYPE_DEFS as { code, label }}
            <button
              onclick={() => toggleType(code)}
              title={label}
              aria-pressed={selectedTypes.has(code)}
              class="rounded border px-2 py-0.5 text-xs font-semibold transition-opacity {selectedTypes.has(code) ? 'opacity-100 ring-2 ring-offset-1 ring-blue-400' : 'opacity-60 hover:opacity-100'}"
              class:bg-blue-100={code === 'F'}   class:text-blue-800={code === 'F'}   class:border-blue-300={code === 'F'}
              class:bg-amber-100={code === 'I'}  class:text-amber-800={code === 'I'}  class:border-amber-300={code === 'I'}
              class:bg-green-100={code === 'N'}  class:text-green-800={code === 'N'}  class:border-green-300={code === 'N'}
              class:bg-violet-100={code === 'P'} class:text-violet-800={code === 'P'} class:border-violet-300={code === 'P'}
              class:bg-red-100={code === 'H'}    class:text-red-800={code === 'H'}    class:border-red-300={code === 'H'}
            >
              {code}
            </button>
          {/each}
        </div>
      </div>

      <!-- Reset -->
      {#if hasFilters}
        <button
          onclick={resetFilters}
          class="flex items-center gap-1 hover:bg-gray-200 ml-auto px-2 py-1 rounded text-gray-500 hover:text-gray-700 text-xs transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      {/if}
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
      {#if loading}
        <div class="flex justify-center items-center py-20 text-gray-400 text-sm">
          Loading…
        </div>
      {:else if fetchError}
        <div class="flex justify-center items-center py-20 text-red-600 text-sm">
          Error loading data: {fetchError}
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-gray-200 border-b">
              <tr>
                <th class="px-4 py-2.5 text-left">
                  <button
                    onclick={() => setSort('productName')}
                    class="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Trade Name
                    {#if sortCol === 'productName'}
                      {#if sortDir === 'asc'}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
                    {:else}
                      <ChevronsUpDown size={14} class="text-gray-400" />
                    {/if}
                  </button>
                </th>
                <th class="px-4 py-2.5 font-semibold text-gray-700 text-left">Active Ingredients</th>
                <th class="px-4 py-2.5 font-semibold text-gray-700 text-left">Type</th>
                <th class="px-4 py-2.5 font-semibold text-gray-700 text-left">Crops</th>
                <th class="px-4 py-2.5 text-left">
                  <button
                    onclick={() => setSort('ingredientCount')}
                    class="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    # AIs
                    {#if sortCol === 'ingredientCount'}
                      {#if sortDir === 'asc'}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
                    {:else}
                      <ChevronsUpDown size={14} class="text-gray-400" />
                    {/if}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {#if filtered.length === 0}
                <tr>
                  <td colspan="5" class="px-4 py-12 text-gray-400 text-center">
                    No products match the current filters.
                  </td>
                </tr>
              {:else}
                {#each filtered as product (product.regNum + product.productName)}
                  <tr
                    class="hover:bg-blue-50 transition-colors cursor-pointer"
                    onclick={() => openDetail(product)}
                  >
                    <td class="px-4 py-2.5 font-medium text-gray-900">
                      {product.productName}
                      {#if product.restrictedUse}
                        <span class="ml-1 font-normal text-red-600 text-xs" title="Restricted Use Pesticide">RUP</span>
                      {/if}
                    </td>
                    <td class="px-4 py-2.5 max-w-xs text-gray-600">
                      {product.ingredients.map((i) => i.name).join(', ')}
                    </td>
                    <td class="px-4 py-2.5">
                      <div class="flex flex-wrap gap-1">
                        {#each product.primaryTypes as t}
                          <TypeBadge type={t} />
                        {/each}
                        {#if product.primaryTypes.length === 0}
                          <span class="text-gray-400 text-xs">—</span>
                        {/if}
                      </div>
                    </td>
                    <td class="px-4 py-2.5 max-w-[180px] text-gray-600 text-xs">
                      {product.crops.join(', ')}
                    </td>
                    <td class="px-4 py-2.5 text-gray-600 text-center">
                      {product.ingredientCount}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        <!-- Footer count -->
        <div class="px-4 py-2 border-gray-100 border-t text-gray-400 text-xs">
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
