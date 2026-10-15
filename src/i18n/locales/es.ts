import type fr from './fr'

const es: typeof fr = {
  app: {
    name: 'bloub',
    title: 'bloub — avatar SVG animado',
    botAria: 'Avatar bloub animado'
  },

  gallery: {
    back: 'Volver al reproductor'
  },

  rail: {
    nav: 'Secciones',
    customize: 'Personalizar',
    animations: 'Animaciones',
    settings: 'Ajustes'
  },

  panel: {
    animations: 'Animación',
    shape: 'Forma',
    expression: 'Expresión',
    color: 'Color',
    rotateEyes: 'Giro 3D',
    addHands: 'Manos'
  },

  glasses: {
    title: 'Gafas',
    add: 'Añadir',
    remove: 'Quitar',
    style: 'Estilo',
    size: 'Tamaño',
    color: 'Color de la montura',
    eyeColor: 'Color de ojos',
    customEyeColor: 'Elegir un color para los ojos',
    showEyesWithGlasses: 'Mostrar los ojos detrás de las gafas',
    styles: {
      round: 'Redondas',
      square: 'Cuadradas',
      aviator: 'De aviador',
      catEye: 'De ojo de gato',
      wayfarer: 'Wayfarer',
      sun: 'Gafas de sol'
    },
    eyeColors: {
      light: 'Claro',
      brown: 'Marrón',
      hazel: 'Avellana',
      green: 'Verde',
      blue: 'Azul',
      gray: 'Gris',
      violet: 'Violeta',
      dark: 'Oscuro'
    }
  },

  accessories: {
    drag: 'Arrastra cada accesorio por la cara',
    blockTitle: 'Accesorios de esta animación',
    blockHint: 'Estos ajustes se guardan en el bloque seleccionado y se mantienen al moverlo en el montaje.',
    enableItem: 'Activar {item} en esta animación',
    disableItem: 'Desactivar {item} en esta animación',
    itemColor: 'Color de {item} en esta animación',
    face: 'Bigote y boca',
    color: 'Color del accesorio',
    positionX: 'Posición horizontal',
    positionY: 'Posición vertical',
    width: 'Ancho',
    height: 'Alto',
    rotation: 'Giro',
    curve: 'Curvatura',
    roundness: 'Redondez',
    glassesWidth: 'Ancho de las gafas',
    glassesHeight: 'Alto de las gafas',
    glassesRotation: 'Giro de las gafas',
    leftLens: 'Lente izquierda',
    rightLens: 'Lente derecha',
    selectLens: 'Seleccionar lente para ajustar',
    leftLensX: 'Posición horizontal de la lente izquierda',
    leftLensY: 'Posición vertical de la lente izquierda',
    rightLensX: 'Posición horizontal de la lente derecha',
    rightLensY: 'Posición vertical de la lente derecha',
    mustache: 'Bigote',
    mouth: 'Boca',
    addMouth: 'Añadir boca',
    removeMouth: 'Quitar la boca',
    mouthColor: 'Color de la boca',
    mouthWidth: 'Ancho de la boca',
    mouthHeight: 'Alto de la boca',
    mouthRotation: 'Giro de la boca',
    mouthCurve: 'Curvatura de la boca',
    mouthRoundness: 'Redondez de la boca',
    mouthStyle: 'Forma de la boca',
    mouthStyles: {
      smile: 'Sonrisa',
      open: 'Abierta',
      pout: 'Labios fruncidos',
      grin: 'Sonrisa amplia',
      frown: 'Triste',
      smirk: 'Sonrisa ladeada',
      round: 'Redonda',
      laugh: 'Risa abierta'
    },
    addMustache: 'Añadir bigote',
    removeMustache: 'Quitar bigote',
    mustacheStyle: 'Estilo de bigote',
    mustacheColor: 'Color del bigote',
    mustacheWidth: 'Ancho del bigote',
    mustacheHeight: 'Alto del bigote',
    mustacheRotation: 'Giro del bigote',
    mustacheCurve: 'Curvatura del bigote',
    mustacheRoundness: 'Redondez del bigote',
    mustacheStyles: {
      classic: 'Clásico',
      chevron: 'Chevron',
      handlebar: 'Con puntas levantadas',
      natural: 'Natural',
      pencil: 'Fino',
      walrus: 'Morsa',
      horseshoe: 'Herradura',
      imperial: 'Imperial',
      toothbrush: 'Cepillo'
    },
  },

  export: {
    action: 'Exportar como PNG',
    more: 'Otros formatos',
    png: 'Descargar PNG',
    svg: 'Descargar SVG',
    anime: 'Descargar SVG animado',
    gif: 'Descargar GIF animado',
    cycleDetail: 'El vídeo ocupa menos y es más fluido; el GIF se reproduce en cualquier sitio.',
    cycleTurnEyes: 'Giro 3D de los ojos',
    cycleTurnEyesHelp: 'Los ojos completan una vuelta y pasan por detrás; el cuerpo permanece quieto.',
    cycleFormat: 'Formato',
    cycle_mp4: 'Vídeo MP4',
    cycle_mp4_aide: 'Ligero y fluido; necesita un fondo',
    cycle_gif: 'GIF animado',
    cycle_gif_aide: 'Se reproduce en cualquier sitio, pero ocupa más',
    cycleProgress: 'Exportando…',
    cycleReessayer: 'Intentar de nuevo',
    gifTitle: 'Descargar GIF animado',
    background: 'Fondo detrás del personaje',
    backgroundHelp: 'Elige fondo transparente, un color, un degradado o una foto.',
    backgroundMode: 'Tipo de fondo',
    backgroundNone: 'Sin fondo',
    backgroundColor: 'Color sólido',
    backgroundGradient: 'Degradado',
    backgroundPhoto: 'Foto',
    backgroundSecondColor: 'Segundo color',
    backgroundDirection: 'Dirección del degradado',
    directionHorizontal: 'Izquierda a derecha',
    directionVertical: 'Arriba abajo',
    directionDiagonal: 'Diagonal descendente',
    directionDiagonalReverse: 'Diagonal ascendente',
    uploadBackground: 'Subir una foto',
    changeBackground: 'Cambiar foto',
    removeBackground: 'Quitar foto de fondo',
    backgroundTypeError: 'Elige una imagen PNG, JPG o WebP.',
    backgroundSizeError: 'La imagen debe pesar menos de 10 MB.',
    backgroundLoadError: 'No se pudo cargar la imagen.',
    gifDetail:
      'El GIF solo admite transparencia total o ninguna: sin fondo, el borde de la esfera queda algo duro.',
    gifBackground: 'Fondo',
    fond_blanc: 'Fondo blanco',
    fond_blanc_aide: 'Borde suave, para fondos claros',
    fond_transparent: 'Fondo transparente',
    fond_transparent_aide: 'Se adapta a cualquier fondo, con el borde algo duro',
    gifConfirm: 'Descargar',
    copie: 'Copiar imagen',
    copieSvg: 'Copiar SVG',
    done: 'Exportado',
    copied: 'Copiado',
    failed: 'Error al exportar'
  },

  preview: {
    exit: 'Salir de la vista previa',
    key: 'Esc'
  },

  timeline: {
    play: 'Iniciar reproducción',
    pause: 'Detener reproducción',
    addAnimation: 'Añadir una animación',
    preview: 'Vista previa',
    export: 'Exportar el montaje',
    zoom: 'Zoom de la pista',
    blockAria: '{state}, {duration}',
    blockDurationAria: 'Duración de {state}, {duration}',
    blockRemoveAria: 'Quitar {state}'
  },

  dialog: {
    cancel: 'Cancelar',
    nameCreateTitle: 'Nuevo ciclo',
    nameRenameTitle: 'Cambiar el nombre del ciclo',
    nameField: 'Nombre del ciclo',
    nameCreate: 'Crear',
    nameRename: 'Cambiar nombre',
    removeTitle: '¿Eliminar «{name}»?',
    removeDetail:
      'Se perderá este montaje, junto con su animación. | Se perderá este montaje, junto con sus {n} animaciones.',
    removeConfirm: 'Eliminar'
  },

  cycles: {
    defaultName: 'Ciclo predeterminado',
    newName: 'Mi ciclo',
    menuNew: 'Nuevo ciclo',
    menuRenameAria: 'Cambiar el nombre de {name}',
    menuRemoveAria: 'Eliminar {name}'
  },

  units: {
    seconds: '{n} s',
    secondsShort: '{n}s'
  },

  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    about: 'Acerca de',
    credits: 'Creado con ❤️ por {name}',
    creditsAria: 'Jérémy en X, se abre en una pestaña nueva',
    github: 'Ver el proyecto en GitHub',
    githubAria: 'Repositorio del proyecto en GitHub, se abre en una pestaña nueva'
  },

  states: {
    idle: 'En reposo',
    thinking: 'Pensando',
    wink: 'Guiño',
    wide: 'Ojos muy abiertos',
    alert: 'Alerta',
    notify: 'Notificación',
    exclaim: 'Exclamación',
    sleep: 'Dormido',
    egg: 'Huevo',
    hexagon: 'Hexágono',
    play: 'Reproducción',
    orbit: 'Órbita',
    burst: 'Estallido',
    comet: 'Cometa',
    swirl: 'Remolino'
  },

  shapes: {
    cercle: 'Círculo',
    galet: 'Guijarro',
    squircle: 'Cuadrado redondeado',
    capsule: 'Cápsula',
    triangle: 'Triángulo',
    hexagone: 'Hexágono',
    nuage: 'Nube',
    goutte: 'Gota'
  },

  colors: {
    encre: 'Tinta',
    creme: 'Crema',
    brun: 'Marrón',
    rouge: 'Rojo',
    orange: 'Naranja',
    ambre: 'Ámbar',
    vert: 'Verde',
    turquoise: 'Turquesa',
    bleu: 'Azul',
    violet: 'Violeta',
    rose: 'Rosa',
    gris: 'Gris'
  },

  expressions: {
    neutre: 'Neutro',
    attentif: 'Atento',
    surpris: 'Sorprendido',
    excite: 'Entusiasmado',
    heureux: 'Feliz',
    hilare: 'Riendo a carcajadas',
    colere: 'Enfadado',
    triste: 'Triste',
    effraye: 'Asustado',
    mefiant: 'Desconfiado',
    confus: 'Confundido',
    curieux: 'Curioso',
    fier: 'Orgulloso',
    timide: 'Tímido',
    blase: 'Hastiado',
    somnolent: 'Soñoliento'
  }
}

export default es
