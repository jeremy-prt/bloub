/**
 * Capture de l'avatar en image. C'est la couche DOM de l'export : elle a besoin
 * d'un canvas et du presse-papiers, donc rien ici n'est testable en `node` — le
 * cadrage et le nommage, eux, vivent dans `export.ts` et le sont.
 *
 * Le SVG exporte est celui de l'ECRAN, recadre : on serialise le noeud vivant
 * plutot que de reconstruire un rendu a cote. Deux sources de dessin auraient
 * derive, et le moteur est deja la seule qui vaille. C'est possible parce que le
 * SVG du bot est deja auto-porteur : aucune `var(--...)`, aucune classe, chaque
 * forme porte son `fill` en hex.
 */

import { createApp, h, nextTick, ref } from 'vue'
import BloubBot from '@/components/BloubBot.vue'
import type { Block } from '@/bot/cycles'
import { gifAnime, gifIndexe, indexe, nouvellePalette, recense, svgAnime } from './anime'
import { arrete, DEMI_ECRAN, sansCommentaires, viewBoxExport } from './export'

/**
 * Serialise le SVG affiche en un document autonome, recadre sur la boule.
 *
 * `width`/`height` sont poses explicitement et ce n'est pas cosmetique : sans
 * dimension intrinseque, Firefox refuse de rasteriser un SVG charge dans une
 * `<img>`, et le canvas ressort vide.
 */
export function svgAutonome(svg: SVGSVGElement, taille: number, viewBox = viewBoxExport()) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  // Les classes Tailwind de la page n'existent pas dans le fichier livre.
  clone.removeAttribute('class')
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('viewBox', viewBox)
  clone.setAttribute('width', String(taille))
  clone.setAttribute('height', String(taille))
  return sansCommentaires(new XMLSerializer().serializeToString(clone))
}

/**
 * Rasterise un SVG dans un canvas et rend son contexte.
 *
 * Passe par un blob et non par une `data:` URL : `btoa` casse sur les accents de
 * l'`aria-label`, et l'encodage en pourcents d'un SVG entier est inutilement
 * long. L'URL est relachee dans un `finally` — un objet non revoque tient le blob
 * en memoire jusqu'au rechargement de la page.
 *
 * Le canvas n'est jamais souille : le SVG du bot n'a ni `<foreignObject>` ni
 * `<image>`, les deux seules choses qui feraient echouer `toBlob`.
 */
async function dessine(
  markup: string,
  taille: number,
  canvas: HTMLCanvasElement,
  fond: string | null = null
) {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()

    canvas.width = taille
    canvas.height = taille
    // `alpha` par defaut : c'est ce qui laisse le fond transparent quand aucune
    // couleur n'est demandee. Le bot s'exporte alors en vignette detachee.
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas indisponible')
    // Le canvas est reutilise d'une image a l'autre pour l'export anime : sans
    // effacement, une image aux yeux fermes garderait les yeux ouverts dessous.
    ctx.clearRect(0, 0, taille, taille)
    if (fond) {
      ctx.fillStyle = fond
      ctx.fillRect(0, 0, taille, taille)
    }
    ctx.drawImage(img, 0, 0, taille, taille)
    return ctx
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Rasterise un SVG en PNG. Le PNG est sans perte, il n'a pas de qualite a regler. */
export async function versPng(markup: string, taille: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await dessine(markup, taille, canvas)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encodage png impossible'))),
      'image/png'
    )
  })
}

