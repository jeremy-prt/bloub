import type fr from './fr'

/**
 * Le type `typeof fr` est le verrou : une cle oubliee ou mal orthographiee est
 * une erreur de compilation nommee, pas une chaine manquante decouverte a
 * l'ecran.
 */
const en: typeof fr = {
  app: {
    name: 'bloub',
    title: 'bloub — animated SVG avatar',
    botAria: 'Animated bloub avatar'
  },

  gallery: {
    back: 'Back to the player'
  },

  rail: {
    nav: 'Sections',
    customize: 'Customise',
    animations: 'Animations',
    settings: 'Settings'
  },

  panel: {
    animations: 'Animation',
    shape: 'Shape',
    expression: 'Expression',
    color: 'Colour',
    rotateEyes: '3D eyes',
    addHands: 'Hands'
  },

  glasses: {
    title: 'Glasses',
    add: 'Add',
    remove: 'Remove',
    style: 'Style',
    size: 'Size',
    color: 'Frame colour',
    eyeColor: 'Eye colour',
    customEyeColor: 'Choose an eye colour',
    showEyesWithGlasses: 'Show eyes behind glasses',
    styles: {
      round: 'Round',
      square: 'Square',
      aviator: 'Aviator',
      catEye: 'Cat-eye',
      wayfarer: 'Wayfarer',
      sun: 'Sunglasses'
    },
    eyeColors: {
      light: 'Light',
      brown: 'Brown',
      hazel: 'Hazel',
      green: 'Green',
      blue: 'Blue',
      gray: 'Gray',
      violet: 'Violet',
      dark: 'Dark'
    }
  },

  accessories: {
    drag: 'Drag each accessory on the face',
    blockTitle: 'Accessories for this animation',
    blockHint: 'These settings are saved on the selected block and follow it in the montage.',
    enableItem: 'Enable {item} in this animation',
    disableItem: 'Disable {item} in this animation',
    itemColor: '{item} color in this animation',
    face: 'Moustache and mouth',
    color: 'Accessory color',
    positionX: 'Horizontal position',
    positionY: 'Vertical position',
    width: 'Wide',
    height: 'Tall',
    rotation: 'Rotate',
    curve: 'Curve',
    roundness: 'Roundness',
    glassesWidth: 'Glasses width',
    glassesHeight: 'Glasses height',
    glassesRotation: 'Glasses rotation',
    leftLens: 'Left lens',
    rightLens: 'Right lens',
    selectLens: 'Select lens to adjust',
    leftLensX: 'Left lens horizontal position',
    leftLensY: 'Left lens vertical position',
    rightLensX: 'Right lens horizontal position',
    rightLensY: 'Right lens vertical position',
    mustache: 'Moustache',
    mouth: 'Mouth',
    addMouth: 'Add a mouth',
    removeMouth: 'Remove the mouth',
    mouthColor: 'Mouth colour',
    mouthWidth: 'Mouth width',
    mouthHeight: 'Mouth height',
    mouthRotation: 'Mouth rotation',
    mouthCurve: 'Mouth curve',
    mouthRoundness: 'Mouth roundness',
    mouthStyle: 'Mouth shape',
    mouthStyles: {
      smile: 'Smile',
      open: 'Open',
      pout: 'Pout',
      grin: 'Wide grin',
      frown: 'Frown',
      smirk: 'Smirk',
      round: 'Round',
      laugh: 'Laughing'
    },
    addMustache: 'Add moustache',
    removeMustache: 'Remove moustache',
    mustacheStyle: 'Moustache style',
    mustacheColor: 'Moustache colour',
    mustacheWidth: 'Moustache width',
    mustacheHeight: 'Moustache height',
    mustacheRotation: 'Moustache rotation',
    mustacheCurve: 'Moustache curve',
    mustacheRoundness: 'Moustache roundness',
    mustacheStyles: {
      classic: 'Classic',
      chevron: 'Chevron',
      handlebar: 'Handlebar',
      natural: 'Natural',
      pencil: 'Pencil',
      walrus: 'Walrus',
      horseshoe: 'Horseshoe',
      imperial: 'Imperial',
      toothbrush: 'Toothbrush'
    },
  },

  export: {
    action: 'Export as PNG',
    more: 'Other formats',
    png: 'Download PNG',
    svg: 'Download SVG',
    anime: 'Download animated SVG',
    gif: 'Download animated GIF',
    cycleDetail: 'The video is lighter and smoother; the GIF plays anywhere.',
    cycleTurnEyes: '3D eye turn',
    cycleTurnEyesHelp: 'The eyes complete a full turn and pass behind; the body stays still.',
    cycleFormat: 'Format',
    cycle_mp4: 'MP4 video',
    cycle_mp4_aide: 'Light and smooth, needs a background',
    cycle_gif: 'Animated GIF',
    cycle_gif_aide: 'Plays anywhere, heavier',
    cycleProgress: 'Exporting…',
    cycleReessayer: 'Try again',
    gifTitle: 'Download animated GIF',
    background: 'Background behind character',
    backgroundHelp: 'Choose a transparent background, solid color, gradient, or photo.',
    backgroundMode: 'Background type',
    backgroundNone: 'No background',
    backgroundColor: 'Solid color',
    backgroundGradient: 'Gradient',
    backgroundPhoto: 'Photo',
    backgroundSecondColor: 'Second color',
    backgroundDirection: 'Gradient direction',
    directionHorizontal: 'Left to right',
    directionVertical: 'Top to bottom',
    directionDiagonal: 'Diagonal down',
    directionDiagonalReverse: 'Diagonal up',
    uploadBackground: 'Upload a photo',
    changeBackground: 'Change photo',
    removeBackground: 'Remove background photo',
    backgroundTypeError: 'Choose a PNG, JPG, or WebP image.',
    backgroundSizeError: 'The image must be smaller than 10 MB.',
    backgroundLoadError: 'The image could not be loaded.',
    gifDetail:
      'GIF transparency is all-or-nothing: with no background, the ball\u2019s edge comes out a little hard.',
    gifBackground: 'Background',
    fond_blanc: 'White background',
    fond_blanc_aide: 'Smooth edge, for light surfaces',
    fond_transparent: 'Transparent background',
    fond_transparent_aide: 'Fits any background, edge a little hard',
    gifConfirm: 'Download',
    copie: 'Copy image',
    copieSvg: 'Copy SVG',
    done: 'Exported',
    copied: 'Copied',
    failed: 'Export failed'
  },

  preview: {
    exit: 'Exit preview',
    key: 'Esc'
  },

  timeline: {
    play: 'Start playback',
    pause: 'Stop playback',
    addAnimation: 'Add an animation',
    preview: 'Preview',
    export: 'Export the montage',
    zoom: 'Track zoom',
    blockAria: '{state}, {duration}',
    blockDurationAria: 'Duration of {state}, {duration}',
    blockRemoveAria: 'Remove {state}'
  },

  dialog: {
    cancel: 'Cancel',
    nameCreateTitle: 'New cycle',
    nameRenameTitle: 'Rename cycle',
    nameField: 'Cycle name',
    nameCreate: 'Create',
    nameRename: 'Rename',
    removeTitle: 'Delete "{name}"?',
    removeDetail:
      'This sequence will be lost, along with its animation. | This sequence will be lost, along with its {n} animations.',
    removeConfirm: 'Delete'
  },

  cycles: {
    defaultName: 'Default cycle',
    newName: 'My cycle',
    menuNew: 'New cycle',
    menuRenameAria: 'Rename {name}',
    menuRemoveAria: 'Delete {name}'
  },

  units: {
    seconds: '{n} s',
    secondsShort: '{n}s'
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    about: 'About',
    credits: 'Made with ❤️ by {name}',
    creditsAria: 'Jérémy on X, in a new tab',
    github: 'View the project on GitHub',
    githubAria: 'The project repository on GitHub, in a new tab'
  },

  states: {
    idle: 'Idle',
    thinking: 'Thinking',
    wink: 'Wink',
    wide: 'Wide eyes',
    alert: 'Alert',
    notify: 'Notification',
    exclaim: 'Exclamation',
    sleep: 'Sleep',
    egg: 'Egg',
    hexagon: 'Hexagon',
    play: 'Play',
    orbit: 'Orbit',
    burst: 'Burst',
    comet: 'Comet',
    swirl: 'Swirl'
  },

  shapes: {
    cercle: 'Circle',
    galet: 'Pebble',
    squircle: 'Squircle',
    capsule: 'Capsule',
    triangle: 'Triangle',
    hexagone: 'Hexagon',
    nuage: 'Cloud',
    goutte: 'Droplet'
  },

  colors: {
    encre: 'Ink',
    creme: 'Cream',
    brun: 'Brown',
    rouge: 'Red',
    orange: 'Orange',
    ambre: 'Amber',
    vert: 'Green',
    turquoise: 'Turquoise',
    bleu: 'Blue',
    violet: 'Purple',
    rose: 'Pink',
    gris: 'Grey'
  },

  expressions: {
    neutre: 'Neutral',
    attentif: 'Attentive',
    surpris: 'Surprised',
    excite: 'Excited',
    heureux: 'Happy',
    hilare: 'Laughing',
    colere: 'Angry',
    triste: 'Sad',
    effraye: 'Scared',
    mefiant: 'Suspicious',
    confus: 'Confused',
    curieux: 'Curious',
    fier: 'Proud',
    timide: 'Shy',
    blase: 'Unimpressed',
    somnolent: 'Sleepy'
  }
}

export default en
