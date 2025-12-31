import {Button, Camera, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {getEnv} from '@tarojs/taro'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createEvaluation} from '@/db/api'
import type {LocalEvaluationResult} from '@/utils/localEvaluation'
import {evaluatePhotoLocally} from '@/utils/localEvaluation'
import {uploadFile} from '@/utils/upload'

export default function CameraPage() {
  const [mode, setMode] = useState<'realtime' | 'capture'>('realtime') // realtime: 实时评估, capture: 拍照评估
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [_analyzing, setAnalyzing] = useState(false)
  const [evaluation, setEvaluation] = useState<LocalEvaluationResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<string[]>([])
  const [cameraReady, setCameraReady] = useState(false)
  const analyzeTimerRef = useRef<any>(null)
  const realtimeTimerRef = useRef<any>(null)
  const cameraCtxRef = useRef<any>(null)
  const isWeApp = getEnv() === 'WEAPP'

  console.log('Camera页面渲染，环境:', getEnv(), 'isWeApp:', isWeApp, 'mode:', mode)

  // 清理定时器
  useEffect(() => {
    return () => {
      console.log('组件卸载，清理定时器')
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current)
      }
      if (realtimeTimerRef.current) {
        clearInterval(realtimeTimerRef.current)
      }
    }
  }, [])

  // Camera组件准备完成 - 移除所有依赖，避免闭包问题
  const handleCameraReady = useCallback(() => {
    console.log('=== Camera组件onReady回调被触发 ===')
    console.log('当前环境 getEnv():', getEnv())
    console.log('isWeApp:', isWeApp)

    if (!isWeApp) {
      console.error('❌ 非小程序环境，Camera组件不可用')
      Taro.showToast({title: '请在微信小程序中使用', icon: 'none', duration: 2000})
      return
    }

    try {
      console.log('开始创建CameraContext...')
      const ctx = Taro.createCameraContext()
      console.log('CameraContext创建结果:', ctx)
      console.log('CameraContext类型:', typeof ctx)

      if (!ctx) {
        console.error('❌ CameraContext创建失败，返回null或undefined')
        Taro.showToast({title: '相机初始化失败', icon: 'none'})
        return
      }

      cameraCtxRef.current = ctx
      console.log('✅ CameraContext已保存到ref')
      console.log('cameraCtxRef.current:', !!cameraCtxRef.current)

      setCameraReady(true)
      console.log('✅ cameraReady状态已设置为true')

      // Camera准备好后，延迟500ms启动实时评估
      console.log('准备启动实时评估（延迟500ms）')
      setTimeout(() => {
        console.log('=== 延迟后开始启动实时评估 ===')

        if (!cameraCtxRef.current) {
          console.error('❌ CameraContext丢失')
          return
        }

        console.log('✅ CameraContext存在，开始启动实时评估')
        console.log('设置初始建议')
        setRealtimeSuggestions(['正在分析镜头...'])

        // 清除旧的定时器
        if (realtimeTimerRef.current) {
          console.log('清除旧的定时器')
          clearInterval(realtimeTimerRef.current)
        }

        // 每2秒采集一次镜头
        console.log('启动定时器，每2秒采集一次')
        const timerId = setInterval(() => {
          if (!cameraCtxRef.current) {
            console.error('❌ 定时器执行时CameraContext丢失')
            return
          }

          console.log('--- 开始采集镜头 ---')
          cameraCtxRef.current.takePhoto({
            quality: 'low',
            success: async (res: any) => {
              console.log('✅ 镜头采集成功:', res.tempImagePath)
              try {
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

                console.log('实时建议:', suggestions)
                setRealtimeSuggestions(suggestions)
              } catch (error) {
                console.error('❌ 实时评估失败:', error)
                setRealtimeSuggestions(['评估失败，继续监控...'])
              }
            },
            fail: (err: any) => {
              console.error('❌ 镜头采集失败:', err)
              setRealtimeSuggestions(['采集失败，继续监控...'])
            }
          })
        }, 2000)

        realtimeTimerRef.current = timerId
        console.log('✅ 实时评估定时器已启动，ID:', timerId)
      }, 500)
    } catch (error) {
      console.error('❌ 创建CameraContext异常:', error)
      Taro.showToast({title: '相机初始化失败', icon: 'none'})
    }
  }, [isWeApp])

  // 停止实时评估
  const stopRealtimeEvaluation = useCallback(() => {
    console.log('停止实时评估')
    if (realtimeTimerRef.current) {
      clearInterval(realtimeTimerRef.current)
      realtimeTimerRef.current = null
    }
    setRealtimeSuggestions([])
  }, [])

  // 重新启动实时评估（用于重新拍照后）
  const restartRealtimeEvaluation = useCallback(() => {
    console.log('=== 重新启动实时评估 ===')

    if (!isWeApp) {
      console.log('非小程序环境，跳过')
      return
    }

    if (!cameraCtxRef.current) {
      console.error('❌ CameraContext不存在')
      return
    }

    console.log('✅ 开始重新启动')
    setRealtimeSuggestions(['正在分析镜头...'])

    // 清除旧的定时器
    if (realtimeTimerRef.current) {
      clearInterval(realtimeTimerRef.current)
    }

    // 每2秒采集一次镜头
    const timerId = setInterval(() => {
      if (!cameraCtxRef.current) {
        console.error('CameraContext丢失')
        return
      }

      console.log('采集镜头...')
      cameraCtxRef.current.takePhoto({
        quality: 'low',
        success: async (res: any) => {
          console.log('镜头采集成功:', res.tempImagePath)
          try {
            const result = await evaluatePhotoLocally(res.tempImagePath)

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

            setRealtimeSuggestions(suggestions)
          } catch (error) {
            console.error('实时评估失败:', error)
            setRealtimeSuggestions(['评估失败，继续监控...'])
          }
        },
        fail: (err: any) => {
          console.error('镜头采集失败:', err)
          setRealtimeSuggestions(['采集失败，继续监控...'])
        }
      })
    }, 2000)

    realtimeTimerRef.current = timerId
    console.log('✅ 定时器已重新启动，ID:', timerId)
  }, [isWeApp])

  // 本地分析照片
  const analyzePhoto = useCallback(async (imagePath: string) => {
    setAnalyzing(true)
    Taro.showLoading({title: '分析中...'})

    try {
      // 使用本地算法评估
      const result = await evaluatePhotoLocally(imagePath)
      setEvaluation(result)
      setShowResult(true)
      Taro.hideLoading()
      setAnalyzing(false)
    } catch (error) {
      console.error('分析失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '分析失败，请重试', icon: 'none'})
      setAnalyzing(false)
    }
  }, [])

  // 拍摄并保存（从实时模式）
  const captureFromRealtime = useCallback(async () => {
    console.log('=== 拍摄按钮点击 ===')
    console.log('isWeApp:', isWeApp)
    console.log('cameraCtxRef.current:', !!cameraCtxRef.current)
    console.log('cameraReady:', cameraReady)

    if (!isWeApp) {
      Taro.showToast({title: '请在小程序中使用', icon: 'none'})
      return
    }

    if (!cameraCtxRef.current) {
      console.error('❌ CameraContext未创建')
      Taro.showToast({title: '相机未就绪，请稍候重试', icon: 'none'})
      return
    }

    // 停止实时评估
    stopRealtimeEvaluation()

    Taro.showLoading({title: '拍摄中...'})

    try {
      cameraCtxRef.current.takePhoto({
        quality: 'high',
        success: async (res: any) => {
          Taro.hideLoading()
          console.log('✅ 拍摄成功:', res.tempImagePath)
          setCurrentImage(res.tempImagePath)
          setMode('capture')

          // 自动开始分析
          analyzePhoto(res.tempImagePath)
        },
        fail: (err: any) => {
          Taro.hideLoading()
          console.error('❌ 拍摄失败:', err)
          Taro.showToast({title: '拍摄失败，请重试', icon: 'none'})

          // 重新启动实时评估
          setTimeout(() => {
            restartRealtimeEvaluation()
          }, 1000)
        }
      })
    } catch (error) {
      Taro.hideLoading()
      console.error('❌ 拍摄异常:', error)
      Taro.showToast({title: '拍摄异常', icon: 'none'})
    }
  }, [isWeApp, cameraReady, stopRealtimeEvaluation, analyzePhoto, restartRealtimeEvaluation])

  // 调用相机拍照（H5或备用方案）
  const takePhoto = useCallback(async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const imagePath = res.tempFilePaths[0]
        setCurrentImage(imagePath)
        setShowResult(false)
        setMode('capture')

        // 自动开始分析
        analyzePhoto(imagePath)
      }
    } catch (error: any) {
      console.error('拍照失败:', error)
      if (error.errMsg && !error.errMsg.includes('cancel')) {
        Taro.showToast({title: '拍照失败', icon: 'none'})
      }
    }
  }, [analyzePhoto])

  // 重新拍照
  const retakePhoto = useCallback(() => {
    setCurrentImage(null)
    setEvaluation(null)
    setShowResult(false)

    if (isWeApp) {
      setMode('realtime')
      // 延迟重新启动实时评估
      setTimeout(() => {
        if (cameraCtxRef.current) {
          restartRealtimeEvaluation()
        }
      }, 500)
    } else {
      takePhoto()
    }
  }, [isWeApp, restartRealtimeEvaluation, takePhoto])

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

  // 生成简略建议（不超过10个字）
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
      {/* 实时预览模式 */}
      {mode === 'realtime' && !currentImage && (
        <View className="relative" style={{height: '100vh'}}>
          {isWeApp ? (
            <>
              {/* Camera组件 */}
              <Camera
                className="w-full h-full"
                devicePosition="back"
                flash="off"
                onReady={handleCameraReady}
                onError={(e) => {
                  console.error('Camera组件错误:', e)
                  Taro.showToast({title: 'Camera组件错误', icon: 'none'})
                }}
                style={{width: '100%', height: '100%'}}
              />

              {/* 实时建议浮层 */}
              {realtimeSuggestions.length > 0 && (
                <View className="absolute top-20 left-4 right-4 bg-black/70 rounded-2xl p-4">
                  <View className="flex flex-row items-center mb-2">
                    <View className="i-mdi-eye text-lg text-primary mr-2" />
                    <Text className="text-sm font-semibold text-white">实时建议</Text>
                  </View>
                  <View className="space-y-1">
                    {realtimeSuggestions.map((suggestion, index) => (
                      <Text key={index} className="text-sm text-white leading-relaxed">
                        • {suggestion}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* 相机状态指示 */}
              {!cameraReady && (
                <View className="absolute top-4 left-4 right-4 bg-primary/80 rounded-xl p-3">
                  <Text className="text-sm text-white text-center">相机初始化中...</Text>
                  <Text className="text-xs text-white text-center mt-1">
                    环境: {getEnv()} | isWeApp: {isWeApp ? '是' : '否'}
                  </Text>
                </View>
              )}

              {/* 拍摄按钮 */}
              <View className="absolute bottom-8 left-0 right-0 flex flex-col items-center">
                <View
                  className="w-20 h-20 bg-white rounded-full border-4 border-primary flex items-center justify-center mb-4"
                  onClick={captureFromRealtime}>
                  <View className="w-16 h-16 bg-primary rounded-full" />
                </View>
                <Text className="text-sm text-white">点击拍摄并保存</Text>
              </View>
            </>
          ) : (
            // H5环境提示
            <View className="flex flex-col items-center justify-center h-full px-6">
              <View className="i-mdi-camera-off text-6xl text-muted-foreground mb-4" />
              <Text className="text-lg text-white mb-2">实时预览功能仅在小程序中可用</Text>
              <Text className="text-sm text-muted-foreground mb-2 text-center">当前环境: {getEnv()}</Text>
              <Text className="text-sm text-muted-foreground mb-6 text-center">
                H5环境不支持Camera组件，请使用拍照功能
              </Text>
              <Button
                className="bg-primary text-white py-3 px-8 rounded-xl break-keep text-base"
                size="default"
                onClick={takePhoto}>
                调用相机拍照
              </Button>
            </View>
          )}
        </View>
      )}

      {/* 拍照结果模式 */}
      {mode === 'capture' && currentImage && (
        <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
          <View className="px-6 py-8">
            {/* 标题 */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-white mb-2">拍照助手</Text>
              <Text className="text-sm text-muted-foreground">拍摄照片，获取实时评分和建议</Text>
            </View>

            {/* 图片预览区域 */}
            <View className="mb-6">
              <Image
                src={currentImage}
                mode="aspectFit"
                className="w-full rounded-2xl bg-card"
                style={{height: '400px'}}
              />
            </View>

            {/* 评估结果 */}
            {showResult && evaluation && (
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

                {/* 各项得分（带简略建议） */}
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
                      <Text className="text-sm text-foreground">高度</Text>
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
            )}

            {/* 操作按钮 */}
            <View className="space-y-3">
              <Button
                className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={retakePhoto}>
                重新拍照
              </Button>
              {showResult && (
                <Button
                  className="w-full bg-secondary text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={saveEvaluation}>
                  保存评估结果
                </Button>
              )}
              <Button
                className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
                size="default"
                onClick={() => Taro.navigateBack()}>
                返回
              </Button>
            </View>

            {/* 提示信息 */}
            <View className="mt-6 bg-muted/30 rounded-xl p-4">
              <View className="flex flex-row items-start">
                <View className="i-mdi-information text-lg text-primary mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground leading-relaxed">
                    本功能使用小程序本地算法进行实时评估，无需上传照片到服务器。评估基于构图规则、亮度对比度等指标，为您提供即时的摄影建议。
                  </Text>
                </View>
              </View>
            </View>

            {/* 底部间距 */}
            <View className="h-20" />
          </View>
        </ScrollView>
      )}
    </View>
  )
}
