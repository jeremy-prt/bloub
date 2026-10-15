import { describe, expect, it } from 'vitest'
import { EXPRESSIONS } from '@/bot/expressions'
import { COLORS, SHAPES } from '@/bot/skins'
import { STATES } from '@/bot/states'
import { formePlurielle, interpoler } from './format'
import { choisirLangue, LANGUES, tagDe } from './langues'
import fr from './locales/fr'
import en from './locales/en'
import es from './locales/es'
import zh from './locales/zh'

/**
 * On importe les dictionnaires et les modules purs, jamais `./index` : celui-ci
 * lit `localStorage`, `navigator` et `document` a l'import, donc il exige un
 * navigateur. C'est precisement pour ca que la regle de choix de langue et la
 * mecanique de texte vivent dans des fichiers separes.
 */
const DICTIONNAIRES = { fr, en, es, zh }

describe('choix de la langue au demarrage', () => {
  it('respecte le choix memorise, quelles que soient les preferences du navigateur', () => {
    expect(choisirLangue('en', ['fr-FR', 'fr'])).toBe('en')
    expect(choisirLangue('zh', ['fr-FR'])).toBe('zh')
    expect(choisirLangue('es', ['fr-FR'])).toBe('es')
  })

  it('ignore un choix memorise qui n est pas une langue connue', () => {
    // le localStorage se modifie a la main : on ne lui fait pas confiance
    expect(choisirLangue('de', ['en-GB'])).toBe('en')
    expect(choisirLangue('', ['en-GB'])).toBe('en')
  })

  it('suit l ordre des preferences du navigateur, pas leur simple presence', () => {
    expect(choisirLangue(null, ['zh-CN', 'en-US', 'fr'])).toBe('zh')
    expect(choisirLangue(null, ['en-US', 'zh-CN', 'fr'])).toBe('en')
    expect(choisirLangue(null, ['es-MX', 'fr-FR'])).toBe('es')
  })

  it('reduit une etiquette complete a sa langue', () => {
    // le piege : `zh-Hans-CN` ne se coupe pas au premier tiret par hasard
    expect(choisirLangue(null, ['zh-Hans-CN'])).toBe('zh')
    expect(choisirLangue(null, ['en-GB-oxendict'])).toBe('en')
  })

  it('saute les langues qu on ne parle pas et les etiquettes invalides', () => {
    expect(choisirLangue(null, ['de-DE', 'ja', 'en'])).toBe('en')
    expect(choisirLangue(null, ['pas une etiquette', 'zh'])).toBe('zh')
  })

  it('retombe sur le francais quand rien ne correspond', () => {
    expect(choisirLangue(null, ['de-DE', 'ja-JP'])).toBe('fr')
    expect(choisirLangue(null, [])).toBe('fr')
  })
})

describe('completude des dictionnaires', () => {
  /**
   * La presence des cles est deja garantie a la compilation (les autres locales
   * sont typees `typeof fr`). Ce qu'on verifie ici, c'est ce que le type ne voit pas :
   * une valeur vide, ou une traduction restee en francais par oubli.
   */
  function feuilles(objet: object, prefixe = ''): Array<[string, string]> {
    return Object.entries(objet).flatMap(([cle, valeur]) =>
      typeof valeur === 'string'
        ? [[`${prefixe}${cle}`, valeur] as [string, string]]
        : feuilles(valeur as object, `${prefixe}${cle}.`)
    )
  }

  it('n a aucune valeur vide, dans aucune langue', () => {
    for (const [langue, dico] of Object.entries(DICTIONNAIRES)) {
      for (const [cle, valeur] of feuilles(dico)) {
        expect(valeur.trim(), `${langue}.${cle}`).not.toBe('')
      }
    }
  })

  it('traduit vraiment les libelles des catalogues, sans les recopier du francais', () => {
    // Les noms de marque et les gabarits purs (« {state}, {duration} ») sont
    // identiques d'une langue a l'autre, c'est normal — on ne regarde donc que
    // les catalogues, ou chaque entree est un vrai mot a traduire.
    for (const famille of ['states', 'shapes', 'colors', 'expressions'] as const) {
      for (const [cle, valeur] of feuilles(fr[famille])) {
        expect(feuilles(zh[famille]).find(([k]) => k === cle)![1], `zh ${famille}.${cle}`).not.toBe(
          valeur
        )
      }
    }
  })

  it('incluye traducciones españolas en los catálogos del avatar', () => {
    expect(es.states.idle).toBe('En reposo')
    expect(es.shapes.cercle).toBe('Círculo')
    expect(es.colors.rouge).toBe('Rojo')
    expect(es.expressions.hilare).toBe('Riendo a carcajadas')
  })

  it('couvre les quatre catalogues du bot, entree par entree', () => {
    const cles = (famille: object) => feuilles(famille).map(([k]) => k)
    expect(cles(fr.states).sort()).toEqual(STATES.map((s) => s.id).sort())
    expect(cles(fr.shapes).sort()).toEqual(SHAPES.map((s) => s.id).sort())
    expect(cles(fr.colors).sort()).toEqual(COLORS.map((c) => c.id).sort())
    expect(cles(fr.expressions).sort()).toEqual(EXPRESSIONS.map((e) => e.id).sort())
  })
})

