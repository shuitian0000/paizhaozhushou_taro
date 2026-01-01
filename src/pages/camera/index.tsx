import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createEvaluation} from '@/db/api'
import type {LocalEvaluationResult} from '@/utils/localEvaluation'
import {evaluatePhotoLocally} from '@/utils/localEvaluation'
import {uploadFile} from '@/utils/upload'

export default function CameraPage() {
  const [mode, setMode] = useState<'idle' | 'evaluating' | 'captured'>('idle')
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<LocalEvaluationResult | null>(null)
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<string[]>([])
  const [evaluationCount, setEvaluationCount] = useState(0)
  const evaluationTimerRef = useRef<any>(null)
  const isEvaluatingRef = useRef(false)

  console.log('📱 拍照助手页面')
  console.log('mode:', mode)
  console.log('evaluationCount:', evaluationCount)

  // 页面显示时重置状态
  useDidShow(() => {
    console.log('📱 页面显示')
    // 如果之前在评估中，停止评估
    if (mode === 'evaluating') {
      if (evaluationTimerRef.current) {
        clearInterval(evaluationTimerRef.current)
        evaluationTimerRef.current = null
      }
      setMode('idle')
    }
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

  // 执行一次拍照和评估
  const performEvaluation = useCallback(async () => {
    if (isEvaluatingRef.current) {
      console.log('⏭️ 上一次评估还在进行中，跳过')
      return
    }

    isEvaluatingRef.current = true
    console.log('--- 📸 开始拍照评估 ---')

    try {
      // 调用相机拍照
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const imagePath = res.tempFilePaths[0]
        console.log('✅ 拍照成功:', imagePath)

        // 更新当前图片
        setCurrentImage(imagePath)
        setEvaluationCount((prev) => prev + 1)

        // 本地评估
        const result = await evaluatePhotoLocally(imagePath)
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
      }
    } catch (error: any) {
      console.error('❌ 拍照或评估失败:', error)

      // 如果用户取消拍照，停止评估
      if (error.errMsg?.includes('cancel')) {
        console.log('用户取消拍照，停止评估')
        if (evaluationTimerRef.current) {
          clearInterval(evaluationTimerRef.current)
          evaluationTimerRef.current = null
        }
        setMode('idle')
        setRealtimeSuggestions([])
        setEvaluationCount(0)
      } else {
        setRealtimeSuggestions(['拍照失败，请重试'])
      }
    } finally {
      isEvaluatingRef.current = false
    }
  }, [])

  // 停止实时评估
  const stopEvaluation = useCallback(() => {
    console.log('⏹️ 停止实时评估')
    if (evaluationTimerRef.current) {
      clearInterval(evaluationTimerRef.current)
      evaluationTimerRef.current = null
    }
    setMode('idle')
    setRealtimeSuggestions([])
    setEvaluationCount(0)
  }, [])

  // 开始实时评估
  const startEvaluation = useCallback(async () => {
    console.log('=== 🚀 开始实时评估 ===')
    setMode('evaluating')
    setEvaluationCount(0)
    setRealtimeSuggestions(['准备拍照...'])

    // 立即进行第一次拍照评估
    await performEvaluation()

    // 启动定时器，每2秒拍照一次
    evaluationTimerRef.current = setInterval(async () => {
      if (!isEvaluatingRef.current) {
        await performEvaluation()
      }
    }, 2000)
  }, [performEvaluation])

  // 确认拍摄（保存当前照片）
  const confirmCapture = useCallback(() => {
    console.log('✅ 确认拍摄')
    if (evaluationTimerRef.current) {
      clearInterval(evaluationTimerRef.current)
      evaluationTimerRef.current = null
    }
    setMode('captured')
  }, [])

  // 重新开始
  const restart = useCallback(() => {
    console.log('🔄 重新开始')
    setCurrentImage(null)
    setEvaluation(null)
    setRealtimeSuggestions([])
    setEvaluationCount(0)
    setMode('idle')
  }, [])

  // 保存评估结果
  const saveEvaluation = useCallback(async () => {
    if (!currentImage || !evaluation) {
      Taro.showToast({title: '没有可保存的评估', icon: 'none'})
      return
    }

    try {
      Taro.showLoading({title: '保存中...'})

      // 上传照片
      const uploadResult = await uploadFile({
        path: currentImage,
        size: 0,
        name: `realtime_${Date.now()}.jpg`
      })

      if (!uploadResult.success || !uploadResult.url) {
        Taro.hideLoading()
        Taro.showToast({title: '照片保存失败', icon: 'none'})
        return
      }

      // 保存评估记录
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
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        <View className="px-6 py-8">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white mb-2">拍照助手</Text>
            <Text className="text-sm text-muted-foreground">实时评估拍摄画面，获取专业建议</Text>
          </View>

          {/* 空闲状态 - 显示说明和开始按钮 */}
          {mode === 'idle' && (
            <View>
              {/* 功能说明 */}
              <View className="bg-card rounded-2xl p-6 mb-6 shadow-card">
                <View className="flex flex-row items-center mb-4">
                  <View className="i-mdi-information text-2xl text-primary mr-3" />
                  <Text className="text-lg font-semibold text-foreground">功能说明</Text>
                </View>
                <View className="space-y-3">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-numeric-1-circle text-xl text-primary mr-3 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm text-foreground leading-relaxed">
                        点击"开始实时评估"后，系统会每2秒自动拍照一次
                      </Text>
                    </View>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-numeric-2-circle text-xl text-secondary mr-3 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm text-foreground leading-relaxed">
                        每次拍照后会立即显示评估结果和改进建议
                      </Text>
                    </View>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-numeric-3-circle text-xl text-accent mr-3 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm text-foreground leading-relaxed">
                        根据建议调整拍摄角度、距离等，直到满意为止
                      </Text>
                    </View>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-numeric-4-circle text-xl text-primary mr-3 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm text-foreground leading-relaxed">
                        点击"确认拍摄"保存当前照片，或"停止评估"重新开始
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 开始按钮 */}
              <Button
                className="w-full bg-gradient-primary text-white py-5 rounded-2xl break-keep text-lg font-semibold shadow-elegant"
                size="default"
                onClick={startEvaluation}>
                <View className="flex flex-row items-center justify-center">
                  <View className="i-mdi-camera text-2xl mr-2" />
                  <Text className="text-lg text-white font-semibold">开始实时评估</Text>
                </View>
              </Button>

              {/* 提示信息 */}
              <View className="mt-6 bg-muted/30 rounded-xl p-4">
                <View className="flex flex-row items-start">
                  <View className="i-mdi-lightbulb-on text-lg text-primary mr-2 mt-0.5" />
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground leading-relaxed">
                      提示：每次拍照时会调用系统相机，请允许相机权限。评估使用本地算法，无需上传照片到服务器。
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 评估中状态 - 显示最新照片和建议 */}
          {mode === 'evaluating' && (
            <View>
              {/* 评估计数 */}
              <View className="bg-primary/20 rounded-xl p-4 mb-4">
                <View className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center">
                    <View className="i-mdi-camera-timer text-xl text-primary mr-2" />
                    <Text className="text-sm text-white">实时评估中...</Text>
                  </View>
                  <Text className="text-sm text-white font-semibold">已评估 {evaluationCount} 次</Text>
                </View>
              </View>

              {/* 当前照片 */}
              {currentImage && (
                <View className="mb-4">
                  <Image
                    src={currentImage}
                    mode="aspectFit"
                    className="w-full rounded-2xl bg-card"
                    style={{height: '400px'}}
                  />
                </View>
              )}

              {/* 实时建议 */}
              {realtimeSuggestions.length > 0 && (
                <View className="bg-card rounded-2xl p-5 mb-4 shadow-card">
                  <View className="flex flex-row items-center mb-3">
                    <View className="i-mdi-lightbulb-on text-xl text-primary mr-2" />
                    <Text className="text-base font-semibold text-foreground">实时建议</Text>
                  </View>
                  <View className="space-y-2">
                    {realtimeSuggestions.map((suggestion, index) => (
                      <Text key={index} className="text-sm text-foreground leading-relaxed">
                        • {suggestion}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* 当前评分 */}
              {evaluation && (
                <View className="bg-card rounded-2xl p-5 mb-4 shadow-card">
                  <View className="flex flex-row items-center justify-between mb-4">
                    <Text className="text-base font-semibold text-foreground">当前评分</Text>
                    <View className="flex flex-row items-center">
                      <Text className={`text-3xl font-bold ${getScoreColor(evaluation.total_score)} mr-1`}>
                        {evaluation.total_score}
                      </Text>
                      <Text className="text-sm text-muted-foreground">分</Text>
                    </View>
                  </View>

                  {/* 各项得分 */}
                  <View className="space-y-3">
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-sm text-foreground">构图</Text>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-muted-foreground mr-2">
                          {getShortSuggestion('composition', evaluation.composition_score)}
                        </Text>
                        <Text className="text-sm text-foreground font-medium">{evaluation.composition_score}/30</Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-sm text-foreground">角度</Text>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-muted-foreground mr-2">
                          {getShortSuggestion('angle', evaluation.angle_score)}
                        </Text>
                        <Text className="text-sm text-foreground font-medium">{evaluation.angle_score}/20</Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-sm text-foreground">距离</Text>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-muted-foreground mr-2">
                          {getShortSuggestion('distance', evaluation.distance_score)}
                        </Text>
                        <Text className="text-sm text-foreground font-medium">{evaluation.distance_score}/10</Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-sm text-foreground">光线</Text>
                      <View className="flex flex-row items-center">
                        <Text className="text-xs text-muted-foreground mr-2">
                          {getShortSuggestion('height', evaluation.height_score)}
                        </Text>
                        <Text className="text-sm text-foreground font-medium">{evaluation.height_score}/10</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* 操作按钮 */}
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
            </View>
          )}

          {/* 已拍摄状态 - 显示最终结果 */}
          {mode === 'captured' && currentImage && evaluation && (
            <View>
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

                  {/* 高度 */}
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
                        <Text className="text-sm text-foreground leading-relaxed">
                          • {evaluation.suggestions.angle}
                        </Text>
                      )}
                      {evaluation.suggestions.distance && (
                        <Text className="text-sm text-foreground leading-relaxed">
                          • {evaluation.suggestions.distance}
                        </Text>
                      )}
                      {evaluation.suggestions.height && (
                        <Text className="text-sm text-foreground leading-relaxed">
                          • {evaluation.suggestions.height}
                        </Text>
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
            </View>
          )}

          {/* 底部间距 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
