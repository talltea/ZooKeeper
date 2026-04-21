<script lang="ts">
  import { data } from './services/store';
  import { computeStreak } from './domain/engine';
  import DrawView from './components/DrawView.svelte';
  import DecksView from './components/DecksView.svelte';

  type Tab = 'draw' | 'decks';
  let tab: Tab = 'draw';

  $: streak = computeStreak($data.usage_days, Date.now());
  $: totalCards = $data.cards.length;
  $: totalCompletions = $data.completions.length;
</script>

<header>
  <h1>🦁 Zoo Keeper</h1>
  <div class="meta">
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
</style>
