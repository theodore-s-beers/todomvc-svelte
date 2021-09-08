<script lang="ts">
  import { onMount } from "svelte";

  export let valueAttr: string;
  export let keydownListener: EventListener;
  export let blurListener: EventListener;

  let editField: HTMLInputElement;

  onMount(() => {
    editField.focus();
  });
</script>

<input
  bind:this={editField}
  value={valueAttr}
  class="edit"
  on:keydown={keydownListener}
  on:blur={blurListener}
/>
