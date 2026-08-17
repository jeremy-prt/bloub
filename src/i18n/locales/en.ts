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
    color: 'Colour'
  },

  export: {
    action: 'Export as PNG',
    more: 'Other formats',
    png: 'Download PNG',
    svg: 'Download SVG',
    anime: 'Download animated SVG',
    gif: 'Download animated GIF',
    cycleDetail: 'The video is lighter and smoother; the GIF plays anywhere.',
    cycleFormat: 'Format',
    cycle_mp4: 'MP4 video',
    cycle_mp4_aide: 'Light and smooth, needs a background',
    cycle_gif: 'Animated GIF',
    cycle_gif_aide: 'Plays anywhere, heavier',
    cycleProgress: 'Exporting…',
    cycleReessayer: 'Try again',
    gifTitle: 'Download animated GIF',
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
