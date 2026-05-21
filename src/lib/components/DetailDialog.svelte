<script lang="ts">
  import { Dialog } from 'bits-ui';
  import TypeBadge from './TypeBadge.svelte';
  import { X } from 'lucide-svelte';
  import type { Product } from '../types.ts';

  interface Props {
    open: boolean;
    product: Product | null;
  }

  let { open = $bindable(false), product }: Props = $props();

  const SIGNAL_WORD_COLOR: Record<string, string> = {
    Danger: 'text-red-700 font-bold',
    Warning: 'text-amber-700 font-semibold',
    Caution: 'text-yellow-700',
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-2xl outline-none"
    >
      {#if product}
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div>
            <Dialog.Title class="text-lg leading-tight font-semibold text-gray-900">
              {product.productName}
            </Dialog.Title>
            <p class="mt-0.5 text-sm text-gray-500">{product.company}</p>
          </div>
          <Dialog.Close
            class="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </Dialog.Close>
        </div>

        <!-- Body -->
        <div class="space-y-4 overflow-y-auto px-6 py-4 text-sm">
          <!-- Key facts grid -->
          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <!-- Active ingredients -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Active ingredients</dt>
              <dd class="text-gray-800">
                <ul>
                  {#each product.ingredients as ing}
                    <li>
                      {#if ing.primaryType}
                        <span class="inline-flex items-center gap-1">
                          <span class="text-gray-700">{ing.name}</span>
                          <TypeBadge type={ing.primaryType} showLabel />
                          {#if ing.secondaryType}
                            <TypeBadge type={ing.secondaryType} showLabel />
                          {/if}
                        </span>
                      {:else}
                        <span class="text-gray-700">{ing.name}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </dd>
            </div>

            <!-- Signal Word -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Signal Word</dt>
              <dd class={SIGNAL_WORD_COLOR[product.signalWord] ?? 'text-gray-800'}>
                {product.signalWord || '—'}
              </dd>
            </div>

            <!-- Pesticide Category -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Pesticide Category</dt>
              <dd class="text-gray-800">{product.pesticideCategory || '—'}</dd>
            </div>

            <!-- Crops -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Crops</dt>
              <dd class="text-gray-800">{product.crops.join(', ') || '—'}</dd>
            </div>

            <!-- Physical Form -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Physical Form</dt>
              <dd class="text-gray-800">{product.physicalForm || '—'}</dd>
            </div>

            <!-- Registration # -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Registration #</dt>
              <dd class="text-gray-800">{product.regNum}</dd>
            </div>

            <!-- Registration Type -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Registration Type</dt>
              <dd class="text-gray-800">{product.regType || '—'}</dd>
            </div>

            <!-- Status -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Status</dt>
              <dd class="text-gray-800">{product.status}</dd>
            </div>

            <!-- Status Date -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Status Date</dt>
              <dd class="text-gray-800">{product.statusDate || '—'}</dd>
            </div>

            <!-- First Registered -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">First Registered</dt>
              <dd class="text-gray-800">{product.dateFirstRegistered || '—'}</dd>
            </div>

            <!-- Latest Label -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Latest Label</dt>
              <dd class="text-gray-800">{product.latestLabelDate || '—'}</dd>
            </div>

            <!-- Similar Product (Me Too) -->
            {#if product.meeToo}
              <div>
                <dt class="text-xs tracking-wide text-gray-400 uppercase">
                  Similar Product (Me Too)
                </dt>
                <dd class="text-gray-700">{product.meeToo}</dd>
              </div>
            {/if}

            <!-- Label lookup -->
            <div>
              <dt class="text-xs tracking-wide text-gray-400 uppercase">Label Lookup</dt>
              <dd>
                <a
                  href={`https://agrian.com/labelcenter/results.cfm?q=${encodeURIComponent(product.productName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:underline"
                >
                  Search for label on Agrian
                </a>
              </dd>
            </div>
          </dl>

          <!-- Restricted Use -->
          {#if product.restrictedUse}
            <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <strong>Restricted Use Pesticide</strong>
              {#if product.restrictedUseReason}
                — {product.restrictedUseReason}
              {/if}
            </div>
          {/if}

          <!-- Transfer History -->
          {#if product.transferHistory}
            <div>
              <p class="mb-0.5 text-xs tracking-wide text-gray-400 uppercase">Transfer History</p>
              <p class="font-mono text-xs text-gray-600">{product.transferHistory}</p>
            </div>
          {/if}

          <!-- Notes -->
          {#if product.notes}
            <div>
              <p class="mb-0.5 text-xs tracking-wide text-gray-400 uppercase">Notes</p>
              <p class="text-gray-700">{product.notes}</p>
            </div>
          {/if}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
