// 本地照片评估算法
import Taro from '@tarojs/taro'

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
}

/**
 * 分析图片的亮度分布
 * 返回：{mean: 平均亮度, histogram: 亮度直方图}
 */
function analyzeBrightnessDistribution(imageData: ImageData): {
  mean: number
  histogram: number[]
  darkRatio: number
  brightRatio: number
} {
  const data = imageData.data
  const histogram = new Array(256).fill(0)
  let totalBrightness = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    histogram[brightness]++
    totalBrightness += brightness
  }

  const mean = totalBrightness / pixelCount

  // 计算暗部和亮部比例
  let darkPixels = 0
  let brightPixels = 0
  for (let i = 0; i < 256; i++) {
    if (i < 85) darkPixels += histogram[i]
    if (i > 170) brightPixels += histogram[i]
  }

  return {
    mean: mean / 255,
    histogram,
    darkRatio: darkPixels / pixelCount,
    brightRatio: brightPixels / pixelCount
  }
}

/**
 * 分析图片的色彩饱和度
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
 * 检测边缘和细节
 * 使用Sobel算子检测边缘
 */
function analyzeEdgeAndDetail(imageData: ImageData): {
  edgeStrength: number
  detailRichness: number
} {
  const {width, height, data} = imageData
  const gray: number[] = []

  // 转换为灰度
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    gray.push(0.299 * r + 0.587 * g + 0.114 * b)
  }

  let totalEdge = 0
  let edgePixels = 0

  // Sobel算子
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
      if (magnitude > 50) edgePixels++
    }
  }

  const avgEdge = totalEdge / ((width - 2) * (height - 2))
  const edgeRatio = edgePixels / ((width - 2) * (height - 2))

  return {
    edgeStrength: Math.min(avgEdge / 500, 1),
    detailRichness: Math.min(edgeRatio * 2, 1)
  }
}

/**
 * 分析图片的对比度
 */
function analyzeContrast(imageData: ImageData): number {
  const data = imageData.data
  const brightnesses: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b
    brightnesses.push(brightness)
  }

  // 计算标准差作为对比度指标
  const mean = brightnesses.reduce((sum, val) => sum + val, 0) / brightnesses.length
  const variance = brightnesses.reduce((sum, val) => sum + (val - mean) ** 2, 0) / brightnesses.length
  const stdDev = Math.sqrt(variance)

  return Math.min(stdDev / 128, 1) // 归一化到0-1
}

/**
 * 分析三分法构图
 */
function analyzeRuleOfThirds(imageData: ImageData): number {
  const {width, height, data} = imageData
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
  const regionSize = 20 // 检查每个点周围20x20的区域

  points.forEach((point) => {
    let regionInterest = 0
    let pixelCount = 0

    for (let dy = -regionSize; dy < regionSize; dy++) {
      for (let dx = -regionSize; dx < regionSize; dx++) {
        const x = point.x + dx
        const y = point.y + dy

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          // 计算该像素的"兴趣度"（对比度）
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b
          regionInterest += Math.abs(brightness - 128)
          pixelCount++
        }
      }
    }

    totalInterest += regionInterest / pixelCount
  })

  return Math.min(totalInterest / (4 * 128), 1) // 归一化到0-1
}

/**
 * 检测图片中心区域的内容密度
 */
function analyzeCenterFocus(imageData: ImageData): number {
  const {width, height, data} = imageData
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  const regionSize = Math.min(width, height) / 4

  let centerInterest = 0
  let edgeInterest = 0
  let centerPixels = 0
  let edgePixels = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b

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
  return centerAvg > edgeAvg ? Math.min(centerAvg / 128, 1) : 0.5
}

/**
 * 本地评估照片 - 优化版
 * 借鉴专业摄影评估模型
 */
