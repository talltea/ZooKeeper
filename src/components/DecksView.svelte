<script lang="ts">
  import { data, upsertCard, deleteCard, completeCard, newCard } from '../services/store';
  import { lastCompletedAt, overdueRatio } from '../domain/engine';
  import CardEditor from './CardEditor.svelte';
  import type { Card } from '../domain/types';

  let editing: Card | null = null;
  let expandedDeck: string | null = null;

  function formatAgo(ts: number): string {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return 'today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  }

  function lastDone(card: Card): string {
    const completions = $data.completions.filter((c) => c.card_id === card.id);
    if (completions.length === 0) return 'never';
    const last = lastCompletedAt(card, $data.completions);
    return formatAgo(last);
  }

  function cardsForDeck(deckId: string): Card[] {
    return $data.cards
      .filter((c) => c.deck_id === deckId && !c.parent_card_id)
      .sort((a, b) => b.created_at - a.created_at);
  }

  function startNew(deckId: string): void {
    editing = newCard(deckId);
  }

  function save(card: Card): void {
    upsertCard(card);
    editing = null;
  }

  function cancel(): void {
    editing = null;
  }

  function markDone(card: Card): void {
    completeCard(card.id);
  }

  function remove(card: Card): void {
    if (confirm(`Delete "${card.title}"? This also removes its completion history.`)) {
      deleteCard(card.id);
    }
  }
</script>

{#if editing}
  <CardEditor card={editing} decks={$data.decks} on:save={(e) => save(e.detail)} on:cancel={cancel} />
{:else}
  {#each $data.decks as deck}
    {@const cards = cardsForDeck(deck.id)}
    <section class="deck" style="--deck-color: {deck.color}">
      <button class="deck-header" type="button" on:click={() => expandedDeck = expandedDeck === deck.id ? null : deck.id}>
        <span class="icon">{deck.icon}</span>
        <h2>{deck.name}</h2>
        <span class="count">{cards.length}</span>
        <span class="chevron">{expandedDeck === deck.id ? '▾' : '▸'}</span>
      </button>
      {#if expandedDeck === deck.id}
        <div class="card-list">
          {#each cards as card (card.id)}
            {@const ratio = overdueRatio(card, $data.completions, Date.now())}
            <div class="row">
              <div class="row-main">
                <div class="title">{card.title}</div>
                <div class="sub">
                  <span>every {card.target_interval_days}d</span>
                  <span>• last: {lastDone(card)}</span>
                  <span>• {ratio >= 1 ? '🔥' : ratio >= 0.5 ? '⏳' : '💤'} {ratio.toFixed(1)}×</span>
                </div>
              </div>
              <div class="row-actions">
                <button on:click={() => markDone(card)} title="Mark done">✓</button>
                <button on:click={() => editing = { ...card }} title="Edit">✎</button>
                <button class="danger" on:click={() => remove(card)} title="Delete">🗑</button>
              </div>
            </div>
          {/each}
          <button class="add" on:click={() => startNew(deck.id)}>+ Add card to {deck.name}</button>
        </div>
      {/if}
    </section>
  {/each}
{/if}

<style>
  .deck {
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-left: 4px solid var(--deck-color);
    border-radius: 10px;
    margin-bottom: 0.8rem;
    overflow: hidden;
  }
  .deck-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.8rem 1rem;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 0;
    width: 100%;
    text-align: left;
    color: inherit;
  }
  .deck-header h2 { font-size: 1.05rem; margin: 0; flex: 1; }
  .deck .icon { font-size: 1.3rem; }
  .count { color: var(--text-muted); font-size: 0.9rem; }
  .chevron { color: var(--text-muted); }
  .card-list { padding: 0 1rem 0.8rem; display: grid; gap: 0.4rem; }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    background: var(--bg-elev2);
    border-radius: 6px;
  }
  .row-main { flex: 1; min-width: 0; }
  .title { font-weight: 500; }
  .sub { font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .row-actions { display: flex; gap: 0.3rem; }
  .row-actions button { padding: 0.3rem 0.5rem; font-size: 0.9rem; }
  .add {
    margin-top: 0.4rem;
    background: transparent;
    border-style: dashed;
    color: var(--text-muted);
  }
</style>
