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
 * 分析图片的亮度
 */
function analyzeBrightness(imageData: ImageData): number {
  const data = imageData.data
  let totalBrightness = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // 计算亮度 (使用加权平均)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b
    totalBrightness += brightness
  }

  return totalBrightness / pixelCount / 255 // 归一化到0-1
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
 * 本地评估照片
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

          // 分析各项指标
          const brightness = analyzeBrightness(imageData)
          const contrast = analyzeContrast(imageData)
          const ruleOfThirds = analyzeRuleOfThirds(imageData)
          const centerFocus = analyzeCenterFocus(imageData)

          console.log('图片分析完成:', {brightness, contrast, ruleOfThirds, centerFocus})

          // 计算各维度得分
          // 构图得分 (30分)
          const compositionScore = Math.round((ruleOfThirds * 0.6 + centerFocus * 0.4) * 30)

          // 角度得分 (20分) - 基于对比度
          const angleScore = Math.round(contrast * 20)

          // 距离得分 (10分) - 基于中心焦点
          const distanceScore = Math.round(centerFocus * 10)

          // 高度得分 (10分) - 基于亮度分布
          const heightScore = Math.round((brightness > 0.3 && brightness < 0.7 ? 1 : 0.7) * 10)

          // 姿态得分 (30分) - 本地无法准确判断，给个中等分数
          const poseScore = null // 本地评估不包含姿态

          // 总分
          const totalScore = compositionScore + angleScore + distanceScore + heightScore + 15 // 姿态给15分基础分

          // 生成建议
          const suggestions: any = {}

          if (compositionScore < 20) {
            suggestions.composition = '尝试使用三分法构图，将主体放在画面的交叉点上'
          } else if (compositionScore < 25) {
            suggestions.composition = '构图不错，可以尝试调整主体位置使其更突出'
          }

          if (angleScore < 12) {
            suggestions.angle = '增加画面对比度，尝试不同的拍摄角度'
          } else if (angleScore < 16) {
            suggestions.angle = '角度选择合理，可以尝试更有创意的视角'
          }

          if (distanceScore < 6) {
            suggestions.distance = '调整拍摄距离，让主体更清晰突出'
          }

          if (heightScore < 6) {
            suggestions.height = '注意光线条件，避免过亮或过暗'
          } else if (brightness < 0.3) {
            suggestions.height = '画面偏暗，建议增加光线或调整曝光'
          } else if (brightness > 0.7) {
            suggestions.height = '画面偏亮，建议减少光线或降低曝光'
          }

          // 场景类型判断（简化版）
          const sceneType = 'other'

          console.log('评估完成，总分:', totalScore)

          resolve({
            total_score: Math.min(totalScore, 100),
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