export async function evaluatePhotoLocally(imagePath: string): Promise<LocalEvaluationResult> {
  return new Promise((resolve, reject) => {
    try {
      console.log('开始本地评估，图片路径:', imagePath)

      // 创建canvas来分析图片
      const canvas = Taro.createOffscreenCanvas({
        type: '2d',
        width: 300,
        height: 400
      })
      const ctx = canvas.getContext('2d') as any

      if (!ctx) {
        console.error('无法创建Canvas上下文')
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      console.log('Canvas创建成功')

      // 加载图片
      const img = canvas.createImage()

      img.onload = () => {
        try {
          console.log('图片加载成功，尺寸:', img.width, 'x', img.height)

          // 绘制图片到canvas
          canvas.width = Math.min(img.width, 300)
          canvas.height = Math.min(img.height, 400)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          console.log('图片绘制成功')

          // 获取图片数据
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

          console.log('获取图片数据成功，像素数:', imageData.data.length)

          // === 专业摄影评估指标分析 ===

          // 1. 亮度分布分析
          const brightnessInfo = analyzeBrightnessDistribution(imageData)

          // 2. 对比度分析
          const contrast = analyzeContrast(imageData)

          // 3. 色彩饱和度分析
          const saturation = analyzeColorSaturation(imageData)

          // 4. 边缘和细节分析
          const edgeInfo = analyzeEdgeAndDetail(imageData)

          // 5. 三分法构图分析
          const ruleOfThirds = analyzeRuleOfThirds(imageData)

          // 6. 中心焦点分析
          const centerFocus = analyzeCenterFocus(imageData)

          console.log('图片分析完成:', {
            brightness: brightnessInfo.mean,
            contrast,
            saturation,
            edgeStrength: edgeInfo.edgeStrength,
            detailRichness: edgeInfo.detailRichness,
            ruleOfThirds,
            centerFocus
          })

          // === 计算各维度得分（借鉴专业评估模型）===

          // 1. 构图得分 (30分)
          // 专业构图考虑：三分法、黄金分割、视觉平衡
          const compositionBase = ruleOfThirds * 0.5 + centerFocus * 0.3 + edgeInfo.detailRichness * 0.2
          let compositionScore = Math.round(compositionBase * 30)

          // 构图加分项：细节丰富度
          if (edgeInfo.detailRichness > 0.6) {
            compositionScore = Math.min(compositionScore + 2, 30)
          }

          // 2. 角度得分 (20分)
          // 专业角度考虑：对比度、边缘强度、视角独特性
          const angleBase = contrast * 0.5 + edgeInfo.edgeStrength * 0.5
          let angleScore = Math.round(angleBase * 20)

          // 角度加分项：高对比度
          if (contrast > 0.6) {
            angleScore = Math.min(angleScore + 2, 20)
          }

          // 3. 距离得分 (10分)
          // 专业距离考虑：主体清晰度、景深效果
          const distanceBase = centerFocus * 0.7 + edgeInfo.detailRichness * 0.3
          const distanceScore = Math.round(distanceBase * 10)

          // 4. 光线得分 (10分)
          // 专业光线考虑：曝光准确性、明暗分布、色彩饱和度
          let heightScore = 0

          // 理想曝光范围：0.35-0.65
          if (brightnessInfo.mean >= 0.35 && brightnessInfo.mean <= 0.65) {
            heightScore = 10
          } else if (brightnessInfo.mean >= 0.25 && brightnessInfo.mean <= 0.75) {
            heightScore = 8
          } else if (brightnessInfo.mean >= 0.15 && brightnessInfo.mean <= 0.85) {
            heightScore = 6
          } else {
            heightScore = 4
          }

          // 光线加分项：色彩饱和度适中
          if (saturation >= 0.3 && saturation <= 0.7) {
            heightScore = Math.min(heightScore + 1, 10)
          }

          // 光线减分项：过度曝光或欠曝
          if (brightnessInfo.darkRatio > 0.4 || brightnessInfo.brightRatio > 0.4) {
            heightScore = Math.max(heightScore - 2, 0)
          }

          // 5. 姿态得分 (30分) - 本地无法准确判断，给基础分
          const poseScore = null

          // 基础姿态分（用于总分计算）
          let poseBaseScore = 18 // 默认60%

          // 根据场景类型调整姿态基础分
          // 人像照片：需要更高的姿态分
          // 风景照片：姿态分影响较小
          if (centerFocus > 0.7 && edgeInfo.detailRichness > 0.5) {
            // 可能是人像照片（中心有明显主体）
            poseBaseScore = 20
          } else if (centerFocus < 0.4 && ruleOfThirds > 0.6) {
            // 可能是风景照片（构图分散）
            poseBaseScore = 22
          }

          // 总分计算
          const totalScore = compositionScore + angleScore + distanceScore + heightScore + poseBaseScore

          // === 生成专业建议 ===
          const suggestions: any = {}

          // 构图建议
          if (compositionScore < 18) {
            if (ruleOfThirds < 0.4) {
              suggestions.composition = '建议使用三分法构图，将主体放在画面的交叉点上，使画面更有视觉冲击力'
            } else if (centerFocus < 0.4) {
              suggestions.composition = '主体不够突出，建议调整构图使主体更加清晰明确'
            } else {
              suggestions.composition = '构图较为平淡，可以尝试更有创意的角度和布局'
            }
          } else if (compositionScore < 24) {
            if (edgeInfo.detailRichness < 0.5) {
              suggestions.composition = '画面细节略显不足，可以靠近主体或选择更丰富的场景'
            } else {
              suggestions.composition = '构图基础良好，可以尝试调整主体位置使其更符合黄金分割比例'
            }
          } else if (compositionScore < 28) {
            suggestions.composition = '构图优秀，画面平衡感强，继续保持'
          }

          // 角度建议
          if (angleScore < 12) {
            if (contrast < 0.3) {
              suggestions.angle = '画面对比度较低，建议寻找光影对比更强的角度，或调整拍摄时间'
            } else if (edgeInfo.edgeStrength < 0.3) {
              suggestions.angle = '画面缺乏层次感，尝试从不同高度或侧面拍摄，增加立体感'
            } else {
              suggestions.angle = '拍摄角度较为常规，可以尝试俯拍、仰拍等特殊视角'
            }
          } else if (angleScore < 16) {
            suggestions.angle = '角度选择合理，可以尝试更大胆的视角创新'
          } else if (angleScore < 19) {
            suggestions.angle = '拍摄角度出色，很好地展现了主体特点'
          }

          // 距离建议
          if (distanceScore < 5) {
            suggestions.distance = '拍摄距离不当，主体不够清晰。建议调整距离使主体占据画面1/3到2/3'
          } else if (distanceScore < 7) {
            suggestions.distance = '距离基本合适，可以微调以获得更好的景深效果'
          } else if (distanceScore < 9) {
            suggestions.distance = '拍摄距离恰当，主体突出且背景协调'
          }

          // 光线建议
          if (heightScore < 5) {
            if (brightnessInfo.mean < 0.3) {
              suggestions.height = '画面整体偏暗，建议增加光源或提高ISO/曝光补偿'
            } else if (brightnessInfo.mean > 0.7) {
              suggestions.height = '画面过度曝光，建议降低曝光或选择光线较柔和的时段拍摄'
            } else if (brightnessInfo.darkRatio > 0.5) {
              suggestions.height = '暗部细节丢失严重，建议使用补光或HDR模式'
            } else if (brightnessInfo.brightRatio > 0.5) {
              suggestions.height = '高光溢出严重，建议降低曝光或使用渐变滤镜'
            }
          } else if (heightScore < 8) {
            if (saturation < 0.3) {
              suggestions.height = '色彩饱和度偏低，可以在光线充足时拍摄或后期适当增强'
            } else if (saturation > 0.7) {
              suggestions.height = '色彩过于饱和，建议适当降低饱和度保持自然'
            } else {
              suggestions.height = '曝光基本准确，可以微调以获得更好的明暗层次'
            }
          } else if (heightScore < 10) {
            suggestions.height = '光线运用良好，明暗过渡自然'
          }

          // 场景类型判断（优化版）
          let sceneType = 'other'
          if (centerFocus > 0.7 && edgeInfo.detailRichness > 0.5) {
            sceneType = 'portrait' // 人像
          } else if (centerFocus < 0.4 && ruleOfThirds > 0.6) {
            sceneType = 'landscape' // 风景
          } else if (centerFocus > 0.5 && ruleOfThirds > 0.5) {
            sceneType = 'group' // 合影
          }

          console.log('评估完成，总分:', totalScore, '场景类型:', sceneType)

          resolve({
            total_score: Math.min(Math.max(totalScore, 0), 100),
            composition_score: compositionScore,
            pose_score: poseScore,
            angle_score: angleScore,
            distance_score: distanceScore,
            height_score: heightScore,
            suggestions,
            scene_type: sceneType
          })
        } catch (error) {
          console.error('图片分析失败:', error)
          reject(error)
        }
      }

      img.onerror = (err) => {
        console.error('图片加载失败:', err, '路径:', imagePath)
        reject(new Error('图片加载失败'))
      }

      console.log('设置图片源:', imagePath)
      img.src = imagePath
    } catch (error) {
      console.error('本地评估异常:', error)
      reject(error)
    }
  })
}
