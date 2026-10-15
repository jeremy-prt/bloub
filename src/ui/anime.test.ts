import { describe, expect, it } from 'vitest'
import { gifAnime, svgAnime } from './anime'

/** SVG minimal ayant la structure de celui de BloubBot : corps + deux yeux. */
const BASE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-125 -125 250 250">' +
  '<defs><mask id="m" maskUnits="userSpaceOnUse">' +
  '<path d="M61 0C62 2Z" fill="#fff"/>' +
  '<path d="M-9 -11A9 9Z" fill="#000" transform="matrix(0.86,-0.32,0.45,0.84,14.85,-27.88)"/>' +
  '<path d="M-9 -11A9 9Z" fill="#000" transform="matrix(0.62,-0.05,0.45,0.84,35.2,-29.43)"/>' +
  '</mask></defs>' +
  '<g opacity="1"><path d="M61 0C62 2Z" fill="#f9f9f9"/>' +
  '<g mask="url(#m)"><rect x="-125" y="-125" width="250" height="250" fill="#0a0a0c"/></g></g>' +
  '</svg>'

const MATRICES = [
  ['matrix(1,0,0,1,0,0)', 'matrix(1,0,0,1,10,0)'],
  ['matrix(1,0,0,0.35,0,0)', 'matrix(1,0,0,0.35,10,0)'],
  ['matrix(1,0,0,1,2,0)', 'matrix(1,0,0,1,12,0)']
]

const AVEC_LUNETTES =
  BASE.replace('</svg>', '<g data-glass-lens transform="matrix(1,0,0,1,0,0)"></g></svg>')
const AVEC_IRIS = BASE.replace(
  '</svg>',
  '<path data-eye-color d="M0 0" transform="matrix(1,0,0,1,0,0)"/></svg>'
)
const AVEC_ACCESSOIRES = BASE.replace(
  '</svg>',
  '<g data-accessory-part transform="matrix(1,0,0,1,0,0)"></g>' +
    '<g data-accessory-part transform="matrix(1,0,0,1,0,0)"></g></svg>'
)
const MATRICES_LUNETTES = MATRICES.map((image, i) => [
  ...image,
  `matrix(1,0,0,1,${i},2)`
])
const MATRICES_IRIS = MATRICES.map((image, i) => [
  ...image,
  `matrix(1,0,0,1,${i},3)`
])
const MATRICES_ACCESSOIRES = MATRICES.map((image, i) => [
  ...image,
  `matrix(1,0,0,1,${i},4)`,
  `matrix(1,0,0,1,${i},5)`
])

