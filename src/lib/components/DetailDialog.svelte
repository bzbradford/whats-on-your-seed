<script>
	import { Dialog } from 'bits-ui';
	import TypeBadge from './TypeBadge.svelte';
	import { X } from 'lucide-svelte';

	let { open = $bindable(false), product } = $props();

	const SIGNAL_WORD_COLOR = {
		Danger: 'text-red-700 font-bold',
		Warning: 'text-amber-700 font-semibold',
		Caution: 'text-yellow-700'
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="z-40 fixed inset-0 bg-black/50 backdrop-blur-sm" />
		<Dialog.Content
			class="top-1/2 left-1/2 z-50 fixed flex flex-col bg-white shadow-2xl rounded-xl outline-none w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2"
		>
			{#if product}
				<!-- Header -->
				<div class="flex justify-between items-start gap-4 px-6 py-4 border-gray-200 border-b">
					<div>
						<Dialog.Title class="font-semibold text-gray-900 text-lg leading-tight">
							{product.productName}
						</Dialog.Title>
						<p class="mt-0.5 text-gray-500 text-sm">{product.company}</p>
					</div>
					<Dialog.Close
						class="hover:bg-gray-100 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors shrink-0"
						aria-label="Close"
					>
						<X size={18} />
					</Dialog.Close>
				</div>

				<!-- Body -->
				<div class="space-y-4 px-6 py-4 overflow-y-auto text-sm">
					<!-- Type badges -->
					<div>
						<dt class="text-gray-400 text-xs uppercase tracking-wide">Active ingredients</dt>
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

					<!-- Key facts grid -->
					<dl class="gap-x-6 gap-y-2 grid grid-cols-2 text-sm">
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Registration #</dt>
							<dd class="text-gray-800">{product.regNum}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Registration Type</dt>
							<dd class="text-gray-800">{product.regType || '—'}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Status</dt>
							<dd class="text-gray-800">{product.status}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Status Date</dt>
							<dd class="text-gray-800">{product.statusDate || '—'}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">First Registered</dt>
							<dd class="text-gray-800">{product.dateFirstRegistered || '—'}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Latest Label</dt>
							<dd class="text-gray-800">{product.latestLabelDate || '—'}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Physical Form</dt>
							<dd class="text-gray-800">{product.physicalForm || '—'}</dd>
						</div>
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Signal Word</dt>
							<dd class={SIGNAL_WORD_COLOR[product.signalWord] ?? 'text-gray-800'}>
								{product.signalWord || '—'}
							</dd>
						</div>
						<div class="col-span-2">
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Crops</dt>
							<dd class="text-gray-800">{product.crops.join(', ') || '—'}</dd>
						</div>
						<div class="col-span-2">
							<dt class="text-gray-400 text-xs uppercase tracking-wide">Pesticide Category</dt>
							<dd class="text-gray-800">{product.pesticideCategory || '—'}</dd>
						</div>
					</dl>

					{#if product.restrictedUse}
						<div class="bg-red-50 px-3 py-2 border border-red-200 rounded-md text-red-800 text-sm">
							<strong>Restricted Use Pesticide</strong>
							{#if product.restrictedUseReason}
								— {product.restrictedUseReason}
							{/if}
						</div>
					{/if}

					{#if product.meeToo}
						<div>
							<dt class="text-gray-400 text-xs uppercase tracking-wide">
								Similar Product (Me Too)
							</dt>
							<dd class="text-gray-700">{product.meeToo}</dd>
						</div>
					{/if}

					{#if product.transferHistory}
						<div>
							<p class="mb-0.5 text-gray-400 text-xs uppercase tracking-wide">Transfer History</p>
							<p class="font-mono text-gray-600 text-xs">{product.transferHistory}</p>
						</div>
					{/if}

					{#if product.notes}
						<div>
							<p class="mb-0.5 text-gray-400 text-xs uppercase tracking-wide">Notes</p>
							<p class="text-gray-700">{product.notes}</p>
						</div>
					{/if}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
