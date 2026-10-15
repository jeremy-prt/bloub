/**
 * Langues proposees et regle de choix. Volontairement sans DOM ni Vue : le
 * navigateur ne rentre que par les arguments, donc la regle se teste sans
 * simuler `navigator` ni `localStorage`.
 */

/**
 * `tag` est l'etiquette BCP 47, pas l'identifiant : elle sert a `Intl` et a
 * l'attribut `lang` du document. `zh` seul ne dit pas si l'ecriture est
 * simplifiee ou traditionnelle, d'ou `zh-Hans`.
 *
 * `nom` est l'endonyme — le nom de la langue DANS cette langue. Une liste de
 * langues traduite serait absurde : on la lit justement quand on ne comprend
 * pas la langue affichee.
 */
export const LANGUES = [
  { id: 'fr', tag: 'fr', emoji: '🇫🇷', nom: 'Français' },
  { id: 'en', tag: 'en', emoji: '🇬🇧', nom: 'English' },
  { id: 'es', tag: 'es', emoji: '🇪🇸', nom: 'Español' },
  { id: 'zh', tag: 'zh-Hans', emoji: '🇨🇳', nom: '简体中文' }
] as const

export type Langue = (typeof LANGUES)[number]['id']

export const LANGUE_PAR_DEFAUT: Langue = 'fr'

export function estLangue(valeur: string | null | undefined): valeur is Langue {
  return LANGUES.some((l) => l.id === valeur)
}

export function tagDe(langue: Langue): string {
  return LANGUES.find((l) => l.id === langue)!.tag
}

/**
 * Langue a afficher au demarrage.
 *
 * Un choix explicite gagne toujours : quelqu'un qui a mis l'interface en
 * anglais ne veut pas la retrouver en francais parce qu'il a change de reseau.
 * Sinon on parcourt les preferences du navigateur DANS L'ORDRE — c'est un
 * classement, pas un ensemble — et on retient la premiere qu'on sait parler.
 *
 * Le decoupage passe par `Intl.Locale` plutot que par `tag.split('-')[0]` :
 * `zh-Hans-CN` doit donner `zh`, et les etiquettes exotiques ne se coupent pas
 * toutes au premier tiret.
 */
export function choisirLangue(memorisee: string | null, preferences: readonly string[]): Langue {
  if (estLangue(memorisee)) return memorisee
  for (const tag of preferences) {
    let base: string
    try {
      base = new Intl.Locale(tag).language
    } catch {
      // une etiquette invalide dans navigator.languages n'a pas a tout casser
      continue
    }
    if (estLangue(base)) return base
  }
  return LANGUE_PAR_DEFAUT
}
