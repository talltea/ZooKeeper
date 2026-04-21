<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { RELIC_TYPES, getRelicType } from '../domain/relics';
  import { data } from '../services/store';

  const dispatch = createEventDispatcher<{ close: void }>();

  $: earnedIds = new Set($data.relics.map((r) => r.type_id));
  $: earnedList = $data.relics
    .map((r) => ({ relic: r, type: getRelicType(r.type_id) }))
    .filter((x): x is { relic: typeof x.relic; type: NonNullable<typeof x.type> } => x.type !== null);
  $: lockedList = RELIC_TYPES.filter((t) => !earnedIds.has(t.id)).map((type) => ({
    type,
    progress: type.progress($data, Date.now()),
  }));
</script>

<svelte:window on:keydown={(e) => e.key === 'Escape' && dispatch('close')} />
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="overlay" role="dialog" aria-modal="true" aria-label="Relics" on:click|self={() => dispatch('close')}>
  <div class="panel">
    <header>
      <h2>Relics</h2>
      <button class="close-x" type="button" aria-label="Close" on:click={() => dispatch('close')}>×</button>
    </header>
    <p class="intro">
      Passive modifiers earned by using the app. Once earned, they're yours — no expirations.
    </p>

    <h3>Earned ({earnedList.length})</h3>
    {#if earnedList.length === 0}
      <p class="empty">None yet. Keep at it.</p>
    {:else}
      <ul class="list">
        {#each earnedList as { relic, type } (relic.id)}
          <li class="relic earned">
            <span class="icon">{type.icon}</span>
            <div class="body">
              <div class="name">{type.name}</div>
              <div class="desc">{type.description}</div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    <h3>Locked ({lockedList.length})</h3>
    {#if lockedList.length === 0}
      <p class="empty">You've earned them all.</p>
    {:else}
      <ul class="list">
        {#each lockedList as { type, progress } (type.id)}
          <li class="relic locked">
            <span class="icon" aria-hidden="true">{type.icon}</span>
            <div class="body">
              <div class="name">{type.name}</div>
              <div class="desc">{type.description}</div>
              <div class="hint">{type.hint}</div>
              <div class="bar" aria-label="progress">
                <div class="fill" style="width: {Math.min(100, (progress.current / progress.target) * 100)}%"></div>
              </div>
              <div class="progress-text">{progress.current} / {progress.target}</div>
            </div>
          </li>
        {/each}
      </ul>
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
  .panel {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.2rem;
    max-width: 560px;
    width: 100%;
    margin-top: 2rem;
  }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
  header h2 { margin: 0; font-size: 1.2rem; }
  .close-x {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.4rem;
  }
  .intro { color: var(--text-muted); font-size: 0.9rem; margin: 0 0 1rem; line-height: 1.4; }
  h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 1rem 0 0.5rem;
  }
  .empty { color: var(--text-muted); font-size: 0.9rem; margin: 0.3rem 0 0; }
  .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .relic {
    display: flex;
    gap: 0.7rem;
    padding: 0.7rem 0.9rem;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .relic.earned { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .relic.locked { opacity: 0.75; }
  .relic .icon { font-size: 1.6rem; line-height: 1; }
  .relic .body { flex: 1; }
  .relic .name { font-weight: 600; margin-bottom: 0.15rem; }
  .relic .desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.35; }
  .relic .hint { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem; font-style: italic; }
  .bar {
    height: 6px;
    background: var(--bg-elev2, rgba(255,255,255,0.08));
    border-radius: 999px;
    margin-top: 0.4rem;
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.3s ease;
  }
  .progress-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }
</style>
