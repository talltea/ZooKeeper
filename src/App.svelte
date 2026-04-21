<script lang="ts">
  import { data } from './services/store';
  import { computeStreak } from './domain/engine';
  import { getArchetype } from './domain/archetypes';
  import DrawView from './components/DrawView.svelte';
  import DecksView from './components/DecksView.svelte';
  import ArchetypePicker from './components/ArchetypePicker.svelte';

  type Tab = 'draw' | 'decks';
  let tab: Tab = 'draw';
  let showPicker = false;

  $: streak = computeStreak($data.usage_days, Date.now());
  $: totalCards = $data.cards.length;
  $: totalCompletions = $data.completions.length;
  $: archetype = getArchetype($data.archetype_id);
  $: needsOnboarding = $data.archetype_id === null;
</script>

<header>
  <h1>🦁 Zoo Keeper</h1>
  <div class="meta">
    <button
      class="arch-chip"
      type="button"
      on:click={() => showPicker = true}
      title={archetype ? `Archetype: ${archetype.name}` : 'Pick an archetype'}
    >
      {#if archetype}
        {archetype.icon} {archetype.name.replace(/^The /, '')}
      {:else}
        🎲 pick
      {/if}
    </button>
    <span title="Streak">🔥 {streak}d</span>
    <span title="Cards">🃏 {totalCards}</span>
    <span title="Completions">✓ {totalCompletions}</span>
  </div>
</header>

<nav>
  <button class:active={tab === 'draw'} on:click={() => tab = 'draw'}>Draw</button>
  <button class:active={tab === 'decks'} on:click={() => tab = 'decks'}>Decks</button>
</nav>

<main>
  {#if tab === 'draw'}
    <DrawView />
  {:else}
    <DecksView />
  {/if}
</main>

{#if needsOnboarding || showPicker}
  <ArchetypePicker
    dismissable={!needsOnboarding}
    on:close={() => (showPicker = false)}
    on:picked={() => (showPicker = false)}
  />
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  header h1 { font-size: 1.4rem; }
  .meta { display: flex; gap: 0.8rem; color: var(--text-muted); font-size: 0.9rem; }
  nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.5rem;
  }
  nav button {
    background: transparent;
    border: none;
    padding: 0.5rem 0.8rem;
    color: var(--text-muted);
  }
  nav button.active {
    color: var(--accent);
    font-weight: 600;
  }
  .arch-chip {
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    border-radius: 999px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
  }
</style>