describe('svg anime', () => {
  const sortie = svgAnime(BASE, MATRICES, 3)

  it('remplace le transform de chaque oeil par une classe', () => {
    expect(sortie).toContain('class="oeil0"')
    expect(sortie).toContain('class="oeil1"')
    // plus aucun transform en dur dans le masque
    expect(sortie.match(/<mask[\s\S]*?<\/mask>/)![0]).not.toContain('transform="matrix')
  })

  it('laisse le corps intact', () => {
    // la silhouette ne bouge pas assez pour etre animee : 1,17u sur un rayon de 100
    expect(sortie).toContain('<path d="M61 0C62 2Z" fill="#fff"/>')
    expect(sortie).toContain('fill="#0a0a0c"')
    expect(sortie).toContain('mask="url(#m)"')
  })

  it('ecrit une regle de keyframes par oeil, aux bons pourcentages', () => {
    expect(sortie).toContain('@keyframes oeil0{0%{transform:matrix(1,0,0,1,0,0)}')
    expect(sortie).toContain('50%{transform:matrix(1,0,0,0.35,0,0)}')
    expect(sortie).toContain('100%{transform:matrix(1,0,0,1,2,0)}')
    expect(sortie).toContain('@keyframes oeil1{')
  })

  /*
   * Sans ces deux proprietes une transformation CSS sur un element SVG tourne
   * autour du centre de sa boite au lieu de l'origine du repere.
   */
  it('cale le repere des transformations CSS sur le viewBox', () => {
    expect(sortie).toContain('transform-box:view-box')
    expect(sortie).toContain('transform-origin:0 0')
  })

  it('anime aussi les lentilles pour qu elles suivent le regard', () => {
    const sortie = svgAnime(AVEC_LUNETTES, MATRICES_LUNETTES, 3)
    expect(sortie).toContain('class="lunette0"')
    expect(sortie).toContain('@keyframes lunette0{0%{transform:matrix(1,0,0,1,0,2)}')
    expect(sortie).toContain('.lunette0{animation-name:lunette0}')
  })

  it('anime la couleur des yeux sans decaler leur forme', () => {
    const sortie = svgAnime(AVEC_IRIS, MATRICES_IRIS, 3)
    expect(sortie).toContain('class="iris0"')
    expect(sortie).toContain('@keyframes iris0{0%{transform:matrix(1,0,0,1,0,3)}')
  })

  it('anime les accessoires pour qu ils restent poses sur le visage', () => {
    const sortie = svgAnime(AVEC_ACCESSOIRES, MATRICES_ACCESSOIRES, 3)
    expect(sortie).toContain('class="accessoire0"')
    expect(sortie).toContain('@keyframes accessoire1{0%{transform:matrix(1,0,0,1,0,5)}')
  })

  /* La derive n'est pas periodique : sans `alternate`, le raccord sauterait. */
  it('reboucle en aller-retour pour ne pas montrer de raccord', () => {
    expect(sortie).toContain('animation-direction:alternate')
    expect(sortie).toContain('animation-iteration-count:infinite')
    expect(sortie).toContain('animation-duration:3s')
  })

  it('reste un SVG bien forme et autonome', () => {
    expect(sortie.startsWith('<svg xmlns=')).toBe(true)
    expect(sortie.endsWith('</svg>')).toBe(true)
    expect(sortie.indexOf('<style>')).toBeLessThan(sortie.indexOf('</svg>'))
  })

  it('pese une fraction d une animation bitmap', () => {
    // 3 images cles ici, mais l'ordre de grandeur est le point : quelques ko
    expect(sortie.length).toBeLessThan(4000)
  })

  it('refuse ce qu il ne sait pas animer', () => {
    expect(() => svgAnime(BASE, [MATRICES[0]!], 3)).toThrow()
    expect(() => svgAnime('<svg></svg>', MATRICES, 3)).toThrow()
    // autant de matrices par image cle que d'yeux dans le masque
    expect(() => svgAnime(BASE, [['matrix(1,0,0,1,0,0)'], ['matrix(1,0,0,1,1,0)']], 3)).toThrow()
    expect(() => svgAnime(AVEC_LUNETTES, MATRICES, 3)).toThrow()
    expect(() => svgAnime(AVEC_IRIS, MATRICES, 3)).toThrow()
  })
})

/** Petite image : un carre opaque sur fond transparent, comme la boule. */
function image(cote: number, couleur: [number, number, number], decalage = 0) {
  const px = new Uint8ClampedArray(cote * cote * 4)
  for (let y = 2; y < cote - 2; y++) {
    for (let x = 2 + decalage; x < cote - 2; x++) {
      const p = (y * cote + x) * 4
      px[p] = couleur[0]
      px[p + 1] = couleur[1]
      px[p + 2] = couleur[2]
      px[p + 3] = 255
    }
  }
  return px
}

