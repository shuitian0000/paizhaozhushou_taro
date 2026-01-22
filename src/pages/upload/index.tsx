import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {createEvaluation} from '@/db/api'
import {imageToBase64} from '@/utils/ai'
import {getCurrentUserId} from '@/utils/auth'
import {chooseImage, type UploadFileInput} from '@/utils/upload'

export default function UploadPage() {
  const [selectedImage, setSelectedImage] = useState<UploadFileInput | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // 选择图片
  const handleChooseImage = useCallback(async () => {
    try {
      console.log('📸 点击选择照片')

      // 先检查权限状态
      const {authSetting} = await Taro.getSetting()
      console.log('权限状态:', authSetting)

      // 检查相册权限（注意：scope.album 在新版本中可能不存在）
      if (authSetting['scope.album'] === false) {
        // 权限被明确拒绝
        console.warn('⚠️ 相册权限被拒绝')
        const modalRes = await Taro.showModal({
          title: '需要相册权限',
          content: '选择照片需要访问相册，请在设置中允许访问相册',
          confirmText: '去设置',
          cancelText: '取消'
        })

        if (modalRes.confirm) {
          await Taro.openSetting()
        }
        return
      }

      // 调用 chooseImage
      console.log('调用 chooseImage...')
      const images = await chooseImage(1)
      console.log('选择结果:', images)

      if (images && images.length > 0) {
        setSelectedImage(images[0])
        console.log('✅ 图片已选择')
      } else {
        console.log('ℹ️ 未选择图片')
      }
    } catch (error) {
      console.error('❌ 选择图片失败:', error)
      Taro.showToast({title: '选择图片失败', icon: 'none'})
    }
  }, [])

  // 开始分析
  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) {
      Taro.showToast({title: '请先选择照片', icon: 'none'})
      return
    }

    if (analyzing || uploading) {
      return
    }

    try {
      setAnalyzing(true)
      Taro.showLoading({title: '分析中...'})

      // 转换为Base64
      const base64Image = await imageToBase64(selectedImage.path)

      // 调用Edge Function分析（照片仅用于分析，不保存）
      const {data, error} = await supabase.functions.invoke('analyze-photo', {
        body: JSON.stringify({
          imageBase64: base64Image,
          evaluationType: 'upload'
        }),
        headers: {'Content-Type': 'application/json'}
      })

      if (error) {
        const errorMsg = await error?.context?.text()
        console.error('分析失败:', errorMsg || error?.message)
        Taro.hideLoading()
        Taro.showToast({title: '分析失败，请重试', icon: 'none'})
        setAnalyzing(false)
        return
      }

      // 获取当前用户ID（如果已登录）
      const userId = await getCurrentUserId()

      // 如果已登录，保存评估记录
      if (userId) {
        Taro.showLoading({title: '保存中...'})

        const evaluation = await createEvaluation({
          // photo_url不传，保护用户隐私
          evaluation_type: 'upload',
          total_score: data.total_score || 70,
          composition_score: data.composition_score,
          pose_score: data.pose_score,
          angle_score: data.angle_score,
          distance_score: data.distance_score,
          height_score: data.height_score,
          suggestions: data.suggestions,
          scene_type: data.scene_type,
          user_id: userId // 关联用户ID
        })

        Taro.hideLoading()
        setAnalyzing(false)

        if (evaluation) {
          // 跳转到结果页面
          Taro.navigateTo({
            url: `/pages/result/index?id=${evaluation.id}`
          })
        } else {
          Taro.showToast({title: '保存失败', icon: 'none'})
        }
      } else {
        // 未登录用户：直接显示分析结果，不保存记录
        Taro.hideLoading()
        setAnalyzing(false)

        // 将分析结果存储到本地，用于结果页面显示
        Taro.setStorageSync('tempEvaluationResult', {
          total_score: data.total_score || 70,
          composition_score: data.composition_score,
          pose_score: data.pose_score,
          angle_score: data.angle_score,
          distance_score: data.distance_score,
          height_score: data.height_score,
          suggestions: data.suggestions,
          scene_type: data.scene_type,
          evaluation_type: 'upload',
          created_at: new Date().toISOString()
        })

        // 跳转到结果页面（临时结果模式）
        Taro.navigateTo({
          url: '/pages/result/index?temp=1'
        })
      }
    } catch (error) {
      console.error('分析失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '分析失败，请重试', icon: 'none'})
      setAnalyzing(false)
      setUploading(false)
    }
  }, [selectedImage, analyzing, uploading])

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        <View className="px-6 py-8">
          {/* 标题 */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-white mb-2">照片评估</Text>
            <Text className="text-sm text-muted-foreground">上传照片，获取专业的摄影评估报告</Text>
          </View>

          {/* 图片预览区域 */}
          <View className="mb-6">
            {selectedImage ? (
              <View className="relative">
                <Image
                  src={selectedImage.path}
                  mode="aspectFit"
                  className="w-full rounded-2xl bg-card"
                  style={{height: '400px'}}
                />
                <View
                  className="absolute top-4 right-4 bg-black/60 rounded-full p-2"
                  onClick={() => setSelectedImage(null)}>
                  <View className="i-mdi-close text-xl text-white" />
                </View>
              </View>
            ) : (
              <View
                className="w-full bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center"
                style={{height: '400px'}}
                onClick={handleChooseImage}>
                <View className="i-mdi-image-plus text-6xl text-muted-foreground mb-4" />
                <Text className="text-base text-foreground mb-2">点击选择照片</Text>
                <Text className="text-sm text-muted-foreground">支持JPG、PNG格式</Text>
              </View>
            )}
          </View>

          {/* 操作按钮 */}
          <View className="space-y-3">
            {selectedImage ? (
              <>
                <Button
                  className="w-full bg-gradient-primary text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={analyzing || uploading ? undefined : handleAnalyze}>
                  {analyzing || uploading ? '分析中...' : '开始分析'}
                </Button>
                <Button
                  className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                  size="default"
                  onClick={handleChooseImage}>
                  重新选择
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="w-full bg-gradient-primary text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleChooseImage}>
                  选择照片
                </Button>
                <Button
                  className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                  size="default"
                  onClick={() => Taro.navigateBack()}>
                  返回
                </Button>
              </>
            )}
          </View>

          {/* 功能说明 */}
          <View className="mt-8 bg-card rounded-2xl p-6">
            <Text className="text-lg font-semibold text-foreground mb-4">评估内容</Text>
            <View className="space-y-3">
              <View className="flex flex-row items-start">
                <View className="i-mdi-check-circle text-lg text-primary mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground">构图分析：基于专业构图理论评估</Text>
                </View>
              </View>
              <View className="flex flex-row items-start">
                <View className="i-mdi-check-circle text-lg text-primary mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground">人物姿态：评估姿态自然度和表情</Text>
                </View>
              </View>
              <View className="flex flex-row items-start">
                <View className="i-mdi-check-circle text-lg text-primary mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground">拍摄技巧：角度、距离、高度评估</Text>
                </View>
              </View>
              <View className="flex flex-row items-start">
                <View className="i-mdi-check-circle text-lg text-primary mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground">改进建议：提供具体可操作的建议</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
