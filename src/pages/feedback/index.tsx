import {Button, Image, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {createFeedback} from '@/db/api'
import {getCurrentUserId, navigateToLogin} from '@/utils/auth'
import {chooseImage, type UploadFileInput, uploadFile} from '@/utils/upload'

export default function FeedbackPage() {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<UploadFileInput[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useDidShow(() => {
    // 清空表单
    setContent('')
    setImages([])
  })

  // 选择图片
  const handleChooseImage = useCallback(async () => {
    if (images.length >= 3) {
      Taro.showToast({title: '最多上传3张图片', icon: 'none'})
      return
    }

    const selectedImages = await chooseImage(3 - images.length)
    if (selectedImages && selectedImages.length > 0) {
      setImages([...images, ...selectedImages])
    }
  }, [images])

  // 删除图片
  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index)
      setImages(newImages)
    },
    [images]
  )

  // 提交反馈
  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      Taro.showToast({title: '请输入反馈内容', icon: 'none'})
      return
    }

    if (submitting || uploading) {
      return
    }

    try {
      // 检查登录状态
      const userId = await getCurrentUserId()
      if (!userId) {
        Taro.showModal({
          title: '提示',
          content: '需要登录后才能提交反馈，是否前往登录？',
          success: (res) => {
            if (res.confirm) {
              navigateToLogin('/pages/feedback/index')
            }
          }
        })
        return
      }

      setSubmitting(true)
      Taro.showLoading({title: '提交中...'})

      // 上传图片
      const imageUrls: string[] = []
      if (images.length > 0) {
        setUploading(true)
        for (const image of images) {
          const result = await uploadFile(image)
          if (result.success && result.url) {
            imageUrls.push(result.url)
          }
        }
        setUploading(false)
      }

      // 创建反馈记录
      const feedback = await createFeedback({
        content: content.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        user_id: userId
      })

      Taro.hideLoading()
      setSubmitting(false)

      if (feedback) {
        Taro.showToast({title: '提交成功，感谢您的反馈！', icon: 'success', duration: 2000})
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        Taro.showToast({title: '提交失败，请重试', icon: 'none'})
      }
    } catch (error) {
      console.error('提交反馈失败:', error)
      Taro.hideLoading()
      setSubmitting(false)
      setUploading(false)
      Taro.showToast({title: '提交失败，请重试', icon: 'none'})
    }
  }, [content, images, submitting, uploading])

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        <View className="px-6 py-8">
          {/* 标题 */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-white mb-2">建议和吐槽</Text>
            <Text className="text-sm text-muted-foreground">您的反馈对我们非常重要，帮助我们不断改进</Text>
          </View>

          {/* 反馈内容 */}
          <View className="mb-6">
            <Text className="text-sm text-white mb-2">反馈内容 *</Text>
            <View className="bg-card rounded-xl border border-border p-4">
              <Textarea
                className="w-full text-foreground"
                style={{padding: 0, border: 'none', background: 'transparent', minHeight: '150px'}}
                placeholder="请详细描述您的建议或遇到的问题..."
                placeholderClass="text-muted-foreground"
                value={content}
                onInput={(e) => setContent(e.detail.value)}
                maxlength={500}
              />
              <View className="flex flex-row justify-end mt-2">
                <Text className="text-xs text-muted-foreground">{content.length}/500</Text>
              </View>
            </View>
          </View>

          {/* 图片上传 */}
          <View className="mb-8">
            <Text className="text-sm text-white mb-2">上传图片（选填，最多3张）</Text>
            <View className="flex flex-row flex-wrap gap-3">
              {images.map((image, index) => (
                <View key={index} className="relative" style={{width: '100px', height: '100px'}}>
                  <Image src={image.path} className="w-full h-full rounded-xl" mode="aspectFill" />
                  <View
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                    onClick={() => handleRemoveImage(index)}
                    style={{width: '24px', height: '24px'}}>
                    <View className="i-mdi-close text-white text-sm" />
                  </View>
                </View>
              ))}

              {images.length < 3 && (
                <View
                  className="bg-card border-2 border-dashed border-border rounded-xl flex items-center justify-center"
                  style={{width: '100px', height: '100px'}}
                  onClick={handleChooseImage}>
                  <View className="i-mdi-plus text-3xl text-muted-foreground" />
                </View>
              )}
            </View>
          </View>

          {/* 提示信息 */}
          <View className="bg-card rounded-xl p-4 mb-6 border border-border">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-primary text-xl mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">
                  • 我们会认真阅读每一条反馈{'\n'}• 您的个人信息将被严格保密{'\n'}• 如有问题我们会尽快处理并改进
                </Text>
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <Button
            className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
            size="default"
            onClick={handleSubmit}>
            {submitting || uploading ? '提交中...' : '提交反馈'}
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
