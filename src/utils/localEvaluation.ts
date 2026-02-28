// 本地照片评估算法
import Taro from '@tarojs/taro'

// ============================================================================
// 配置常量
// ============================================================================
const CONFIG = {
  // Canvas 尺寸
  canvas: {
    maxWidth: 300,
    maxHeight: 400
  },
  // 亮度分析
  brightness: {
    darkThreshold: 85, // 暗部阈值
    brightThreshold: 170, // 亮部阈值
    idealMin: 0.35, // 理想亮度最小值
    idealMax: 0.65, // 理想亮度最大值
    acceptableMin: 0.25, // 可接受最小值
    acceptableMax: 0.75, // 可接受最大值
    marginMin: 0.15, // 边缘最小值
    marginMax: 0.85, // 边缘最大值
    exposureThreshold: 0.4 // 曝光过度/不足阈值
  },
  // 饱和度
  saturation: {
    idealMin: 0.3, // 理想饱和度最小值
    idealMax: 0.7 // 理想饱和度最大值
  },
  // 边缘检测
  edge: {
    sobelThreshold: 50, // Sobel边缘阈值
    sobelNormalization: 500, // Sobel归一化因子
    detailThreshold: 0.6 // 细节丰富度阈值
  },
  // 对比度
  contrast: {
    normalization: 128, // 对比度归一化因子
    lowThreshold: 0.3, // 低对比度阈值
    highThreshold: 0.6 // 高对比度阈值
  },
  // 构图分析
  composition: {
    regionSize: 20, // 三分法兴趣点区域大小
    interestNormalization: 128, // 兴趣度归一化因子
    strongThreshold: 0.4, // 强构图阈值
    weakThreshold: 0.6 // 弱构图阈值
  },
  // 主体分析
  subject: {
    contrastThreshold: 30, // 主体对比度阈值
    ratioNormalization: 10, // 主体占比归一化因子
    densityNormalization: 2, // 中心密度归一化因子
    idealMin: 0.4, // 理想主体占比最小值
    idealMax: 0.6, // 理想主体占比最大值
    acceptableMin: 0.3, // 可接受最小值
    acceptableMax: 0.7, // 可接受最大值
    adjustMin: 0.2, // 需要调整最小值
    adjustMax: 0.8 // 需要调整最大值
  },
  // 中心焦点
  centerFocus: {
    strongThreshold: 0.7, // 强中心焦点阈值
    weakThreshold: 0.4 // 弱中心焦点阈值
  },
  // 评分权重
  weights: {
    composition: {ruleOfThirds: 0.5, centerFocus: 0.3, detailRichness: 0.2},
    contrast: {contrast: 0.5, edgeStrength: 0.5}
  },
  // 评分阈值
  score: {
    compositionFull: 30,
    angleFull: 20,
    distanceFull: 15,
    heightFull: 15,
    poseBase: 18,
    posePortrait: 20,
    poseLandscape: 22,
    bonusMax: 2,
    lightBonus: 1,
    lightPenalty: 2
  },
  // 噪点检测
  noise: {
    blockSize: 8,
    varianceThreshold: 100,
    lowNoiseThreshold: 0.5,
    highNoiseThreshold: 0.85,
    sharpnessThreshold: 0.3,
    lowSharpnessThreshold: 0.15,
    sharpnessNormalization: 50 // 清晰度归一化因子
  },
  // 景深/虚化检测
  depthOfField: {
    centerRegionSize: 0.25,
    edgeRegionSize: 0.15,
    blurRatioThreshold: 0.6,
    strongBlurThreshold: 0.7,
    edgeFocusThreshold: 0.4
  },
  // 曝光分析
  exposure: {
    highlightThreshold: 245,
    shadowThreshold: 10,
    highlightRatioWarning: 0.05,
    shadowRatioWarning: 0.1,
    dynamicRangeMin: 0.5,
    idealDynamicRange: 0.7
  },
  // 色温/白平衡检测
  colorTemperature: {
    warmThreshold: 6300, // 暖色调阈值(K)
    coolThreshold: 5700, // 冷色调阈值(K)
    neutralMin: 5700,
    neutralMax: 6300,
    tintThreshold: 0.1 // 色偏阈值
  },
  // 黄金分割构图
  goldenRatio: {
    phi: 0.618, // 黄金比例
    regionSize: 20,
    strongThreshold: 0.5,
    weakThreshold: 0.35,
    interestNormalization: 64 // 兴趣度归一化因子
  },
  // 对称检测
  symmetry: {
    verticalThreshold: 0.6, // 垂直对称阈值
    horizontalThreshold: 0.6, // 水平对称阈值
    samplingStep: 4 // 采样步长
  },
  // 画面平衡度
  balance: {
    centerWeightThreshold: 0.4, // 中心权重阈值
    strongUnbalanced: 0.35, // 严重不平衡阈值
    weakUnbalanced: 0.45 // 轻微不平衡阈值
  },
  // 眼神光检测
  eyeCatchlight: {
    highlightThreshold: 200, // 高光阈值（0-255）
    minCatchlightSize: 3, // 最小眼神光像素数
    maxCatchlightSize: 100, // 最大正常眼神光像素数
    skinHighlightDiff: 30, // 皮肤高光与眼神光亮度差
    eyeRegionRatio: 0.15, // 眼睛区域占面部比例
    perfectScore: 1, // 完美分数
    goodScore: 0.7, // 良好分数
    fairScore: 0.4 // 一般分数
  },
  // 面部曝光分析
  faceExposure: {
    faceBrightnessMin: 0.25, // 面部最低理想亮度
    faceBrightnessMax: 0.75, // 面部最高理想亮度
    faceToOverallRatioMin: 0.8, // 面部与整体曝光比最小值
    faceToOverallRatioMax: 1.2, // 面部与整体曝光比最大值
    highlightThreshold: 240, // 高光阈值
    shadowThreshold: 30, // 阴影阈值
    warningHighlightRatio: 0.1, // 高光警告比例
    warningShadowRatio: 0.15 // 阴影警告比例
  },
  // 眼睛对焦检测
  eyeFocus: {
    faceDivision: {
      // 三庭五眼比例
      topRatio: 0.3, // 发际线到眉毛
      middleRatio: 0.35, // 眉毛到鼻尖
      bottomRatio: 0.35, // 鼻尖到下巴
      eyeLineRatio: 0.45 // 眼睛在面部的垂直位置
    },
    sharpnessThreshold: {
      excellent: 0.8, // 优秀（眼睛最清晰）
      good: 0.6, // 良好
      acceptable: 0.4, // 可接受
      poor: 0.2 // 较差
    },
    eyeToFaceSharpnessRatio: 1.1 // 眼睛应比面部其他区域清晰
  },
  // 自适应肤色检测
  adaptiveSkinTone: {
    // 基础YCbCr范围
    baseCbMin: 77,
    baseCbMax: 127,
    baseCrMin: 133,
    baseCrMax: 173,
    // 光照适应因子
    brightnessThreshold: 50,
    shadowRange: 0.2,
    highlightRange: 0.2,
    // 肤色健康度
    healthyHighlightRatio: 0.15,
    healthyShadowRatio: 0.1,
    maxShadowContrast: 50,
    // 最小有效肤色区域
    minSkinRatio: 0.02,
    minSkinPixels: 100,
    // 色调分类
    warmTintMin: 0.05,
    coolTintMax: -0.05,
    redTintMin: 0.08,
    yellowTintMin: 0.06,
    // 质量阈值
    goodHealthScore: 0.7,
    fairHealthScore: 0.5
  },
  // 场景判断阈值
  sceneThresholds: {
    portrait: {centerFocus: 0.7, detail: 0.5},
    landscape: {centerFocus: 0.4, ruleOfThirds: 0.6},
    group: {centerFocus: 0.5, ruleOfThirds: 0.5}
  },
  // 画面布局
  layout: {
    portrait: 1,
    landscape: 1.3
  },
  // 头部空间与视线方向检测
  headroom: {
    excessiveRatio: 0.3, // 头部留白过多阈值
    tightRatio: 0.08, // 头部贴边阈值
    goodMinRatio: 0.12, // 理想最小留白
    goodMaxRatio: 0.25, // 理想最大留白
    leadRoomRatio: 0.15, // 视线方向最小空间
    jointThreshold: 0.05, // 关节截断检测阈值
    hipLineRatio: 0.85, // 臀部在面部的垂直位置比例
    kneeLineRatio: 0.65 // 膝盖在面部的垂直位置比例
  },
  // 姿态评估开关
  pose: {
    enableRuleBasedPose: true,
    weight: 0.7,
    ruleBased: {
      frontal: {
        centerFocusMin: 0.7,
        detailMin: 0.4,
        score: 22
      },
      profile: {
        centerFocusMax: 0.5,
        ruleOfThirdsMin: 0.55,
        score: 20
      },
      back: {
        centerFocusMin: 0.75,
        detailMax: 0.35,
        score: 15
      },
      closeup: {
        subjectRatioMin: 0.65,
        score: 21
      },
      standing: {
        subjectRatioMax: 0.55,
        centerFocusMin: 0.5,
        score: 20
      },
      sitting: {
        subjectRatioMin: 0.35,
        subjectRatioMax: 0.65,
        score: 18
      },
      baseScore: 15,
      goodCompositionBonus: 2,
      goodLightBonus: 1
    },
    // 建议生成阈值
    suggestions: {
      composition: {
        poor: 15,
        fair: 20,
        good: 25,
        ruleOfThirdsPoor: 0.3,
        centerFocusStrong: 0.7,
        centerFocusPoor: 0.3,
        detailRichnessPoor: 0.3
      },
      contrast: {
        poor: 8,
        fair: 14,
        good: 17,
        contrastPoor: 0.25,
        edgeStrengthPoor: 0.2,
        centerFocusStrong: 0.7
      },
      distance: {
        poor: 8,
        fair: 11,
        good: 13,
        far: 0.2,
        veryNear: 0.8,
        near: 0.3,
        nearThreshold: 0.7,
        subjectLarge: 0.7
      },
      height: {
        poor: 8,
        fair: 12,
        perfect: 14,
        brightnessVeryLow: 0.2,
        brightnessVeryHigh: 0.8,
        ratioHigh: 0.3,
        saturationLow: 0.2,
        saturationHigh: 0.8
      },
      pose: {
        centerFocusThreshold: 0.5,
        detailRichnessThreshold: 0.4
      }
    }
  }
}

export interface LocalEvaluationResult {
  total_score: number
  composition_score: number
  pose_score: number | null
  angle_score: number
  distance_score: number
  height_score: number
  suggestions: {
    composition?: string
    pose?: string
    angle?: string
    distance?: string
    height?: string
  }
  scene_type: string
  // 姿态评估结果（当 enableRuleBasedPose 为 true 时）
  pose_analysis?: {
    pose_type: string
    confidence: number
    score: number
    description: string
  }
  // 置信度评估（0-1，越高表示分析越可信）
  confidence: {
    overall: number
    composition: number
    lighting: number
    distance: number
    pose: number
    reason: string
  }
  // 画质分析
  quality?: {
    sharpness: number
    noise_level: number
    noise_score: number
    is_blurry: boolean
    has_noise: boolean
    // 景深分析
    depth_of_field?: {
      has_blur: boolean
      blur_strength: number
      is_shallow: boolean
      description: string
    }
    // 曝光分析
    exposure?: {
      dynamic_range: number
      highlight_ratio: number
      shadow_ratio: number
      has_overexposure: boolean
      has_underexposure: boolean
      description: string
    }
  }
  // 色彩分析
  color_analysis?: {
    color_temperature: number
    is_warm: boolean
    is_cool: boolean
    is_neutral: boolean
    tint: number
    description: string
  }
  // 构图增强分析
  composition_enhanced?: {
    golden_ratio_score: number
    has_golden_point: boolean
    symmetry_score: number
    is_symmetric: boolean
    balance_score: number
    is_balanced: boolean
  }
  // 眼神光分析（P0新增）
  eye_catchlight?: {
    has_catchlight: boolean
    catchlight_count: number
    catchlight_position: 'both_eyes' | 'left_eye' | 'right_eye' | 'none'
    catchlight_quality: 'excellent' | 'good' | 'fair' | 'poor'
    brightness: number
    description: string
    suggestion: string
  }
  // 面部曝光分析（P0新增）
  face_exposure?: {
    face_brightness: number
    face_contrast: number
    overall_brightness: number
    is_face_underexposed: boolean
    is_face_overexposed: boolean
    is_face_correctly_exposed: boolean
    face_to_overall_ratio: number
    face_highlight_ratio: number
    face_shadow_ratio: number
    description: string
    suggestion: string
  }
  // 眼睛对焦分析（P0新增）
  eye_focus?: {
    eye_sharpness: number
    face_sharpness: number
    is_eye_sharpest: boolean
    is_face_sharp: boolean
    focus_quality: 'excellent' | 'good' | 'acceptable' | 'poor'
    description: string
    suggestion: string
  }
  // 自适应肤色分析（P1新增）
  adaptive_skin_tone?: {
    skin_ratio: number
    skin_pixels_count: number
    skin_tone_type: 'warm' | 'cool' | 'neutral' | 'reddish' | 'yellowish' | 'unknown'
    skin_health_score: number
    has_healthy_highlights: boolean
    has_natural_shadows: boolean
    skin_texture_score: number
    description: string
    suggestion: string
  }
  // 头部空间与视线方向分析（P1新增）
  headroom_analysis?: {
    headroom: 'excessive' | 'good' | 'tight' | 'cut_off'
    headroom_ratio: number
    lead_room: 'good' | 'insufficient' | 'excessive'
    lead_room_ratio: number
    is_at_joint: boolean
    joint_type: 'hip' | 'knee' | 'elbow' | 'wrist' | 'ankle' | 'neck' | 'none'
    horizon_level: number
    horizon_position: 'through_head' | 'through_neck' | 'below_chin' | 'proper' | 'unknown'
    composition_score: number
    description: string
    suggestion: string
  }
}

// ============ 工具函数 ============

/**
 * 计算像素亮度 (使用标准 luminance 公式)
 */
