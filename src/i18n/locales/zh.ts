import type fr from './fr'

/**
 * Chinois simplifie. Trois differences typographiques portees par la traduction
 * et pas par le code :
 *
 * - ponctuation pleine largeur (， 。 ？ “ ”), y compris dans les gabarits ;
 * - pas de pluriel : `removeDetail` n'a qu'une forme, et le classificateur `个`
 *   est obligatoire devant le nom compte ;
 * - une espace fine separe les chiffres latins des caracteres chinois, sauf
 *   dans la graduation de la regle ou la place manque.
 */
const zh: typeof fr = {
  app: {
    name: 'bloub',
    title: 'bloub — 动画 SVG 头像',
    botAria: 'bloub 动画头像'
  },

  gallery: {
    back: '返回播放器'
  },

  rail: {
    nav: '版块',
    customize: '个性化',
    animations: '动画',
    settings: '设置'
  },

  panel: {
    animations: '动画',
    shape: '形状',
    expression: '表情',
    color: '颜色',
    rotateEyes: '3D眼睛',
    addHands: '手'
  },

  glasses: {
    title: '眼镜',
    add: '添加',
    remove: '移除',
    style: '样式',
    size: '大小',
    color: '镜框颜色',
    eyeColor: '眼睛颜色',
    customEyeColor: '选择眼睛颜色',
    showEyesWithGlasses: '在眼镜后显示眼睛',
    styles: {
      round: '圆形',
      square: '方形',
      aviator: '飞行员款',
      catEye: '猫眼款',
      wayfarer: '经典款',
      sun: '太阳镜'
    },
    eyeColors: {
      light: '浅色',
      brown: '棕色',
      hazel: '榛色',
      green: '绿色',
      blue: '蓝色',
      gray: '灰色',
      violet: '紫色',
      dark: '深色'
    }
  },

  accessories: {
    drag: '拖动配饰以调整脸部位置',
    blockTitle: '此动画的配饰',
    blockHint: '这些设置保存在所选片段中，并会随片段一起移动。',
    enableItem: '在此动画中启用{item}',
    disableItem: '在此动画中停用{item}',
    itemColor: '此动画中{item}的颜色',
    face: '胡子和嘴巴',
    color: '配饰颜色',
    positionX: '水平位置',
    positionY: '垂直位置',
    width: '宽',
    height: '高',
    rotation: '旋转',
    curve: '弯曲度',
    roundness: '圆润度',
    glassesWidth: '眼镜宽度',
    glassesHeight: '眼镜高度',
    glassesRotation: '眼镜旋转',
    leftLens: '左镜片',
    rightLens: '右镜片',
    selectLens: '选择要调整的镜片',
    leftLensX: '左镜片水平位置',
    leftLensY: '左镜片垂直位置',
    rightLensX: '右镜片水平位置',
    rightLensY: '右镜片垂直位置',
    mustache: '胡子',
    mouth: '嘴巴',
    addMouth: '添加嘴巴',
    removeMouth: '移除嘴巴',
    mouthColor: '嘴巴颜色',
    mouthWidth: '嘴巴宽度',
    mouthHeight: '嘴巴高度',
    mouthRotation: '嘴巴旋转',
    mouthCurve: '嘴巴弯曲度',
    mouthRoundness: '嘴巴圆润度',
    mouthStyle: '嘴巴形状',
    mouthStyles: {
      smile: '微笑',
      open: '张嘴',
      pout: '噘嘴',
      grin: '大笑',
      frown: '悲伤',
      smirk: '坏笑',
      round: '圆形',
      laugh: '开怀大笑'
    },
    addMustache: '添加胡子',
    removeMustache: '移除胡子',
    mustacheStyle: '胡子样式',
    mustacheColor: '胡子颜色',
    mustacheWidth: '胡子宽度',
    mustacheHeight: '胡子高度',
    mustacheRotation: '胡子旋转',
    mustacheCurve: '胡子弯曲度',
    mustacheRoundness: '胡子圆润度',
    mustacheStyles: {
      classic: '经典',
      chevron: '倒 V 形',
      handlebar: '翘胡子',
      natural: '自然',
      pencil: '细款',
      walrus: '海象式',
      horseshoe: '马蹄式',
      imperial: '帝王式',
      toothbrush: '牙刷式'
    },
  },

  export: {
    action: '导出 PNG',
    more: '其他格式',
    png: '下载 PNG',
    svg: '下载 SVG',
    anime: '下载 SVG 动图',
    gif: '下载 GIF 动图',
    cycleDetail: '视频更轻更流畅；GIF 到处都能播放。',
    cycleTurnEyes: '眼睛 3D 旋转',
    cycleTurnEyesHelp: '眼睛完整旋转一周并绕到后方；身体保持不动。',
    cycleFormat: '格式',
    cycle_mp4: 'MP4 视频',
    cycle_mp4_aide: '轻巧流畅，必须有背景',
    cycle_gif: 'GIF 动图',
    cycle_gif_aide: '到处可播，体积更大',
    cycleProgress: '正在导出…',
    cycleReessayer: '重试',
    gifTitle: '下载 GIF 动图',
    background: '角色后方背景',
    backgroundHelp: '可选择透明背景、纯色、渐变或照片。',
    backgroundMode: '背景类型',
    backgroundNone: '无背景',
    backgroundColor: '纯色',
    backgroundGradient: '渐变',
    backgroundPhoto: '照片',
    backgroundSecondColor: '第二种颜色',
    backgroundDirection: '渐变方向',
    directionHorizontal: '从左到右',
    directionVertical: '从上到下',
    directionDiagonal: '向右下倾斜',
    directionDiagonalReverse: '向右上倾斜',
    uploadBackground: '上传照片',
    changeBackground: '更换照片',
    removeBackground: '移除背景照片',
    backgroundTypeError: '请选择 PNG、JPG 或 WebP 图片。',
    backgroundSizeError: '图片必须小于 10 MB。',
    backgroundLoadError: '无法加载图片。',
    gifDetail: 'GIF 的透明只有全有或全无：不加背景时，球体边缘会略显生硬。',
    gifBackground: '背景',
    fond_blanc: '白色背景',
    fond_blanc_aide: '边缘平滑，适合浅色底',
    fond_transparent: '透明背景',
    fond_transparent_aide: '适配任何背景，边缘略硬',
    gifConfirm: '下载',
    copie: '复制图片',
    copieSvg: '复制 SVG',
    done: '已导出',
    copied: '已复制',
    failed: '导出失败'
  },

  preview: {
    exit: '退出预览',
    key: 'Esc'
  },

  timeline: {
    play: '开始播放',
    pause: '停止播放',
    addAnimation: '添加动画',
    preview: '预览',
    export: '导出动画序列',
    zoom: '轨道缩放',
    blockAria: '{state}，{duration}',
    blockDurationAria: '{state} 的时长，{duration}',
    blockRemoveAria: '移除 {state}'
  },

  dialog: {
    cancel: '取消',
    nameCreateTitle: '新建序列',
    nameRenameTitle: '重命名序列',
    nameField: '序列名称',
    nameCreate: '创建',
    nameRename: '重命名',
    removeTitle: '删除“{name}”？',
    removeDetail: '该序列将被删除，其中包含的 {n} 个动画也将一并丢失。',
    removeConfirm: '删除'
  },

  cycles: {
    defaultName: '默认序列',
    newName: '我的序列',
    menuNew: '新建序列',
    menuRenameAria: '重命名 {name}',
    menuRemoveAria: '删除 {name}'
  },

  units: {
    seconds: '{n} 秒',
    secondsShort: '{n}秒'
  },

  settings: {
    title: '设置',
    language: '语言',
    about: '关于',
    credits: '由 {name} 用 ❤️ 打造',
    creditsAria: 'Jérémy 的 X 主页，在新标签页中打开',
    github: '在 GitHub 上查看项目',
    githubAria: '项目的 GitHub 仓库，在新标签页中打开'
  },

  states: {
    idle: '静止',
    thinking: '思考',
    wink: '眨眼',
    wide: '睁大眼睛',
    alert: '警示',
    notify: '通知',
    exclaim: '感叹号',
    sleep: '休眠',
    egg: '蛋形',
    hexagon: '六边形',
    play: '播放',
    orbit: '轨道',
    burst: '爆散',
    comet: '彗星',
    swirl: '漩涡'
  },

  shapes: {
    cercle: '圆形',
    galet: '卵石',
    squircle: '圆角方形',
    capsule: '胶囊',
    triangle: '三角形',
    hexagone: '六边形',
    nuage: '云朵',
    goutte: '水滴'
  },

  colors: {
    encre: '墨黑',
    creme: '奶油白',
    brun: '棕色',
    rouge: '红色',
    orange: '橙色',
    ambre: '琥珀色',
    vert: '绿色',
    turquoise: '青绿色',
    bleu: '蓝色',
    violet: '紫色',
    rose: '粉色',
    gris: '灰色'
  },

  expressions: {
    neutre: '平静',
    attentif: '专注',
    surpris: '惊讶',
    excite: '兴奋',
    heureux: '开心',
    hilare: '大笑',
    colere: '生气',
    triste: '难过',
    effraye: '害怕',
    mefiant: '怀疑',
    confus: '困惑',
    curieux: '好奇',
    fier: '得意',
    timide: '羞怯',
    blase: '无趣',
    somnolent: '困倦'
  }
}

export default zh