describe('substitution', () => {
  it('remplace toutes les occurrences d un parametre', () => {
    expect(interpoler('{a} et {a}', { a: 'x' })).toBe('x et x')
  })

  it('accepte les nombres et plusieurs parametres', () => {
    expect(interpoler('{etat}, {duree}', { etat: 'Repos', duree: 2 })).toBe('Repos, 2')
  })

  it('laisse visible un parametre sans valeur, plutot que de le vider', () => {
    // un « {name} » a l'ecran se remarque ; une chaine vide passe inapercue
    expect(interpoler('Supprimer {name} ?', {})).toBe('Supprimer {name} ?')
  })
})

describe('pluriel', () => {
  it('range zero avec le singulier en francais, avec le pluriel en anglais', () => {
    const gabarit = 'un | plusieurs'
    expect(formePlurielle(gabarit, 0, 'fr')).toBe('un')
    expect(formePlurielle(gabarit, 0, 'en')).toBe('plusieurs')
  })

  it('distingue un de deux dans les langues à pluriel', () => {
    const gabarit = 'un | plusieurs'
    for (const tag of ['fr', 'en', 'es']) {
      expect(formePlurielle(gabarit, 1, tag)).toBe('un')
      expect(formePlurielle(gabarit, 2, tag)).toBe('plusieurs')
    }
    expect(formePlurielle(gabarit, 0, 'es')).toBe('plusieurs')
  })

  it('rend la forme unique quand la langue n a pas de pluriel', () => {
    // le chinois : une seule forme ecrite dans le dictionnaire, sans separateur
    for (const n of [0, 1, 2, 17]) {
      expect(formePlurielle('{n} 个动画', n, 'zh-Hans')).toBe('{n} 个动画')
    }
  })

  it('donne au chinois une seule forme et aux autres langues deux', () => {
    expect(zh.dialog.removeDetail.includes(' | ')).toBe(false)
    expect(fr.dialog.removeDetail.split(' | ')).toHaveLength(2)
    expect(en.dialog.removeDetail.split(' | ')).toHaveLength(2)
    expect(es.dialog.removeDetail.split(' | ')).toHaveLength(2)
  })
})

describe('catalogue des langues', () => {
  it('propose les quatre langues, avec un drapeau et un endonyme', () => {
    expect(LANGUES.map((l) => l.id)).toEqual(['fr', 'en', 'es', 'zh'])
    for (const l of LANGUES) {
      expect(l.emoji.length, l.id).toBeGreaterThan(0)
      expect(l.nom.trim(), l.id).not.toBe('')
    }
  })

  it('donne une etiquette BCP 47 que `Intl` sait lire', () => {
    for (const l of LANGUES) {
      const tag = tagDe(l.id)
      expect(new Intl.Locale(tag).language, l.id).toBe(l.id)
      // c'est cette etiquette qui formate les nombres : elle doit etre utilisable
      expect(new Intl.NumberFormat(tag).format(2.4), l.id).toMatch(/2[.,]4/)
    }
  })

  it('precise l ecriture du chinois, que `zh` seul laisse indeterminee', () => {
    expect(tagDe('zh')).toBe('zh-Hans')
  })
})
