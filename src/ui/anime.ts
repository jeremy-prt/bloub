/**
 * Assemblage de l'animation exportee : un SVG anime en CSS.
 *
 * Tout est pur — de la chaine vers de la chaine — donc testable en `node` comme le
 * reste de `src/ui/`. C'est la capture des images cles qui a besoin du DOM, et elle
 * vit dans `capture.ts`.
 */

/** Ecrit un entier non signe sur `n` octets, petit-boutiste. */
function le(valeur: number, n: number): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) out.push((valeur / 2 ** (8 * i)) & 0xff)
  return out
}

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0))

/**
 * Injecte les transformations du personnage, du visage et des accessoires dans un SVG deja rendu.
 *
 * On ne reconstruit PAS le dessin : on part du SVG que `BloubBot` a produit pour
 * la premiere image et on remplace ses transformations par des classes animees.
 * Une seule source de dessin, donc aucune derive possible — c'est la meme regle
 * que pour l'export fixe.
 *
 * Le corps et le visage ne varient que si le tour complet est active. Les yeux
 * et leurs montures partagent les memes images cles, ce qui garde les lunettes
 * en place sans alourdir le fichier.
 *
 * L'interpolation est faite par le NAVIGATEUR : c'est ce qui rend l'animation
 * lisse a la frequence de l'ecran au lieu de sauter d'image en image comme un
 * feuilletage. C'est tout l'interet par rapport a un WebP ou un GIF.
 */
export function svgAnime(base: string, matrices: string[][], duree: number): string {
  if (matrices.length < 2) throw new Error('il faut au moins deux images cles')

  const mask = base.match(/<mask[\s\S]*?<\/mask>/)
  if (!mask) throw new Error('masque introuvable')

  // Les yeux sont les seules formes du masque a porter un `transform` : le corps
  // n'en a pas. On les numerote dans l'ordre du document.
  let n = 0
  const maskAnime = mask[0].replace(/transform="matrix\([^)]*\)"/g, () => `class="oeil${n++}"`)

  let nombreYeuxColores = 0
  const yeuxColoresAnimes = base.replace(
    /<path\b(?=[^>]*\bdata-eye-color)[^>]*>/g,
    (path) =>
      path.replace(
        /transform="matrix\([^)]*\)"/,
        () => `class="iris${nombreYeuxColores++}"`
      )
  )

  let nombreLunettes = 0
  const lunettesAnimees = yeuxColoresAnimes.replace(
    /<g\b(?=[^>]*\bdata-glass-lens)[^>]*>/g,
    (groupe) =>
      groupe.replace(
        /transform="matrix\([^)]*\)"/,
        () => `class="lunette${nombreLunettes++}"`
      )
  )
  let nombreAccessoires = 0
  const accessoiresAnimes = lunettesAnimees.replace(
    /<g\b(?=[^>]*\bdata-accessory-part)[^>]*>/g,
    (groupe) =>
      groupe.replace(
        /transform="matrix\([^)]*\)"/,
        () => `class="accessoire${nombreAccessoires++}"`
      )
  )
  const elementsAnimes = n + nombreYeuxColores + nombreLunettes + nombreAccessoires
  if (elementsAnimes === 0) throw new Error('aucun element a animer')
  const parImage = matrices[0]!.length
  if (parImage !== elementsAnimes) {
    throw new Error(
      `${n} yeux, ${nombreYeuxColores} couleurs d'oeil, ${nombreLunettes} montures et ${nombreAccessoires} accessoires dans le SVG, ${parImage} matrices par image cle`
    )
  }

  const pas = 100 / (matrices.length - 1)
  const noms = [
    ...Array.from({ length: n }, (_, i) => `oeil${i}`),
    ...Array.from({ length: nombreYeuxColores }, (_, i) => `iris${i}`),
    ...Array.from({ length: nombreLunettes }, (_, i) => `lunette${i}`),
    ...Array.from({ length: nombreAccessoires }, (_, i) => `accessoire${i}`)
  ]
  const regles = noms.map((nom, index) => {
    const etapes = matrices
      .map((m, i) => `${+(i * pas).toFixed(3)}%{transform:${m[index]}}`)
      .join('')
    return `@keyframes ${nom}{${etapes}}`
  })

  const classes = noms.join(',')
  const style =
    '<style>' +
    // `transform-box`/`transform-origin` ne sont pas decoratifs : sans eux, une
    // transformation CSS sur un element SVG tourne autour du centre de sa boite
    // au lieu de l'origine du repere, et l'oeil part a l'autre bout de la boule.
    `${classes}{transform-box:view-box;transform-origin:0 0;` +
    // `alternate` donne une boucle SANS COUTURE : la derive du regard n'est pas
    // periodique (ses periodes sont premieres entre elles pour ne jamais se
    // repeter), donc une boucle simple montrerait un saut au raccord. Jouee puis
    // rejouee a l'envers, elle reboucle exactement sur elle-meme — et un
    // clignement a l'envers reste un clignement.
    `animation-duration:${duree}s;animation-iteration-count:infinite;` +
    `animation-timing-function:linear;animation-direction:alternate}` +
    noms.map((nom) => `.${nom}{animation-name:${nom}}`).join('') +
    regles.join('') +
    '</style>'

  return accessoiresAnimes
    .replace(mask[0], maskAnime)
    .replace('</svg>', `${style}</svg>`)
}

