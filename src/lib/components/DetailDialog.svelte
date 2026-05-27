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
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
    <Dialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-2xl outline-none"
    >
      {#if product}
        <!-- Header -->
        <div class="dialog-header">
          <div>
            <Dialog.Title class="text-lg leading-tight font-semibold text-gray-900">
              {product.productName}
            </Dialog.Title>
            <p class="dialog-subtitle">{product.company}</p>
          </div>
          <Dialog.Close
            class="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </Dialog.Close>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <!-- Key facts grid -->
          <dl class="facts-grid">
            <!-- Active ingredients -->
            <div>
              <dt class="fact-label">Active ingredients</dt>
              <dd class="fact-value">
                <ul>
                  {#each product.ingredients as ing}
                    <li>
                      {#if ing.primaryType}
                        <span class="ingredient-row">
                          <span class="ingredient-name">{ing.name}</span>
                          <TypeBadge type={ing.primaryType} showLabel />
                          {#if ing.secondaryType}
                            <TypeBadge type={ing.secondaryType} showLabel />
                          {/if}
                        </span>
                      {:else}
                        <span class="ingredient-name">{ing.name}</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </dd>
            </div>

            <!-- Signal Word -->
            <div>
              <dt class="fact-label">Signal Word</dt>
              <dd class="signal-word" data-signal={product.signalWord}>
                {product.signalWord || '—'}
              </dd>
            </div>

            <!-- Pesticide Category -->
            <div>
              <dt class="fact-label">Pesticide Category</dt>
              <dd class="fact-value">{product.pesticideCategory || '—'}</dd>
            </div>

            <!-- Crops -->
            <div>
              <dt class="fact-label">Crops</dt>
              <dd class="fact-value">{product.crops.join(', ') || '—'}</dd>
            </div>

            <!-- Physical Form -->
            <div>
              <dt class="fact-label">Physical Form</dt>
              <dd class="fact-value">{product.physicalForm || '—'}</dd>
            </div>

            <!-- Registration # -->
            <div>
              <dt class="fact-label">Registration #</dt>
              <dd class="fact-value">{product.regNum}</dd>
            </div>

            <!-- Registration Type -->
            <div>
              <dt class="fact-label">Registration Type</dt>
              <dd class="fact-value">{product.regType || '—'}</dd>
            </div>

            <!-- Status -->
            <div>
              <dt class="fact-label">Status</dt>
              <dd class="fact-value">{product.status}</dd>
            </div>

            <!-- Status Date -->
            <div>
              <dt class="fact-label">Status Date</dt>
              <dd class="fact-value">{product.statusDate || '—'}</dd>
            </div>

            <!-- First Registered -->
            <div>
              <dt class="fact-label">First Registered</dt>
              <dd class="fact-value">{product.dateFirstRegistered || '—'}</dd>
            </div>

            <!-- Latest Label -->
            <div>
              <dt class="fact-label">Latest Label</dt>
              <dd class="fact-value">{product.latestLabelDate || '—'}</dd>
            </div>

            <!-- Similar Product (Me Too) -->
            {#if product.meeToo}
              <div>
                <dt class="fact-label">Similar Product (Me Too)</dt>
                <dd class="fact-value-muted">{product.meeToo}</dd>
              </div>
            {/if}

            <!-- Label lookup -->
            <div>
              <dt class="fact-label">Label Lookup</dt>
              <dd>
                <a
                  href={`https://agrian.com/labelcenter/results.cfm?q=${encodeURIComponent(product.productName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="external-link"
                >
                  Search for label on Agrian
                </a>
              </dd>
            </div>
          </dl>

          <!-- Restricted Use -->
          {#if product.restrictedUse}
            <div class="rup-notice">
              <strong>Restricted Use Pesticide</strong>
              {#if product.restrictedUseReason}
                — {product.restrictedUseReason}
              {/if}
            </div>
          {/if}

          <!-- Transfer History -->
          {#if product.transferHistory}
            <div>
              <p class="section-label">Transfer History</p>
              <p class="transfer-history">{product.transferHistory}</p>
            </div>
          {/if}

          <!-- Notes -->
          {#if product.notes}
            <div>
              <p class="section-label">Notes</p>
              <p class="notes-text">{product.notes}</p>
            </div>
          {/if}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  @reference "../../app.css";

  .dialog-header {
    @apply flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4;
  }
  .dialog-subtitle {
    @apply mt-0.5 text-sm text-gray-500;
  }
  .dialog-body {
    @apply space-y-4 overflow-y-auto px-6 py-4 text-sm;
  }
  .facts-grid {
    @apply grid grid-cols-2 gap-x-6 gap-y-2 text-sm;
  }
  .fact-label {
    @apply text-xs tracking-wide text-gray-400 uppercase;
  }
  .fact-value {
    @apply text-gray-800;
  }
  .fact-value-muted {
    @apply text-gray-700;
  }
  .ingredient-row {
    @apply inline-flex items-center gap-1;
  }
  .ingredient-name {
    @apply text-gray-700;
  }
  .signal-word {
    @apply text-gray-800;
  }
  .signal-word[data-signal='Danger'] {
    @apply text-red-700 font-bold;
  }
  .signal-word[data-signal='Warning'] {
    @apply text-amber-700 font-semibold;
  }
  .signal-word[data-signal='Caution'] {
    @apply text-yellow-700;
  }
  .external-link {
    @apply text-blue-600;
    &:hover {
      @apply underline;
    }
  }
  .rup-notice {
    @apply rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800;
  }
  .section-label {
    @apply mb-0.5 text-xs tracking-wide text-gray-400 uppercase;
  }
  .transfer-history {
    @apply font-mono text-xs text-gray-600;
  }
  .notes-text {
    @apply text-gray-700;
  }
</style>
