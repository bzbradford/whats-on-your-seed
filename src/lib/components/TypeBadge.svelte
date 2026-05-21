<script lang="ts">
  interface Props {
    type: string;
    showLabel?: boolean;
  }

  const { type, showLabel = false }: Props = $props();

  interface BadgeConfig {
    label: string;
    bg: string;
    text: string;
    border: string;
  }

  const CONFIG: Record<string, BadgeConfig> = {
    F: { label: 'Fungicide', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    I: {
      label: 'Insecticide',
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    N: {
      label: 'Nematicide',
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
    },
    P: {
      label: 'Plant Growth Reg.',
      bg: 'bg-violet-100',
      text: 'text-violet-800',
      border: 'border-violet-300',
    },
    H: { label: 'Herbicide', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  };

  const cfg = $derived(
    CONFIG[type] ?? {
      label: type,
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
    },
  );
</script>

<span
  class="inline-flex items-center rounded border px-1.5 py-0.5 text-xs leading-none font-semibold {cfg.bg} {cfg.text} {cfg.border}"
  title={cfg.label}
>
  {#if showLabel}
    {cfg.label}
  {:else}
    {type}
  {/if}
</span>