/* ------------------------------------------------------------------- gif */

/**
 * Compression LZW du GIF : codes de longueur VARIABLE, ecrits bit a bit en
 * commencant par le bit de poids faible, et regroupes en sous-blocs de 255 octets
 * au plus.
 */
function lzw(indices: Uint8Array, bitsParPixel: number): number[] {
  const clear = 1 << bitsParPixel
  const fin = clear + 1
  let taille = bitsParPixel + 1
  let suivant = fin + 1
  let dico = new Map<string, number>()

  const octets: number[] = []
  let reserve = 0
  let bits = 0
  const ecris = (code: number) => {
    reserve |= code << bits
    bits += taille
    while (bits >= 8) {
      octets.push(reserve & 0xff)
      reserve >>= 8
      bits -= 8
    }
  }

  ecris(clear)
  let prefixe = String(indices[0])
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i]!
    const cle = `${prefixe},${c}`
    const connu = dico.get(cle)
    if (connu !== undefined) {
      prefixe = String(connu)
      continue
    }
    ecris(Number(prefixe))
    if (suivant < 4096) {
      dico.set(cle, suivant++)
      // La largeur du code grandit un cran APRES que le dictionnaire ait
      // depasse ce qu'elle adresse, et ce decalage est le piege du format :
      // l'encodeur inscrit son entree juste apres avoir emis un code, alors que
      // le decodeur n'inscrit la sienne qu'en lisant le code SUIVANT. Il est donc
      // toujours en retard d'une entree, et l'encodeur doit elargir en retard
      // aussi. Ecrire `=== (1 << taille)` desynchronise les deux et le flux
      // devient illisible — verifie par un test d'aller-retour.
      if (suivant > 1 << taille && taille < 12) taille++
    } else {
      // Dictionnaire plein : on le repart a zero, le decodeur fait pareil en
      // voyant le code de remise a zero.
      ecris(clear)
      dico = new Map()
      taille = bitsParPixel + 1
      suivant = fin + 1
    }
    prefixe = String(c)
  }
  ecris(Number(prefixe))
  ecris(fin)
  if (bits > 0) octets.push(reserve & 0xff)

  // Decoupage en sous-blocs : chacun est precede de sa longueur, et un octet nul
  // termine la serie.
  const sortie: number[] = [bitsParPixel]
  for (let i = 0; i < octets.length; i += 255) {
    const bloc = octets.slice(i, i + 255)
    sortie.push(bloc.length, ...bloc)
  }
  sortie.push(0)
  return sortie
}

