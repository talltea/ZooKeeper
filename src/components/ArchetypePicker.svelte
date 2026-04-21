<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ARCHETYPES } from '../domain/archetypes';
  import { data, setArchetype } from '../services/store';

  export let dismissable = true;

  const dispatch = createEventDispatcher<{ picked: { id: string }; close: void }>();

  function pick(id: string): void {
    setArchetype(id);
    dispatch('picked', { id });
  }

  $: current = $data.archetype_id;
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Archetype picker">
  <div class="picker">
    <h2>Pick your archetype</h2>
    <p class="intro">
      Archetypes gently bias which cards surface. No content is locked — switch any time.
      {#if !current}The <strong>Generalist</strong> is a safe default if you want no bias.{/if}
    </p>
    <div class="grid">
      {#each ARCHETYPES as a (a.id)}
        <button
          class="arch"
          class:active={current === a.id}
          type="button"
          on:click={() => pick(a.id)}
        >
          <div class="row">
            <span class="icon" aria-hidden="true">{a.icon}</span>
            <span class="name">{a.name}</span>
            {#if a.hand_size}<span class="badge">hand of {a.hand_size}</span>{/if}
            {#if current === a.id}<span class="badge current">current</span>{/if}
          </div>
          <div class="desc">{a.description}</div>
        </button>
      {/each}
    </div>
    {#if dismissable}
      <button class="close" type="button" on:click={() => dispatch('close')}>Done</button>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    z-index: 1000;
    overflow-y: auto;
  }
  .picker {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.2rem;
    max-width: 560px;
    width: 100%;
    margin-top: 2rem;
  }
  h2 { margin: 0 0 0.3rem; font-size: 1.2rem; }
  .intro { color: var(--text-muted); font-size: 0.9rem; margin: 0 0 1rem; line-height: 1.4; }
  .grid { display: grid; gap: 0.5rem; }
  .arch {
    display: block;
    text-align: left;
    padding: 0.7rem 0.9rem;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: inherit;
    width: 100%;
    cursor: pointer;
  }
  .arch.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .arch .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  .arch .icon { font-size: 1.4rem; }
  .arch .name { font-weight: 600; flex: 1; }
  .arch .badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    background: var(--bg-elev2);
    border-radius: 999px;
    color: var(--text-muted);
  }
  .arch .badge.current { background: var(--accent); color: var(--on-chip); }
  .arch .desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.35; }
  .close { margin-top: 1rem; width: 100%; }
</style>
