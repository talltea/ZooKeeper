<script lang="ts">
  import { data, createDraw, completeCard, snoozeCard } from '../services/store';
  import { overdueRatio } from '../domain/engine';
  import type { Card, Energy, DrawFilters } from '../domain/types';

  let selectedDecks: Set<string> = new Set();
  let energyCap: Energy | '' = '';
  let hand: Card[] = [];
  let poolSize = 0;
  let sessionId: string | undefined;
  let drewOnce = false;
  let flash: string | null = null;

  function toggleDeck(id: string): void {
    if (selectedDecks.has(id)) selectedDecks.delete(id);
    else selectedDecks.add(id);
    selectedDecks = selectedDecks;
  }

  function doDraw(): void {
    const filters: DrawFilters = {
      deck_ids: selectedDecks.size > 0 ? [...selectedDecks] : null,
      energy_cap: energyCap || undefined,
    };
    const res = createDraw(filters, 3);
    hand = res.cards;
    poolSize = res.poolSize;
    sessionId = res.session.id;
    drewOnce = true;
    flash = null;
  }

  function complete(card: Card): void {
    completeCard(card.id, sessionId);
    hand = hand.filter((c) => c.id !== card.id);
    flash = `Nice — marked "${card.title}" done ✓`;
  }

  function snooze(card: Card, days: number): void {
    snoozeCard(card.id, days);
    hand = hand.filter((c) => c.id !== card.id);
    flash = `Snoozed "${card.title}" for ${days}d`;
  }

  function pass(card: Card): void {
    hand = hand.filter((c) => c.id !== card.id);
  }

  function rarityLabel(ratio: number): string {
    if (ratio >= 3) return 'epic';
    if (ratio >= 2) return 'rare';
    if (ratio >= 1) return 'ready';
    return 'fresh';
  }

  function deckById(id: string) {
    return $data.decks.find((d) => d.id === id);
  }

  $: eligiblePool = $data.cards.filter((c) => {
    if (selectedDecks.size > 0 && !selectedDecks.has(c.deck_id)) return false;
    if (energyCap) {
      const rank = { low: 1, medium: 2, high: 3 };
      if (rank[c.energy] > rank[energyCap]) return false;
    }
    return true;
  }).length;
</script>

<section class="filters">
  <h3>Filters</h3>
  <div class="deck-chips">
    {#each $data.decks as deck}
      <button
        class="chip"
        class:active={selectedDecks.has(deck.id)}
        style="--chip: {deck.color}"
        on:click={() => toggleDeck(deck.id)}
      >
        {deck.icon} {deck.name}
      </button>
    {/each}
  </div>
  <label class="energy-row">
    Energy cap:
    <select bind:value={energyCap}>
      <option value="">any</option>
      <option value="low">low only</option>
      <option value="medium">low + medium</option>
      <option value="high">all</option>
    </select>
  </label>
  <p class="hint">{eligiblePool} cards match filters{selectedDecks.size === 0 ? ' (all decks)' : ''}</p>
</section>

<div class="draw-btn-wrap">
  <button class="primary draw-btn" on:click={doDraw}>🎴 Draw</button>
</div>

{#if flash}
  <div class="flash">{flash}</div>
{/if}

{#if drewOnce}
  {#if hand.length === 0}
    <p class="empty">No cards in your hand. {poolSize === 0 ? 'Nothing is overdue enough yet — everything is fresh.' : 'Draw again?'}</p>
  {:else}
    <div class="hand">
      {#each hand as card (card.id)}
        {@const ratio = overdueRatio(card, $data.completions, Date.now())}
        {@const rarity = rarityLabel(ratio)}
        {@const deck = deckById(card.deck_id)}
        <article class="card rarity-{rarity}" style="--deck-color: {deck?.color ?? '#fff'}">
          <div class="card-head">
            <span class="deck-tag">{deck?.icon} {deck?.name}</span>
            <span class="rarity">{rarity}</span>
          </div>
          <h3>{card.title}</h3>
          {#if card.notes}<p class="notes">{card.notes}</p>{/if}
          <div class="meta">
            <span>⚡ {card.energy}</span>
            <span>⏱ {card.duration_minutes}m</span>
            <span>every {card.target_interval_days}d</span>
          </div>
          <div class="actions">
            <button class="primary" on:click={() => complete(card)}>Done</button>
            <button on:click={() => pass(card)}>Pass</button>
            <button on:click={() => snooze(card, 1)}>Snooze 1d</button>
            <button on:click={() => snooze(card, 7)}>Snooze 7d</button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
{:else}
  <p class="empty">Tap <strong>Draw</strong> to get a suggestion.</p>
{/if}

<style>
  section.filters {
    background: var(--bg-elev);
    padding: 0.8rem 1rem;
    border-radius: 10px;
    margin-bottom: 1rem;
  }
  section.filters h3 { font-size: 0.9rem; margin-bottom: 0.6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .deck-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
  .chip {
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    font-size: 0.85rem;
    border-color: var(--border);
  }
  .chip.active {
    background: var(--chip, var(--accent));
    border-color: var(--chip, var(--accent));
    color: var(--on-chip);
    font-weight: 600;
  }
  .energy-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
  .energy-row select { width: auto; }
  .hint { font-size: 0.8rem; color: var(--text-muted); margin: 0.4rem 0 0; }

  .draw-btn-wrap { display: flex; justify-content: center; margin: 1rem 0; }
  .draw-btn { font-size: 1.2rem; padding: 0.8rem 2rem; border-radius: 999px; }

  .flash {
    background: var(--accent-ok);
    color: var(--on-chip);
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .empty { color: var(--text-muted); text-align: center; padding: 2rem; }

  .hand { display: grid; gap: 0.8rem; }
  .card {
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-left: 4px solid var(--deck-color);
    border-radius: 10px;
    padding: 0.9rem 1rem;
  }
  .card.rarity-rare { box-shadow: 0 0 0 1px #e8c97f40; border-color: #e8c97f; }
  .card.rarity-epic { box-shadow: 0 0 16px #e85a8a50; border-color: #e85a8a; }
  .card-head {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.3rem;
  }
  .rarity { text-transform: uppercase; letter-spacing: 0.08em; }
  .card.rarity-rare .rarity { color: #e8c97f; }
  .card.rarity-epic .rarity { color: #e85a8a; }
  .card h3 { font-size: 1.1rem; margin: 0.2rem 0 0.4rem; }
  .notes { font-size: 0.9rem; color: var(--text-muted); margin: 0 0 0.5rem; }
  .meta { display: flex; gap: 0.8rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
</style>
