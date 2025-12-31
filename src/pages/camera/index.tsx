import {Camera, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useCallback, useEffect, useRef, useState} from 'react'
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
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0)
  const cameraCtxRef = useRef<any>(null)
  const analyzeTimerRef = useRef<any>(null)

  // 实时分析相机画面
  const analyzeCurrentFrame = useCallback(async () => {
    if (analyzing) return

    const now = Date.now()
    // 限制分析频率，至少间隔5秒
    if (now - lastAnalysisTime < 5000) return

    setAnalyzing(true)
    setLastAnalysisTime(now)

    try {
      const ctx = cameraCtxRef.current
      if (!ctx) {
        setAnalyzing(false)
        return
      }

      // 拍摄当前画面（不保存，仅用于分析）
      ctx.takePhoto({
        quality: 'normal',
        success: async (res) => {
          try {
            // 转换为Base64
            const base64Image = await imageToBase64(res.tempImagePath)

            // 调用Edge Function分析
            const {data, error} = await supabase.functions.invoke('analyze-photo', {
              body: JSON.stringify({
                imageBase64: base64Image,
                evaluationType: 'realtime'
              }),
              headers: {'Content-Type': 'application/json'}
            })

            if (error) {
              console.error('实时分析失败:', error)
              setAnalyzing(false)
              return
            }

            // 更新实时评分和建议
            setScore(data.total_score || 70)

            const suggestionList: string[] = []
            if (data.suggestions?.composition) {
              suggestionList.push(data.suggestions.composition)
            }
            if (data.suggestions?.angle) {
              suggestionList.push(data.suggestions.angle)
            }
            if (data.suggestions?.pose && data.suggestions.pose !== '无人物') {
              suggestionList.push(data.suggestions.pose)
            }

            setSuggestions(suggestionList.slice(0, 3))
            setAnalyzing(false)
          } catch (error) {
            console.error('分析处理失败:', error)
            setAnalyzing(false)
          }
        },
        fail: (error) => {
          console.error('截取画面失败:', error)
          setAnalyzing(false)
        }
      })
    } catch (error) {
      console.error('实时分析出错:', error)
      setAnalyzing(false)
    }
  }, [analyzing, lastAnalysisTime])

  // 启动实时分析
  const startRealtimeAnalysis = useCallback(() => {
    // 每8秒自动分析一次
    analyzeTimerRef.current = setInterval(() => {
      analyzeCurrentFrame()
    }, 8000)

    // 首次立即分析
    setTimeout(() => {
      analyzeCurrentFrame()
    }, 2000)
  }, [analyzeCurrentFrame])

  // 初始化相机上下文
  useEffect(() => {
    cameraCtxRef.current = Taro.createCameraContext()

    // 启动定时分析
    startRealtimeAnalysis()

    return () => {
      if (analyzeTimerRef.current) {
        clearInterval(analyzeTimerRef.current)
      }
    }
  }, [startRealtimeAnalysis])

  // 切换摄像头
  const toggleCamera = useCallback(() => {
    setDevicePosition((prev) => (prev === 'back' ? 'front' : 'back'))
  }, [])

  // 切换闪光灯
  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'))
  }, [])

  // 拍照并保存评估
  const takePhotoAndSave = useCallback(async () => {
    try {
      Taro.showLoading({title: '拍摄中...'})

      const ctx = cameraCtxRef.current
      if (!ctx) {
        Taro.hideLoading()
        Taro.showToast({title: '相机未就绪', icon: 'none'})
        return
      }

      ctx.takePhoto({
        quality: 'high',
        success: async (res) => {
          const tempImagePath = res.tempImagePath

          Taro.showLoading({title: '分析中...'})

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
  }, [])

  return (
    <View className="relative w-full h-screen bg-black">
      {/* 相机组件 */}
      <Camera devicePosition={devicePosition} flash={flash} className="w-full h-full">
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
                <Text className="text-sm text-white/80">{analyzing ? '分析中...' : '实时评分'}</Text>
                <View className="flex flex-row items-center">
                  <Text className="text-3xl font-bold text-primary mr-1">{score}</Text>
                  <Text className="text-sm text-white/80">分</Text>
                </View>
              </View>
              {suggestions.length > 0 && (
                <View className="mt-2 pt-2 border-t border-white/20">
                  <Text className="text-xs text-white/70 mb-1">建议：</Text>
                  {suggestions.map((suggestion, index) => (
                    <Text key={index} className="text-xs text-white/90 mb-1">
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
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
                onClick={takePhotoAndSave}>
                <View className="w-16 h-16 rounded-full bg-white" />
              </View>
            </View>
            <Text className="text-sm text-white/80 mt-4 text-center">点击拍摄并保存评估</Text>
            <Text className="text-xs text-white/60 mt-1 text-center">实时评分每8秒自动更新</Text>
          </View>
        </View>
      </Camera>
    </View>
  )
}
