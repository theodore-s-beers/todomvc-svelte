import App from './App.svelte'

const app = new App({
  target: document.querySelector('.todoapp') as HTMLElement
})

export default app