function getBrightness(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 肤色检测（基于YCbCr色彩空间）
 * 用于检测人脸/皮肤区域，提高主体识别精度
 * @param imageData - Canvas图像数据
 * @returns 肤色区域信息
 */
function _detectSkinTone(imageData: ImageData): {
  skinRatio: number
  skinPixels: boolean[]
  skinCenterX: number
  skinCenterY: number
} {
  const {data, width, height} = imageData
  const skinPixels: boolean[] = new Array(width * height).fill(false)
  let skinPixelCount = 0
  let totalSkinX = 0
  let totalSkinY = 0

  // YCbCr 肤色范围
  const cbMin = 77
  const cbMax = 127
  const crMin = 133
  const crMax = 173

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // 转换为 YCbCr
      const yVal = 0.299 * r + 0.587 * g + 0.114 * b
      const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128
      const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128

      // 判断是否为肤色
      const isSkin = cb >= cbMin && cb <= cbMax && cr >= crMin && cr <= crMax && yVal > 50 // 排除过暗的区域

      if (isSkin) {
        skinPixels[y * width + x] = true
        skinPixelCount++
        totalSkinX += x
        totalSkinY += y
      }
    }
  }

  const skinRatio = skinPixelCount / (width * height)
  const skinCenterX = skinPixelCount > 0 ? totalSkinX / skinPixelCount : width / 2
  const skinCenterY = skinPixelCount > 0 ? totalSkinY / skinPixelCount : height / 2

  return {
    skinRatio,
    skinPixels,
    skinCenterX,
    skinCenterY
  }
}

/**
 * 计算动态采样的Canvas尺寸
 * - 小图(< maxSize): 保持原尺寸，保证精度
 * - 大图(> maxSize): 缩放到最长边 = maxSize，保证性能
 */
function calculateOptimalSize(width: number, height: number, maxSize: number): {width: number; height: number} {
  const maxDimension = Math.max(width, height)

  if (maxDimension <= maxSize) {
    return {width, height}
  }

  const scale = maxSize / maxDimension
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  }
}

/**
 * 预计算灰度图像
 * 将RGBA数据转换为灰度数组，供多个分析函数复用
 */
function precomputeGrayscale(imageData: ImageData): number[] {
  const {data} = imageData
  const gray: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    gray.push(getBrightness(r, g, b))
  }

  return gray
}

/**
 * 统一图像数据分析
 * 一次遍历同时计算灰度数组和亮度统计，避免重复遍历像素
 * @param imageData - Canvas图像数据
 * @returns 灰度数组和亮度信息的组合结果
 */
function analyzeImageData(imageData: ImageData): {
  gray: number[]
  brightness: {
    mean: number
    histogram: number[]
    darkRatio: number
    brightRatio: number
  }
} {
  const {data} = imageData
  const gray: number[] = []
  const histogram = new Array(256).fill(0)
  let totalBrightness = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = getBrightness(r, g, b)

    gray.push(brightness)
    const roundedBrightness = Math.round(brightness)
    histogram[roundedBrightness]++
    totalBrightness += brightness
  }

  const mean = totalBrightness / pixelCount

  // 计算暗部和亮部比例
  let darkPixels = 0
  let brightPixels = 0
  for (let i = 0; i < 256; i++) {
    if (i < CONFIG.brightness.darkThreshold) darkPixels += histogram[i]
    if (i > CONFIG.brightness.brightThreshold) brightPixels += histogram[i]
  }

  return {
    gray,
    brightness: {
      mean: mean / 255,
      histogram,
      darkRatio: darkPixels / pixelCount,
      brightRatio: brightPixels / pixelCount
    }
  }
}

/**
 * 分析图片的色彩饱和度
 * @param imageData - Canvas图像数据
 * @returns 平均饱和度 (0-1)
 */
function analyzeColorSaturation(imageData: ImageData): number {
  const data = imageData.data
  let totalSaturation = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max

    totalSaturation += saturation
  }

  return totalSaturation / pixelCount
}

/**
 * 边缘检测结果类型
 */
interface EdgeResult {
  gray: number[]
  edgeStrength: number
  detailRichness: number
  highContrastPixels: boolean[]
  totalPixels: number
}

/**
 * 检测边缘和细节
 * 使用Sobel算子检测边缘，返回结果供其他函数复用
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 边缘强度、细节丰富度、高对比度像素位置
 */
function analyzeEdges(imageData: ImageData, precomputedGray?: number[]): EdgeResult {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)

  let totalEdge = 0
  let edgePixels = 0
  // 使用一维数组，索引为 y*width+x，预先分配正确长度
  const highContrastPixels: boolean[] = new Array(width * height).fill(false)

  // Sobel算子 - 只遍历非边缘像素
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x

      // Gx (水平方向)
      const gx =
        -gray[idx - width - 1] +
        gray[idx - width + 1] -
        2 * gray[idx - 1] +
        2 * gray[idx + 1] -
        gray[idx + width - 1] +
        gray[idx + width + 1]

      // Gy (垂直方向)
      const gy =
        -gray[idx - width - 1] -
        2 * gray[idx - width] -
        gray[idx - width + 1] +
        gray[idx + width - 1] +
        2 * gray[idx + width] +
        gray[idx + width + 1]

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      totalEdge += magnitude
      const isHighEdge = magnitude > CONFIG.edge.sobelThreshold
      if (isHighEdge) {
        edgePixels++
        highContrastPixels[idx] = true
      }
    }
  }

  const avgEdge = totalEdge / ((width - 2) * (height - 2))
  const edgeRatio = edgePixels / ((width - 2) * (height - 2))

  return {
    gray,
    edgeStrength: Math.min(avgEdge / CONFIG.edge.sobelNormalization, 1),
    detailRichness: Math.min(edgeRatio * 2, 1),
    highContrastPixels,
    totalPixels: width * height
  }
}

/**
 * 分析主体大小占比（用于距离评估）
 * 基于高对比度像素占比估算主体占比和中心密度
 * @param imageData - Canvas图像数据
 * @param edgeResult - 可选的边缘检测结果（避免重复计算）
 * @returns 主体占比、中心密度
 */
function analyzeSubjectSize(
  imageData: ImageData,
  edgeResult?: EdgeResult
): {
  subjectRatio: number
  centerDensity: number
} {
  const {width, height} = imageData
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)

  // 计算中心区域大小（1/3画面）
  const centerWidth = Math.floor(width / 3)
  const centerHeight = Math.floor(height / 3)

  // 复用边缘数据或重新计算
  let edgeData: boolean[]
  if (edgeResult) {
    edgeData = edgeResult.highContrastPixels
  } else {
    const edge = analyzeEdges(imageData)
    edgeData = edge.highContrastPixels
  }

  let centerHighContrastPixels = 0
  let totalCenterPixels = 0
  let totalHighContrastPixels = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edgeIdx = y * width + x
      const isHighContrast = edgeData[edgeIdx] || false

      if (isHighContrast) {
        totalHighContrastPixels++
      }

      // 检查是否在中心区域
      const inCenterX = Math.abs(x - centerX) < centerWidth / 2
      const inCenterY = Math.abs(y - centerY) < centerHeight / 2
      if (inCenterX && inCenterY) {
        totalCenterPixels++
        if (isHighContrast) {
          centerHighContrastPixels++
        }
      }
    }
  }

  const centerDensity = totalCenterPixels > 0 ? centerHighContrastPixels / totalCenterPixels : 0
  const subjectRatio = totalHighContrastPixels / (width * height)

  return {
    subjectRatio: Math.min(subjectRatio * CONFIG.subject.ratioNormalization, 1),
    centerDensity: Math.min(centerDensity * CONFIG.subject.densityNormalization, 1)
  }
}

/**
 * 基于规则的姿态评估
 * 利用构图特征（中心焦点、三分法、主体占比、细节丰富度）推断人物姿态
 * @param centerFocus - 中心焦点得分
 * @param ruleOfThirds - 三分法得分
 * @param subjectSize - 主体大小分析结果
 * @param detailRichness - 细节丰富度
 * @param brightnessMean - 平均亮度
 * @returns 姿态评估结果
 */
function analyzePose(
  centerFocus: number,
  ruleOfThirds: number,
  subjectSize: {subjectRatio: number; centerDensity: number},
  detailRichness: number,
  brightnessMean: number
): {pose_type: string; confidence: number; score: number; description: string} {
  const cfg = CONFIG.pose.ruleBased
  let pose_type = 'unknown'
  let confidence = 0.5
  let score = cfg.baseScore
  let description = ''

  // 判断主体朝向：正面/侧面/背影
  if (centerFocus >= cfg.frontal.centerFocusMin && detailRichness >= cfg.frontal.detailMin) {
    // 中心聚焦 + 细节丰富 = 可能是正面人像
    pose_type = '正面'
    confidence = Math.min(0.7 + detailRichness * 0.2, 0.9)
    score = cfg.frontal.score
    description = '人物正面朝向，主体突出'
  } else if (centerFocus <= cfg.profile.centerFocusMax && ruleOfThirds >= cfg.profile.ruleOfThirdsMin) {
    // 偏心 + 符合三分法 = 可能是侧面
    pose_type = '侧面'
    confidence = Math.min(0.6 + ruleOfThirds * 0.2, 0.85)
    score = cfg.profile.score
    description = '人物侧面朝向，符合构图原则'
  } else if (centerFocus >= cfg.back.centerFocusMin && detailRichness <= cfg.back.detailMax) {
    // 中心聚焦 + 背景简单 = 可能是背影
    pose_type = '背影'
    confidence = Math.min(0.5 + centerFocus * 0.3, 0.8)
    score = cfg.back.score
    description = '可能为人物背影或背部特写'
  } else if (subjectSize.subjectRatio >= cfg.closeup.subjectRatioMin) {
    // 主体占比大 = 可能是特写
    pose_type = '特写'
    confidence = Math.min(0.6 + subjectSize.subjectRatio * 0.2, 0.85)
    score = cfg.closeup.score
    description = '人物特写，主体占据画面主体'
  } else if (subjectSize.subjectRatio <= cfg.standing.subjectRatioMax) {
    // 主体占比适中 = 可能是站姿
    pose_type = '站姿'
    confidence = 0.6
    score = cfg.standing.score
    description = '人物站姿，主体完整呈现'
  } else {
    // 默认未知姿态
    pose_type = '全身'
    confidence = 0.5
    score = cfg.baseScore
    description = '人物整体呈现在画面中'
  }

  // 根据构图质量加分
  if (ruleOfThirds >= 0.6 && centerFocus >= 0.5) {
    score = Math.min(score + cfg.goodCompositionBonus, 27)
    description += '，构图良好'
  }

  // 根据光线质量加分
  if (brightnessMean >= CONFIG.brightness.idealMin && brightnessMean <= CONFIG.brightness.idealMax) {
    score = Math.min(score + cfg.goodLightBonus, 28)
    description += '，光线充足'
  }

  // 应用权重系数（本地算法无法精确检测姿态，降权）
  const finalScore = Math.round(score * CONFIG.pose.weight)

  return {
    pose_type,
    confidence: Math.round(confidence * 100) / 100,
    score: finalScore,
    description
  }
}

/**
 * 分析图片的对比度
 * @param precomputedGray 可选的预计算灰度数组
 */
function analyzeContrast(imageData: ImageData, precomputedGray?: number[]): number {
  const brightnesses = precomputedGray || precomputeGrayscale(imageData)

  // 计算标准差作为对比度指标
  const mean = brightnesses.reduce((sum, val) => sum + val, 0) / brightnesses.length
  const variance = brightnesses.reduce((sum, val) => sum + (val - mean) ** 2, 0) / brightnesses.length
  const stdDev = Math.sqrt(variance)

  return Math.min(stdDev / CONFIG.contrast.normalization, 1) // 归一化到0-1
}

/**
 * 噪点检测
 * 使用局部方差分析检测图像噪点水平，同时检测清晰度
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 噪点等级、清晰度、是否模糊、是否有噪点
 */
function analyzeNoiseAndSharpness(
  imageData: ImageData,
  precomputedGray?: number[]
): {noise_level: number; sharpness: number; is_blurry: boolean; has_noise: boolean} {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)
  const blockSize = CONFIG.noise.blockSize

  const numBlocksX = Math.floor(width / blockSize)
  const numBlocksY = Math.floor(height / blockSize)
  const totalBlocks = numBlocksX * numBlocksY

  let totalVariance = 0
  let totalEdgeStrength = 0

  // 分析每个块
  for (let by = 0; by < numBlocksY; by++) {
    for (let bx = 0; bx < numBlocksX; bx++) {
      const startX = bx * blockSize
      const startY = by * blockSize

      // 计算块内方差（噪点指标）
      let blockSum = 0
      let blockSumSq = 0
      let blockPixels = 0

      for (let y = startY; y < startY + blockSize && y < height; y++) {
        for (let x = startX; x < startX + blockSize && x < width; x++) {
          const idx = y * width + x
          const val = gray[idx]
          blockSum += val
          blockSumSq += val * val
          blockPixels++
        }
      }

      const blockMean = blockSum / blockPixels
      const blockVariance = blockSumSq / blockPixels - blockMean * blockMean

      // 边缘强度（清晰度指标）- 使用 Laplacian 简化版
      let edgeSum = 0
      for (let y = startY + 1; y < startY + blockSize - 1 && y < height - 1; y++) {
        for (let x = startX + 1; x < startX + blockSize - 1 && x < width - 1; x++) {
          const idx = y * width + x
          // Laplacian: center * 4 - neighbors
          const laplacian = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width]
          edgeSum += Math.abs(laplacian)
        }
      }
      const blockEdge = edgeSum / blockPixels

      totalVariance += blockVariance
      totalEdgeStrength += blockEdge
    }
  }

  // 归一化
  const avgVariance = totalVariance / totalBlocks
  const avgEdge = totalEdgeStrength / totalBlocks

  // 噪点等级 (0-1, 越高噪点越多)
  const noise_level = Math.min(avgVariance / CONFIG.noise.varianceThreshold, 1)

  // 清晰度 (0-1, 越高越清晰)
  const sharpness = Math.min(avgEdge / CONFIG.noise.sharpnessNormalization, 1)

  // 判断是否模糊（清晰度低于阈值）
  const is_blurry = sharpness < CONFIG.noise.lowSharpnessThreshold

  // 判断是否有明显噪点（噪点等级高于阈值）
  const has_noise = noise_level > CONFIG.noise.lowNoiseThreshold

  return {
    noise_level: Math.round(noise_level * 100) / 100,
    sharpness: Math.round(sharpness * 100) / 100,
    is_blurry,
    has_noise
  }
}