/**
 * Palette commune a toutes les images, index 0 reserve au transparent.
 *
 * Elle se construit en DEUX temps — recenser les couleurs, puis indexer les
 * images — parce qu'un GIF exige une palette commune : il faut avoir vu toutes
 * les images avant d'en encoder une seule. Sur un cycle de trente secondes, les
 * garder en pixels bruts couterait 255 Mo ; recensees puis indexees, elles ne
 * pesent plus qu'un octet par pixel.
 */
export interface PaletteGif {
  /** Combien de pixels par teinte, pendant le recensement. */
  vues: Map<number, number>
  /** RGB compacte sur 24 bits -> index, une fois la palette arretee. */
  index: Map<number, number>
  /** Resolution des teintes absentes vers la plus proche retenue. */
  proches: Map<number, number>
  /** Au moins un pixel transparent a ete vu. */
  transparence: boolean
}

export const nouvellePalette = (): PaletteGif => ({
  vues: new Map(),
  index: new Map(),
  proches: new Map(),
  transparence: false
})

/**
 * Recense les couleurs d'une image, en COMPTANT les pixels.
 *
 * Le comptage n'est pas un detail : une palette remplie au premier arrive se
 * serait gorgee des nuances d'anticrenelage des premieres images, et les teintes
 * des anneaux — qui n'apparaissent qu'au milieu du cycle — seraient toutes tombees
 * sur la meme case. Mesure : un cycle depasse les 255 couleurs, donc il FAUT
 * choisir lesquelles garder.
 */
export function recense(palette: PaletteGif, px: Uint8ClampedArray) {
  for (let p = 0; p < px.length; p += 4) {
    if (px[p + 3]! < 128) {
      palette.transparence = true
      continue
    }
    const cle = (px[p]! << 16) | (px[p + 1]! << 8) | px[p + 2]!
    palette.vues.set(cle, (palette.vues.get(cle) ?? 0) + 1)
  }
}

/** Arrete la palette sur les 255 teintes les plus presentes. */
function arrete(palette: PaletteGif) {
  if (palette.index.size) return
  const tries = [...palette.vues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 255)
  for (const [cle] of tries) palette.index.set(cle, palette.index.size + 1)
}

/** Index de la teinte la plus proche parmi celles retenues, mis en cache. */
function plusProche(palette: PaletteGif, cle: number) {
  const connu = palette.proches.get(cle)
  if (connu !== undefined) return connu
  const r = (cle >> 16) & 0xff
  const v = (cle >> 8) & 0xff
  const b = cle & 0xff
  let meilleur = 1
  let ecart = Infinity
  for (const [autre, i] of palette.index) {
    const dr = r - ((autre >> 16) & 0xff)
    const dv = v - ((autre >> 8) & 0xff)
    const db = b - (autre & 0xff)
    const d = dr * dr + dv * dv + db * db
    if (d < ecart) {
      ecart = d
      meilleur = i
    }
  }
  // Le cache borne le cout : chaque teinte absente n'est resolue qu'une fois,
  // meme si elle revient sur des centaines d'images.
  palette.proches.set(cle, meilleur)
  return meilleur
}

/** Traduit une image en index de palette, un octet par pixel. */
export function indexe(palette: PaletteGif, px: Uint8ClampedArray): Uint8Array {
  arrete(palette)
  const out = new Uint8Array(px.length / 4)
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    // 0 = transparent, et c'est deja la valeur par defaut du tableau
    if (px[p + 3]! < 128) continue
    const cle = (px[p]! << 16) | (px[p + 1]! << 8) | px[p + 2]!
    out[i] = palette.index.get(cle) ?? plusProche(palette, cle)
  }
  return out
}

