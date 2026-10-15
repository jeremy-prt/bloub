// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/bot/engine'
import { blockAt, defaultCycle, offsetOf, type Block } from '@/bot/cycles'
import { RAYON } from '@/bot/repere'
import { SHAPE_BY_ID } from '@/bot/skins'
import { EXPRESSION_BY_ID } from '@/bot/expressions'
import {
  DEFAULT_ACCESSORY_LAYOUT,

  mouthPath,
  mustachePath
} from './accessories'
import { ouvreCycle, svgAutonome, versSvgAnime } from './capture'
import { DEMI_ECRAN, viewBoxExport } from './export'
import { SWEEP_PERIOD } from './gaze'

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

  it('anime les yeux sans faire tourner le corps et exporte les mains separees', async () => {
    const blocs = [{ state: 'idle' as const, duration: SWEEP_PERIOD }]
    const normal = await ouvreCycle(REGLAGES, blocs, TAILLE)
    const balaye = await ouvreCycle({ ...REGLAGES, turnEyes: true, hands: true }, blocs, TAILLE)
    try {
      const t = SWEEP_PERIOD / 10
      const imageNormale = await normal.rendre(t)
      const imageBalayee = await balaye.rendre(t)
      expect(corpsDe(imageBalayee)).toBe(corpsDe(imageNormale))
      expect(yeuxDe(imageBalayee)).not.toEqual(yeuxDe(imageNormale))
      expect(imageBalayee.querySelectorAll('[data-detached-hand]')).toHaveLength(2)
      const yeuxInitiaux = yeuxDe(imageBalayee)
      const positions = (svg: SVGSVGElement) =>
        [...svg.querySelectorAll('[data-detached-hand]')].map((hand) => [
          hand.getAttribute('x'),
          hand.getAttribute('y')
        ])
      expect([...imageBalayee.querySelectorAll('[data-detached-hand]')].every(
        (hand) => hand.tagName.toLowerCase() === 'rect'
      )).toBe(true)
      const positionsInitiales = positions(imageBalayee)

      const profil = await balaye.rendre(SWEEP_PERIOD / 4)
      expect(corpsDe(profil)).toBe(corpsDe(imageBalayee))
      expect(profil.querySelectorAll('[data-detached-hand]')).toHaveLength(2)
      expect(positions(profil)).not.toEqual(positionsInitiales)

      await balaye.rendre(2)
      const rejoue = await balaye.rendre(t)
      expect(yeuxDe(rejoue)).toEqual(yeuxInitiaux)
      expect(positions(rejoue)).toEqual(positionsInitiales)
    } finally {
      normal.ferme()
      balaye.ferme()
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

  it('lie les montures aux matrices reelles des yeux', async () => {
    const blocs = [{ state: 'idle' as const, duration: 2 }]
    const lecteur = await ouvreCycle(
      {
        ...REGLAGES,
        glasses: true,
        glassesStyle: 'sun',
        glassesSize: 1.2,
        eyeColor: 'blue',
        mustache: true,
        mustacheColor: '#8b3a24',
        accessoryLayout: {
          glasses: {
            x: 7,
            y: -5,
            width: 1.25,
            height: 0.8,
            rotation: 30,
            curve: 0,
            roundness: 0,
            lowerCurve: 0,
            leftLensX: -7,
            leftLensY: 4,
            rightLensX: 9,
            rightLensY: -6
          },
          mustache: { x: 17, y: -11, width: 1.3, height: 0.7, rotation: -12, curve: 0.7, roundness: 0.8, lowerCurve: 0 },
          mouth: { ...DEFAULT_ACCESSORY_LAYOUT.mouth }
        }
      },
      blocs,
      TAILLE
    )
    try {
      const t = 0.5
      const svg = await lecteur.rendre(t)
      const montures = [...svg.querySelectorAll('[data-glass-lens]')]
      const attendu = moteurAuMemeInstant(blocs, t)
      expect(montures).toHaveLength(2)
      const lensMatrices = montures.map((lens) =>
        lens
          .getAttribute('transform')!
          .slice('matrix('.length, -1)
          .split(',')
          .map(Number)
      )
      const eyeMiddle = (Math.min(...attendu.eyes.map((eye) => eye.x)) +
        Math.max(...attendu.eyes.map((eye) => eye.x))) / 2
      attendu.eyes.forEach((eye, index) => {
        const base = eye.frameMatrix
          .slice('matrix('.length, -1)
          .split(',')
          .map(Number)
        const left = eye.x < eyeMiddle
        expect(lensMatrices[index]![4]).toBeCloseTo(base[4]! + (left ? -7 : 9), 1)
        expect(lensMatrices[index]![5]).toBeCloseTo(base[5]! + (left ? 4 : -6), 1)
      })

      expect(montures.map((eye) => eye.getAttribute('opacity'))).toEqual(
        attendu.eyes.map((eye) => String(eye.alpha))
      )
      const lentesSolares = [...svg.querySelectorAll('[data-sunglasses-lens]')]
      expect(lentesSolares).toHaveLength(2)
      expect(lentesSolares.map((lens) => lens.getAttribute('fill-opacity'))).toEqual([
        '0.96',
        '0.96'
      ])
      expect(lentesSolares.every((lens) => lens.getAttribute('fill') === '#09090b')).toBe(true)
      expect(svg.querySelectorAll('mask path')).toHaveLength(1)
      expect(svg.querySelectorAll('[data-eye-color]')).toHaveLength(0)
      const accessoires = [...svg.querySelectorAll('[data-accessory-part]')]
      expect(accessoires).toHaveLength(1)
      expect(accessoires[0]!.getAttribute('transform')).toMatch(/^matrix\(/)
      expect(
        svg.querySelector('[data-accessory-kind="glasses"]')?.getAttribute('transform')
      ).toMatch(/^matrix\(1\.08,0\.62,-0\.4,0\.69,/)
      expect(
        svg.querySelector('[data-accessory-kind="mustache"] path')?.getAttribute('d')
      ).toBe(mustachePath('classic', 0.7, 0.8))
    } finally {
      lecteur.ferme()
    }
  })

  it('affiche les yeux derrière les lunettes selon le réglage du bloc', async () => {
    const blocs: Block[] = [
      {
        state: 'idle',
        duration: 2,
        accessorySettings: {
          cercle: {
            glasses: { enabled: true, color: '#202028', showEyes: false }
          }
        }
      },
      {
        state: 'idle',
        duration: 2,
        accessorySettings: {
          cercle: {
            glasses: { enabled: true, color: '#202028', showEyes: true }
          }
        }
      }
    ]
    const lecteur = await ouvreCycle({ ...REGLAGES, glasses: true }, blocs, TAILLE)
    try {
      const hidden = await lecteur.rendre(0.5)
      const hiddenEyeCount = hidden.querySelectorAll('[data-eye-color]').length
      const hiddenLensOpacity = [...hidden.querySelectorAll('[data-sunglasses-lens]')].map((lens) =>
        lens.getAttribute('fill-opacity')
      )
      const visible = await lecteur.rendre(2.5)
      const visibleEyeCount = visible.querySelectorAll('[data-eye-color]').length
      const visibleLensOpacity = [...visible.querySelectorAll('[data-sunglasses-lens]')].map((lens) =>
        lens.getAttribute('fill-opacity')
      )
      expect(hiddenEyeCount).toBe(0)
      expect(visibleEyeCount).toBe(2)
      expect(hiddenLensOpacity).toEqual(['0.96', '0.96'])
      expect(visibleLensOpacity).toEqual(['0.42', '0.42'])
    } finally {
      lecteur.ferme()
    }
  })

  it('rend les reglages propres a chaque bloc dans le montage exporte', async () => {
    const blocs: Block[] = [
      {
        state: 'idle',
        duration: 2,
        accessoryLayouts: {
          cercle: {
            ...DEFAULT_ACCESSORY_LAYOUT,
            mustache: { ...DEFAULT_ACCESSORY_LAYOUT.mustache, x: -12, curve: -0.8 }
          }
        },
        accessorySettings: {
          cercle: {
            glasses: { enabled: false, color: '#111111' },
            mustache: { enabled: true, color: '#9a3520' },
            mouth: { enabled: true, color: '#c96c73' }
          }
        }
      },
      ({
        state: 'wink',
        duration: 2,
        accessoryLayouts: {
          cercle: {
            ...DEFAULT_ACCESSORY_LAYOUT,
            mustache: { ...DEFAULT_ACCESSORY_LAYOUT.mustache, x: 18, curve: 0.9 }
          }
        },
        accessorySettings: {
          cercle: {
            glasses: { enabled: true, color: '#123456' },
            mustache: { enabled: true, color: '#315fa0' },
            mouth: { enabled: false, color: '#c96c73' }
          }
        }
      })
    ]
    const lecteur = await ouvreCycle(
      { ...REGLAGES, glasses: true, mustache: true },
      blocs,
      TAILLE
    )
    try {
      const premier = await lecteur.rendre(0.2)
      const first = {
        path: premier.querySelector('[data-accessory-kind="mustache"] path')?.getAttribute('d'),
        transform: premier.querySelector('[data-accessory-kind="mustache"]')?.getAttribute('transform'),
        glasses: premier.querySelector('[data-accessory-kind="glasses"]')
      }
      expect(first.glasses).toBeNull()
      expect(premier.querySelector('[data-accessory-kind="mouth"]')).toBeNull()
      expect(
        premier.querySelector('[data-accessory-kind="mustache"] path')?.getAttribute('fill')
      ).toBe('#9a3520')
      const second = await lecteur.rendre(2.2)
      expect(
        second.querySelector('[data-accessory-kind="mustache"] path')?.getAttribute('d')
      ).not.toBe(first.path)
      expect(
        second.querySelector('[data-accessory-kind="mustache"] path')?.getAttribute('fill')
      ).toBe('#315fa0')
      expect(second.querySelector('[data-accessory-kind="glasses"]')).not.toBeNull()
      expect(second.querySelector('[data-accessory-kind="mouth"]')).toBeNull()
      expect(
        second.querySelector('[data-accessory-kind="mustache"]')?.getAttribute('transform')
      ).not.toBe(first.transform)
      const scales = (transform: string | undefined) => {
        const values = transform?.match(/^matrix\(([^)]+)\)$/)?.[1]?.split(',').map(Number)
        expect(values).toHaveLength(6)
        return [Math.hypot(values![0]!, values![1]!), Math.hypot(values![2]!, values![3]!)]
      }
      const secondTransform = second
        .querySelector('[data-accessory-kind="mustache"]')
        ?.getAttribute('transform') ?? undefined
      expect(scales(secondTransform)[0]).toBeCloseTo(scales(first.transform ?? undefined)[0]!, 1)
      expect(scales(secondTransform)[1]).toBeCloseTo(scales(first.transform ?? undefined)[1]!, 1)
    } finally {
      lecteur.ferme()
    }
  })

  it('conserve les yeux colores quand les lunettes sont retirees', async () => {
    const lecteur = await ouvreCycle(
      { ...REGLAGES, eyeColor: 'blue' },
      [{ state: 'idle', duration: 2 }],
      TAILLE
    )
    try {
      const svg = await lecteur.rendre(0.5)
      expect([...svg.querySelectorAll('[data-eye-color]')].map((eye) => eye.getAttribute('fill'))).toEqual([
        '#4d83b8',
        '#4d83b8'
      ])
    } finally {
      lecteur.ferme()
    }
  })

  it('conserve des lunettes animees dans le SVG exporte', async () => {
    const blob = await versSvgAnime(
      {
        ...REGLAGES,
        glasses: true,
        glassesStyle: 'sun',
        glassesSize: 1.2,
        eyeColor: 'green',
        mustache: true,
      },
      TAILLE,
      2,
      0.1
    )
    const svg = await blob.text()
    expect(svg).toContain('class="lunette0"')
    expect(svg).toContain('@keyframes lunette0{')
    expect(svg).not.toContain('class="iris0"')
    expect(svg).toContain('class="accessoire0"')
    expect(svg).not.toContain('class="accessoire1"')
    expect(svg).toContain('@keyframes accessoire0{')
  })

  it('coloca la foto detrás del personaje en SVG fijo y animado', async () => {
    const backdrop = {
      mode: 'image' as const,
      image: 'data:image/png;base64,aGVsbG8=',
      color: '#f4f1eb',
      secondColor: '#c9d9f2',
      direction: 'diagonal' as const
    }
    const lecteur = await ouvreCycle(
      REGLAGES,
      [{ state: 'idle', duration: 2 }],
      TAILLE,
      undefined,
      backdrop
    )
    try {
      const rendered = await lecteur.rendre(0)
      const image = rendered.firstElementChild
      expect(image?.tagName.toLowerCase()).toBe('image')
      expect(image?.parentElement).toBe(rendered)
      expect(image?.getAttribute('href')).toBe(backdrop.image)
      expect(image?.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice')
      expect(rendered.querySelector('[data-background-frame]')?.getAttribute('rx')).toBe('10')

      const fixed = svgAutonome(rendered, TAILLE)
      expect(fixed).toContain(`href="${backdrop.image}"`)
      expect(fixed).toContain('preserveAspectRatio="xMidYMid slice"')
      const exported = new DOMParser().parseFromString(fixed, 'image/svg+xml')
      expect(Number(exported.querySelector('[data-background-frame]')?.getAttribute('rx'))).toBeCloseTo(8)
    } finally {
      lecteur.ferme()
    }

    const animated = await versSvgAnime(REGLAGES, TAILLE, 2, 0.1, backdrop)
    const markup = await animated.text()
    expect(markup).toContain(`href="${backdrop.image}"`)
    expect(markup).toContain('@keyframes')
  })

  it('incluye colores sólidos y degradados en el SVG exportado', async () => {
    const colorBackdrop = {
      mode: 'color' as const,
      image: null,
      color: '#ff0000',
      secondColor: '#0000ff',
      direction: 'horizontal' as const
    }
    const colorReader = await ouvreCycle(
      REGLAGES,
      [{ state: 'idle', duration: 2 }],
      TAILLE,
      undefined,
      colorBackdrop
    )
    try {
      const solid = await colorReader.rendre(0)
      expect(solid.firstElementChild?.tagName.toLowerCase()).toBe('rect')
      expect(solid.firstElementChild?.getAttribute('fill')).toBe('#ff0000')
      expect(solid.firstElementChild?.getAttribute('clip-path')).toMatch(/^url\(#/)
    } finally {
      colorReader.ferme()
    }

    const gradientBackdrop = { ...colorBackdrop, mode: 'gradient' as const }
    const gradientReader = await ouvreCycle(
      REGLAGES,
      [{ state: 'idle', duration: 2 }],
      TAILLE,
      undefined,
      gradientBackdrop
    )
    try {
      const gradient = await gradientReader.rendre(0)
      const fill = gradient.firstElementChild?.getAttribute('fill')
      expect(fill).toMatch(/^url\(#.*-background-gradient\)$/)
      expect(gradient.querySelector('linearGradient stop')?.getAttribute('stop-color')).toBe('#ff0000')
      expect(gradient.querySelectorAll('linearGradient stop')[1]?.getAttribute('stop-color')).toBe('#0000ff')
    } finally {
      gradientReader.ferme()
    }

    const animated = await versSvgAnime(REGLAGES, TAILLE, 2, 0.1, gradientBackdrop)
    const animatedMarkup = await animated.text()
    expect(animatedMarkup).toContain('stop-color="#ff0000"')
    expect(animatedMarkup).toContain('stop-color="#0000ff"')
    expect(animatedMarkup).toContain('x1="-158" y1="0" x2="158" y2="0"')
  })

  it('usa un color mas intenso para las manos separadas', async () => {
    const reader = await ouvreCycle({ ...REGLAGES, hands: true }, [{ state: 'idle', duration: 2 }], TAILLE)
    try {
      const svg = await reader.rendre(0)
      const hands = [...svg.querySelectorAll('[data-detached-hand]')]
      expect(hands).toHaveLength(2)
      expect(hands.every((hand) => hand.getAttribute('fill') === '#0a0a0c')).toBe(true)
    } finally {
      reader.ferme()
    }
  })

  it('anime les yeux et conserve les mains dans le SVG exporte', async () => {
    const blob = await versSvgAnime(
      { ...REGLAGES, turnEyes: true, hands: true, glasses: true },
      TAILLE,
      3,
      SWEEP_PERIOD / 4
    )
    const svg = await blob.text()
    expect(svg).not.toContain('data-character-turn')
    expect(svg).toContain('data-detached-hands')
    expect(svg).toContain('class="lunette0"')
    expect(svg).toContain('data-detached-hand="left"')
    expect(svg).toContain('data-detached-hand="right"')
    expect(svg).not.toContain('class="mano0"')
  })

  it('rend la bouche choisie et respecte sa taille dans la capture', async () => {
    const layout = {
      ...DEFAULT_ACCESSORY_LAYOUT,
      mouth: { ...DEFAULT_ACCESSORY_LAYOUT.mouth, width: 1.7, height: 1.4 }
    }
    const lecteur = await ouvreCycle(
      { ...REGLAGES, mouth: true, mouthStyle: 'pout' },
      [
        {
          state: 'idle',
          duration: 2,
          accessoryLayouts: { cercle: layout }
        }
      ],
      TAILLE
    )
    const reference = await ouvreCycle(
      { ...REGLAGES, mouth: true, mouthStyle: 'pout' },
      [{ state: 'idle', duration: 2 }],
      TAILLE
    )
    try {
      const svg = await lecteur.rendre(0.2)
      const referenceSvg = await reference.rendre(0.2)
      expect(svg.querySelector('[data-accessory-kind="mouth"] path')?.getAttribute('d')).toBe(
        mouthPath('pout')
      )
      const transform = svg
        .querySelector('[data-accessory-kind="mouth"]')
        ?.getAttribute('transform')
      const referenceTransform = referenceSvg
        .querySelector('[data-accessory-kind="mouth"]')
        ?.getAttribute('transform')
      expect(transform).toMatch(/^matrix\(/)
      expect(transform).not.toBe(referenceTransform)
      expect(svg.querySelector('[data-accessory-kind="mustache"]')).toBeNull()
    } finally {
      lecteur.ferme()
      reference.ferme()
    }
  })
})