/**
 * 景深/背景虚化检测
 * 通过比较中心区域和边缘区域的清晰度来判断是否存在虚化效果
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 虚化检测结果
 */
function analyzeDepthOfField(
  imageData: ImageData,
  precomputedGray?: number[]
): {has_blur: boolean; blur_strength: number; is_shallow: boolean; description: string} {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)

  const centerRegionW = Math.floor(width * CONFIG.depthOfField.centerRegionSize)
  const centerRegionH = Math.floor(height * CONFIG.depthOfField.centerRegionSize)
  const edgeRegionW = Math.floor(width * CONFIG.depthOfField.edgeRegionSize)
  const edgeRegionH = Math.floor(height * CONFIG.depthOfField.edgeRegionSize)

  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)

  // 计算中心区域边缘强度
  let centerEdgeSum = 0
  let centerPixelCount = 0

  for (let y = centerY - centerRegionH / 2; y < centerY + centerRegionH / 2 - 1; y++) {
    for (let x = centerX - centerRegionW / 2; x < centerX + centerRegionW / 2 - 1; x++) {
      if (x >= 1 && x < width - 1 && y >= 1 && y < height - 1) {
        const idx = Math.floor(y) * width + Math.floor(x)
        const laplacian = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width]
        centerEdgeSum += Math.abs(laplacian)
        centerPixelCount++
      }
    }
  }

  // 计算边缘区域边缘强度（上、下、左、右四个边缘区域）
  const edgeRegions = [
    {x: centerX, y: 0, w: width, h: edgeRegionH}, // 顶部
    {x: centerX, y: height - edgeRegionH, w: width, h: edgeRegionH}, // 底部
    {x: 0, y: centerY, w: edgeRegionW, h: height}, // 左侧
    {x: width - edgeRegionW, y: centerY, w: edgeRegionW, h: height} // 右侧
  ]

  let edgeEdgeSum = 0
  let edgePixelCount = 0

  edgeRegions.forEach((region) => {
    for (let y = Math.floor(region.y); y < Math.floor(region.y + region.h) - 1; y++) {
      for (let x = Math.floor(region.x); x < Math.floor(region.x + region.w) - 1; x++) {
        if (x >= 1 && x < width - 1 && y >= 1 && y < height - 1) {
          const idx = y * width + x
          const laplacian = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width]
          edgeEdgeSum += Math.abs(laplacian)
          edgePixelCount++
        }
      }
    }
  })

  const centerAvg = centerPixelCount > 0 ? centerEdgeSum / centerPixelCount : 0
  const edgeAvg = edgePixelCount > 0 ? edgeEdgeSum / edgePixelCount : 0

  // 计算虚化强度：中心清晰/边缘模糊 = 浅景深效果好
  const blurRatio = centerAvg > 0 ? edgeAvg / centerAvg : 1
  const blurStrength = Math.min(blurRatio, 1)

  // 判断是否有明显虚化
  const has_blur = blurRatio < CONFIG.depthOfField.blurRatioThreshold

  // 判断是否为浅景深（专业虚化效果）
  const is_shallow = has_blur && centerAvg > CONFIG.depthOfField.edgeFocusThreshold

  // 生成描述
  let description = ''
  if (is_shallow) {
    description = '背景虚化效果明显，主体突出'
  } else if (has_blur) {
    description = '有一定虚化效果，画面有层次'
  } else {
    description = '整体清晰，景深均匀'
  }

  return {
    has_blur,
    blur_strength: Math.round(blurStrength * 100) / 100,
    is_shallow,
    description
  }
}

/**
 * 曝光分析
 * 分析直方图分布，检测高光溢出、阴影死黑和动态范围
 * @param imageData - Canvas图像数据
 * @returns 曝光分析结果
 */
function analyzeExposure(imageData: ImageData): {
  dynamic_range: number
  highlight_ratio: number
  shadow_ratio: number
  has_overexposure: boolean
  has_underexposure: boolean
  description: string
} {
  const {data} = imageData
  const histogram = new Array(256).fill(0)
  const pixelCount = data.length / 4

  // 构建直方图
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    histogram[brightness]++
  }

  // 计算高光和阴影比例
  let highlightPixels = 0
  let shadowPixels = 0

  for (let i = 0; i < 256; i++) {
    if (i >= CONFIG.exposure.highlightThreshold) {
      highlightPixels += histogram[i]
    }
    if (i <= CONFIG.exposure.shadowThreshold) {
      shadowPixels += histogram[i]
    }
  }

  const highlight_ratio = highlightPixels / pixelCount
  const shadow_ratio = shadowPixels / pixelCount

  // 计算动态范围（有效灰度范围）
  let minGray = 255
  let maxGray = 0

  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      if (i < minGray) minGray = i
      if (i > maxGray) maxGray = i
    }
  }

  const dynamic_range = minGray < maxGray ? (maxGray - minGray) / 255 : 0

  // 判断是否有过曝或欠曝
  const has_overexposure = highlight_ratio > CONFIG.exposure.highlightRatioWarning
  const has_underexposure = shadow_ratio > CONFIG.exposure.shadowRatioWarning

  // 生成描述
  let description = ''
  if (has_overexposure && has_underexposure) {
    description = '明暗对比强烈，适合表现戏剧性场景'
  } else if (has_overexposure) {
    description = '部分区域过曝，丢失细节'
  } else if (has_underexposure) {
    description = '部分区域欠曝，较暗'
  } else if (dynamic_range >= CONFIG.exposure.idealDynamicRange) {
    description = '曝光均衡，动态范围良好'
  } else if (dynamic_range >= CONFIG.exposure.dynamicRangeMin) {
    description = '曝光基本正常，动态范围一般'
  } else {
    description = '画面反差较小，较平淡'
  }

  return {
    dynamic_range: Math.round(dynamic_range * 100) / 100,
    highlight_ratio: Math.round(highlight_ratio * 1000) / 1000,
    shadow_ratio: Math.round(shadow_ratio * 1000) / 1000,
    has_overexposure,
    has_underexposure,
    description
  }
}

/**
 * 色温/白平衡分析
 * 基于平均色温和色彩偏移判断画面偏暖/偏冷/中性
 * @param imageData - Canvas图像数据
 * @returns 色温分析结果
 */
function analyzeColorTemperature(imageData: ImageData): {
  color_temperature: number
  is_warm: boolean
  is_cool: boolean
  is_neutral: boolean
  tint: number
  description: string
} {
  const {data} = imageData
  let totalR = 0
  let totalG = 0
  let totalB = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i]
    totalG += data[i + 1]
    totalB += data[i + 2]
  }

  const avgR = totalR / pixelCount
  const avgG = totalG / pixelCount
  const avgB = totalB / pixelCount

  // 估算色温 (简化版)
  // 使用 R/B 比例估算色温
  const rbRatio = avgR / (avgB + 1)

  // 简化色温估算 (K)
  // R > B -> 暖色, R < B -> 冷色
  let color_temperature = 5500
  if (rbRatio > 1.1) {
    color_temperature = Math.round(4000 + (rbRatio - 1) * 4000)
    color_temperature = Math.min(color_temperature, 10000)
  } else if (rbRatio < 0.9) {
    color_temperature = Math.round(7000 - (1 - rbRatio) * 3000)
    color_temperature = Math.max(color_temperature, 2000)
  }

  // 计算色偏 (tint): R - G 的差异
  const tint = (avgR - avgG) / 255

  // 判断色调
  const is_warm = color_temperature > CONFIG.colorTemperature.warmThreshold
  const is_cool = color_temperature < CONFIG.colorTemperature.coolThreshold
  const is_neutral =
    color_temperature >= CONFIG.colorTemperature.neutralMin && color_temperature <= CONFIG.colorTemperature.neutralMax

  // 生成描述
  let description = ''
  if (is_neutral) {
    description = '白平衡准确，色彩自然'
  } else if (is_warm) {
    description = '画面偏暖色调，营造温馨氛围'
  } else if (is_cool) {
    description = '画面偏冷色调，给人清爽感'
  } else {
    description = '色彩偏中性'
  }

  return {
    color_temperature,
    is_warm,
    is_cool,
    is_neutral,
    tint: Math.round(tint * 100) / 100,
    description
  }
}

/**
 * 黄金分割构图分析
 * 检测画面是否符合黄金分割点（0.618位置）
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 黄金分割得分
 */
function analyzeGoldenRatio(
  imageData: ImageData,
  precomputedGray?: number[]
): {golden_ratio_score: number; has_golden_point: boolean} {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)

  // 黄金分割点位置
  const goldenX = Math.floor(width * CONFIG.goldenRatio.phi)
  const goldenY = Math.floor(height * CONFIG.goldenRatio.phi)

  // 四个黄金点
  const goldenPoints = [
    {x: goldenX, y: goldenY},
    {x: width - goldenX, y: goldenY},
    {x: goldenX, y: height - goldenY},
    {x: width - goldenX, y: height - goldenY}
  ]

  let totalInterest = 0
  const regionSize = CONFIG.goldenRatio.regionSize

  goldenPoints.forEach((point) => {
    let regionInterest = 0
    let pixelCount = 0

    for (let dy = -regionSize; dy < regionSize; dy++) {
      for (let dx = -regionSize; dx < regionSize; dx++) {
        const x = point.x + dx
        const y = point.y + dy

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const grayIdx = y * width + x
          const brightness = gray[grayIdx]
          regionInterest += Math.abs(brightness - 128)
          pixelCount++
        }
      }
    }

    if (pixelCount > 0) {
      totalInterest += regionInterest / pixelCount
    }
  })

  // 归一化得分
  const golden_ratio_score = Math.min(totalInterest / (4 * CONFIG.goldenRatio.interestNormalization), 1)
  const has_golden_point = golden_ratio_score >= CONFIG.goldenRatio.weakThreshold

  return {
    golden_ratio_score: Math.round(golden_ratio_score * 100) / 100,
    has_golden_point
  }
}

/**
 * 对称性检测
 * 检测画面是否具有垂直或水平对称性
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 对称性得分
 */
function analyzeSymmetry(
  imageData: ImageData,
  precomputedGray?: number[]
): {symmetry_score: number; is_symmetric: boolean} {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)
  const step = CONFIG.symmetry.samplingStep

  // 垂直对称检测
  let verticalDiff = 0
  let verticalCount = 0

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < Math.floor(width / 2); x += step) {
      const leftIdx = y * width + x
      const rightIdx = y * width + (width - 1 - x)
      verticalDiff += Math.abs(gray[leftIdx] - gray[rightIdx])
      verticalCount++
    }
  }

  // 水平对称检测
  let horizontalDiff = 0
  let horizontalCount = 0

  for (let y = 0; y < Math.floor(height / 2); y += step) {
    for (let x = 0; x < width; x += step) {
      const topIdx = y * width + x
      const bottomIdx = (height - 1 - y) * width + x
      horizontalDiff += Math.abs(gray[topIdx] - gray[bottomIdx])
      horizontalCount++
    }
  }

  // 计算对称得分 (差异越小，对称性越好)
  const verticalScore = verticalCount > 0 ? 1 - verticalDiff / verticalCount / 255 : 0.5
  const horizontalScore = horizontalCount > 0 ? 1 - horizontalDiff / horizontalCount / 255 : 0.5

  const symmetry_score = Math.max(verticalScore, horizontalScore)
  const is_symmetric = symmetry_score >= CONFIG.symmetry.verticalThreshold

  return {
    symmetry_score: Math.round(symmetry_score * 100) / 100,
    is_symmetric
  }
}

/**
 * 画面平衡度分析
 * 检测画面视觉重量是否均衡分布
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 平衡度得分
 */
function analyzeBalance(
  imageData: ImageData,
  precomputedGray?: number[]
): {balance_score: number; is_balanced: boolean} {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)
  const centerX = width / 2
  const centerY = height / 2

  // 计算左右两侧的视觉重量
  let leftWeight = 0
  let rightWeight = 0
  let topWeight = 0
  let bottomWeight = 0
  let totalWeight = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const brightness = gray[idx]
      // 亮度越高，视觉重量越大
      const weight = (brightness / 255) * 0.5 + 0.5

      // 距离中心的距离作为权重因子
      const distX = Math.abs(x - centerX) / centerX
      const distY = Math.abs(y - centerY) / centerY

      totalWeight += weight

      if (x < centerX) {
        leftWeight += weight * distX
      } else {
        rightWeight += weight * distX
      }

      if (y < centerY) {
        topWeight += weight * distY
      } else {
        bottomWeight += weight * distY
      }
    }
  }

  // 计算左右平衡度
  const horizontalBalance = 1 - Math.abs(leftWeight - rightWeight) / (totalWeight + 1)
  const verticalBalance = 1 - Math.abs(topWeight - bottomWeight) / (totalWeight + 1)

  // 综合平衡度
  const balance_score = (horizontalBalance + verticalBalance) / 2
  const is_balanced = balance_score >= CONFIG.balance.weakUnbalanced

  return {
    balance_score: Math.round(balance_score * 100) / 100,
    is_balanced
  }
}

/**
 * 计算整体置信度
 * 基于多个指标的综合可信度评估
 */
