<script lang="ts">
  import { onMount } from "svelte";

  export let valueAttr;
  export let keydownListener;
  export let blurListener;

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
