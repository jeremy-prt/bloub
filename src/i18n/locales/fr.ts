/**
 * Locale de reference. Les deux autres sont typees `typeof fr`, donc c'est ce
 * fichier qui definit le contrat : y ajouter une cle fait echouer `vue-tsc` sur
 * `en.ts` et `zh.ts` jusqu'a ce qu'elles soient traduites.
 *
 * Surtout PAS de `as const` : chaque valeur deviendrait son propre type
 * litteral, et toute traduction serait alors refusee comme n'etant pas la
 * chaine francaise.
 *
 * Les guillemets et les espaces font partie de la traduction, pas du code : le
 * francais veut « ... » avec espaces insecables, l'anglais "...", le chinois
 * n'a pas d'espace avant ses unites. Aucun composant ne doit les ajouter.
 */
export default {
  app: {
    /**
     * Nom du produit. En minuscules dans toutes les langues, ce n'est pas une
     * coquille : les capitales de `NOM` (App.vue) sont un logotype, pas le nom.
     * Un nom propre ne se traduit pas non plus. `title` sert de `document.title`.
     * Voir aussi le <title> de index.html, qui est statique.
     */
    name: 'bloub',
    title: 'bloub — avatar SVG animé',
    botAria: 'Avatar bloub animé'
  },

  gallery: {
    back: 'Retour au lecteur'
  },

  rail: {
    nav: 'Sections',
    customize: 'Personnaliser',
    animations: 'Animations',
    settings: 'Réglages'
  },

  panel: {
    /**
     * Au SINGULIER, comme les trois autres : un titre de grille nomme ce qu'un
     * clic pose, pas le nombre de vignettes proposees. Le pluriel reste au rail,
     * qui nomme la vue et non le choix (`rail.animations`).
     */
    animations: 'Animation',
    shape: 'Forme',
    expression: 'Expression',
    color: 'Couleur',
    rotateEyes: 'Yeux 3D',
    addHands: 'Mains'
  },

  glasses: {
    title: 'Lunettes',
    add: 'Ajouter',
    remove: 'Retirer',
    style: 'Style',
    size: 'Taille',
    color: 'Couleur de la monture',
    eyeColor: 'Couleur des yeux',
    customEyeColor: 'Choisir une couleur des yeux',
    showEyesWithGlasses: 'Afficher les yeux derrière les lunettes',
    styles: {
      round: 'Rondes',
      square: 'Carrées',
      aviator: 'Aviateur',
      catEye: 'Œil-de-chat',
      wayfarer: 'Wayfarer',
      sun: 'Lunettes de soleil'
    },
    eyeColors: {
      light: 'Clair',
      brown: 'Marron',
      hazel: 'Noisette',
      green: 'Vert',
      blue: 'Bleu',
      gray: 'Gris',
      violet: 'Violet',
      dark: 'Foncé'
    }
  },

  accessories: {
    drag: 'Faites glisser chaque accessoire sur le visage',
    blockTitle: 'Accessoires de cette animation',
    blockHint: 'Ces réglages sont enregistrés sur le bloc sélectionné et le suivent dans le montage.',
    enableItem: 'Activer {item} dans cette animation',
    disableItem: 'Désactiver {item} dans cette animation',
    itemColor: 'Couleur de {item} dans cette animation',
    face: 'Moustache et bouche',
    color: 'Couleur de l’accessoire',
    positionX: 'Position horizontale',
    positionY: 'Position verticale',
    width: 'Larg.',
    height: 'Haut.',
    rotation: 'Inclinaison',
    curve: 'Courbure',
    roundness: 'Rondeur',
    glassesWidth: 'Largeur des lunettes',
    glassesHeight: 'Hauteur des lunettes',
    glassesRotation: 'Inclinaison des lunettes',
    leftLens: 'Verre gauche',
    rightLens: 'Verre droit',
    selectLens: 'Choisir le verre à régler',
    leftLensX: 'Position horizontale du verre gauche',
    leftLensY: 'Position verticale du verre gauche',
    rightLensX: 'Position horizontale du verre droit',
    rightLensY: 'Position verticale du verre droit',
    mustache: 'Moustache',
    mouth: 'Bouche',
    addMouth: 'Ajouter une bouche',
    removeMouth: 'Retirer la bouche',
    mouthColor: 'Couleur de la bouche',
    mouthWidth: 'Largeur de la bouche',
    mouthHeight: 'Hauteur de la bouche',
    mouthRotation: 'Inclinaison de la bouche',
    mouthCurve: 'Courbure de la bouche',
    mouthRoundness: 'Rondeur de la bouche',
    mouthStyle: 'Forme de la bouche',
    mouthStyles: {
      smile: 'Sourire',
      open: 'Ouverte',
      pout: 'Lèvres pincées',
      grin: 'Grand sourire',
      frown: 'Triste',
      smirk: 'Sourire en coin',
      round: 'Ronde',
      laugh: 'Rire ouvert'
    },
    addMustache: 'Ajouter une moustache',
    removeMustache: 'Retirer la moustache',
    mustacheStyle: 'Style de moustache',
    mustacheColor: 'Couleur de la moustache',
    mustacheWidth: 'Largeur de la moustache',
    mustacheHeight: 'Hauteur de la moustache',
    mustacheRotation: 'Inclinaison de la moustache',
    mustacheCurve: 'Courbure de la moustache',
    mustacheRoundness: 'Rondeur de la moustache',
    mustacheStyles: {
      classic: 'Classique',
      chevron: 'Chevron',
      handlebar: 'En guidon',
      natural: 'Naturelle',
      pencil: 'Fine',
      walrus: 'Morse',
      horseshoe: 'Fer à cheval',
      imperial: 'Impériale',
      toothbrush: 'Brosse'
    },
  },

  /**
   * Barre d'export de la vue Personnaliser. Les libelles du menu sont des
   * ACTIONS et pas des noms de format : « Télécharger le PNG » se comprend sans
   * savoir ce qu'est un PNG, « PNG · 1024 px » demande de trancher une question
   * qui n'est pas celle de l'utilisateur.
   */
  export: {
    action: 'Exporter en PNG',
    more: 'Autres formats',
    png: 'Télécharger le PNG',
    svg: 'Télécharger le SVG',
    anime: "Télécharger l'animation SVG",
    gif: 'Télécharger le GIF animé',
    cycleDetail: 'La vidéo est plus légère et plus fluide ; le GIF passe partout.',
    cycleTurnEyes: 'Rotation 3D des yeux',
    cycleTurnEyesHelp: 'Les yeux font un tour complet et passent derrière ; le corps reste immobile.',
    cycleFormat: 'Format',
    cycle_mp4: 'Vidéo MP4',
    cycle_mp4_aide: 'Léger et fluide, fond obligatoire',
    cycle_gif: 'GIF animé',
    cycle_gif_aide: 'Lu partout, plus lourd',
    cycleProgress: 'Export en cours…',
    cycleReessayer: 'Réessayer',
    gifTitle: 'Télécharger le GIF animé',
    background: 'Arrière-plan derrière le personnage',
    backgroundHelp: 'Choisissez un fond transparent, uni, dégradé ou une photo.',
    backgroundMode: "Type d'arrière-plan",
    backgroundNone: 'Aucun fond',
    backgroundColor: 'Couleur unie',
    backgroundGradient: 'Dégradé',
    backgroundPhoto: 'Photo',
    backgroundSecondColor: 'Deuxième couleur',
    backgroundDirection: 'Direction du dégradé',
    directionHorizontal: 'De gauche à droite',
    directionVertical: 'De haut en bas',
    directionDiagonal: 'Diagonale descendante',
    directionDiagonalReverse: 'Diagonale montante',
    uploadBackground: 'Importer une photo',
    changeBackground: 'Changer la photo',
    removeBackground: "Retirer la photo d'arrière-plan",
    backgroundTypeError: 'Choisissez une image PNG, JPG ou WebP.',
    backgroundSizeError: "L'image doit peser moins de 10 Mo.",
    backgroundLoadError: "L'image n'a pas pu être chargée.",
    gifDetail:
      "Le GIF ne gère la transparence qu'en tout ou rien : sans fond, le contour de la boule est un peu dur.",
    gifBackground: 'Fond',
    fond_blanc: 'Fond blanc',
    fond_blanc_aide: 'Contour lisse, à poser sur du clair',
    fond_transparent: 'Fond transparent',
    fond_transparent_aide: "S'adapte à tout fond, contour un peu dur",
    gifConfirm: 'Télécharger',
    copie: "Copier l'image",
    copieSvg: 'Copier le SVG',
    done: 'Exporté',
    copied: 'Copié',
    failed: "Échec de l'export"
  },

  preview: {
    exit: "Quitter l'aperçu",
    /** Nom de la touche tel qu'il est grave sur le clavier de la langue. */
    key: 'Échap'
  },

  timeline: {
    play: 'Lancer la lecture',
    pause: 'Arrêter la lecture',
    addAnimation: 'Ajouter une animation',
    preview: 'Aperçu',
    export: 'Exporter le montage',
    zoom: 'Zoom de la piste',
    blockAria: '{state}, {duration}',
    blockDurationAria: 'Durée de {state}, {duration}',
    blockRemoveAria: 'Retirer {state}'
  },

  dialog: {
    cancel: 'Annuler',
    nameCreateTitle: 'Nouveau cycle',
    nameRenameTitle: 'Renommer le cycle',
    nameField: 'Nom du cycle',
    nameCreate: 'Créer',
    nameRename: 'Renommer',
    removeTitle: 'Supprimer « {name} » ?',
    removeDetail:
      'Ce montage sera perdu, avec son animation. | Ce montage sera perdu, avec ses {n} animations.',
    removeConfirm: 'Supprimer'
  },

  cycles: {
    defaultName: 'Cycle par défaut',
    newName: 'Mon cycle',
    menuNew: 'Nouveau cycle',
    menuRenameAria: 'Renommer {name}',
    menuRemoveAria: 'Supprimer {name}'
  },

  units: {
    seconds: '{n} s',
    /** Graduation de la règle : serré, le chiffre est déjà petit. */
    secondsShort: '{n}s'
  },

  settings: {
    title: 'Réglages',
    language: 'Langue',
    about: 'À propos',
    credits: 'Créé avec ❤️ par {name}',
    creditsAria: 'Jérémy sur X, dans un nouvel onglet',
    github: 'Voir le projet sur GitHub',
    githubAria: 'Le dépôt du projet sur GitHub, dans un nouvel onglet'
  },

  states: {
    idle: 'Repos',
    thinking: 'Réflexion',
    wink: "Clin d'œil",
    wide: 'Yeux écarquillés',
    alert: 'Alerte',
    notify: 'Notification',
    exclaim: 'Exclamation',
    sleep: 'Veille',
    egg: 'Œuf',
    hexagon: 'Hexagone',
    play: 'Lecture',
    orbit: 'Orbite',
    burst: 'Éclatement',
    comet: 'Comète',
    swirl: 'Tourbillon'
  },

  shapes: {
    cercle: 'Cercle',
    galet: 'Galet',
    squircle: 'Squircle',
    capsule: 'Capsule',
    triangle: 'Triangle',
    hexagone: 'Hexagone',
    nuage: 'Nuage',
    goutte: 'Goutte'
  },

  colors: {
    encre: 'Encre',
    creme: 'Crème',
    brun: 'Brun',
    rouge: 'Rouge',
    orange: 'Orange',
    ambre: 'Ambre',
    vert: 'Vert',
    turquoise: 'Turquoise',
    bleu: 'Bleu',
    violet: 'Violet',
    rose: 'Rose',
    gris: 'Gris'
  },

  expressions: {
    neutre: 'Neutre',
    attentif: 'Attentif',
    surpris: 'Surpris',
    excite: 'Excité',
    heureux: 'Heureux',
    hilare: 'Hilare',
    colere: 'En colère',
    triste: 'Triste',
    effraye: 'Effrayé',
    mefiant: 'Méfiant',
    confus: 'Confus',
    curieux: 'Curieux',
    fier: 'Fier',
    timide: 'Timide',
    blase: 'Blasé',
    somnolent: 'Somnolent'
  }
}