/** Relit la structure d'un GIF : en-tete, extensions, nombre d'images. */
function litGif(f: Uint8Array) {
  const txt = (o: number, n: number) => String.fromCharCode(...f.subarray(o, o + n))
  const bits = (f[10]! & 0x07) + 1
  let o = 13 + 3 * (1 << bits)
  let images = 0
  let boucle: number | null = null
  let delai: number | null = null
  let transparent: number | null = null
  let elimination: number | null = null
  while (o < f.length && f[o] !== 0x3b) {
    if (f[o] === 0x21 && f[o + 1] === 0xff) {
      boucle = f[o + 16]! + f[o + 17]! * 256
      o += 19
    } else if (f[o] === 0x21 && f[o + 1] === 0xf9) {
      elimination = (f[o + 3]! >> 2) & 0x07
      transparent = f[o + 3]! & 0x01 ? f[o + 6]! : null
      delai = f[o + 4]! + f[o + 5]! * 256
      o += 8
    } else if (f[o] === 0x2c) {
      images++
      // 10 octets de descripteur, separateur inclus, puis la taille de code
      o += 11
      // borne explicite : un flux mal forme ferait tourner ce saut a l'infini
      while (o < f.length && f[o] !== 0) o += 1 + f[o]!
      o++
    } else break
  }
  return {
    entete: txt(0, 6),
    largeur: f[6]! + f[7]! * 256,
    hauteur: f[8]! + f[9]! * 256,
    tablePresente: !!(f[10]! & 0x80),
    couleursTable: 1 << bits,
    images,
    boucle,
    delai,
    transparent,
    elimination,
    finTrouvee: f[f.length - 1] === 0x3b
  }
}

describe('gif anime', () => {
  const suite = [image(16, [10, 10, 12]), image(16, [10, 10, 12], 2), image(16, [249, 249, 249])]

  it('produit un GIF89a bien forme et termine', () => {
    const g = litGif(gifAnime(suite, 16, 16, 50))
    expect(g.entete).toBe('GIF89a')
    expect(g.largeur).toBe(16)
    expect(g.hauteur).toBe(16)
    expect(g.images).toBe(3)
    expect(g.finTrouvee).toBe(true)
  })

  it('porte une palette globale', () => {
    const g = litGif(gifAnime(suite, 16, 16, 50))
    expect(g.tablePresente).toBe(true)
    // deux teintes + le transparent tiennent dans quatre entrees
    expect(g.couleursTable).toBe(4)
  })

  /* Sans index transparent, le fond serait peint. */
  it('declare l index 0 transparent', () => {
    expect(litGif(gifAnime(suite, 16, 16, 50)).transparent).toBe(0)
  })

  /*
   * Sans « retour au fond », les zones transparentes laissent voir l'image
   * precedente et la boule traine derriere elle.
   */
  it('elimine chaque image en retour au fond', () => {
    expect(litGif(gifAnime(suite, 16, 16, 50)).elimination).toBe(2)
  })

  it('boucle sans fin', () => {
    expect(litGif(gifAnime(suite, 16, 16, 50)).boucle).toBe(0)
  })

  /* Le delai du GIF se compte en centiemes de seconde, pas en millisecondes. */
  it('convertit le delai en centiemes', () => {
    expect(litGif(suite.length ? gifAnime(suite, 16, 16, 50) : new Uint8Array()).delai).toBe(5)
    expect(litGif(gifAnime(suite, 16, 16, 100)).delai).toBe(10)
  })

  /* Un delai de 0 ou 1 centieme n'est pas traite pareil par tous les lecteurs. */
  it('ne descend pas sous deux centiemes', () => {
    expect(litGif(gifAnime(suite, 16, 16, 5)).delai).toBe(2)
  })

  it('refuse une animation vide', () => {
    expect(() => gifAnime([], 16, 16, 50)).toThrow()
  })

  /**
   * La transparence est DEDUITE des pixels. Des images deja aplaties sur un fond
   * ne doivent pas declarer d'index transparent, et surtout pas etre eliminees
   * « retour au fond » entre deux — ce qui ferait clignoter le fond.
   */
  it('n annonce pas de transparence sur des images opaques', () => {
    const cote = 8
    const opaque = new Uint8ClampedArray(cote * cote * 4).fill(255)
    const g = litGif(gifAnime([opaque, opaque], cote, cote, 50))
    expect(g.transparent).toBeNull()
    expect(g.elimination).toBe(1) // « laisser en place »
  })

  it('annonce la transparence des qu une image en a', () => {
    const g = litGif(gifAnime(suite, 16, 16, 50))
    expect(g.transparent).toBe(0)
    expect(g.elimination).toBe(2) // « retour au fond »
  })

  it('reste sous la limite de 256 couleurs meme sur du degrade', () => {
    const degrade = new Uint8ClampedArray(64 * 64 * 4)
    for (let i = 0; i < 64 * 64; i++) {
      degrade[i * 4] = i % 256
      degrade[i * 4 + 1] = (i * 7) % 256
      degrade[i * 4 + 2] = (i * 13) % 256
      degrade[i * 4 + 3] = 255
    }
    const g = litGif(gifAnime([degrade], 64, 64, 50))
    expect(g.couleursTable).toBeLessThanOrEqual(256)
    expect(g.images).toBe(1)
  })
})

