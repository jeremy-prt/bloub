<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '@/i18n'

export type ViewId = 'animations' | 'personnaliser' | 'reglages'

const view = defineModel<ViewId>({ default: 'personnaliser' })

/**
 * `computed` et pas une constante de module : les libelles changent avec la
 * langue, et un tableau construit a l'import resterait dans celle du demarrage.
 */
const ITEMS = computed<Array<{ id: ViewId; label: string }>>(() => [
  { id: 'personnaliser', label: t('rail.customize') },
  { id: 'animations', label: t('rail.animations') },
  { id: 'reglages', label: t('rail.settings') }
])

/**
 * Icone dont l'infobulle est masquee jusqu'a ce que le pointeur reparte : une
 * fois le clic fait la vue a change, l'infobulle n'a plus rien a annoncer et
 * rester affichee sous le curseur donne l'impression qu'elle est coincee.
 * `pointerdown` et pas `click` : au clavier (Entree) rien n'est masque, la
 * l'infobulle est la seule indication de ce qu'on vient de choisir.
 */
const muted = ref<ViewId | null>(null)
</script>

<template>
  <!--
    Deux dispositions, et c'est la mise en page de la page qui les impose.

    A partir de 64rem la scene est une grille de trois colonnes bordee de marges
    larges : le rail flotte dans celle de gauche sans rien recouvrir. En dessous
    tout s'empile sur la largeur entiere, et ce meme flottement tombait en plein
    milieu du contenu — mesure a 375 px : la pilule couvrait le titre du panneau
    des animations et le flanc gauche de l'avatar dans les reglages.

    Il passe donc en BANDE HAUTE, horizontale et centree, et la scene lui reserve
    sa hauteur (`max-lg:pt-20` dans `App.vue`). En haut et pas en bas : la barre
    de montage occupe deja le bas de la fenetre dans les animations, et empiler
    les deux prenait 260 px sur 812.
  -->
  <nav
    class="fixed top-3 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-[var(--line)] bg-white/85 p-1.5 shadow-sm backdrop-blur lg:top-1/2 lg:left-4 lg:translate-x-0 lg:-translate-y-1/2"
    :aria-label="t('rail.nav')"
  >
    <ul class="flex gap-1 lg:flex-col">
      <li
        v-for="item in ITEMS"
        :key="item.id"
        class="group relative"
        @pointerleave="muted = null"
      >
        <button
          type="button"
          class="peer flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition"
          :class="
            view === item.id
              ? 'bg-[var(--ink)] text-[var(--paper)]'
              : 'text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]'
          "
          :aria-label="item.label"
          :aria-current="view === item.id ? 'page' : undefined"
          @pointerdown="muted = item.id"
          @click="view = item.id"
        >
          <!--
            Les trois icones viennent de bibliotheques, pas d'un trace maison :
            les formes pleines et arrondies tiennent a 18 px, ce que ne faisaient
            pas les contours fins d'avant. Les traces sont recopies tels quels
            depuis les paquets Iconify — pour en changer, prendre le corps du
            `<symbol>` dans `@iconify-json/<paquet>`, pas le redessiner. Ce sont
            les seules formes du projet qui ne sont PAS relevees sur la video.

            Animations : le clap de Solar (`solar:clapperboard-play-bold`).
          -->
          <svg
            v-if="item.id === 'animations'"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <g fill="currentColor">
              <path d="M12 2C13.8452 2 15.3293 2 16.5401 2.08783L13.0986 7.25002H8.40139L11.9014 2H12Z" />
              <path d="M3.46447 3.46447C4.71683 2.2121 6.62194 2.03072 10.0957 2.00445L6.59861 7.25002H2.10418C2.25143 5.48593 2.6068 4.32213 3.46447 3.46447Z" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 10.7633 2 9.68875 2.02644 8.75002H21.9736C22 9.68875 22 10.7633 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12ZM13.014 12.5852C14.338 13.4395 15 13.8666 15 14.5C15 15.1334 14.338 15.5605 13.014 16.4148C11.6719 17.2807 11.0008 17.7137 10.5004 17.3958C10 17.0779 10 16.2186 10 14.5C10 12.7814 10 11.9221 10.5004 11.6042C11.0008 11.2863 11.6719 11.7193 13.014 12.5852Z" />
              <path d="M21.8958 7.25002C21.7486 5.48593 21.3932 4.32213 20.5355 3.46447C19.9382 2.86714 19.1924 2.51345 18.1987 2.30403L14.9014 7.25002H21.8958Z" />
            </g>
          </svg>
          <!--
            Reglages : la roue dentee de Solar (`solar:settings-bold`). Elle est
            centree sur x = 12,5 et non 12 dans sa boite : c'est le trace de la
            bibliotheque, ne pas le « recentrer », le decalage est invisible a
            18 px et toucher aux coordonnees deforme les dents.
          -->
          <svg
            v-else-if="item.id === 'reglages'"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z"
            />
          </svg>
          <!--
            Personnaliser : la palette de Remix (`ri:palette-fill`) et pas celle
            de Solar, qui se lit mal a cette taille. Melange de bibliotheques
            assume : c'est la seule des trois ou Solar ne convenait pas.
          -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2c5.522 0 10 3.978 10 8.889a5.56 5.56 0 0 1-5.556 5.555h-1.966c-.922 0-1.667.745-1.667 1.667c0 .422.167.811.422 1.1c.267.3.434.689.434 1.122C13.667 21.256 12.9 22 12 22C6.478 22 2 17.522 2 12S6.478 2 12 2M7.5 12a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m9 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3M12 9a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3"
            />
          </svg>
        </button>

        <!--
          Infobulle au survol ET au focus clavier : sinon la barre n'est
          utilisable qu'a la souris. `peer-focus-visible` et pas `focus-within` :
          apres un clic souris le bouton garde le focus, et l'infobulle restait
          affichee alors que le pointeur etait deja parti. Passer par `peer`
          (frere du bouton) plutot que par `group-has-[:focus-visible]` : dans
          `:has()`, Chromium ne reevalue pas `:focus-visible` et l'infobulle
          restait collee a l'ecran.
        -->
        <!--
          L'infobulle suit le rail : sous le bouton quand la barre est en haut, a
          sa droite quand elle est sur le flanc. Elle ne fait que se FONDRE sur
          petit ecran, la ou elle glisse a partir de 64rem : le glissement s'ecrit
          sur `translate-x`, deja pris par le centrage horizontal en bande haute,
          et deux valeurs sur le meme axe s'ecrasent au lieu de se composer.
        -->
        <span
          class="pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-xs whitespace-nowrap text-[var(--paper)] opacity-0 transition peer-focus-visible:opacity-100 group-hover:opacity-100 lg:top-1/2 lg:left-full lg:mt-0 lg:ml-2 lg:-translate-y-1/2 lg:translate-x-1 lg:peer-focus-visible:translate-x-0 lg:group-hover:translate-x-0"
          :class="muted === item.id && 'opacity-0! lg:translate-x-1!'"
          role="tooltip"
        >
          {{ item.label }}
        </span>
      </li>
    </ul>
  </nav>
</template>
