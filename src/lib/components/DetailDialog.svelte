<script>
  import { Dialog } from 'bits-ui';
  import TypeBadge from './TypeBadge.svelte';
  import { X } from 'lucide-svelte';

  let { open = $bindable(false), product } = $props();

  const SIGNAL_WORD_COLOR = {
    Danger: 'text-red-700 font-bold',
    Warning: 'text-amber-700 font-semibold',
    Caution: 'text-yellow-700',
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl outline-none max-h-[90vh] flex flex-col"
    >
      {#if product}
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div>
            <Dialog.Title class="text-lg font-semibold text-gray-900 leading-tight">
              {product.productName}
            </Dialog.Title>
            <p class="mt-0.5 text-sm text-gray-500">{product.company}</p>
          </div>
          <Dialog.Close
            class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </Dialog.Close>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto px-6 py-4 space-y-4 text-sm">

          <!-- Type badges -->
          <div class="flex flex-wrap gap-1.5">
            {#each product.ingredients as ing}
              {#if ing.primaryType}
                <span class="inline-flex items-center gap-1">
                  <TypeBadge type={ing.primaryType} showLabel />
                  <span class="text-gray-700">{ing.name}</span>
                  {#if ing.secondaryType}
                    <TypeBadge type={ing.secondaryType} />
                  {/if}
                </span>
              {:else}
                <span class="text-gray-700">{ing.name}</span>
              {/if}
            {/each}
          </div>

          <!-- Key facts grid -->
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Registration #</dt>
              <dd class="text-gray-800">{product.regNum}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Registration Type</dt>
              <dd class="text-gray-800">{product.regType || '—'}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Status</dt>
              <dd class="text-gray-800">{product.status}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Status Date</dt>
              <dd class="text-gray-800">{product.statusDate || '—'}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">First Registered</dt>
              <dd class="text-gray-800">{product.dateFirstRegistered || '—'}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Latest Label</dt>
              <dd class="text-gray-800">{product.latestLabelDate || '—'}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Physical Form</dt>
              <dd class="text-gray-800">{product.physicalForm || '—'}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Signal Word</dt>
              <dd class={SIGNAL_WORD_COLOR[product.signalWord] ?? 'text-gray-800'}>
                {product.signalWord || '—'}
              </dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs uppercase tracking-wide text-gray-400">Crops</dt>
              <dd class="text-gray-800">{product.crops.join(', ') || '—'}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs uppercase tracking-wide text-gray-400">Pesticide Category</dt>
              <dd class="text-gray-800">{product.pesticideCategory || '—'}</dd>
            </div>
          </dl>

          {#if product.restrictedUse}
            <div class="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              <strong>Restricted Use Pesticide</strong>
              {#if product.restrictedUseReason}
                — {product.restrictedUseReason}
              {/if}
            </div>
          {/if}

          {#if product.meeToo}
            <div>
              <dt class="text-xs uppercase tracking-wide text-gray-400">Similar Product (Me Too)</dt>
              <dd class="text-gray-700">{product.meeToo}</dd>
            </div>
          {/if}

          {#if product.transferHistory}
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Transfer History</p>
              <p class="text-gray-600 text-xs font-mono">{product.transferHistory}</p>
            </div>
          {/if}

          {#if product.notes}
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Notes</p>
              <p class="text-gray-700">{product.notes}</p>
            </div>
          {/if}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