/**
 * Assemble des images en GIF anime.
 *
 * La transparence du GIF est sur UN bit : un pixel est opaque ou invisible, rien
 * entre les deux. Sur un fond transparent, le bord antialiase de la boule est donc
 * tranche a 50 % d'opacite et ressort en marches d'escalier. Ce n'est pas un defaut
 * a corriger, c'est le format — d'ou le choix laisse a l'utilisateur entre ce bord
 * dur et un fond plein, ou le bord reste lisse parce qu'il a de quoi se fondre.
 *
 * La transparence est DEDUITE des images, pas demandee : des images deja aplaties
 * sur un fond n'ont pas a declarer d'index transparent, et surtout pas a etre
 * eliminees « retour au fond » entre deux — ce qui ferait clignoter le fond.
 *
 * Le GIF n'existe que pour les endroits qui refusent le SVG anime, comme les
 * avatars animes de Discord ou de Slack. Partout ailleurs le SVG est meilleur.
 */
export function gifAnime(
  images: Uint8ClampedArray[],
  largeur: number,
  hauteur: number,
  delaiMs: number
): Uint8Array<ArrayBuffer> {
  if (!images.length) throw new Error('aucune image a emballer')
  const palette = nouvellePalette()
  for (const px of images) recense(palette, px)
  return gifIndexe(
    palette,
    images.map((px) => indexe(palette, px)),
    largeur,
    hauteur,
    delaiMs
  )
}

/**
 * Meme chose, mais sur des images DEJA indexees — la voie a memoire bornee, pour
 * les longues sequences. Cf. `PaletteGif`.
 */
export function gifIndexe(
  palette: PaletteGif,
  images: Uint8Array[],
  largeur: number,
  hauteur: number,
  delaiMs: number
): Uint8Array<ArrayBuffer> {
  if (!images.length) throw new Error('aucune image a emballer')

  arrete(palette)
  const transparence = palette.transparence
  const couleurs = palette.index
  // Une palette GIF a une taille en puissance de deux, et il faut au moins deux
  // bits par pixel pour que le code de remise a zero tienne.
  const bits = Math.max(2, Math.ceil(Math.log2(couleurs.size + 1)))
  const tailleTable = 1 << bits

  const table: number[] = [0, 0, 0] // index 0 : le transparent, couleur sans importance
  for (const cle of couleurs.keys()) table.push((cle >> 16) & 0xff, (cle >> 8) & 0xff, cle & 0xff)
  while (table.length < tailleTable * 3) table.push(0)

  const out: number[] = [
    ...ascii('GIF89a'),
    ...le(largeur, 2),
    ...le(hauteur, 2),
    0x80 | (bits - 1), // table globale presente, et sa taille
    0, // index de fond : le transparent
    0, // pas de rapport d'aspect
    ...table,
    // Boucle sans fin, par l'extension Netscape — rien d'autre ne sait le dire.
    0x21,
    0xff,
    0x0b,
    ...ascii('NETSCAPE2.0'),
    0x03,
    0x01,
    ...le(0, 2),
    0x00
  ]

  // Le delai du GIF se compte en CENTIEMES de seconde : c'est ce qui limite sa
  // cadence, un delai de 0 ou 1 etant traite differemment selon les lecteurs.
  const delai = Math.max(2, Math.round(delaiMs / 10))

  for (const indices of images) {
    out.push(
      0x21,
      0xf9,
      0x04,
      // Sur fond transparent : elimination « retour au fond » (2) et index
      // transparent declare, sinon les zones vides laissent voir l'image
      // precedente et la boule traine derriere elle.
      //
      // Sur fond plein : « laisser en place » (1), et surtout PAS de retour au
      // fond — chaque image couvre toute la toile, donc effacer entre deux ne
      // sert qu'a faire clignoter le fond.
      transparence ? (2 << 2) | 0x01 : 1 << 2,
      ...le(delai, 2),
      0, // index transparent
      0x00,
      0x2c,
      ...le(0, 2),
      ...le(0, 2),
      ...le(largeur, 2),
      ...le(hauteur, 2),
      0, // pas de table locale, pas d'entrelacement
      ...lzw(indices, bits)
    )
  }

  out.push(0x3b)
  return new Uint8Array(out)
}