function calculateConfidence(
  brightness: {mean: number; darkRatio: number; brightRatio: number},
  saturation: number,
  _contrast: number,
  edgeInfo: {edgeStrength: number; detailRichness: number},
  subjectSize: {subjectRatio: number; centerDensity: number},
  sceneType: string,
  quality?: {noise_level: number; sharpness: number; is_blurry: boolean; has_noise: boolean}
): {overall: number; composition: number; lighting: number; distance: number; pose: number; reason: string} {
  const reasons: string[] = []
  let compositionConf = 0.5
  let lightingConf = 0.5
  let distanceConf = 0.5
  let poseConf = 0.5

  // 亮度置信度
  let lightingConfFactors = 1.0
  if (brightness.mean < 0.15 || brightness.mean > 0.85) {
    reasons.push('画面过暗或过亮')
    lightingConfFactors *= 0.5
  }
  if (brightness.darkRatio > 0.5 || brightness.brightRatio > 0.5) {
    reasons.push('存在大面积过曝或欠曝区域')
    lightingConfFactors *= 0.6
  }
  if (saturation < 0.1) {
    reasons.push('色彩过于平淡')
    lightingConfFactors *= 0.7
  }
  lightingConf = Math.min(lightingConf * lightingConfFactors + 0.3, 0.95)

  // 构图置信度
  let compositionConfFactors = 1.0
  if (edgeInfo.detailRichness < 0.2) {
    reasons.push('画面细节过少')
    compositionConfFactors *= 0.5
  }
  if (subjectSize.subjectRatio < 0.1 || subjectSize.subjectRatio > 0.9) {
    reasons.push('主体占比极端')
    compositionConfFactors *= 0.7
  }
  compositionConf = Math.min(compositionConf * compositionConfFactors + 0.3, 0.95)

  // 距离置信度
  if (subjectSize.subjectRatio >= 0.2 && subjectSize.subjectRatio <= 0.8) {
    distanceConf = 0.85
  } else if (subjectSize.subjectRatio >= 0.1 && subjectSize.subjectRatio <= 0.9) {
    distanceConf = 0.65
  } else {
    reasons.push('主体占比极端，难以准确判断距离')
    distanceConf = 0.4
  }

  // 姿态置信度 - 本地算法本身置信度就低
  if (CONFIG.pose.enableRuleBasedPose) {
    poseConf = 0.5 // 基于规则的方法置信度较低
    reasons.push('姿态分析为算法推断，可能不准确')
  }

  // 画质影响置信度
  if (quality) {
    if (quality.is_blurry) {
      reasons.push('画面模糊，分析结果可能不准确')
      compositionConf *= 0.5
      lightingConf *= 0.5
    }
    if (quality.has_noise) {
      reasons.push('画面噪点较多')
      compositionConf *= 0.8
    }
  }

  // 场景影响
  if (sceneType === 'other' || sceneType === '') {
    reasons.push('场景类型不明确')
    compositionConf *= 0.7
    poseConf *= 0.6
  }

  // 计算综合置信度
  const overall = Math.min(
    Math.max(compositionConf * 0.3 + lightingConf * 0.25 + distanceConf * 0.25 + poseConf * 0.2, 0),
    1
  )

  // 生成原因描述
  let reasonDesc = ''
  if (reasons.length === 0) {
    reasonDesc = '分析结果置信度高'
  } else if (reasons.length <= 2) {
    reasonDesc = `${reasons.join('，')}，结果仅供参考`
  } else {
    reasonDesc = `${reasons.slice(0, 2).join('，')}等，${reasons.length}项因素影响准确性`
  }

  return {
    overall: Math.round(overall * 100) / 100,
    composition: Math.round(compositionConf * 100) / 100,
    lighting: Math.round(lightingConf * 100) / 100,
    distance: Math.round(distanceConf * 100) / 100,
    pose: Math.round(poseConf * 100) / 100,
    reason: reasonDesc
  }
}

/**
 * 分析三分法构图
 * 检查画面四个交叉点区域的内容丰富度
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 构图得分 (0-1)
 */
function analyzeRuleOfThirds(imageData: ImageData, precomputedGray?: number[]): number {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)
  const thirdW = Math.floor(width / 3)
  const thirdH = Math.floor(height / 3)

  // 计算四个交叉点区域的兴趣度
  const points = [
    {x: thirdW, y: thirdH},
    {x: thirdW * 2, y: thirdH},
    {x: thirdW, y: thirdH * 2},
    {x: thirdW * 2, y: thirdH * 2}
  ]

  let totalInterest = 0
  const regionSize = CONFIG.composition.regionSize // 检查每个点周围20x20的区域

  points.forEach((point) => {
    let regionInterest = 0
    let pixelCount = 0

    for (let dy = -regionSize; dy < regionSize; dy++) {
      for (let dx = -regionSize; dx < regionSize; dx++) {
        const x = point.x + dx
        const y = point.y + dy

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const grayIdx = y * width + x
          const brightness = gray[grayIdx]

          // 计算该像素的"兴趣度"（对比度）
          regionInterest += Math.abs(brightness - 128)
          pixelCount++
        }
      }
    }

    totalInterest += regionInterest / pixelCount
  })

  return Math.min(totalInterest / (4 * CONFIG.composition.interestNormalization), 1) // 归一化到0-1
}

/**
 * 对角线构图检测
 * 检测画面中是否存在明显的对角线方向（引导线构图）
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 对角线得分 (0-1)，越高表示对角线特征越明显
 */
function analyzeDiagonalLines(imageData: ImageData, precomputedGray?: number[], edgeInfo?: EdgeResult): number {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)

  // 计算四个对角线方向上的梯度强度
  // 主对角线 (左上到右下)
  let mainDiagonalStrength = 0
  // 副对角线 (右上到左下)
  let antiDiagonalStrength = 0

  // 采样步长，避免遍历所有像素
  const step = 2
  let mainCount = 0
  let antiCount = 0

  // 主对角线方向梯度
  for (let i = 0; i < Math.min(width, height); i += step) {
    if (i + 1 < width && i + 1 < height) {
      const idx1 = i * width + i
      const idx2 = (i + 1) * width + (i + 1)
      mainDiagonalStrength += Math.abs(gray[idx1] - gray[idx2])
      mainCount++
    }
  }

  // 副对角线方向梯度
  for (let i = 0; i < Math.min(width, height); i += step) {
    if (i + 1 < width && i + 1 < height) {
      const idx1 = i * width + (width - 1 - i)
      const idx2 = (i + 1) * width + (width - 2 - i)
      antiDiagonalStrength += Math.abs(gray[idx1] - gray[idx2])
      antiCount++
    }
  }

  // 计算平均梯度
  const mainAvg = mainCount > 0 ? mainDiagonalStrength / mainCount : 0
  const antiAvg = antiCount > 0 ? antiDiagonalStrength / antiCount : 0

  // 复用已有的 edgeInfo 获取整体边缘强度
  const avgEdge = precomputedGray ? analyzeEdges(imageData).edgeStrength : edgeInfo.edgeStrength

  // 对角线得分：对角线梯度应该明显高于平均水平
  const maxDiagonal = Math.max(mainAvg, antiAvg)
  const diagonalRatio = avgEdge > 10 ? maxDiagonal / avgEdge : 0

  // 归一化到 0-1，考虑对角线特征在整体边缘中的占比
  return Math.min(diagonalRatio * 0.8, 1)
}

/**
 * 检测图片中心区域的内容密度
 * 比较中心区域与边缘区域的内容丰富度
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 中心焦点得分 (0-1)
 */
function analyzeCenterFocus(imageData: ImageData, precomputedGray?: number[]): number {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  const regionSize = Math.min(width, height) / 4

  let centerInterest = 0
  let edgeInterest = 0
  let centerPixels = 0
  let edgePixels = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grayIdx = y * width + x
      const brightness = gray[grayIdx]

      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)

      if (distFromCenter < regionSize) {
        centerInterest += Math.abs(brightness - 128)
        centerPixels++
      } else if (distFromCenter > regionSize * 2) {
        edgeInterest += Math.abs(brightness - 128)
        edgePixels++
      }
    }
  }

  const centerAvg = centerPixels > 0 ? centerInterest / centerPixels : 0
  const edgeAvg = edgePixels > 0 ? edgeInterest / edgePixels : 0

  // 中心区域应该比边缘更有"兴趣"
  return centerAvg > edgeAvg ? Math.min(centerAvg / CONFIG.contrast.normalization, 1) : 0.5
}

/**
 * 光线方向检测
 * 将画面分为9个区域，分析各区域的亮度分布判断主光源方向
 * @param imageData - Canvas图像数据
 * @param precomputedGray - 可选的预计算灰度数组
 * @returns 光线方向信息
 */
function analyzeLightDirection(
  imageData: ImageData,
  precomputedGray?: number[]
): {
  direction: 'front' | 'side' | 'back' | 'top' | 'even'
  directionScore: number
  description: string
} {
  const {width, height} = imageData
  const gray = precomputedGray || precomputeGrayscale(imageData)

  // 将画面分为9个区域计算亮度
  const regions = [
    {name: 'topLeft', x: 0, y: 0, w: Math.floor(width / 3), h: Math.floor(height / 3)},
    {name: 'topCenter', x: Math.floor(width / 3), y: 0, w: Math.floor(width / 3), h: Math.floor(height / 3)},
    {name: 'topRight', x: Math.floor((width * 2) / 3), y: 0, w: Math.floor(width / 3), h: Math.floor(height / 3)},
    {name: 'midLeft', x: 0, y: Math.floor(height / 3), w: Math.floor(width / 3), h: Math.floor(height / 3)},
    {
      name: 'midCenter',
      x: Math.floor(width / 3),
      y: Math.floor(height / 3),
      w: Math.floor(width / 3),
      h: Math.floor(height / 3)
    },
    {
      name: 'midRight',
      x: Math.floor((width * 2) / 3),
      y: Math.floor(height / 3),
      w: Math.floor(width / 3),
      h: Math.floor(height / 3)
    },
    {name: 'bottomLeft', x: 0, y: Math.floor((height * 2) / 3), w: Math.floor(width / 3), h: Math.floor(height / 3)},
    {
      name: 'bottomCenter',
      x: Math.floor(width / 3),
      y: Math.floor((height * 2) / 3),
      w: Math.floor(width / 3),
      h: Math.floor(height / 3)
    },
    {
      name: 'bottomRight',
      x: Math.floor((width * 2) / 3),
      y: Math.floor((height * 2) / 3),
      w: Math.floor(width / 3),
      h: Math.floor(height / 3)
    }
  ]

  // 计算各区域平均亮度
  const regionBrightness: Record<string, number> = {}
  regions.forEach((region) => {
    let totalBrightness = 0
    let pixelCount = 0
    for (let y = region.y; y < region.y + region.h && y < height; y++) {
      for (let x = region.x; x < region.x + region.w && x < width; x++) {
        totalBrightness += gray[y * width + x]
        pixelCount++
      }
    }
    regionBrightness[region.name] = pixelCount > 0 ? totalBrightness / pixelCount / 255 : 0
  })

  // 计算各方向区域的平均亮度
  const top = (regionBrightness.topLeft + regionBrightness.topCenter + regionBrightness.topRight) / 3
  const bottom = (regionBrightness.bottomLeft + regionBrightness.bottomCenter + regionBrightness.bottomRight) / 3
  const left = (regionBrightness.topLeft + regionBrightness.midLeft + regionBrightness.bottomLeft) / 3
  const right = (regionBrightness.topRight + regionBrightness.midRight + regionBrightness.bottomRight) / 3
  const center = regionBrightness.midCenter

  // 判断光线方向
  const brightnessDiff = 0.15 // 亮度差异阈值
  let direction: 'front' | 'side' | 'back' | 'top' | 'even' | 'unknown' = 'unknown'
  let directionScore = 0.5
  let description = '光线均匀分布'

  // 顺光（正面光）：整体亮度均匀，中心与边缘差异小
  const edgeAvg = (left + right + top + bottom) / 4
  const centerDiff = Math.abs(center - edgeAvg)

  if (centerDiff < brightnessDiff) {
    direction = 'front'
    directionScore = 0.8
    description = '顺光：光线均匀分布在画面上'
  }
  // 侧光：左侧或右侧明显亮于另一侧
  else if (Math.abs(left - right) > brightnessDiff * 2) {
    direction = 'side'
    directionScore = 0.6
    const sideLight = left > right ? '左侧' : '右侧'
    description = `侧光：${sideLight}光线较强`
  }
  // 逆光：中心亮，四周暗
  else if (center > edgeAvg * 1.2) {
    direction = 'back'
    directionScore = 0.5
    description = '逆光：主体背光，可能有轮廓光效果'
  }
  // 顶光：上部明显亮于下部
  else if (top > bottom * 1.3) {
    direction = 'top'
    directionScore = 0.6
    description = '顶光：光线从上方照射'
  }

  return {
    direction,
    directionScore,
    description
  }
}

/**
 * 定位面部区域
 * 基于肤色检测（YCbCr色彩空间）
 *
 * @param imageData - Canvas图像数据
 * @returns 面部区域信息
 */
function locateFaceRegion(imageData: ImageData): {x: number; y: number; width: number; height: number} | null {
  const {width, height} = imageData

  // 基于肤色检测
  const skinInfo = _detectSkinTone(imageData)

  if (skinInfo.skinRatio < 0.02) {
    return null
  }

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0
  let skinPixelCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (skinInfo.skinPixels[y * width + x]) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
        skinPixelCount++
      }
    }
  }

  if (skinPixelCount < width * height * 0.01) {
    return null
  }

  const padding = Math.min((maxX - minX) * 0.2, (maxY - minY) * 0.2)

  return {
    x: Math.max(0, Math.floor(minX - padding)),
    y: Math.max(0, Math.floor(minY - padding * 1.5)),
    width: Math.min(width, Math.ceil(maxX - minX + padding * 2)),
    height: Math.min(height, Math.ceil(maxY - minY + padding * 2))
  }
}

/**
 * 眼神光检测
 * 检测眼球区域是否有高光点，眼神光是人像摄影的灵魂
 * @param imageData - Canvas图像数据
 * @param faceRegion - 面部区域（可选，自动检测）
 * @returns 眼神光分析结果
 */
