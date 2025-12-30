// 图片上传工具函数
import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

export interface UploadFileInput {
  path: string
  size: number
  name?: string
  originalFileObj?: File
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

const BUCKET_NAME = 'app-8l12za1oblz5_photos'
const MAX_FILE_SIZE = 1024 * 1024 // 1MB

/**
 * 生成唯一文件名
 */
function generateFileName(originalPath: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalPath.split('.').pop() || 'jpg'
  return `photo_${timestamp}_${random}.${ext}`
}

/**
 * 压缩图片
 */
export async function compressImage(imagePath: string, quality = 0.8): Promise<string> {
  return new Promise((resolve, _reject) => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
      // H5环境直接返回
      resolve(imagePath)
    } else {
      // 小程序环境压缩
      Taro.compressImage({
        src: imagePath,
        quality: quality * 100,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: (error) => {
          console.warn('图片压缩失败，使用原图:', error)
          resolve(imagePath)
        }
      })
    }
  })
}

/**
 * 上传文件到Supabase Storage
 */
export async function uploadFile(file: UploadFileInput): Promise<UploadResult> {
  try {
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      // 尝试压缩
      const compressedPath = await compressImage(file.path, 0.7)
      file.path = compressedPath
    }

    const fileName = file.name || generateFileName(file.path)
    const fileContent = file.originalFileObj || ({tempFilePath: file.path} as any)

    const {data, error} = await supabase.storage.from(BUCKET_NAME).upload(fileName, fileContent, {
      cacheControl: '3600',
      upsert: false
    })

    if (error) {
      console.error('上传失败:', error)
      return {success: false, error: error.message}
    }

    // 获取公开URL
    const {data: urlData} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('上传出错:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    }
  }
}

/**
 * 获取图片公开URL
 */
export function getPublicUrl(path: string): string {
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const {data} = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

/**
 * 选择图片
 */
export async function chooseImage(count = 1): Promise<UploadFileInput[] | null> {
  try {
    const res = await Taro.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    const uploadFiles: UploadFileInput[] = res.tempFiles.map((file, index) => ({
      path: file.path,
      size: file.size || 0,
      name: `image_${Date.now()}_${index}.jpg`,
      originalFileObj: (file as any).originalFileObj
    }))

    return uploadFiles
  } catch (error) {
    console.error('选择图片失败:', error)
    return null
  }
}
