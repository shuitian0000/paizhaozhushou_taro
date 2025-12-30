// AI图片分析工具函数
import Taro from '@tarojs/taro'

/**
 * 将图片路径转换为Base64格式
 */
export async function imageToBase64(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        // 小程序环境
        const fs = Taro.getFileSystemManager()
        fs.readFile({
          filePath: imagePath,
          encoding: 'base64',
          success: (res) => {
            const extension = imagePath.split('.').pop()?.toLowerCase() || 'jpg'
            const mimeTypeMap: Record<string, string> = {
              png: 'image/png',
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              gif: 'image/gif',
              webp: 'image/webp',
              bmp: 'image/bmp'
            }
            const mimeType = mimeTypeMap[extension] || 'image/jpeg'
            const base64String = `data:${mimeType};base64,${res.data}`
            resolve(base64String)
          },
          fail: (error) => {
            console.error('读取图片文件失败:', error)
            reject(new Error('图片转换失败'))
          }
        })
      } else {
        // H5环境
        if (imagePath.startsWith('data:')) {
          resolve(imagePath)
          return
        }
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('无法创建Canvas上下文'))
              return
            }
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            const base64String = canvas.toDataURL('image/jpeg', 0.8)
            resolve(base64String)
          } catch (error) {
            console.error('Canvas转换失败:', error)
            reject(new Error('图片处理失败'))
          }
        }
        img.onerror = () => {
          reject(new Error('图片加载失败'))
        }
        img.src = imagePath
      }
    } catch (error) {
      console.error('图片转base64出错:', error)
      reject(new Error('图片处理失败'))
    }
  })
}

export interface AnalysisResult {
  total_score: number
  composition_score: number
  pose_score: number
  angle_score: number
  distance_score: number
  height_score: number
  suggestions: {
    composition: string
    pose: string
    angle: string
    distance: string
    height: string
  }
  scene_type: 'portrait' | 'landscape' | 'group' | 'other'
}

/**
 * 解析AI返回的分析结果
 */
export function parseAnalysisResult(aiResponse: string): AnalysisResult | null {
  try {
    // 尝试从AI响应中提取JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return result
    }

    // 如果没有JSON格式，尝试解析文本
    const lines = aiResponse.split('\n')
    const result: any = {
      suggestions: {}
    }

    for (const line of lines) {
      if (line.includes('总分') || line.includes('总评分')) {
        const scoreMatch = line.match(/(\d+)/)
        if (scoreMatch) result.total_score = Number.parseInt(scoreMatch[1], 10)
      }
      if (line.includes('构图')) {
        const scoreMatch = line.match(/(\d+)/)
        if (scoreMatch) result.composition_score = Number.parseInt(scoreMatch[1], 10)
        result.suggestions.composition = line
      }
      if (line.includes('姿态') || line.includes('pose')) {
        const scoreMatch = line.match(/(\d+)/)
        if (scoreMatch) result.pose_score = Number.parseInt(scoreMatch[1], 10)
        result.suggestions.pose = line
      }
      if (line.includes('角度')) {
        const scoreMatch = line.match(/(\d+)/)
        if (scoreMatch) result.angle_score = Number.parseInt(scoreMatch[1], 10)
        result.suggestions.angle = line
      }
      if (line.includes('距离')) {
        const scoreMatch = line.match(/(\d+)/)
        if (scoreMatch) result.distance_score = Number.parseInt(scoreMatch[1], 10)
        result.suggestions.distance = line
      }
      if (line.includes('高度') || line.includes('机位')) {
        const scoreMatch = line.match(/(\d+)/)
        if (scoreMatch) result.height_score = Number.parseInt(scoreMatch[1], 10)
        result.suggestions.height = line
      }
    }

    // 设置默认值
    result.total_score = result.total_score || 70
    result.composition_score = result.composition_score || 20
    result.pose_score = result.pose_score || 20
    result.angle_score = result.angle_score || 15
    result.distance_score = result.distance_score || 8
    result.height_score = result.height_score || 7
    result.scene_type = result.scene_type || 'other'

    return result
  } catch (error) {
    console.error('解析AI结果失败:', error)
    return null
  }
}