function analyzeEyeCatchlight(
  imageData: ImageData,
  faceRegion?: {x: number; y: number; width: number; height: number} | null
): {
  hasCatchlight: boolean
  catchlightCount: number
  catchlightPosition: 'both_eyes' | 'left_eye' | 'right_eye' | 'none'
  catchlightQuality: 'excellent' | 'good' | 'fair' | 'poor'
  brightness: number
  description: string
  suggestion: string
} {
  const {data, width, height} = imageData
  const cfg = CONFIG.eyeCatchlight

  const region = faceRegion || locateFaceRegion(imageData)

  if (!region) {
    return {
      hasCatchlight: false,
      catchlightCount: 0,
      catchlightPosition: 'none',
      catchlightQuality: 'poor',
      brightness: 0,
      description: '未检测到面部区域',
      suggestion: '请确保人物面部在画面中清晰可见'
    }
  }

  const eyeY = region.y + region.height * CONFIG.eyeFocus.faceDivision.eyeLineRatio
  const eyeRegionHeight = region.height * 0.12
  const eyeRegionWidth = region.width * 0.35

  const leftEyeRegion = {
    x: region.x + region.width * 0.12,
    y: eyeY,
    width: eyeRegionWidth,
    height: eyeRegionHeight
  }

  const rightEyeRegion = {
    x: region.x + region.width * 0.53,
    y: eyeY,
    width: eyeRegionWidth,
    height: eyeRegionHeight
  }

  function analyzeSingleEye(region: {x: number; y: number; width: number; height: number}): {
    hasHighlight: boolean
    highlightCount: number
    highlightPixels: number[]
    avgBrightness: number
    maxBrightness: number
  } {
    const highlightPixels: number[] = []
    let maxBrightness = 0
    let totalBrightness = 0
    let pixelCount = 0

    for (let y = Math.floor(region.y); y < Math.floor(region.y + region.height) && y < height; y++) {
      for (let x = Math.floor(region.x); x < Math.floor(region.x + region.width) && x < width; x++) {
        const idx = (y * width + x) * 4
        const brightness = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]

        totalBrightness += brightness
        pixelCount++
        maxBrightness = Math.max(maxBrightness, brightness)

        if (brightness > cfg.highlightThreshold) {
          highlightPixels.push(idx)
        }
      }
    }

    const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0

    const filteredHighlights = highlightPixels.filter((idx) => {
      const x = Math.floor(idx / 4) % width
      const y = Math.floor(idx / 4 / width)
      let adjacentHighlightCount = 0

      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const checkX = x + dx
          const checkY = y + dy
          if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
            const checkIdx = (checkY * width + checkX) * 4
            const checkBrightness = 0.299 * data[checkIdx] + 0.587 * data[checkIdx + 1] + 0.114 * data[checkIdx + 2]
            if (checkBrightness > cfg.highlightThreshold) {
              adjacentHighlightCount++
            }
          }
        }
      }

      return adjacentHighlightCount >= 3
    })

    return {
      hasHighlight: filteredHighlights.length >= cfg.minCatchlightSize,
      highlightCount: filteredHighlights.length,
      highlightPixels: filteredHighlights,
      avgBrightness,
      maxBrightness
    }
  }

  const leftEye = analyzeSingleEye(leftEyeRegion)
  const rightEye = analyzeSingleEye(rightEyeRegion)

  let catchlightCount = 0
  let catchlightPosition: 'both_eyes' | 'left_eye' | 'right_eye' | 'none' = 'none'

  if (leftEye.hasHighlight && rightEye.hasHighlight) {
    catchlightCount = 2
    catchlightPosition = 'both_eyes'
  } else if (leftEye.hasHighlight) {
    catchlightCount = 1
    catchlightPosition = 'left_eye'
  } else if (rightEye.hasHighlight) {
    catchlightCount = 1
    catchlightPosition = 'right_eye'
  }

  const hasCatchlight = catchlightCount > 0

  let catchlightQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor'
  let description = ''
  let suggestion = ''

  if (!hasCatchlight) {
    if (leftEye.maxBrightness < 150 || rightEye.maxBrightness < 150) {
      catchlightQuality = 'poor'
      description = '眼睛无神，光线未到达眼睛'
      suggestion = '尝试调整光源位置，让光线反射到眼睛形成眼神光'
    } else {
      catchlightQuality = 'fair'
      description = '眼睛较暗，缺乏眼神光'
      suggestion = '可以使用反光板或调整机位，让眼睛区域更亮'
    }
  } else if (catchlightCount === 2) {
    const avgBrightness = (leftEye.avgBrightness + rightEye.avgBrightness) / 2
    if (avgBrightness > cfg.highlightThreshold + 20) {
      catchlightQuality = 'excellent'
      description = '眼神光清晰明亮，双眼有神'
      suggestion = '保持这种光线条件，眼神光非常加分'
    } else {
      catchlightQuality = 'good'
      description = '有眼神光，眼睛有神采'
      suggestion = '眼神光效果不错，可以微调光源位置增强效果'
    }
  } else {
    catchlightQuality = 'fair'
    description = '单眼有眼神光，另一只眼睛较暗'
    suggestion = '建议调整光源或使用反光板，让双眼都有眼神光'
  }

  return {
    hasCatchlight,
    catchlightCount,
    catchlightPosition,
    catchlightQuality,
    brightness: hasCatchlight ? (leftEye.maxBrightness + rightEye.maxBrightness) / 2 : 0,
    description,
    suggestion
  }
}

/**
 * 面部优先曝光分析
 * 分析面部区域的曝光是否准确，是人像摄影的关键
 * @param imageData - Canvas图像数据
 * @param faceRegion - 面部区域（可选，自动检测）
 * @returns 面部曝光分析结果
 */
function analyzeFaceExposure(
  imageData: ImageData,
  faceRegion?: {x: number; y: number; width: number; height: number} | null
): {
  faceBrightness: number
  faceContrast: number
  overallBrightness: number
  isFaceUnderexposed: boolean
  isFaceOverexposed: boolean
  isFaceCorrectlyExposed: boolean
  faceToOverallRatio: number
  faceHighlightRatio: number
  faceShadowRatio: number
  description: string
  suggestion: string
} {
  const {data, width, height} = imageData
  const cfg = CONFIG.faceExposure

  const region = faceRegion || locateFaceRegion(imageData)

  const faceHistogram = new Array(256).fill(0)
  let facePixelCount = 0
  let faceBrightnessSum = 0

  if (region) {
    for (let y = region.y; y < region.y + region.height && y < height; y++) {
      for (let x = region.x; x < region.x + region.width && x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b

        faceHistogram[Math.round(brightness)]++
        faceBrightnessSum += brightness
        facePixelCount++
      }
    }
  }

  const faceBrightness = facePixelCount > 0 ? faceBrightnessSum / facePixelCount / 255 : 0

  let faceContrast = 0
  if (facePixelCount > 0) {
    let mean = 0
    for (let i = 0; i < 256; i++) {
      mean += i * faceHistogram[i]
    }
    mean /= facePixelCount

    let variance = 0
    for (let i = 0; i < 256; i++) {
      variance += faceHistogram[i] * (i / 255 - mean) ** 2
    }
    faceContrast = Math.sqrt(variance / facePixelCount) / 128
  }

  const overallHistogram = new Array(256).fill(0)
  let overallBrightnessSum = 0
  const overallPixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    overallHistogram[Math.round(brightness)]++
    overallBrightnessSum += brightness
  }

  const overallBrightness = overallBrightnessSum / overallPixelCount / 255

  let faceHighlightPixels = 0
  let faceShadowPixels = 0

  if (facePixelCount > 0) {
    for (let i = cfg.highlightThreshold; i < 256; i++) {
      faceHighlightPixels += faceHistogram[i]
    }
    for (let i = 0; i <= cfg.shadowThreshold; i++) {
      faceShadowPixels += faceHistogram[i]
    }
  }

  const faceHighlightRatio = facePixelCount > 0 ? faceHighlightPixels / facePixelCount : 0
  const faceShadowRatio = facePixelCount > 0 ? faceShadowPixels / facePixelCount : 0

  const faceToOverallRatio = overallBrightness > 0 ? faceBrightness / overallBrightness : 1

  const isFaceUnderexposed = faceBrightness < cfg.faceBrightnessMin || faceHighlightRatio > faceShadowRatio * 2
  const isFaceOverexposed = faceBrightness > cfg.faceBrightnessMax || faceHighlightRatio > 0.15
  const isFaceCorrectlyExposed = !isFaceUnderexposed && !isFaceOverexposed

  let description = ''
  let suggestion = ''

  if (!region) {
    description = '未检测到面部区域'
    suggestion = '请确保人物面部在画面中清晰可见'
  } else if (
    isFaceCorrectlyExposed &&
    faceToOverallRatio >= cfg.faceToOverallRatioMin &&
    faceToOverallRatio <= cfg.faceToOverallRatioMax
  ) {
    description = '面部曝光准确，与整体和谐'
    suggestion = '面部曝光完美，保持这种光线条件'
  } else if (isFaceUnderexposed) {
    if (faceToOverallRatio < cfg.faceToOverallRatioMin) {
      description = '面部欠曝，比整体画面暗'
      suggestion = '面部较暗，可以增加曝光或使用反光板补光'
    } else if (faceHighlightRatio > faceShadowRatio * 2) {
      description = '面部高光不足，阴影过重'
      suggestion = '面部反差过大，尝试使用柔光或反光板减少阴影'
    } else {
      description = '面部略微欠曝'
      suggestion = '可以稍微增加一点曝光，让面部更清晰'
    }
  } else if (isFaceOverexposed) {
    if (faceToOverallRatio > cfg.faceToOverallRatioMax) {
      description = '面部过曝，比整体画面亮'
      suggestion = '面部过亮，可以减少曝光或移动到阴影区域'
    } else if (faceHighlightRatio > 0.15) {
      description = '面部高光区域过曝'
      suggestion = '面部高光溢出，尝试减少曝光或调整光线角度'
    } else {
      description = '面部略微过曝'
      suggestion = '可以稍微减少一点曝光，保留更多细节'
    }
  } else if (faceToOverallRatio < cfg.faceToOverallRatioMin) {
    description = '面部比整体暗，与背景融合'
    suggestion = '面部与背景区分度不够，可以增加面部补光'
  } else if (faceToOverallRatio > cfg.faceToOverallRatioMax) {
    description = '面部比整体亮，略显突出'
    suggestion = '面部比背景亮很多，可以适当减少补光'
  } else {
    description = '面部曝光基本正常'
    suggestion = '曝光条件尚可，可根据效果微调'
  }

  return {
    faceBrightness,
    faceContrast: Math.min(faceContrast, 1),
    overallBrightness,
    isFaceUnderexposed,
    isFaceOverexposed,
    isFaceCorrectlyExposed,
    faceToOverallRatio: Math.round(faceToOverallRatio * 100) / 100,
    faceHighlightRatio: Math.round(faceHighlightRatio * 1000) / 1000,
    faceShadowRatio: Math.round(faceShadowRatio * 1000) / 1000,
    description,
    suggestion
  }
}

/**
 * 眼睛对焦检测
 * 检测眼睛是否在焦平面上（对焦在眼是人像摄影的核心原则）
 * @param imageData - Canvas图像数据
 * @param faceRegion - 面部区域（可选，自动检测）
 * @returns 眼睛对焦分析结果
 */
function analyzeEyeFocus(
  imageData: ImageData,
  faceRegion?: {x: number; y: number; width: number; height: number} | null
): {
  eyeSharpness: number
  faceSharpness: number
  isEyeSharpest: boolean
  isFaceSharp: boolean
  focusQuality: 'excellent' | 'good' | 'acceptable' | 'poor'
  description: string
  suggestion: string
} {
  const {width, height} = imageData
  const gray = precomputeGrayscale(imageData)
  const cfg = CONFIG.eyeFocus

  const region = faceRegion || locateFaceRegion(imageData)

  if (!region) {
    return {
      eyeSharpness: 0,
      faceSharpness: 0,
      isEyeSharpest: false,
      isFaceSharp: false,
      focusQuality: 'poor',
      description: '未检测到面部区域',
      suggestion: '请确保人物面部在画面中清晰可见'
    }
  }

  const eyeY = region.y + region.height * cfg.faceDivision.eyeLineRatio
  const eyeRegionHeight = Math.floor(region.height * 0.12)
  const eyeRegionWidth = Math.floor(region.width * 0.35)

  const leftEyeRegion = {
    x: region.x + Math.floor(region.width * 0.12),
    y: Math.floor(eyeY),
    width: eyeRegionWidth,
    height: eyeRegionHeight
  }

  const rightEyeRegion = {
    x: region.x + Math.floor(region.width * 0.53),
    y: Math.floor(eyeY),
    width: eyeRegionWidth,
    height: eyeRegionHeight
  }

  function calculateRegionSharpness(
    region: {x: number; y: number; width: number; height: number},
    grayData: number[]
  ): number {
    let edgeSum = 0
    let pixelCount = 0

    for (let y = region.y + 1; y < region.y + region.height - 1 && y < height - 1; y++) {
      for (let x = region.x + 1; x < region.x + region.width - 1 && x < width - 1; x++) {
        const idx = y * width + x
        const laplacian =
          4 * grayData[idx] - grayData[idx - 1] - grayData[idx + 1] - grayData[idx - width] - grayData[idx + width]
        edgeSum += Math.abs(laplacian)
        pixelCount++
      }
    }

    return pixelCount > 0 ? edgeSum / pixelCount / CONFIG.noise.sharpnessNormalization : 0
  }

  const leftEyeSharpness = calculateRegionSharpness(leftEyeRegion, gray)
  const rightEyeSharpness = calculateRegionSharpness(rightEyeRegion, gray)
  const eyeSharpness = Math.max(leftEyeSharpness, rightEyeSharpness)

  let faceSharpnessSum = 0
  let faceSharpnessCount = 0

  for (let y = region.y + 1; y < region.y + region.height - 1 && y < height - 1; y++) {
    for (let x = region.x + 1; x < region.x + region.width - 1 && x < width - 1; x++) {
      const idx = y * width + x
      const laplacian = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width]
      faceSharpnessSum += Math.abs(laplacian)
      faceSharpnessCount++
    }
  }

  const faceSharpness =
    faceSharpnessCount > 0 ? faceSharpnessSum / faceSharpnessCount / CONFIG.noise.sharpnessNormalization : 0

  const isEyeSharpest = eyeSharpness >= faceSharpness * cfg.eyeToFaceSharpnessRatio
  const isFaceSharp = faceSharpness >= cfg.sharpnessThreshold.acceptable

  let focusQuality: 'excellent' | 'good' | 'acceptable' | 'poor'
  let description = ''
  let suggestion = ''

  if (eyeSharpness >= cfg.sharpnessThreshold.excellent && isEyeSharpest) {
    focusQuality = 'excellent'
    description = '眼睛对焦精准，非常清晰'
    suggestion = '对焦完美，眼睛是画面最清晰的部分'
  } else if (eyeSharpness >= cfg.sharpnessThreshold.good && isEyeSharpest) {
    focusQuality = 'good'
    description = '眼睛对焦良好，清晰度不错'
    suggestion = '眼睛对焦准确，可以保持'
  } else if (eyeSharpness >= cfg.sharpnessThreshold.acceptable) {
    focusQuality = 'acceptable'
    description = '眼睛清晰度一般，可能有轻微失焦'
    suggestion = '眼睛清晰度刚好达标，建议确认对焦是否准确'
  } else if (faceSharpness >= cfg.sharpnessThreshold.acceptable) {
    focusQuality = 'poor'
    description = '眼睛失焦，面部其他区域更清晰'
    suggestion = '对焦可能偏了，请将对焦点对准眼睛后重新拍摄'
  } else {
    focusQuality = 'poor'
    description = '整体较模糊，可能手抖或对焦失败'
    suggestion = '画面模糊，请确保稳定拍摄，对准眼睛对焦'
  }

  return {
    eyeSharpness: Math.round(eyeSharpness * 100) / 100,
    faceSharpness: Math.round(faceSharpness * 100) / 100,
    isEyeSharpest,
    isFaceSharp,
    focusQuality,
    description,
    suggestion
  }
}

