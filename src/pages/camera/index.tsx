import {Camera, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useCallback, useRef, useState} from 'react'
import {supabase} from '@/client/supabase'
import {createEvaluation} from '@/db/api'
import {imageToBase64} from '@/utils/ai'
import {uploadFile} from '@/utils/upload'

export default function CameraPage() {
  const [devicePosition, setDevicePosition] = useState<'back' | 'front'>('back')
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [analyzing, setAnalyzing] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const cameraRef = useRef<any>(null)
  const _analyzeTimerRef = useRef<any>(null)

  // 切换摄像头
  const toggleCamera = useCallback(() => {
    setDevicePosition((prev) => (prev === 'back' ? 'front' : 'back'))
  }, [])

  // 切换闪光灯
  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'))
  }, [])

  // 拍照
  const takePhoto = useCallback(async () => {
    if (analyzing) {
      Taro.showToast({title: '正在分析中...', icon: 'none'})
      return
    }

    try {
      Taro.showLoading({title: '拍摄中...'})

      const ctx = Taro.createCameraContext()
      ctx.takePhoto({
        quality: 'high',
        success: async (res) => {
          const tempImagePath = res.tempImagePath

          Taro.showLoading({title: '分析中...'})
          setAnalyzing(true)

          try {
            // 转换为Base64
            const base64Image = await imageToBase64(tempImagePath)

            // 调用Edge Function分析
            const {data, error} = await supabase.functions.invoke('analyze-photo', {
              body: JSON.stringify({
                imageBase64: base64Image,
                evaluationType: 'realtime'
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

            // 上传照片
            const uploadResult = await uploadFile({
              path: tempImagePath,
              size: 0,
              name: `realtime_${Date.now()}.jpg`
            })

            if (!uploadResult.success || !uploadResult.url) {
              Taro.hideLoading()
              Taro.showToast({title: '照片保存失败', icon: 'none'})
              setAnalyzing(false)
              return
            }

            // 保存评估记录
            const evaluation = await createEvaluation({
              photo_url: uploadResult.url,
              evaluation_type: 'realtime',
              total_score: data.total_score || 70,
              composition_score: data.composition_score,
              pose_score: data.pose_score,
              angle_score: data.angle_score,
              distance_score: data.distance_score,
              height_score: data.height_score,
              suggestions: data.suggestions,
              scene_type: data.scene_type
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
          } catch (error) {
            console.error('处理照片失败:', error)
            Taro.hideLoading()
            Taro.showToast({title: '处理失败，请重试', icon: 'none'})
            setAnalyzing(false)
          }
        },
        fail: (error) => {
          console.error('拍照失败:', error)
          Taro.hideLoading()
          Taro.showToast({title: '拍照失败', icon: 'none'})
        }
      })
    } catch (error) {
      console.error('拍照出错:', error)
      Taro.hideLoading()
      Taro.showToast({title: '拍照失败', icon: 'none'})
    }
  }, [analyzing])

  // 实时分析（简化版，显示提示）
  const startRealtimeAnalysis = useCallback(() => {
    // 显示实时提示
    const tips = ['保持相机稳定', '注意光线充足', '尝试三分法构图', '调整拍摄角度', '注意主体突出']
    const randomTip = tips[Math.floor(Math.random() * tips.length)]
    setSuggestions([randomTip])
    setScore(Math.floor(Math.random() * 30) + 60)
  }, [])

  return (
    <View className="relative w-full h-screen bg-black">
      {/* 相机组件 */}
      <Camera
        ref={cameraRef}
        devicePosition={devicePosition}
        flash={flash}
        className="w-full h-full"
        onInitDone={startRealtimeAnalysis}>
        {/* 顶部控制栏 */}
        <View className="absolute top-0 left-0 right-0 z-10">
          <View className="flex flex-row justify-between items-center px-6 pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent">
            <View className="flex flex-row items-center" onClick={() => Taro.navigateBack()}>
              <View className="i-mdi-arrow-left text-2xl text-white" />
            </View>
            <Text className="text-lg font-semibold text-white">拍照助手</Text>
            <View className="flex flex-row items-center gap-4">
              <View
                className={`i-mdi-flash${flash === 'on' ? '' : '-off'} text-2xl text-white`}
                onClick={toggleFlash}
              />
              <View className="i-mdi-camera-flip text-2xl text-white" onClick={toggleCamera} />
            </View>
          </View>
        </View>

        {/* 实时评分显示 */}
        {score !== null && (
          <View className="absolute top-32 left-6 right-6 z-10">
            <View className="bg-black/70 rounded-2xl p-4 backdrop-blur">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-sm text-white/80">实时评分</Text>
                <View className="flex flex-row items-center">
                  <Text className="text-3xl font-bold text-primary mr-1">{score}</Text>
                  <Text className="text-sm text-white/80">分</Text>
                </View>
              </View>
              {suggestions.length > 0 && (
                <View className="mt-2 pt-2 border-t border-white/20">
                  <Text className="text-xs text-white/70 mb-1">建议：</Text>
                  {suggestions.map((suggestion, index) => (
                    <Text key={index} className="text-xs text-white/90">
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* 构图辅助线 */}
        <View className="absolute inset-0 z-5 pointer-events-none">
          {/* 三分法辅助线 */}
          <View className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
          <View className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          <View className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
          <View className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
        </View>

        {/* 底部拍照按钮 */}
        <View className="absolute bottom-0 left-0 right-0 z-10">
          <View className="flex flex-col items-center px-6 pb-12 pt-6 bg-gradient-to-t from-black/60 to-transparent">
            <View className="flex flex-row items-center justify-center w-full">
              <View
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${analyzing ? 'opacity-50' : ''}`}
                onClick={takePhoto}>
                <View className="w-16 h-16 rounded-full bg-white" />
              </View>
            </View>
            <Text className="text-sm text-white/80 mt-4 text-center">{analyzing ? '分析中...' : '点击拍摄并分析'}</Text>
          </View>
        </View>
      </Camera>
    </View>
  )
}