/**
 * Decodeur LZW minimal, pour verifier par ALLER-RETOUR que le flux produit est
 * relisable. Un encodeur LZW subtilement faux sort un fichier que les lecteurs
 * refusent, et rien dans la structure ne le montre.
 */
function decodeGif(f: Uint8Array) {
  const bits = (f[10]! & 0x07) + 1
  let o = 13 + 3 * (1 << bits)
  const images: number[][] = []
  while (o < f.length && f[o] !== 0x3b) {
    if (f[o] === 0x21) {
      o += 2
      while (o < f.length && f[o] !== 0) o += 1 + f[o]!
      o++
    } else if (f[o] === 0x2c) {
      o += 10
      const min = f[o]!
      o++
      const donnees: number[] = []
      while (o < f.length && f[o] !== 0) {
        const n = f[o]!
        for (let k = 1; k <= n; k++) donnees.push(f[o + k]!)
        o += 1 + n
      }
      o++

      const clear = 1 << min
      const eoi = clear + 1
      let taille = min + 1
      let dico: number[][] = []
      const reset = () => {
        dico = []
        for (let i = 0; i < clear; i++) dico[i] = [i]
        dico[clear] = []
        dico[eoi] = []
        taille = min + 1
      }
      reset()
      const sortie: number[] = []
      let reserve = 0
      let nbBits = 0
      let precedent: number[] | null = null
      for (let i = 0; i <= donnees.length; i++) {
        if (i < donnees.length) {
          reserve |= donnees[i]! << nbBits
          nbBits += 8
        }
        while (nbBits >= taille) {
          const code = reserve & ((1 << taille) - 1)
          reserve >>= taille
          nbBits -= taille
          if (code === eoi) { nbBits = 0; break }
          if (code === clear) { reset(); precedent = null; continue }
          let entree = dico[code]
          if (!entree) {
            if (!precedent) throw new Error('code inconnu sans precedent')
            entree = [...precedent, precedent[0]!]
          }
          sortie.push(...entree)
          if (precedent) dico.push([...precedent, entree[0]!])
          if (dico.length === 1 << taille && taille < 12) taille++
          precedent = entree
        }
      }
      images.push(sortie)
    } else break
  }
  return images
}

describe('aller-retour du LZW', () => {
  it('retrouve exactement les pixels d une image simple', () => {
    const px = image(16, [10, 10, 12])
    const gif = gifAnime([px], 16, 16, 50)
    const [decode] = decodeGif(gif)
    expect(decode).toHaveLength(16 * 16)
    // reconstruit les index attendus : 0 dehors, 1 dedans
    const attendu: number[] = []
    for (let i = 0; i < 16 * 16; i++) attendu.push(px[i * 4 + 3]! < 128 ? 0 : 1)
    expect(decode).toEqual(attendu)
  })

  it('retrouve les pixels sur une image a beaucoup de couleurs', () => {
    const cote = 40
    const px = new Uint8ClampedArray(cote * cote * 4)
    for (let i = 0; i < cote * cote; i++) {
      px[i * 4] = (i * 5) % 200
      px[i * 4 + 1] = (i * 11) % 200
      px[i * 4 + 2] = (i * 17) % 200
      px[i * 4 + 3] = 255
    }
    const [decode] = decodeGif(gifAnime([px], cote, cote, 50))
    expect(decode).toHaveLength(cote * cote)
    // aucun index transparent : tout est opaque
    expect(decode!.every((v) => v > 0)).toBe(true)
  })
})
