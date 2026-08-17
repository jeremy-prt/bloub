import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  /*
   * Le plugin Vue est la pour un seul FICHIER, `ui/capture.test.ts` : il monte `BloubBot.vue`
   * parce que le rendu exporte doit etre celui du composant, pas un second dessin monte a
   * cote. Sans le plugin, importer `capture.ts` suffit a faire echouer la collecte.
   *
   * Il ne change rien aux autres : `src/bot/` n'importe aucun `.vue`, et l'environnement
   * reste `node` par defaut — un DOM se demande fichier par fichier, en tete de celui qui en
   * a besoin (`// @vitest-environment happy-dom`). C'est ce qui garde la suite a quelques
   * secondes.
   */
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
})