/**
 * 自适应肤色检测
 * 根据图像亮度自动调整YCbCr阈值，适应不同光照条件
 * @param imageData - Canvas图像数据
 * @returns 自适应肤色分析结果
 */
function analyzeAdaptiveSkinTone(imageData: ImageData): {
  skinRatio: number
  skinPixelsCount: number
  adaptiveRange: {cbMin: number; cbMax: number; crMin: number; crMax: number}
  skinToneType: 'warm' | 'cool' | 'neutral' | 'reddish' | 'yellowish' | 'unknown'
  skinHealthScore: number
  hasHealthyHighlights: boolean
  hasNaturalShadows: boolean
  skinTextureScore: number
  description: string
  suggestion: string
} {
  const {data, width, height} = imageData
  const cfg = CONFIG.adaptiveSkinTone

  let totalR = 0,
    totalG = 0,
    totalB = 0
  let skinR = 0,
    skinG = 0,
    skinB = 0
  let skinPixelCount = 0
  let skinHighlightCount = 0
  let skinShadowCount = 0
  let skinContrastSum = 0

  const skinPixels: boolean[] = new Array(width * height).fill(false)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    totalR += r
    totalG += g
    totalB += b
  }

  const avgR = totalR / (data.length / 4)
  const avgG = totalG / (data.length / 4)
  const avgB = totalB / (data.length / 4)

  let adaptiveCbMin = cfg.baseCbMin
  let adaptiveCbMax = cfg.baseCbMax
  let adaptiveCrMin = cfg.baseCrMin
  let adaptiveCrMax = cfg.baseCrMax

  if (avgR > 180 && avgG > 180 && avgB > 180) {
    adaptiveCrMin -= 5
    adaptiveCbMax += 5
  } else if (avgR < 60 && avgG < 60 && avgB < 60) {
    adaptiveCrMax += 8
    adaptiveCbMin -= 8
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2]

      const yVal = 0.299 * r + 0.587 * g + 0.114 * b
      const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128
      const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128

      const isSkin = cb >= adaptiveCbMin && cb <= adaptiveCbMax && cr >= adaptiveCrMin && cr <= adaptiveCrMax

      if (isSkin && yVal > cfg.brightnessThreshold) {
        skinPixels[y * width + x] = true
        skinPixelCount++
        skinR += r
        skinG += g
        skinB += b

        if (yVal > 200) skinHighlightCount++
        if (yVal < 60) {
          skinShadowCount++
          skinContrastSum += yVal
        }
      }
    }
  }

  const skinRatio = skinPixelCount / (width * height)

  if (skinPixelCount < cfg.minSkinPixels) {
    return {
      skinRatio: 0,
      skinPixelsCount: 0,
      adaptiveRange: {cbMin: adaptiveCbMin, cbMax: adaptiveCbMax, crMin: adaptiveCrMin, crMax: adaptiveCrMax},
      skinToneType: 'unknown',
      skinHealthScore: 0,
      hasHealthyHighlights: false,
      hasNaturalShadows: false,
      skinTextureScore: 0,
      description: '未检测到足够肤色区域',
      suggestion: '请确保人物面部在画面中清晰可见，光线充足'
    }
  }

  const avgSkinR = skinR / skinPixelCount
  const avgSkinG = skinG / skinPixelCount
  const avgSkinB = skinB / skinPixelCount

  const highlightRatio = skinHighlightCount / skinPixelCount
  const shadowRatio = skinShadowCount / skinPixelCount

  const hasHealthyHighlights = highlightRatio <= cfg.healthyHighlightRatio || highlightRatio >= 0.08
  const avgShadowBrightness = skinShadowCount > 0 ? skinContrastSum / skinShadowCount : 128
  const hasNaturalShadows = avgShadowBrightness > 30 || skinShadowCount < skinPixelCount * 0.15

  const healthFactors = [
    hasHealthyHighlights ? 0.25 : 0,
    hasNaturalShadows ? 0.25 : 0,
    skinRatio >= cfg.minSkinRatio ? 0.25 : 0,
    shadowRatio < 0.2 ? 0.25 : 0
  ]
  const skinHealthScore = Math.min(
    healthFactors.reduce((sum, f) => sum + f, 0),
    1
  )

  const skinTextureScore = Math.min(1 - Math.abs(0.5 - shadowRatio), 1)

  let skinToneType: 'warm' | 'cool' | 'neutral' | 'reddish' | 'yellowish' | 'unknown' = 'neutral'
  const rgDiff = (avgSkinR - avgSkinG) / 255
  const rbDiff = (avgSkinR - avgSkinB) / 255

  if (avgSkinR > avgSkinG + 10 && avgSkinG > avgSkinB + 5) {
    if (rgDiff > cfg.redTintMin) {
      skinToneType = 'reddish'
    } else if (rbDiff > cfg.yellowTintMin) {
      skinToneType = 'warm'
    }
  } else if (avgSkinB > avgSkinR + 10) {
    skinToneType = 'cool'
  }

  let description = ''
  let suggestion = ''

  if (skinHealthScore >= cfg.goodHealthScore) {
    if (skinToneType === 'warm') {
      description = '肤色健康自然，呈现温暖的色调'
    } else if (skinToneType === 'reddish') {
      description = '肤色红润健康，气色好'
    } else {
      description = '肤色自然健康，白平衡准确'
    }
    suggestion = '肤色状态良好'
  } else if (skinHealthScore >= cfg.fairHealthScore) {
    description = '肤色基本健康，可能略有偏差'
    suggestion = '可以微调白平衡获得更准确的肤色'
  } else {
    if (skinToneType === 'cool') {
      description = '肤色偏冷，可能受环境光线影响'
      suggestion = '可以尝试调整白平衡或更换拍摄环境'
    } else if (!hasNaturalShadows) {
      description = '皮肤阴影过重或过于平淡'
      suggestion = '调整光线，减少面部阴影或增加对比度'
    } else if (!hasHealthyHighlights) {
      description = '皮肤高光不自然，可能过曝或偏色'
      suggestion = '避免直射强光，使用柔光或反光板'
    } else {
      description = '肤色状态一般，建议优化光线条件'
      suggestion = '确保光线均匀柔和，避免偏色'
    }
  }

  return {
    skinRatio: Math.round(skinRatio * 1000) / 1000,
    skinPixelsCount: skinPixelCount,
    adaptiveRange: {cbMin: adaptiveCbMin, cbMax: adaptiveCbMax, crMin: adaptiveCrMin, crMax: adaptiveCrMax},
    skinToneType,
    skinHealthScore: Math.round(skinHealthScore * 100) / 100,
    hasHealthyHighlights,
    hasNaturalShadows,
    skinTextureScore: Math.round(skinTextureScore * 100) / 100,
    description,
    suggestion
  }
}

/**
 * 头部空间与视线方向检测
 * 分析人像照片中的头部留白和视线方向空间
 * @param imageData - Canvas图像数据
 * @param faceRegion - 面部区域（可选，自动检测）
 * @returns 头部空间分析结果
 */
function analyzeHeadroom(
  imageData: ImageData,
  faceRegion?: {x: number; y: number; width: number; height: number} | null
): {
  headroom: 'excessive' | 'good' | 'tight' | 'cut_off'
  headroomRatio: number
  leadRoom: 'good' | 'insufficient' | 'excessive' | 'unknown'
  leadRoomRatio: number
  isAtJoint: boolean
  jointType: 'hip' | 'knee' | 'elbow' | 'wrist' | 'ankle' | 'neck' | 'none'
  horizonLevel: number
  horizonPosition: 'through_head' | 'through_neck' | 'below_chin' | 'proper' | 'unknown'
  compositionScore: number
  description: string
  suggestion: string
} {
  const {width, height} = imageData
  const cfg = CONFIG.headroom

  const region = faceRegion || locateFaceRegion(imageData)

  if (!region) {
    return {
      headroom: 'tight',
      headroomRatio: 0,
      leadRoom: 'good',
      leadRoomRatio: 0,
      isAtJoint: false,
      jointType: 'none',
      horizonLevel: 0,
      horizonPosition: 'proper',
      compositionScore: 0,
      description: '未检测到面部区域',
      suggestion: '请确保人物面部在画面中清晰可见'
    }
  }

  const faceTopY = region.y
  const faceBottomY = region.y + region.height
  const imageTopY = 0
  const imageBottomY = height

  const headroomHeight = faceTopY - imageTopY
  const headroomRatio = headroomHeight / height

  const leadRoomHeight = imageBottomY - faceBottomY
  const leadRoomRatio = leadRoomHeight / height

  let leadRoomStatus: 'good' | 'insufficient' | 'excessive' = 'good'
  if (leadRoomRatio > 0.5) {
    leadRoomStatus = 'excessive'
  } else if (leadRoomRatio < cfg.leadRoomRatio) {
    leadRoomStatus = 'insufficient'
  }

  let headroomStatus: 'excessive' | 'good' | 'tight' | 'cut_off'
  if (headroomRatio > cfg.excessiveRatio) {
    headroomStatus = 'excessive'
  } else if (headroomRatio < cfg.tightRatio) {
    headroomStatus = faceTopY <= 5 ? 'cut_off' : 'tight'
  } else if (headroomRatio >= cfg.goodMinRatio && headroomRatio <= cfg.goodMaxRatio) {
    headroomStatus = 'good'
  } else if (headroomRatio < cfg.goodMinRatio) {
    headroomStatus = 'tight'
  } else {
    headroomStatus = 'excessive'
  }

  const bodyY = faceBottomY
  const bodyRatio = bodyY / height

  let isAtJoint = false
  let jointType: 'hip' | 'knee' | 'elbow' | 'wrist' | 'ankle' | 'neck' | 'none' = 'none'

  if (Math.abs(bodyRatio - cfg.hipLineRatio) < cfg.jointThreshold) {
    isAtJoint = true
    jointType = 'hip'
  } else if (Math.abs(bodyRatio - cfg.kneeLineRatio) < cfg.jointThreshold * 1.2) {
    isAtJoint = true
    jointType = 'knee'
  }

  const gray = precomputeGrayscale(imageData)
  const horizontalProjection = new Array(height).fill(0)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = y * width + x
      const diff = x < width - 1 ? Math.abs(gray[idx] - gray[idx + 1]) : 0
      horizontalProjection[y] += diff
    }
  }

  let horizonY = -1
  let maxDiff = 0

  for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.8); y++) {
    const diff = Math.abs(horizontalProjection[y] - horizontalProjection[y + 1])
    if (diff > maxDiff) {
      maxDiff = diff
      horizonY = y
    }
  }

  let horizonLevel = 0
  let horizonPosition: 'through_head' | 'through_neck' | 'below_chin' | 'proper' | 'unknown' = 'proper'

  if (horizonY > 0) {
    const angle =
      (Math.atan2(horizontalProjection[horizonY + 10] - horizontalProjection[horizonY - 10], 20) * 180) / Math.PI
    horizonLevel = Math.abs(angle)

    if (horizonY > faceTopY - 10 && horizonY < faceTopY + region.height) {
      if (horizonY < faceTopY + region.height * 0.2) {
        horizonPosition = 'through_head'
      } else if (horizonY < faceTopY + region.height * 0.5) {
        horizonPosition = 'through_neck'
      } else if (horizonY < faceTopY + region.height * 0.8) {
        horizonPosition = 'below_chin'
      } else {
        horizonPosition = 'proper'
      }
    } else if (horizonY < faceTopY) {
      horizonPosition = 'through_head'
    } else {
      horizonPosition = 'proper'
    }
  }

  let compositionScore = 100
  let description = ''
  let suggestion = ''

  if (headroomStatus === 'excessive') {
    compositionScore -= 15
    description = '头顶留白过多，画面松散'
    suggestion = '稍微向下移动构图，让头部更靠近画面顶部'
  } else if (headroomStatus === 'tight') {
    compositionScore -= 10
    description = '头顶空间紧凑，有点压抑'
    suggestion = '稍微向上移动构图，留出更多头部空间'
  } else if (headroomStatus === 'cut_off') {
    compositionScore -= 25
    description = '画面切到头顶，不完整'
    suggestion = '确保头顶完全在画面内，留出一点空间'
  } else {
    compositionScore += 5
  }

  if (leadRoomStatus === 'insufficient' && leadRoomRatio > 0) {
    compositionScore -= 10
    description += '，视线前方空间不足'
    suggestion = '如果人物在看某个方向，确保那个方向有足够空间'
  } else if (leadRoomStatus === 'insufficient') {
    description += '，画面下部较满'
    suggestion = '可以稍微向上移动，让画面更平衡'
  } else if (leadRoomStatus === 'excessive' && leadRoomRatio > 0.6) {
    compositionScore -= 5
    description += '，视线前方空间过大'
    suggestion = '可以稍微向下移动，让主体更突出'
  }

  if (isAtJoint) {
    compositionScore -= 15
    const jointNames: Record<string, string> = {
      hip: '臀部',
      knee: '膝盖',
      elbow: '手肘',
      wrist: '手腕',
      ankle: '脚踝',
      neck: '颈部'
    }
    description += `，在${jointNames[jointType]}处截断`
    suggestion = `人物在${jointNames[jointType]}处被截断，可以尝试拍全身或截取更大幅`
  }

  if (horizonPosition === 'through_head') {
    compositionScore -= 20
    description += '，地平线穿过头部'
    suggestion = '地平线不要穿过头部，可以调整机位高度或后期裁剪'
  } else if (horizonPosition === 'through_neck') {
    compositionScore -= 10
    description += '，地平线切过脖子'
    suggestion = '地平线不要切过脖子，调整一下位置'
  } else if (horizonLevel > 5) {
    compositionScore -= 5
    description += '，地平线略有倾斜'
    suggestion = '注意地平线保持水平'
  }

  if (description === '') {
    description = '构图舒适，比例协调'
    suggestion = '构图不错'
  }

  return {
    headroom: headroomStatus,
    headroomRatio: Math.round(headroomRatio * 100) / 100,
    leadRoom: leadRoomStatus,
    leadRoomRatio: Math.round(leadRoomRatio * 100) / 100,
    isAtJoint,
    jointType,
    horizonLevel: Math.round(horizonLevel * 10) / 10,
    horizonPosition,
    compositionScore: Math.max(0, Math.min(100, Math.round(compositionScore))),
    description,
    suggestion
  }
}

