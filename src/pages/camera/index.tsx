import {Button, Camera, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createEvaluation} from '@/db/api'
import type {LocalEvaluationResult} from '@/utils/localEvaluation'
import {evaluatePhotoLocally} from '@/utils/localEvaluation'
import {uploadFile} from '@/utils/upload'

export default function CameraPage() {
  const [mode, setMode] = useState<'preview' | 'captured'>('preview')
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<LocalEvaluationResult | null>(null)
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<string[]>([])
  const [evaluationCount, setEvaluationCount] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const cameraCtxRef = useRef<any>(null)
  const evaluationTimerRef = useRef<any>(null)
  const isProcessingRef = useRef(false)
  const retryCountRef = useRef(0)

  console.log('📱 拍照助手页面')
  console.log('mode:', mode)
  console.log('isEvaluating:', isEvaluating)
  console.log('evaluationCount:', evaluationCount)

  // 页面显示时初始化相机
  useDidShow(() => {
    console.log('📱 页面显示，初始化相机')

    // 延迟1秒后初始化CameraContext
    setTimeout(() => {
      initCamera()
    }, 1000)
  })

  // 清理定时器
  useEffect(() => {
    return () => {
      console.log('🧹 组件卸载，清理定时器')
      if (evaluationTimerRef.current) {
        clearInterval(evaluationTimerRef.current)
      }
    }
  }, [])

  // 初始化相机
  const initCamera = useCallback(() => {
    console.log('=== 🎥 初始化相机 ===')

    try {
      // 直接创建CameraContext，不等待onReady
      const ctx = Taro.createCameraContext()
      console.log('CameraContext创建结果:', ctx)

      if (ctx) {
        cameraCtxRef.current = ctx
        console.log('✅ CameraContext已创建')
        Taro.showToast({title: '相机已就绪', icon: 'success', duration: 1500})
      } else {
        console.error('❌ CameraContext创建失败')
        Taro.showToast({title: '相机初始化失败', icon: 'none'})
      }
    } catch (error) {
      console.error('❌ 初始化相机异常:', error)
      Taro.showToast({title: '相机初始化异常', icon: 'none'})
    }
  }, [])

  // 执行一次拍照和评估
  const performEvaluation = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log('⏭️ 上一次评估还在进行中，跳过')
      return
    }

    if (!cameraCtxRef.current) {
      console.error('❌ CameraContext不存在')
      setRealtimeSuggestions(['相机未就绪'])
      return
    }

    isProcessingRef.current = true
    console.log('--- 📸 开始拍照评估 ---')

    try {
      // 使用CameraContext拍照
      cameraCtxRef.current.takePhoto({
        quality: 'low',
        success: async (res: any) => {
          console.log('✅ 拍照成功:', res.tempImagePath)
          retryCountRef.current = 0 // 重置重试计数

          try {
            // 更新当前图片
            setCurrentImage(res.tempImagePath)
            setEvaluationCount((prev) => prev + 1)

            // 本地评估
            const result = await evaluatePhotoLocally(res.tempImagePath)
            console.log('✅ 评估完成 - 总分:', result.total_score)

            // 生成实时建议
            const suggestions: string[] = []

            if (result.composition_score < 20) {
              suggestions.push('构图：需优化主体位置')
            } else if (result.composition_score < 25) {
              suggestions.push('构图：可调整主体')
            }

            if (result.angle_score < 12) {
              suggestions.push('角度：建议换个视角')
            } else if (result.angle_score < 16) {
              suggestions.push('角度：可尝试其他角度')
            }

            if (result.distance_score < 6) {
              suggestions.push('距离：需调整拍摄距离')
            }

            if (result.height_score < 6) {
              suggestions.push('光线：光线不足')
            } else if (result.height_score < 8) {
              suggestions.push('光线：曝光欠佳')
            }

            if (suggestions.length === 0) {
              suggestions.push('画面良好，可以拍摄')
            }

            console.log('💡 实时建议:', suggestions)
            setRealtimeSuggestions(suggestions)
            setEvaluation(result)
          } catch (error) {
            console.error('❌ 评估失败:', error)
            setRealtimeSuggestions(['评估失败，继续监控...'])
          }
        },
        fail: (err: any) => {
          console.error('❌ 拍照失败:', err)
          retryCountRef.current++

          if (retryCountRef.current >= 3) {
            console.error('❌ 拍照失败次数过多，停止评估')
            setRealtimeSuggestions(['拍照失败次数过多，请重新开始'])
            // stopEvaluation() - 改为直接停止
            if (evaluationTimerRef.current) {
              clearInterval(evaluationTimerRef.current)
              evaluationTimerRef.current = null
            }
            setIsEvaluating(false)
          } else {
            setRealtimeSuggestions([`拍照失败，正在重试(${retryCountRef.current}/3)...`])
          }
        }
      })
    } catch (error) {
      console.error('❌ 拍照异常:', error)
      setRealtimeSuggestions(['拍照异常，继续监控...'])
    } finally {
      isProcessingRef.current = false
    }
  }, [])

  // 停止实时评估
  const stopEvaluation = useCallback(() => {
    console.log('⏹️ 停止实时评估')
    if (evaluationTimerRef.current) {
      clearInterval(evaluationTimerRef.current)
      evaluationTimerRef.current = null
    }
    setIsEvaluating(false)
    setRealtimeSuggestions([])
  }, [])

  // 开始实时评估
  const startEvaluation = useCallback(() => {
    console.log('=== 🚀 开始实时评估 ===')

    if (!cameraCtxRef.current) {
      console.error('❌ CameraContext未创建')
      Taro.showToast({title: '相机未就绪，请稍候重试', icon: 'none'})

      // 尝试重新初始化
      initCamera()
      return
    }

    setIsEvaluating(true)
    setEvaluationCount(0)
    setRealtimeSuggestions(['开始实时评估...'])
    retryCountRef.current = 0

    // 立即进行第一次拍照评估
    performEvaluation()

    // 启动定时器，每2秒拍照一次
    evaluationTimerRef.current = setInterval(() => {
      if (!isProcessingRef.current) {
        performEvaluation()
      }
    }, 2000)
  }, [initCamera, performEvaluation])

  // 确认拍摄（保存当前照片）
  const confirmCapture = useCallback(() => {
    console.log('✅ 确认拍摄')
    if (evaluationTimerRef.current) {
      clearInterval(evaluationTimerRef.current)
      evaluationTimerRef.current = null
    }
    setIsEvaluating(false)
    setMode('captured')
  }, [])

  // 重新开始
  const restart = useCallback(() => {
    console.log('🔄 重新开始')
    setCurrentImage(null)
    setEvaluation(null)
    setRealtimeSuggestions([])
    setEvaluationCount(0)
    setIsEvaluating(false)
    setMode('preview')

    // 重新初始化相机
    setTimeout(() => {
      initCamera()
    }, 500)
  }, [initCamera])

  // 直接拍摄（不启动实时评估）
  const directCapture = useCallback(async () => {
    console.log('=== 📸 直接拍摄 ===')

    if (!cameraCtxRef.current) {
      console.error('❌ CameraContext未创建')
      Taro.showToast({title: '相机未就绪，请稍候重试', icon: 'none'})
      initCamera()
      return
    }

    Taro.showLoading({title: '拍摄中...'})

    try {
      cameraCtxRef.current.takePhoto({
        quality: 'high',
        success: async (res: any) => {
          console.log('✅ 直接拍摄成功:', res.tempImagePath)

          try {
            // 更新当前图片
            setCurrentImage(res.tempImagePath)

            // 本地评估
            const result = await evaluatePhotoLocally(res.tempImagePath)
            console.log('✅ 评估完成 - 总分:', result.total_score)

            setEvaluation(result)
            setMode('captured')

            Taro.hideLoading()
            Taro.showToast({title: '拍摄成功', icon: 'success', duration: 1500})
          } catch (error) {
            console.error('❌ 评估失败:', error)
            Taro.hideLoading()
            Taro.showToast({title: '评估失败', icon: 'none'})
          }
        },
        fail: (err: any) => {
          console.error('❌ 拍摄失败:', err)
          Taro.hideLoading()
          Taro.showToast({title: '拍摄失败，请重试', icon: 'none'})
        }
      })
    } catch (error) {
      console.error('❌ 拍摄异常:', error)
      Taro.hideLoading()
      Taro.showToast({title: '拍摄异常', icon: 'none'})
    }
  }, [initCamera])

  // 保存评估结果
  const saveEvaluation = useCallback(async () => {
    if (!currentImage || !evaluation) {
      Taro.showToast({title: '没有可保存的评估', icon: 'none'})
      return
    }

    try {
      Taro.showLoading({title: '保存中...'})

      // 1. 先保存到手机相册
      try {
        await Taro.saveImageToPhotosAlbum({
          filePath: currentImage
        })
        console.log('✅ 已保存到相册')
      } catch (error: any) {
        console.error('❌ 保存到相册失败:', error)
        // 如果是权限问题，提示用户
        if (error.errMsg?.includes('auth')) {
          Taro.hideLoading()
          Taro.showModal({
            title: '需要相册权限',
            content: '保存照片需要访问您的相册，请在设置中开启权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                Taro.openSetting()
              }
            }
          })
          return
        }
      }

      // 2. 上传照片到云端
      const uploadResult = await uploadFile({
        path: currentImage,
        size: 0,
        name: `realtime_${Date.now()}.jpg`
      })

      if (!uploadResult.success || !uploadResult.url) {
        Taro.hideLoading()
        Taro.showToast({title: '照片上传失败', icon: 'none'})
        return
      }

      // 3. 保存评估记录
      const record = await createEvaluation({
        photo_url: uploadResult.url,
        evaluation_type: 'realtime',
        total_score: evaluation.total_score,
        composition_score: evaluation.composition_score,
        pose_score: evaluation.pose_score ?? undefined,
        angle_score: evaluation.angle_score,
        distance_score: evaluation.distance_score,
        height_score: evaluation.height_score,
        suggestions: evaluation.suggestions,
        scene_type: evaluation.scene_type as 'portrait' | 'landscape' | 'group' | 'other' | undefined
      })

      Taro.hideLoading()

      if (record) {
        Taro.showToast({title: '保存成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateTo({
            url: `/pages/result/index?id=${record.id}`
          })
        }, 1500)
      } else {
        Taro.showToast({title: '保存失败', icon: 'none'})
      }
    } catch (error) {
      console.error('保存失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '保存失败，请重试', icon: 'none'})
    }
  }, [currentImage, evaluation])

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-primary'
    return 'text-orange-500'
  }

  // 生成简略建议
  const getShortSuggestion = (dimension: string, score: number): string => {
    switch (dimension) {
      case 'composition':
        if (score < 20) return '构图需优化'
        if (score < 25) return '可调整主体'
        return '构图良好'
      case 'angle':
        if (score < 12) return '角度欠佳'
        if (score < 16) return '可换视角'
        return '角度合适'
      case 'distance':
        if (score < 6) return '距离不当'
        if (score < 8) return '可调距离'
        return '距离适中'
      case 'height':
        if (score < 6) return '光线不足'
        if (score < 8) return '曝光欠佳'
        return '光线良好'
      default:
        return ''
    }
  }

  return (
    <View className="min-h-screen bg-gradient-dark">
      {/* 预览模式 */}
      {mode === 'preview' && (
        <View className="relative" style={{height: '100vh'}}>
          {/* Camera组件 */}
          <Camera className="w-full h-full" devicePosition="back" flash="off" style={{width: '100%', height: '100%'}} />

          {/* 顶部信息栏 */}
          <View className="absolute top-4 left-4 right-4">
            {!isEvaluating && (
              <View className="bg-black/70 rounded-xl p-4">
                <Text className="text-sm text-white text-center leading-relaxed">
                  点击"开始实时评估"后，系统会每2秒自动采集镜头画面并提供建议
                </Text>
              </View>
            )}

            {isEvaluating && (
              <View>
                {/* 评估计数 */}
                <View className="bg-primary/90 rounded-xl p-3 mb-3">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center">
                      <View className="i-mdi-camera-timer text-lg text-white mr-2" />
                      <Text className="text-sm text-white font-semibold">实时评估中...</Text>
                    </View>
                    <Text className="text-sm text-white font-semibold">已评估 {evaluationCount} 次</Text>
                  </View>
                </View>

                {/* 实时建议 */}
                {realtimeSuggestions.length > 0 && (
                  <View className="bg-black/80 rounded-2xl p-5 border-2 border-primary/50">
                    <View className="flex flex-row items-center mb-3">
                      <View className="i-mdi-lightbulb-on text-2xl text-primary mr-2" />
                      <Text className="text-base font-bold text-white">实时建议</Text>
                    </View>
                    <View className="space-y-2">
                      {realtimeSuggestions.map((suggestion, index) => (
                        <View key={index} className="flex flex-row items-start">
                          <View className="i-mdi-chevron-right text-lg text-primary mr-1 mt-0.5" />
                          <Text className="text-base text-white font-medium leading-relaxed flex-1">{suggestion}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 当前评分 */}
                {evaluation && (
                  <View className="bg-black/70 rounded-xl p-4 mt-3">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-semibold text-white">当前评分</Text>
                      <View className="flex flex-row items-center">
                        <Text className="text-2xl font-bold text-primary mr-1">{evaluation.total_score}</Text>
                        <Text className="text-xs text-white">分</Text>
                      </View>
                    </View>
                    <View className="space-y-2">
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white">构图</Text>
                        <Text className="text-xs text-white">{evaluation.composition_score}/30</Text>
                      </View>
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white">角度</Text>
                        <Text className="text-xs text-white">{evaluation.angle_score}/20</Text>
                      </View>
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white">距离</Text>
                        <Text className="text-xs text-white">{evaluation.distance_score}/10</Text>
                      </View>
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white">光线</Text>
                        <Text className="text-xs text-white">{evaluation.height_score}/10</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 底部操作按钮 */}
          <View className="absolute bottom-8 left-0 right-0 px-6">
            {!isEvaluating ? (
              <View className="space-y-3">
                <Button
                  className="w-full bg-gradient-primary text-white py-4 rounded-xl break-keep text-base shadow-elegant"
                  size="default"
                  onClick={startEvaluation}>
                  开始实时评估
                </Button>
                <Button
                  className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                  size="default"
                  onClick={directCapture}>
                  直接拍摄
                </Button>
              </View>
            ) : (
              <View className="space-y-3">
                <Button
                  className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={confirmCapture}>
                  确认拍摄
                </Button>
                <Button
                  className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                  size="default"
                  onClick={stopEvaluation}>
                  停止评估
                </Button>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 已拍摄模式 */}
      {mode === 'captured' && currentImage && evaluation && (
        <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
          <View className="px-6 py-8">
            {/* 标题 */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-white mb-2">拍照助手</Text>
              <Text className="text-sm text-muted-foreground">评估结果</Text>
            </View>

            {/* 图片预览 */}
            <View className="mb-6">
              <Image
                src={currentImage}
                mode="aspectFit"
                className="w-full rounded-2xl bg-card"
                style={{height: '400px'}}
              />
            </View>

            {/* 评估结果 */}
            <View className="bg-card rounded-2xl p-6 mb-6 shadow-card">
              {/* 总分 */}
              <View className="flex flex-col items-center mb-6 pb-6 border-b border-border">
                <Text className="text-sm text-muted-foreground mb-2">综合评分</Text>
                <View className="flex flex-row items-center">
                  <Text className={`text-5xl font-bold ${getScoreColor(evaluation.total_score)} mr-2`}>
                    {evaluation.total_score}
                  </Text>
                  <Text className="text-lg text-muted-foreground">分</Text>
                </View>
              </View>

              {/* 各项得分（带进度条） */}
              <View className="space-y-4 mb-6">
                {/* 构图 */}
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-foreground">构图</Text>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('composition', evaluation.composition_score)}
                      </Text>
                      <Text className="text-sm text-foreground font-medium">{evaluation.composition_score}/30</Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(evaluation.composition_score / 30) * 100}%`
                      }}
                    />
                  </View>
                </View>

                {/* 角度 */}
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-foreground">角度</Text>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('angle', evaluation.angle_score)}
                      </Text>
                      <Text className="text-sm text-foreground font-medium">{evaluation.angle_score}/20</Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-secondary rounded-full"
                      style={{
                        width: `${(evaluation.angle_score / 20) * 100}%`
                      }}
                    />
                  </View>
                </View>

                {/* 距离 */}
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-foreground">距离</Text>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('distance', evaluation.distance_score)}
                      </Text>
                      <Text className="text-sm text-foreground font-medium">{evaluation.distance_score}/10</Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-accent rounded-full"
                      style={{
                        width: `${(evaluation.distance_score / 10) * 100}%`
                      }}
                    />
                  </View>
                </View>

                {/* 光线 */}
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-foreground">光线</Text>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('height', evaluation.height_score)}
                      </Text>
                      <Text className="text-sm text-foreground font-medium">{evaluation.height_score}/10</Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(evaluation.height_score / 10) * 100}%`
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* 详细改进建议 */}
              {Object.keys(evaluation.suggestions).length > 0 && (
                <View className="bg-muted/50 rounded-xl p-4">
                  <View className="flex flex-row items-center mb-3">
                    <View className="i-mdi-lightbulb-on text-xl text-primary mr-2" />
                    <Text className="text-sm font-semibold text-foreground">详细建议</Text>
                  </View>
                  <View className="space-y-2">
                    {evaluation.suggestions.composition && (
                      <Text className="text-sm text-foreground leading-relaxed">
                        • {evaluation.suggestions.composition}
                      </Text>
                    )}
                    {evaluation.suggestions.angle && (
                      <Text className="text-sm text-foreground leading-relaxed">• {evaluation.suggestions.angle}</Text>
                    )}
                    {evaluation.suggestions.distance && (
                      <Text className="text-sm text-foreground leading-relaxed">
                        • {evaluation.suggestions.distance}
                      </Text>
                    )}
                    {evaluation.suggestions.height && (
                      <Text className="text-sm text-foreground leading-relaxed">• {evaluation.suggestions.height}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* 操作按钮 */}
            <View className="space-y-3">
              <Button
                className="w-full bg-secondary text-white py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={saveEvaluation}>
                保存评估结果
              </Button>
              <Button
                className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                size="default"
                onClick={restart}>
                重新拍摄
              </Button>
              <Button
                className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                size="default"
                onClick={() => Taro.navigateBack()}>
                返回
              </Button>
            </View>

            {/* 底部间距 */}
            <View className="h-20" />
          </View>
        </ScrollView>
      )}
    </View>
  )
}
