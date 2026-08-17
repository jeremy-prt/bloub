// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/bot/engine'
import { blockAt, defaultCycle, offsetOf, type Block } from '@/bot/cycles'
import { RAYON } from '@/bot/repere'
import { SHAPE_BY_ID } from '@/bot/skins'
import { EXPRESSION_BY_ID } from '@/bot/expressions'
import { ouvreCycle } from './capture'
import { DEMI_ECRAN, viewBoxExport } from './export'

/**
 * Le lecteur hors ecran, celui qui rend les images d'un export de montage.
 *
 * C'est le seul test du depot a demander un DOM, d'ou l'environnement `happy-dom` en tete
 * de fichier : le reste de la suite tourne en `node`, ce qui rendait `capture.ts` — et avec
 * lui toute la chaine d'export — intestable.
 *
 * Ce qu'il attrape n'est visible d'aucune autre facon qu'en regardant un MP4 image par
 * image, et c'est precisement ce qui l'a laisse passer : trois defauts abimaient
 * silencieusement chaque video exportee.
 */

const REGLAGES = { shape: 'cercle', color: 'encre', expression: 'neutre' }
const TAILLE = 128

/** Le `d` du corps, tel que le composant l'a mis dans le masque. */
function corpsDe(svg: SVGSVGElement) {
  return svg.querySelector('mask path')!.getAttribute('d')!
}

/** Les matrices des yeux, dans l'ordre du document. */
function yeuxDe(svg: SVGSVGElement) {
  return [...svg.querySelectorAll('mask [transform]')].map((e) => e.getAttribute('transform')!)
}

/** Le moteur seul, cale comme `rendAt` le fait : chaque etat date de son offset absolu. */
function moteurAuMemeInstant(blocs: Block[], t: number) {
  const e = new BotEngine(
    RAYON,
    blocs[0]!.state,
    SHAPE_BY_ID.get(REGLAGES.shape)!.radii,
    EXPRESSION_BY_ID.get(REGLAGES.expression)!
  )
  const { index } = blockAt(blocs, t)
  for (let i = 1; i <= index; i++) e.setState(blocs[i]!.state, offsetOf(blocs, i))
  return e.sample(t)
}

/**
 * Le cadre de l'export d'un CYCLE doit etre celui que le composant DESSINE, pas un nombre
 * qui lui ressemble.
 *
 * `DEMI_ECRAN` valait 158 en dur face a un `VB = 158` ecrit a la main dans le composant, et
 * rien ne reliait les deux. La regression visee : quelqu'un elargit le viewBox pour un
 * nouvel etat aux anneaux plus grands, l'export continue au cadre precedent et ajoute des
 * bandes vides a chaque video, tous les tests au vert.
 *
 * Compare ici au `viewBox` reellement emis, et non a la constante : les deux viennent
 * desormais du meme module, donc une assertion entre elles serait une tautologie. Ce qui
 * peut encore deriver, c'est le GABARIT.
 */
describe('cadre de l export', () => {
  it('exporte le cycle sur le viewBox que le composant dessine', async () => {
    const lecteur = await ouvreCycle(REGLAGES, defaultCycle().blocks, TAILLE)
    try {
      const svg = await lecteur.rendre(0)
      expect(svg.getAttribute('viewBox')).toBe(viewBoxExport(DEMI_ECRAN))
    } finally {
      lecteur.ferme()
    }
  })
})

describe('lecteur hors ecran', () => {
  /**
   * Rejouer la sequence doit redonner exactement les memes images.
   *
   * L'export GIF en depend : il fait DEUX passes, une pour recenser la palette et une pour
   * indexer, et la palette de la premiere ne vaut que si la seconde rend les memes images.
   * Un seul lecteur servait aux deux, or il retient le dernier bloc pose et le moteur
   * retient l'etat precedent : rejouer l'image 0 apres une passe complete datait le premier
   * etat a l'instant 0 avec le DERNIER en etat precedent, et rendait donc la pose de
   * celui-la. Le GIF par defaut s'ouvrait sur une boule SANS YEUX — la comete a un
   * `eyeAlpha` nul.
   */
  it('rejoue la sequence a l identique', async () => {
    const blocs = defaultCycle().blocks
    const neuf = await ouvreCycle(REGLAGES, blocs, TAILLE)
    const reference = { corps: corpsDe(await neuf.rendre(0)), yeux: yeuxDe(await neuf.rendre(0)) }
    neuf.ferme()

    const rejoue = await ouvreCycle(REGLAGES, blocs, TAILLE)
    try {
      // une passe complete, grossierement echantillonnee : ce qui compte est d'avoir
      // traverse tous les blocs avant de revenir au debut
      for (let t = 0; t < 30; t += 1.5) await rejoue.rendre(t)
      const apres = await rejoue.rendre(0)
      expect(corpsDe(apres)).toBe(reference.corps)
      expect(yeuxDe(apres)).toEqual(reference.yeux)
      expect(yeuxDe(apres)).toHaveLength(2)
    } finally {
      rejoue.ferme()
    }
  })

  /**
   * L'image rendue doit etre celle du moteur, y compris SUR un joint de bloc.
   *
   * Aux jointures, le composant posait bien l'etat a son offset absolu puis echantillonnait
   * a la bonne date — mais le watcher de `state`, dont la file est videe par le `nextTick`
   * de l'export, repassait derriere un `redrawFrozen()` non inerte (le lecteur est monte
   * avec `frozenAt: 0`). Or `sample(0)` juste apres un changement date plus tard donne un
   * ratio de melange nul, donc la pose de l'etat PRECEDENT : une image fausse a chaque
   * jointure, treize fois dans le montage par defaut.
   */
  it('rend exactement ce que le moteur rend, jointures comprises', async () => {
    const blocs = defaultCycle().blocks
    const lecteur = await ouvreCycle(REGLAGES, blocs, TAILLE)
    try {
      // les dates des jointures elles-memes, plus un point au milieu de chaque bloc
      const dates = blocs.flatMap((b, i) => {
        const debut = offsetOf(blocs, i)
        return i === 0 ? [debut + b.duration / 2] : [debut, debut + b.duration / 2]
      })
      for (const t of dates) {
        const svg = await lecteur.rendre(t)
        const attendu = moteurAuMemeInstant(blocs, t)
        expect(corpsDe(svg), `t=${t.toFixed(2)}`).toBe(attendu.bodyPath)
        expect(yeuxDe(svg), `t=${t.toFixed(2)}`).toEqual(attendu.eyes.map((e) => e.matrix))
      }
    } finally {
      lecteur.ferme()
    }
  })

  /**
   * L'image 0 est le PREMIER etat du montage, pas un repos qui morphe vers lui.
   *
   * Le lecteur etait monte sans prop `state`, donc le modele prenait son defaut `idle` et
   * le moteur se construisait dessus : un montage commencant par l'orbite s'ouvrait sur une
   * boule au repos qui morphait vers le triangle pendant 0,6 s. La lecture a l'ecran ne
   * fait pas ca, elle amorce l'etat sur le bloc courant.
   */
  it('ouvre sur le premier etat du montage, sans morpher depuis le repos', async () => {
    for (const debut of ['orbit', 'egg', 'hexagon'] as const) {
      const blocs = [
        { state: debut, duration: 2 },
        { state: 'idle' as const, duration: 2 }
      ]
      const lecteur = await ouvreCycle(REGLAGES, blocs, TAILLE)
      try {
        const svg = await lecteur.rendre(0)
        expect(corpsDe(svg), debut).toBe(moteurAuMemeInstant(blocs, 0).bodyPath)
      } finally {
        lecteur.ferme()
      }
    }
  })
})