/**
 * 本地照片评估算法
 * 借鉴专业摄影评估模型，对照片进行多维度分析
 * @param imagePath - 图片路径
 * @returns 评估结果包含总分、各项得分及改进建议
 */
export async function evaluatePhotoLocally(imagePath: string): Promise<LocalEvaluationResult> {
  // 添加超时机制
  const timeoutMs = 10000 // 10秒超时

  return new Promise<LocalEvaluationResult>((resolve, reject) => {
    // 设置超时
    const timeoutId = setTimeout(() => {
      console.error('评估超时')
      reject(new Error('评估超时'))
    }, timeoutMs)

    try {
      // 创建canvas来分析图片
      let canvas
      try {
        canvas = Taro.createOffscreenCanvas({
          type: '2d',
          width: CONFIG.canvas.maxWidth,
          height: CONFIG.canvas.maxHeight
        })
      } catch (canvasErr) {
        console.error('创建OffscreenCanvas失败:', canvasErr)
        clearTimeout(timeoutId)
        reject(new Error('创建OffscreenCanvas失败'))
        return
      }

      if (!canvas) {
        console.error('无法创建OffscreenCanvas')
        clearTimeout(timeoutId)
        reject(new Error('无法创建OffscreenCanvas'))
        return
      }

      const ctx = canvas.getContext('2d') as any

      if (!ctx) {
        console.error('无法创建Canvas上下文')
        clearTimeout(timeoutId)
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      // 加载图片
      const img = canvas.createImage()

      if (!img) {
        console.error('无法创建Image对象')
        clearTimeout(timeoutId)
        reject(new Error('无法创建Image对象'))
        return
      }

      // img.onload 回调
      img.onload = async () => {
        try {
          // 动态采样：小图保持原尺寸，大图等比缩放
          const optimalSize = calculateOptimalSize(img.width, img.height, CONFIG.canvas.maxWidth)
          canvas.width = optimalSize.width
          canvas.height = optimalSize.height
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // 获取图片数据
          let imageData
          try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          } catch (e) {
            console.error('获取图片数据失败:', e)
            clearTimeout(timeoutId)
            reject(new Error('获取图片数据失败'))
            return
          }

          if (!imageData || !imageData.data) {
            console.error('图片数据无效')
            clearTimeout(timeoutId)
            reject(new Error('图片数据无效'))
            return
          }

          // === 专业摄影评估指标分析 ===

          // === 专业摄影评估指标分析 ===

          // 0. 预处理：统一图像数据分析（一次遍历同时计算灰度数组和亮度统计）
          const {gray: grayScale, brightness: brightnessInfo} = analyzeImageData(imageData)

          // 1. 边缘和细节分析（复用灰度数据）
          const edgeInfo = analyzeEdges(imageData, grayScale)

          // 2. 对比度分析（复用灰度数据）
          const contrast = analyzeContrast(imageData, grayScale)

          // 5. 中心焦点分析（复用灰度数据）
          const ruleOfThirds = analyzeRuleOfThirds(imageData, grayScale)

          // 6. 主体大小分析（复用边缘数据）
          const centerFocus = analyzeCenterFocus(imageData, grayScale)

          // 7. 噪点与清晰度分析
          const subjectSize = analyzeSubjectSize(imageData, edgeInfo)

          // 8. 景深/虚化分析
          const quality = analyzeNoiseAndSharpness(imageData, grayScale)
          const noiseScore = quality.is_blurry ? 0 : quality.has_noise ? 5 : 10

          // 9. 曝光分析
          const depthOfField = analyzeDepthOfField(imageData, grayScale)

          // 10. 色温分析
          const exposure = analyzeExposure(imageData)

          // 11. 黄金分割构图分析
          const colorTemp = analyzeColorTemperature(imageData)

          // 12. 黄金分割构图分析
          const goldenRatio = analyzeGoldenRatio(imageData, grayScale)

          // 13. 对角线构图分析（复用灰度数据和边缘信息）
          const diagonalScore = analyzeDiagonalLines(imageData, grayScale, edgeInfo)

          // 14. 对称性分析
          const symmetry = analyzeSymmetry(imageData, grayScale)

          // 15. 画面平衡度分析（复用灰度数据）
          const balance = analyzeBalance(imageData, grayScale)

          // P0新增：人像专业分析
          // 眼神光检测
          const eyeCatchlight = analyzeEyeCatchlight(imageData)

          // 面部优先曝光分析
          const faceExposure = analyzeFaceExposure(imageData)

          // 眼睛对焦检测
          const eyeFocus = analyzeEyeFocus(imageData)

          // P1新增：自适应肤色分析
          // 16. 自适应肤色检测
          const adaptiveSkinTone = analyzeAdaptiveSkinTone(imageData)

          // === 计算各维度得分（借鉴专业评估模型）===

          // 1. 构图得分 (30分)
          // 专业构图考虑：三分法、黄金分割、视觉平衡、对角线构图
          const compositionBase =
            ruleOfThirds * CONFIG.weights.composition.ruleOfThirds +
            centerFocus * CONFIG.weights.composition.centerFocus +
            edgeInfo.detailRichness * CONFIG.weights.composition.detailRichness +
            diagonalScore * 0.2
          let compositionScore = Math.round(compositionBase * CONFIG.score.compositionFull)

          // 构图加分项：细节丰富度或对角线构图
          if (edgeInfo.detailRichness > CONFIG.edge.detailThreshold) {
            compositionScore = Math.min(compositionScore + CONFIG.score.bonusMax, CONFIG.score.compositionFull)
          }

          // 对角线构图额外加分
          if (diagonalScore > 0.4) {
            compositionScore = Math.min(compositionScore + 2, CONFIG.score.compositionFull)
          }

          // 2. 立体感得分 (20分)
          // 分析画面对比度和边缘强度，评估立体感/透视感
          const contrastBase =
            contrast * CONFIG.weights.contrast.contrast + edgeInfo.edgeStrength * CONFIG.weights.contrast.edgeStrength
          let contrastScore = Math.round(contrastBase * CONFIG.score.angleFull)

          // 立体感加分项：高对比度
          if (contrast > CONFIG.contrast.highThreshold) {
            contrastScore = Math.min(contrastScore + CONFIG.score.bonusMax, CONFIG.score.angleFull)
          }

          // 3. 距离得分 (15分) - 优化版
          // 使用主体占比和中心密度来评估距离
          // 理想状态：主体占画面40-60%，中心密度适中
          let distanceScore = 0
          if (
            subjectSize.subjectRatio >= CONFIG.subject.idealMin &&
            subjectSize.subjectRatio <= CONFIG.subject.idealMax
          ) {
            // 主体大小理想
            distanceScore = CONFIG.score.distanceFull
          } else if (
            subjectSize.subjectRatio >= CONFIG.subject.acceptableMin &&
            subjectSize.subjectRatio <= CONFIG.subject.acceptableMax
          ) {
            // 主体大小可接受
            distanceScore = 12
          } else if (
            subjectSize.subjectRatio >= CONFIG.subject.adjustMin &&
            subjectSize.subjectRatio <= CONFIG.subject.adjustMax
          ) {
            // 主体大小需要调整
            distanceScore = 9
          } else if (subjectSize.subjectRatio < CONFIG.subject.adjustMin) {
            // 主体太小，距离太远
            distanceScore = 6
          } else {
            // 主体太大，距离太近
            distanceScore = 7
          }

          // 4. 光线得分 (15分)
          // 专业光线考虑：曝光准确性、明暗分布、色彩饱和度、光线方向
          const lightDirection = analyzeLightDirection(imageData, grayScale)
          let heightScore = 0

          // 理想曝光范围：0.35-0.65
          if (brightnessInfo.mean >= CONFIG.brightness.idealMin && brightnessInfo.mean <= CONFIG.brightness.idealMax) {
            heightScore = CONFIG.score.heightFull
          } else if (
            brightnessInfo.mean >= CONFIG.brightness.acceptableMin &&
            brightnessInfo.mean <= CONFIG.brightness.acceptableMax
          ) {
            heightScore = 12
          } else if (
            brightnessInfo.mean >= CONFIG.brightness.marginMin &&
            brightnessInfo.mean <= CONFIG.brightness.marginMax
          ) {
            heightScore = 9
          } else {
            heightScore = 6
          }

          // 光线加分项：色彩饱和度适中
          if (saturation >= CONFIG.saturation.idealMin && saturation <= CONFIG.saturation.idealMax) {
            heightScore = Math.min(heightScore + CONFIG.score.lightBonus, CONFIG.score.heightFull)
          }

          // 光线加分项：光线方向理想（顺光或柔和侧光）
          if (lightDirection.direction === 'front' || lightDirection.direction === 'side') {
            heightScore = Math.min(heightScore + 1, CONFIG.score.heightFull)
          }

          // 光线减分项：过度曝光或欠曝
          if (
            brightnessInfo.darkRatio > CONFIG.brightness.exposureThreshold ||
            brightnessInfo.brightRatio > CONFIG.brightness.exposureThreshold
          ) {
            heightScore = Math.max(heightScore - CONFIG.score.lightPenalty, 0)
          }

          // 5. 姿态得分 (30分)
          // 根据配置开关选择评估方式
          let poseScore: number | null = null
          let poseAnalysis: LocalEvaluationResult['pose_analysis']
          let poseBaseScore: number = CONFIG.pose.ruleBased.baseScore

          if (CONFIG.pose.enableRuleBasedPose) {
            // 方案四：基于规则的姿态评估
            const poseResult = analyzePose(
              centerFocus,
              ruleOfThirds,
              subjectSize,
              edgeInfo.detailRichness,
              brightnessInfo.mean
            )
            poseAnalysis = {
              pose_type: poseResult.pose_type,
              confidence: poseResult.confidence,
              score: poseResult.score,
              description: poseResult.description
            }
            poseScore = poseResult.score
            poseBaseScore = poseResult.score
          } else {
            // 原有方案：基于场景类型的基础分（已降权）
            poseBaseScore = Math.round(CONFIG.score.poseBase * CONFIG.pose.weight) // 默认5分
            if (
              centerFocus > CONFIG.centerFocus.strongThreshold &&
              edgeInfo.detailRichness > CONFIG.sceneThresholds.portrait.detail
            ) {
              poseBaseScore = Math.round(CONFIG.score.posePortrait * CONFIG.pose.weight)
            } else if (
              centerFocus < CONFIG.centerFocus.weakThreshold &&
              ruleOfThirds > CONFIG.sceneThresholds.landscape.ruleOfThirds
            ) {
              poseBaseScore = Math.round(CONFIG.score.poseLandscape * CONFIG.pose.weight)
            }
          }

          // 总分计算
          const totalScore = compositionScore + contrastScore + distanceScore + heightScore + poseBaseScore

          // 场景类型判断
          let sceneType = 'other'
          if (
            centerFocus > CONFIG.sceneThresholds.portrait.centerFocus &&
            edgeInfo.detailRichness > CONFIG.sceneThresholds.portrait.detail
          ) {
            sceneType = 'portrait'
          } else if (
            centerFocus < CONFIG.sceneThresholds.landscape.centerFocus &&
            ruleOfThirds > CONFIG.sceneThresholds.landscape.ruleOfThirds
          ) {
            sceneType = 'landscape'
          } else if (
            centerFocus > CONFIG.sceneThresholds.group.centerFocus &&
            ruleOfThirds > CONFIG.sceneThresholds.group.ruleOfThirds
          ) {
            sceneType = 'group'
          }

          // 计算置信度
          const confidence = calculateConfidence(
            brightnessInfo,
            saturation,
            contrast,
            edgeInfo,
            subjectSize,
            sceneType,
            quality
          )

          // === 生成专业建议（优化版：更具体明确）===
          const suggestions: LocalEvaluationResult['suggestions'] = {}

          // 分析画面布局（用于生成具体建议）
          const imageAspectRatio = canvas.width / canvas.height
          const isPortrait = imageAspectRatio < CONFIG.layout.portrait // 竖屏
          const isLandscape = imageAspectRatio > CONFIG.layout.landscape // 横屏

          // 构图建议 - 通俗易懂的用户友好语言
          if (compositionScore < 15) {
            if (ruleOfThirds < 0.3) {
              if (centerFocus > 0.7) {
                suggestions.composition = '人物太居中了，往左或往右站一点，画面会更生动'
              } else {
                suggestions.composition = '试试把人物放到画面偏左或偏右的位置，视觉焦点会更突出'
              }
            } else if (centerFocus < 0.3) {
              suggestions.composition = '离镜头近一点，人物会更醒目'
            } else {
              suggestions.composition = '换个角度试试，比如斜着站或让画面有些引导线，会更有冲击力'
            }
          } else if (compositionScore < 20) {
            if (edgeInfo.detailRichness < 0.3) {
              suggestions.composition = '背景有点单调，靠近人物或换个背景更丰富的位置试试'
            } else {
              suggestions.composition = '构图不错，稍微调整下位置会更完美'
            }
          } else if (compositionScore < 25) {
            suggestions.composition = '构图很棒，保持这个姿势！'
          }

          // 立体感建议 - 通俗易懂
          if (contrastScore < 8) {
            if (contrast < 0.25) {
              if (centerFocus > 0.7) {
                suggestions.angle = '画面有点平，加个人或物当前景层次会更丰富'
              } else {
                suggestions.angle = '光线反差不够大，找个明暗对比更明显的背景试试'
              }
            } else if (edgeInfo.edgeStrength < 0.2) {
              suggestions.angle = '侧面打点光，人物轮廓会更分明'
            } else {
              suggestions.angle = '换个角度拍，画面会更立体'
            }
          } else if (contrastScore < 14) {
            if (centerFocus > 0.7) {
              suggestions.angle = '人物立体感不错，换个侧光角度会更帅'
            } else {
              suggestions.angle = '层次感挺好的，保持这个角度'
            }
          } else if (contrastScore < 17) {
            suggestions.angle = '光影层次很棒，画面很有立体感！'
          }

          // 距离建议 - 通俗易懂
          if (distanceScore < 8) {
            if (subjectSize.subjectRatio < 0.2) {
              suggestions.distance = '离镜头太远了，往前走几步会更醒目'
            } else if (subjectSize.subjectRatio > 0.8) {
              suggestions.distance = '离镜头太近了，稍微往后退一点，构图会更舒服'
            } else {
              suggestions.distance = '调整下距离，人物会更突出'
            }
          } else if (distanceScore < 11) {
            if (subjectSize.subjectRatio < 0.3) {
              suggestions.distance = '稍微靠近一点，面部细节会更清晰'
            } else if (subjectSize.subjectRatio > 0.7) {
              suggestions.distance = '稍微往后退一点，可以拍到全身'
            } else {
              suggestions.distance = '距离刚刚好，可以根据需求微调'
            }
          } else if (distanceScore < 13) {
            suggestions.distance = '距离恰到好处，很棒！'
          }

          // 机位高度建议 - 通俗易懂
          if (heightScore < 8) {
            if (brightnessInfo.mean < 0.2) {
              suggestions.height = '画面有点暗，镜头举高一点，让更多光照到脸上'
            } else if (brightnessInfo.mean > 0.8) {
              suggestions.height = '画面太亮了，镜头稍微放低一点'
            } else if (brightnessInfo.darkRatio > 0.3) {
              suggestions.height = '阴影太多，镜头抬高一点会好很多'
            } else if (brightnessInfo.brightRatio > 0.3) {
              suggestions.height = '高光太亮了，镜头放低一点试试'
            } else {
              suggestions.height = '光线不太理想，稍微调整下镜头高度'
            }
          } else if (heightScore < 12) {
            if (saturation < 0.2) {
              suggestions.height = '颜色有点淡，镜头举高一点俯拍，会更有立体感'
            } else if (saturation > 0.8) {
              suggestions.height = '颜色有点浓，镜头放低一点仰拍，会更自然'
            } else {
              if (subjectSize.subjectRatio > 0.7) {
                suggestions.height = '人像照，镜头稍微抬高或降低一点，效果会不同'
              } else {
                suggestions.height = '镜头高度可以微调，试试看'
              }
            }
          } else if (heightScore < 14) {
            if (subjectSize.subjectRatio > 0.7) {
              suggestions.height = '光线很好，稍微调整下高度会有惊喜'
            }
          }

          // 人物姿态建议 - 通俗易懂
          if (centerFocus > 0.5 && edgeInfo.detailRichness > 0.4) {
            if (!suggestions.pose) {
              if (isPortrait) {
                suggestions.pose = '身体稍微侧一点，一腿在前会更显腿长，手臂别贴着身体'
              } else if (isLandscape) {
                suggestions.pose = '摆个S型曲线，重心放一侧，再加点头部倾斜，会更有曲线美'
              } else {
                suggestions.pose = '上半身稍微转侧面，下巴抬一点，眼神往上看，会显脸小'
              }
            }
          }

          // 画质及额外建议 - 全部用try-catch保护
          try {
            // 如果有模糊或噪点，添加画质建议
            if (quality.is_blurry && !suggestions.composition) {
              suggestions.composition = '画面有点模糊，拍照时手要稳住哦'
            } else if (quality.has_noise && !suggestions.height) {
              suggestions.height = '画面噪点有点多，光线充足时拍效果会更好'
            }

            // 如果有过曝或欠曝，添加曝光建议
            if (exposure.has_overexposure && !suggestions.height) {
              suggestions.height = '画面局部过曝了，稍微减少点曝光试试'
            } else if (exposure.has_underexposure && !suggestions.height) {
              suggestions.height = '画面有点暗，稍微增加点曝光会更清晰'
            }

            // 如果动态范围低且不是人像场景，添加建议
            if (
              exposure.dynamic_range < CONFIG.exposure.dynamicRangeMin &&
              sceneType !== 'portrait' &&
              !suggestions.angle
            ) {
              suggestions.angle = '画面反差有点小，找个明暗对比更明显的背景会更好'
            }

            // 如果色彩偏暖/偏冷且明显，给出建议
            if (colorTemp.is_warm && sceneType !== 'portrait' && !suggestions.height) {
              suggestions.height = '画面偏暖色调，如果想拍清新风格可以换个白平衡'
            } else if (colorTemp.is_cool && sceneType !== 'portrait' && !suggestions.height) {
              suggestions.height = '画面偏冷色调，试试调整白平衡会有不同效果'
            }

            // 如果有明显对称性，可以建议保持
            if (symmetry.is_symmetric && !suggestions.composition) {
              suggestions.composition = '对称构图很有特点，保持这种平衡感'
            }

            // 如果画面不平衡，给出建议
            if (!balance.is_balanced && !suggestions.composition) {
              suggestions.composition = '画面有点偏，试着把主体往另一侧挪一点会更平衡'
            }
          } catch (e) {
            console.error('生成额外建议失败:', e)
          }

          clearTimeout(timeoutId)
          resolve({
            total_score: Math.min(Math.max(totalScore, 0), 100),
            composition_score: compositionScore,
            pose_score: poseScore,
            angle_score: contrastScore,
            distance_score: distanceScore,
            height_score: heightScore,
            suggestions,
            scene_type: sceneType,
            pose_analysis: poseAnalysis,
            confidence,
            quality: {
              sharpness: quality.sharpness,
              noise_level: quality.noise_level,
              noise_score: noiseScore,
              is_blurry: quality.is_blurry,
              has_noise: quality.has_noise,
              depth_of_field: {
                has_blur: depthOfField.has_blur,
                blur_strength: depthOfField.blur_strength,
                is_shallow: depthOfField.is_shallow,
                description: depthOfField.description
              },
              exposure: {
                dynamic_range: exposure.dynamic_range,
                highlight_ratio: exposure.highlight_ratio,
                shadow_ratio: exposure.shadow_ratio,
                has_overexposure: exposure.has_overexposure,
                has_underexposure: exposure.has_underexposure,
                description: exposure.description
              }
            },
            color_analysis: {
              color_temperature: colorTemp.color_temperature,
              is_warm: colorTemp.is_warm,
              is_cool: colorTemp.is_cool,
              is_neutral: colorTemp.is_neutral,
              tint: colorTemp.tint,
              description: colorTemp.description
            },
            composition_enhanced: {
              golden_ratio_score: goldenRatio.golden_ratio_score,
              has_golden_point: goldenRatio.has_golden_point,
              symmetry_score: symmetry.symmetry_score,
              is_symmetric: symmetry.is_symmetric,
              balance_score: balance.balance_score,
              is_balanced: balance.is_balanced
            },
            eye_catchlight: {
              has_catchlight: eyeCatchlight.hasCatchlight,
              catchlight_count: eyeCatchlight.catchlightCount,
              catchlight_position: eyeCatchlight.catchlightPosition,
              catchlight_quality: eyeCatchlight.catchlightQuality,
              brightness: eyeCatchlight.brightness,
              description: eyeCatchlight.description,
              suggestion: eyeCatchlight.suggestion
            },
            face_exposure: {
              face_brightness: faceExposure.faceBrightness,
              face_contrast: faceExposure.faceContrast,
              overall_brightness: faceExposure.overallBrightness,
              is_face_underexposed: faceExposure.isFaceUnderexposed,
              is_face_overexposed: faceExposure.isFaceOverexposed,
              is_face_correctly_exposed: faceExposure.isFaceCorrectlyExposed,
              face_to_overall_ratio: faceExposure.faceToOverallRatio,
              face_highlight_ratio: faceExposure.faceHighlightRatio,
              face_shadow_ratio: faceExposure.faceShadowRatio,
              description: faceExposure.description,
              suggestion: faceExposure.suggestion
            },
            eye_focus: {
              eye_sharpness: eyeFocus.eyeSharpness,
              face_sharpness: eyeFocus.faceSharpness,
              is_eye_sharpest: eyeFocus.isEyeSharpest,
              is_face_sharp: eyeFocus.isFaceSharp,
              focus_quality: eyeFocus.focusQuality,
              description: eyeFocus.description,
              suggestion: eyeFocus.suggestion
            },
            adaptive_skin_tone: {
              skin_ratio: adaptiveSkinTone.skinRatio,
              skin_pixels_count: adaptiveSkinTone.skinPixelsCount,
              skin_tone_type: adaptiveSkinTone.skinToneType,
              skin_health_score: adaptiveSkinTone.skinHealthScore,
              has_healthy_highlights: adaptiveSkinTone.hasHealthyHighlights,
              has_natural_shadows: adaptiveSkinTone.hasNaturalShadows,
              skin_texture_score: adaptiveSkinTone.skinTextureScore,
              description: adaptiveSkinTone.description,
              suggestion: adaptiveSkinTone.suggestion
            }
          })
        } catch (error) {
          console.error('图片分析失败:', error)
          const errorDetails = error instanceof Error ? error.message : String(error)
          console.error('图片分析错误详情:', errorDetails)
          clearTimeout(timeoutId)
          // 返回默认评估结果而不是抛出错误
          resolve({
            total_score: 70,
            composition_score: 20,
            pose_score: 18,
            angle_score: 14,
            distance_score: 10,
            height_score: 8,
            suggestions: {
              composition: '',
              pose: '',
              angle: '',
              distance: '',
              height: ''
            },
            scene_type: 'other',
            pose_analysis: null,
            confidence: {
              overall: 0,
              composition: 0,
              lighting: 0,
              distance: 0,
              pose: 0,
              reason: '分析过程中发生错误'
            },
            quality: {
              sharpness: 0,
              noise_level: 0,
              noise_score: 0,
              is_blurry: false,
              has_noise: false,
              depth_of_field: {
                has_blur: false,
                blur_strength: 0,
                is_shallow: false,
                description: ''
              },
              exposure: {
                dynamic_range: 0,
                highlight_ratio: 0,
                shadow_ratio: 0,
                has_overexposure: false,
                has_underexposure: false,
                description: ''
              }
            },
            color_analysis: {
              color_temperature: 5500,
              is_warm: false,
              is_cool: false,
              is_neutral: true,
              tint: 0,
              description: ''
            },
            composition_enhanced: {
              golden_ratio_score: 0,
              has_golden_point: false,
              symmetry_score: 0,
              is_symmetric: false,
              balance_score: 0,
              is_balanced: true
            },
            eye_catchlight: {
              has_catchlight: false,
              catchlight_count: 0,
              catchlight_position: 'none',
              catchlight_quality: 'poor',
              brightness: 0,
              description: '分析失败',
              suggestion: '请重试'
            },
            face_exposure: {
              face_brightness: 0,
              face_contrast: 0,
              overall_brightness: 0,
              is_face_underexposed: false,
              is_face_overexposed: false,
              is_face_correctly_exposed: false,
              face_to_overall_ratio: 1,
              face_highlight_ratio: 0,
              face_shadow_ratio: 0,
              description: '分析失败',
              suggestion: '请重试'
            },
            eye_focus: {
              eye_sharpness: 0,
              face_sharpness: 0,
              is_eye_sharpest: false,
              is_face_sharp: false,
              focus_quality: 'poor',
              description: '分析失败',
              suggestion: '请重试'
            },
            adaptive_skin_tone: {
              skin_ratio: 0,
              skin_pixels_count: 0,
              skin_tone_type: 'unknown',
              skin_health_score: 0,
              has_healthy_highlights: false,
              has_natural_shadows: false,
              skin_texture_score: 0,
              description: '分析失败',
              suggestion: '请重试'
            }
          })
        }
      }

      img.onerror = (err) => {
        console.error('图片加载失败:', err, '路径:', imagePath)
        const errorDetails = err instanceof Error ? err.message : String(err)
        console.error('图片加载错误详情:', errorDetails)
        clearTimeout(timeoutId)
        reject(new Error('图片加载失败'))
      }

      img.src = imagePath
    } catch (error) {
      console.error('本地评估异常:', error)
      const errorDetails = error instanceof Error ? error.message : String(error)
      console.error('本地评估错误详情:', errorDetails)
      clearTimeout(timeoutId)
      reject(error)
    }
  })
}