/** Declenche le telechargement d'un blob sous le nom donne. */
export function telecharge(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = nom
    a.click()
  } finally {
    // Differe : Safari lit encore l'URL apres le clic sur un gros blob.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}

/** Le presse-papiers sait-il ecrire une image ici ? */
export function copiePossible() {
  return (
    typeof ClipboardItem !== 'undefined' &&
    !!navigator.clipboard?.write &&
    // `supports` est recent : son absence n'est pas un refus.
    (ClipboardItem.supports?.('image/png') ?? true)
  )
}

/**
 * Copie une image dans le presse-papiers.
 *
 * Le blob est passe en PROMESSE et non attendu avant l'appel : Safari exige que
 * `write` part du geste de l'utilisateur, or tout `await` glisse entre les deux
 * perd ce geste et la copie est refusee.
 */
export async function copie(blob: Promise<Blob>) {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

/**
 * Copie le SVG en TEXTE et non comme image : c'est sous cette forme que Figma,
 * Illustrator et un editeur de code le collent en vectoriel modifiable. Colle en
 * `image/svg+xml`, il ressortirait aplati la ou il ressort editable ici.
 */
export async function copieTexte(texte: string) {
  await navigator.clipboard.writeText(texte)
}

/** Combien d'images faites sur combien, pour la barre de progression. */
export type Avancement = (fait: number, total: number) => void

/**
 * Exporte le cycle en MP4.
 *
 * Le fond est OBLIGATOIRE et non optionnel : la video n'a pas d'alpha (verifie,
 * `VideoEncoder` refuse `alpha: 'keep'`). Sans fond, le bot serait compose sur du
 * noir.
 */
export async function cycleVersMp4(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  images: number,
  pas: number,
  fond: string,
  avance?: Avancement,
  signal?: AbortSignal
): Promise<Blob> {
  const { versMp4 } = await import('./video')
  const canvas = document.createElement('canvas')
  const lecteur = await ouvreCycle(reglages, blocs, taille, fond)
  try {
    return await versMp4(
      canvas,
      images,
      Math.round(1 / pas),
      async (i) => {
        const svg = await lecteur.rendre(i * pas)
        await dessine(svgAutonome(svg, taille, viewBoxExport(DEMI_ECRAN)), taille, canvas, fond)
      },
      avance,
      signal
    )
  } finally {
    lecteur.ferme()
  }
}

/**
 * Exporte le cycle en GIF.
 *
 * DEUX passes sur la sequence, et c'est pour la memoire : un GIF a besoin d'une
 * palette commune a toutes les images, donc de les avoir toutes vues avant d'en
 * encoder une seule. Les garder en pixels bruts couterait 255 Mo sur un cycle de
 * trente secondes. La premiere passe ne retient que les couleurs, la seconde
 * encode — le rendu est deterministe, donc rejouer la sequence redonne exactement
 * les memes images.
 *
 * Ce determinisme repose sur le fait que le LECTEUR est idempotent : rejouer l'image 0
 * apres une passe complete doit redonner exactement l'image 0. Ca n'a pas toujours ete le
 * cas — le moteur garde l'etat precedent pour ses fondus, si bien que le premier etat se
 * melangeait avec le DERNIER et que le GIF par defaut s'ouvrait sur une boule sans yeux,
 * la comete ayant un `eyeAlpha` nul. La palette, elle, avait ete comptee sur des images
 * qui n'etaient pas celles encodees. C'est `rendAt` qui rembobine desormais, et
 * `capture.test.ts` le verrouille — sans quoi ce module devrait ouvrir un lecteur par
 * passe pour s'en sortir.
 */
export async function cycleVersGif(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  images: number,
  pas: number,
  fond: string | null,
  avance?: Avancement,
  signal?: AbortSignal
): Promise<Blob> {
  // Un seul canvas et un seul lecteur pour les deux passes : le canvas est reinitialise a
  // chaque image, et le lecteur sait rembobiner.
  const canvas = document.createElement('canvas')
  const vue = viewBoxExport(DEMI_ECRAN)
  const lecteur = await ouvreCycle(reglages, blocs, taille, fond ?? undefined)

  /** Une passe complete sur la sequence. */
  const passe = async (lis: (index: number, pixels: Uint8ClampedArray) => void) => {
    for (let i = 0; i < images; i++) {
      // teste a chaque image : un cycle de trente secondes fait deux fois six cents
      // images, et l'abandon ne doit pas attendre la fin d'une passe
      arrete(signal)
      const svg = await lecteur.rendre(i * pas)
      const ctx = await dessine(svgAutonome(svg, taille, vue), taille, canvas, fond)
      lis(i, ctx.getImageData(0, 0, taille, taille).data)
    }
  }

  try {
    const palette = nouvellePalette()
    await passe((i, pixels) => {
      recense(palette, pixels)
      avance?.(i + 1, images * 2)
    })

    const morceaux: Uint8Array[] = []
    await passe((i, pixels) => {
      morceaux.push(indexe(palette, pixels))
      avance?.(images + i + 1, images * 2)
    })

    return new Blob([gifIndexe(palette, morceaux, taille, taille, Math.round(pas * 1000))], {
      type: 'image/gif'
    })
  } finally {
    lecteur.ferme()
  }
}

/** Ce que le bot doit porter sur l'animation exportee. */
export interface ReglagesBot {
  shape: string
  color: string
  expression: string
}

/**
 * Rend la sequence image par image, sur une instance HORS ECRAN.
 *
 * Pas de capture de l'avatar affiche, et c'est deliberé : a l'ecran le bot est
 * a une date d'horloge quelconque, alors qu'ici on veut une sequence
 * reproductible qui commence au debut. C'est possible parce que `engine.sample(t)`
 * est une fonction pure du temps — la meme date redonne toujours la meme image —
 * et parce qu'un `BloubBot` a qui on donne `frozenAt` ne lance aucune boucle
 * d'animation ni aucun ecouteur : on le fait avancer nous-memes.
 *
 * Le meme composant sert donc a l'ecran et a l'export : une seule source de
 * dessin, aucune chance de derive.
 */
export async function sequenceDuBot<T>(
  reglages: ReglagesBot,
  taille: number,
  nombre: number,
  pas: number,
  lis: (svg: SVGSVGElement, index: number) => T | Promise<T>,
  /**
   * Couleur des yeux. Ce sont des TROUS remplis de cette teinte, donc sur un
   * export a fond plein elle doit valoir exactement celle du fond — sinon
   * l'ancienne teinte du site reste visible dedans, en anneau plus sombre.
   */
  paper?: string
): Promise<T[]> {
  const hote = document.createElement('div')
  // hors du flux et hors de vue, mais RENDU : un `display:none` ne donnerait pas
  // de SVG a serialiser.
  hote.style.cssText = 'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden'
  document.body.appendChild(hote)

  const date = ref(0)
  const app = createApp({
    render: () =>
      h(BloubBot, { ...reglages, size: taille, frozenAt: date.value, ...(paper ? { paper } : {}) })
  })
  app.mount(hote)

  try {
    const out: T[] = []
    for (let i = 0; i < nombre; i++) {
      date.value = i * pas
      await nextTick()
      const svg = hote.querySelector('svg')
      if (!svg) throw new Error('bot hors ecran non rendu')
      out.push(await lis(svg, i))
    }
    return out
  } finally {
    app.unmount()
    hote.remove()
  }
}

/**
 * Rend un CYCLE hors ecran, image par image, en appelant `lis` pour chacune.
 *
 * Les images ne sont jamais accumulees : un cycle de trente secondes fait plus de
 * six cents images, soit 255 Mo de pixels bruts si on les gardait toutes. C'est
 * l'appelant qui decide quoi en faire au fil de l'eau — encoder, indexer, jeter.
 *
 * Le rendu passe par `rendAt` et non par `frozenAt` : seul `rendAt` parcourt les
 * blocs en datant chaque changement d'etat a son offset absolu, ce qui donne les
 * memes fondus aux jointures que la lecture temps reel. Voir sa doc dans
 * `BloubBot.vue`.
 */
export interface LecteurHorsEcran {
  /** Rend l'instant `t` du cycle et renvoie le SVG a lire. */
  rendre: (t: number) => Promise<SVGSVGElement>
  ferme: () => void
}

export async function ouvreCycle(
  reglages: ReglagesBot,
  blocs: Block[],
  taille: number,
  paper?: string
): Promise<LecteurHorsEcran> {
  const hote = document.createElement('div')
  hote.style.cssText = 'position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden'
  document.body.appendChild(hote)

  const bot = ref<{ rendAt: (t: number) => void } | null>(null)
  const app = createApp({
    render: () =>
      h(BloubBot, {
        ...reglages,
        size: taille,
        cycle: blocs,
        /*
         * Le moteur se construit sur l'etat qu'on lui donne, et l'image 0 doit
         * etre le PREMIER etat du montage. Sans cette prop le modele prenait son
         * defaut `idle` : un montage commencant par l'orbite s'ouvrait sur une
         * boule au repos qui morphait vers le triangle pendant 0,6 s. C'est la
         * meme precaution qu'a l'ecran, ou `state` est amorce sur le bloc courant
         * « pour ne pas entrer en morphant depuis un etat qui n'a jamais ete
         * affiche » (cf. `App.vue`).
         */
        state: blocs[0]?.state ?? 'idle',
        frozenAt: 0,
        ref: bot,
        ...(paper ? { paper } : {})
      })
  })
  app.mount(hote)
  await nextTick()

  const svg = hote.querySelector('svg')
  if (!svg || !bot.value) {
    app.unmount()
    hote.remove()
    throw new Error('bot hors ecran non rendu')
  }

  return {
    rendre: async (t: number) => {
      bot.value!.rendAt(t)
      await nextTick()
      return svg
    },
    ferme: () => {
      app.unmount()
      hote.remove()
    }
  }
}

/**
 * Les matrices des yeux d'une image, lues sur le masque.
 *
 * Les yeux sont les seules formes du masque a porter un `transform` — le corps
 * n'en a pas — donc l'ordre du document suffit a les identifier.
 */
function matricesDesYeux(svg: SVGSVGElement) {
  return [...svg.querySelectorAll('mask [transform]')].map((e) => e.getAttribute('transform')!)
}

/**
 * Assemble l'animation du bot en un SVG anime.
 *
 * Le corps est celui de la premiere image et n'est pas anime : au repos la
 * silhouette ne se deplace que de 1,17 unite sur un rayon de 100, soit environ un
 * pixel et demi. Tout le mouvement est dans les yeux.
 */
export async function versSvgAnime(
  reglages: ReglagesBot,
  taille: number,
  nombre: number,
  pas: number
): Promise<Blob> {
  let base = ''
  const matrices = await sequenceDuBot(reglages, taille, nombre, pas, (svg, i) => {
    if (i === 0) base = svgAutonome(svg, taille)
    return matricesDesYeux(svg)
  })
  const markup = svgAnime(base, matrices, +((nombre - 1) * pas).toFixed(3))
  return new Blob([markup], { type: 'image/svg+xml' })
}

/**
 * Assemble l'animation du bot en GIF anime.
 *
 * Le GIF est un vrai feuilletage : il faut donc rasteriser chaque image, la ou le
 * SVG anime ne collecte que des matrices. Il n'existe que pour les endroits qui
 * refusent le SVG — un avatar anime Discord ou Slack — et son bord sera dur, sa
 * transparence n'ayant qu'un bit.
 */
export async function versGifAnime(
  reglages: ReglagesBot,
  taille: number,
  nombre: number,
  pas: number,
  fond: string | null = null
): Promise<Blob> {
  // Un seul canvas pour toute la sequence : en creer un par image laisse des
  // dizaines de contextes au ramasse-miettes pendant l'export.
  const canvas = document.createElement('canvas')
  const images = await sequenceDuBot(
    reglages,
    taille,
    nombre,
    pas,
    async (svg) => {
      const ctx = await dessine(svgAutonome(svg, taille), taille, canvas, fond)
      return ctx.getImageData(0, 0, taille, taille).data
    },
    // les yeux prennent la teinte du fond pour s'y fondre exactement
    fond ?? undefined
  )
  return new Blob([gifAnime(images, taille, taille, Math.round(pas * 1000))], { type: 'image/gif' })
}
