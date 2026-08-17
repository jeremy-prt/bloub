import { describe, expect, it } from 'vitest'
import { RAYON } from '@/bot/repere'
import { SHAPES } from '@/bot/skins'
import {
  ACTIONS,
  BLANC,
  CYCLE_FPS,
  CYCLE_TAILLE,
  DEMI_ECRAN,
  FORMATS_CYCLE,
  FORMAT_CYCLE_DEFAUT,
  cycleAccepteTransparence,
  cycleImages,
  FONDS_GIF,
  FOND_GIF_DEFAUT,
  couleurDeFond,
  ACTION_BY_ID,
  ACTION_DEFAUT,
  DEMI_CADRE,
  RAYON_MAX,
  nomFichier,
  sansCommentaires,
  viewBoxExport
} from './export'

/** Rayon de la boule au repos, cf. le `R` de BloubBot.vue. */


/** Demi-cote du viewBox affiche a l'ecran, cf. le `VB` de BloubBot.vue. */
const VB_ECRAN = 158

describe('cadre d export', () => {
  /*
   * LE test du fichier : le cadre est plus serre que l'ecran, donc c'est lui qui
   * decide ce qui rentre. Une forme ajoutee a `skins.ts` avec un rayon plus
   * grand que la marge se ferait rogner en silence sur l'image exportee.
   */
  it('contient toutes les formes du personnalisateur', () => {
    for (const forme of SHAPES) {
      const rayon = Math.max(...forme.radii) * RAYON
      expect(rayon, `la forme « ${forme.id} » depasse du cadre`).toBeLessThan(DEMI_CADRE)
    }
  })

  it('laisse une marge pour le rognage circulaire d une photo de profil', () => {
    // La boule au repos ne doit pas toucher le bord : entre 70 % et 90 % du cadre.
    const remplissage = RAYON / DEMI_CADRE
    expect(remplissage).toBeGreaterThan(0.7)
    expect(remplissage).toBeLessThan(0.9)
  })

  it('est plus serre que le viewBox de l ecran', () => {
    // La marge de l'ecran loge les anneaux des etats animes, absents au repos :
    // la garder remplirait l'export de vide.
    expect(DEMI_CADRE).toBeLessThan(VB_ECRAN)
  })

  it('se cadre sur la forme la plus etalee et non sur le cercle', () => {
    // Le squircle culmine a 1.15 sur sa diagonale : un cadre calcule sur le
    // cercle seul (1.0) le rognerait.
    expect(RAYON_MAX).toBeGreaterThan(1)
    expect(RAYON_MAX).toBe(Math.max(...SHAPES.map((f) => Math.max(...f.radii))))
  })

  it('produit un viewBox carre centre sur la boule', () => {
    expect(viewBoxExport(125)).toBe('-125 -125 250 250')
    expect(viewBoxExport()).toBe(`${-DEMI_CADRE} ${-DEMI_CADRE} ${DEMI_CADRE * 2} ${DEMI_CADRE * 2}`)
  })
})

describe('catalogue des exports', () => {
  it('a des ids uniques', () => {
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(ACTIONS.length)
  })

  it('expose une action par defaut qui existe', () => {
    expect(ACTION_BY_ID.get(ACTION_DEFAUT)).toBeDefined()
  })

  /*
   * Une seule taille de PNG : proposer 1024 et 2048 faisait trancher a
   * l'utilisateur une question qui n'est pas la sienne.
   */
  it('ne propose qu un seul png a telecharger', () => {
    const pngs = ACTIONS.filter((a) => a.mode === 'telecharge' && a.extension === 'png')
    expect(pngs).toHaveLength(1)
  })

  /* Le presse-papiers image ne sait ecrire que du bitmap ; le SVG passe en texte. */
  it('copie le bitmap en image et le vectoriel en texte', () => {
    for (const action of ACTIONS) {
      if (action.mode === 'copieImage') expect(action.extension).toBe('png')
      if (action.mode === 'copieTexte') expect(action.extension).toBe('svg')
    }
  })

  it('propose de copier les deux formats', () => {
    expect(ACTIONS.some((a) => a.mode === 'copieImage')).toBe(true)
    expect(ACTIONS.some((a) => a.mode === 'copieTexte')).toBe(true)
  })

  it('donne une taille exploitable a chaque action', () => {
    for (const action of ACTIONS) {
      expect(action.taille).toBeGreaterThan(0)
      expect(Number.isFinite(action.taille)).toBe(true)
    }
  })
})

