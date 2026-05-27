<script lang="ts">
  interface Props {
    type: string;
    showLabel?: boolean;
  }

  const { type, showLabel = false }: Props = $props();

  const LABELS: Record<string, string> = {
    F: 'Fungicide',
    I: 'Insecticide',
    N: 'Nematicide',
    P: 'Plant Growth Reg.',
    H: 'Herbicide',
  };

  const label = $derived(LABELS[type] ?? type);
</script>

<span class="badge" data-type={type} title={label}>
  {#if showLabel}
    {label}
  {:else}
    {type}
  {/if}
</span>

<style>
  @reference "../../app.css";

  .badge {
    @apply inline-flex items-center rounded border px-1.5 py-0.5 text-xs leading-none font-semibold;
    @apply bg-gray-100 text-gray-700 border-gray-300;
  }
  .badge[data-type='F'] {
    @apply bg-blue-100 text-blue-800 border-blue-300;
  }
  .badge[data-type='I'] {
    @apply bg-amber-100 text-amber-800 border-amber-300;
  }
  .badge[data-type='N'] {
    @apply bg-green-100 text-green-800 border-green-300;
  }
  .badge[data-type='P'] {
    @apply bg-violet-100 text-violet-800 border-violet-300;
  }
  .badge[data-type='H'] {
    @apply bg-red-100 text-red-800 border-red-300;
  }
</style>
