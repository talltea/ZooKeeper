<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Card, Deck } from '../domain/types';

  export let card: Card;
  export let decks: Deck[];

  const dispatch = createEventDispatcher<{ save: Card; cancel: void }>();

  function save(): void {
    if (!card.title.trim()) return;
    dispatch('save', card);
  }
</script>

<form on:submit|preventDefault={save} class="editor">
  <h2>{card.title ? 'Edit card' : 'New card'}</h2>

  <label>
    Title
    <input bind:value={card.title} placeholder="e.g. Do the dishes" required />
  </label>

  <label>
    Deck
    <select bind:value={card.deck_id}>
      {#each decks as deck}
        <option value={deck.id}>{deck.icon} {deck.name}</option>
      {/each}
    </select>
  </label>

  <label>
    Notes
    <textarea bind:value={card.notes} rows="2" />
  </label>

  <div class="row">
    <label>
      Every (days)
      <input type="number" min="1" bind:value={card.target_interval_days} />
    </label>
    <label>
      Duration (min)
      <input type="number" min="1" bind:value={card.duration_minutes} />
    </label>
  </div>

  <div class="row">
    <label>
      Energy
      <select bind:value={card.energy}>
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
    </label>
    <label>
      Time
      <select bind:value={card.time_of_day}>
        <option value="any">any</option>
        <option value="morning">morning</option>
        <option value="day">day</option>
        <option value="evening">evening</option>
      </select>
    </label>
  </div>

  <div class="actions">
    <button type="submit" class="primary">Save</button>
    <button type="button" on:click={() => dispatch('cancel')}>Cancel</button>
  </div>
</form>

<style>
  .editor { display: grid; gap: 0.7rem; background: var(--bg-elev); padding: 1rem; border-radius: 10px; }
  label { display: grid; gap: 0.25rem; font-size: 0.85rem; color: var(--text-muted); }
  label input, label select, label textarea { color: var(--text); }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }
</style>