describe('export d un cycle', () => {
  /*
   * LE piege du cycle : les anneaux des etats animes montent a 1,4 fois le rayon
   * de la boule, soit 140 — au-dela du cadre serre de l'export fixe, qui les
   * rognerait. Un cycle doit donc partir sur le viewBox de l'ecran.
   */
  it('exporte sur le viewBox de l ecran, pas sur le cadre serre', () => {
    const RAYON_ARCS = 140
    expect(DEMI_ECRAN).toBeGreaterThan(RAYON_ARCS)
    expect(DEMI_CADRE).toBeLessThan(RAYON_ARCS)
  })


  it('ne propose ni SVG anime ni format hors video', () => {
    // le corps morphe a chaque image : 2,5 ko de chemin fois six cents images
    expect(FORMATS_CYCLE).toEqual(['mp4', 'gif'])
    expect(FORMATS_CYCLE).toContain(FORMAT_CYCLE_DEFAUT)
  })

  /* La video n'a pas d'alpha : `VideoEncoder` refuse `alpha: 'keep'`. */
  it('ne laisse le choix du fond qu au gif', () => {
    expect(cycleAccepteTransparence('gif')).toBe(true)
    expect(cycleAccepteTransparence('mp4')).toBe(false)
  })

  it('compte les images d apres la duree et le format', () => {
    expect(cycleImages(31.2, 'mp4')).toBe(Math.round(31.2 * CYCLE_FPS.mp4))
    expect(cycleImages(31.2, 'gif')).toBe(Math.round(31.2 * CYCLE_FPS.gif))
    // un montage minuscule doit quand meme donner une image
    expect(cycleImages(0, 'mp4')).toBe(1)
  })

  /*
   * Les reglages sont SEPARES par format, et c'est la correction d'une vraie
   * erreur : le MP4 avait herite du 320 px / 20 img/s du GIF, justifie chez lui
   * par le poids. A 93 kbps mesures, la video avait la definition d'une vignette.
   * Une video compresse le mouvement, elle n'a pas cette contrainte.
   */
  it('exporte la video plus grande et plus fluide que le gif', () => {
    expect(CYCLE_TAILLE.mp4).toBeGreaterThan(CYCLE_TAILLE.gif)
    expect(CYCLE_FPS.mp4).toBeGreaterThan(CYCLE_FPS.gif)
    expect(CYCLE_TAILLE.mp4).toBeGreaterThanOrEqual(1024)
  })

  /* Le delai d'un GIF se compte en centiemes : 20 img/s tombe juste, 30 non. */
  it('garde une cadence gif exprimable en centiemes de seconde', () => {
    expect(Number.isInteger(100 / CYCLE_FPS.gif)).toBe(true)
  })
})

describe('fond du gif', () => {
  /* Le GIF est le SEUL format a poser la question : lui seul a 1 bit d'alpha. */
  it('ne concerne que le gif', () => {
    const anime = ACTIONS.filter((a) => a.mode === 'anime' || a.mode === 'gif')
    expect(anime.filter((a) => a.extension === 'gif')).toHaveLength(1)
  })

  it('propose blanc et transparent, blanc par defaut', () => {
    expect(FONDS_GIF).toEqual(['blanc', 'transparent'])
    expect(FONDS_GIF).toContain(FOND_GIF_DEFAUT)
    expect(FOND_GIF_DEFAUT).toBe('blanc')
  })

  /* « Fond blanc » doit etre BLANC, pas le `--paper` legerement casse du site. */
  it('peint du blanc pur, et rien du tout en transparent', () => {
    expect(couleurDeFond('blanc')).toBe(BLANC)
    expect(BLANC).toBe('#ffffff')
    expect(couleurDeFond('transparent')).toBeNull()
  })
})

describe('nettoyage du markup', () => {
  it('retire les commentaires sans toucher au dessin', () => {
    const markup =
      '<defs><!-- les yeux sont de vrais trous --><mask id="m">' +
      '<path d="M0 0" fill="#fff"/></mask></defs>' +
      '<g mask="url(#m)"><rect fill="#0a0a0c"/></g>'
    const propre = sansCommentaires(markup)
    expect(propre).not.toContain('<!--')
    expect(propre).not.toContain('trous')
    // Ce qui fait le dessin doit survivre intact.
    expect(propre).toContain('fill="#fff"')
    expect(propre).toContain('fill="#0a0a0c"')
    expect(propre).toContain('mask="url(#m)"')
    expect(propre).toContain('d="M0 0"')
  })

  it('retire un commentaire multiligne', () => {
    expect(sansCommentaires('<a/><!--\n  deux\n  lignes\n--><b/>')).toBe('<a/><b/>')
  })

  it('laisse un markup sans commentaire tel quel', () => {
    expect(sansCommentaires('<circle r="100"/>')).toBe('<circle r="100"/>')
  })
})

describe('nom de fichier', () => {
  it('se construit sur les ids et pas sur les libelles', () => {
    expect(nomFichier('goutte', 'neutre', 'encre', 'png')).toBe('bloub-goutte-neutre-encre.png')
    expect(nomFichier('cercle', 'hilare', 'violet', 'svg')).toBe('bloub-cercle-hilare-violet.svg')
  })

  /*
   * `App.vue` relit forme / expression / couleur du localStorage sans les
   * valider : une valeur trafiquee ne doit pas pouvoir composer un chemin.
   */
  it('ne laisse pas passer de separateur de chemin', () => {
    const nom = nomFichier('../../etc/passwd', 'neutre', 'encre', 'png')
    expect(nom).not.toContain('/')
    // Un seul point, celui de l'extension.
    expect(nom.split('.')).toHaveLength(2)
    expect(nom.endsWith('.png')).toBe(true)
  })

  /* Un nom de montage doit rester lisible : « Cycle par défaut », pas « cyclepardfaut ». */
  it('translittere les accents et separe les mots', () => {
    expect(nomFichier('Cycle par défaut', '', '', 'mp4')).toBe('bloub-cycle-par-defaut.mp4')
    expect(nomFichier('Été 2026', '', '', 'gif')).toBe('bloub-ete-2026.gif')
  })

  it('survit a des ids vides', () => {
    expect(nomFichier('', '', '', 'png')).toBe('bloub.png')
  })
})
