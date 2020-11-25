<script lang="ts">
  import { onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";

  import EditField from "./EditField.svelte";

  let currentFilter = "all";

  interface TodoItem {
    id: string;
    description: string;
    completed: boolean;
  }

  let items: TodoItem[] = [];

  let editing: number = null;

  try {
    items = JSON.parse(localStorage.getItem("todos-svelte")) || [];
  } catch (err) {
    items = [];
  }

  const updateView = () => {
    currentFilter = "all";
    if (window.location.hash === "#active") {
      currentFilter = "active";
    } else if (window.location.hash === "#completed") {
      currentFilter = "completed";
    }
  };

  window.addEventListener("hashchange", updateView);

  updateView();

  function clearCompleted() {
    items = items.filter((item) => !item.completed);
  }

  function remove(index: number) {
    items = items.slice(0, index).concat(items.slice(index + 1));
  }

  function toggleAll(event: Event) {
    items = items.map((item) => ({
      id: item.id,
      description: item.description,
      completed: (event.target as HTMLInputElement).checked,
    }));
  }

  function createNew(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (newTodoField.value.length > 0) {
        items = items.concat({
          id: uuidv4(),
          description: newTodoField.value,
          completed: false,
        });
        newTodoField.value = "";
      }
    }
  }

  function handleEdit(event: KeyboardEvent) {
    const editItemField = event.target as HTMLInputElement;
    if (event.key === "Enter") {
      editItemField.blur();
    } else if (event.key === "Escape" || event.key === "Esc") {
      editItemField.value = items[editing].description;
      editItemField.blur();
    }
  }

  function submit(event: Event) {
    items[editing].description = (event.target as HTMLInputElement).value;
    editing = null;
  }

  function toggleCompleted(item: TodoItem) {
    items = items.map((todo) => {
      if (item.id === todo.id) return { ...todo, completed: !todo.completed };
      return todo;
    });
  }

  $: filtered =
    currentFilter === "all"
      ? items
      : currentFilter === "completed"
      ? items.filter((item) => item.completed)
      : items.filter((item) => !item.completed);

  $: numActive = items.filter((item) => !item.completed).length;
  $: numCompleted = items.filter((item) => item.completed).length;

  $: try {
    localStorage.setItem("todos-svelte", JSON.stringify(items));
  } catch (err) {
    // noop
  }

  let newTodoField: HTMLInputElement;

  onMount(() => {
    newTodoField.focus();
  });
</script>

<svelte:head>
  <meta
    name="description"
    content="An implementation of TodoMVC using the Svelte framework with
    TypeScript" />
</svelte:head>

<header class="header">
  <h1>todos</h1>

  <input
    bind:this={newTodoField}
    class="new-todo"
    on:keydown={createNew}
    placeholder="What needs to be done?"
    aria-label="What needs to be done?" />
</header>

{#if items.length > 0}
  <section class="main">
    <input
      id="toggle-all"
      class="toggle-all"
      type="checkbox"
      on:change={toggleAll}
      checked={numCompleted === items.length} />
    <label for="toggle-all">Mark all as complete</label>

    <ul class="todo-list">
      {#each filtered as item, index (item.id)}
        <li
          class="{item.completed ? 'completed' : ''}
            {editing === index ? 'editing' : ''}">
          <div class="view">
            <input
              class="toggle"
              type="checkbox"
              checked={item.completed}
              on:click={() => toggleCompleted(item)} />

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label on:dblclick={() => (editing = index)}>
              {item.description}
            </label>

            <button on:click={() => remove(index)} class="destroy" />
          </div>

          {#if editing === index}
            <EditField
              valueAttr={item.description}
              keydownListener={handleEdit}
              blurListener={submit} />
          {/if}
        </li>
      {/each}
    </ul>

    <footer class="footer">
      <span class="todo-count">
        <strong>{numActive}</strong>
        {numActive === 1 ? 'item' : 'items'}
        left
      </span>

      <ul class="filters">
        <li>
          <a class={currentFilter === 'all' ? 'selected' : ''} href="#all">
            All
          </a>
        </li>
        <li>
          <a
            class={currentFilter === 'active' ? 'selected' : ''}
            href="#active">
            Active
          </a>
        </li>
        <li>
          <a
            class={currentFilter === 'completed' ? 'selected' : ''}
            href="#completed">
            Completed
          </a>
        </li>
      </ul>

      {#if numCompleted}
        <button class="clear-completed" on:click={clearCompleted}>
          Clear completed
        </button>
      {/if}
    </footer>
  </section>
{/if}
