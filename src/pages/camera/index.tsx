import {Button, Camera, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createEvaluation} from '@/db/api'
import {getCurrentUserId} from '@/utils/auth'
import type {LocalEvaluationResult} from '@/utils/localEvaluation'
import {evaluatePhotoLocally} from '@/utils/localEvaluation'

export default function CameraPage() {
  const [mode, setMode] = useState<'preview' | 'captured'>('preview')
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<LocalEvaluationResult | null>(null)
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<string[]>([])
  const [evaluationCount, setEvaluationCount] = useState(0)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back') // 摄像头方向
  const cameraCtxRef = useRef<any>(null)
  const evaluationTimerRef = useRef<any>(null)
  const isProcessingRef = useRef(false)
  const retryCountRef = useRef(0)

  // 检查运行环境
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  console.log('📱 拍照助手页面')
  console.log('运行环境:', isWeapp ? '微信小程序' : isH5 ? 'H5浏览器' : '其他')
  console.log('mode:', mode)
  console.log('isEvaluating:', isEvaluating)
  console.log('evaluationCount:', evaluationCount)
  console.log('cameraPosition:', cameraPosition)

  // 页面显示时检查摄像头权限
  useDidShow(() => {
    if (isWeapp) {
      checkCameraPermission()
    }
  })

  // 检查摄像头权限
  const checkCameraPermission = useCallback(async () => {
    try {
      console.log('🔍 检查摄像头权限...')
      const {authSetting} = await Taro.getSetting()
      console.log('权限状态:', authSetting)

      // 检查摄像头权限
      if (authSetting['scope.camera'] === false) {
        // 权限被拒绝
        console.warn('⚠️ 摄像头权限被拒绝')
        Taro.showModal({
          title: '需要摄像头权限',
          content: '拍照助手需要使用摄像头，请在设置中允许访问摄像头',
          confirmText: '去设置',
          cancelText: '返回',
          success: (res) => {
            if (res.confirm) {
              Taro.openSetting({
                success: (settingRes) => {
                  console.log('设置结果:', settingRes.authSetting)
                  if (settingRes.authSetting['scope.camera']) {
                    // 用户开启了权限
                    Taro.showToast({title: '权限已开启', icon: 'success'})
                  } else {
                    // 用户仍未开启权限
                    Taro.showToast({title: '请开启摄像头权限', icon: 'none'})
                    setTimeout(() => {
                      Taro.switchTab({url: '/pages/home/index'})
                    }, 1500)
                  }
                }
              })
            } else {
              // 用户取消，返回首页
              Taro.switchTab({url: '/pages/home/index'})
            }
          }
        })
      } else if (authSetting['scope.camera'] === undefined) {
        // 权限未请求过
        console.log('ℹ️ 摄像头权限未请求过，等待 Camera 组件自动请求')
      } else {
        // 权限已允许
        console.log('✅ 摄像头权限已允许')
      }
    } catch (error) {
      console.error('❌ 检查权限失败:', error)
    }
  }, [])

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
      } else {
        console.error('❌ CameraContext创建失败')
        Taro.showToast({title: '相机初始化失败', icon: 'none'})
      }
    } catch (error) {
      console.error('❌ 初始化相机异常:', error)
      Taro.showToast({title: '相机初始化异常', icon: 'none'})
    }
  }, [])

  // Camera 组件初始化完成回调
  const handleCameraReady = useCallback(() => {
    console.log('✅ Camera 组件初始化完成')
    // Camera 组件就绪后再创建 CameraContext
    setTimeout(() => {
      initCamera()
      Taro.showToast({title: '相机已就绪', icon: 'success', duration: 1500})
    }, 500)
  }, [initCamera])

  // Camera 组件错误回调
  const handleCameraError = useCallback((e: any) => {
    console.error('❌ Camera 组件错误:', e)
    console.error('错误详情:', JSON.stringify(e, null, 2))

    const errorMsg = e.detail?.errMsg || e.errMsg || '相机初始化失败'
    console.error('错误消息:', errorMsg)

    // 显示详细的错误信息和解决方案
    Taro.showModal({
      title: '摄像头无法使用',
      content: `${errorMsg}\n\n可能原因：\n• 权限被拒绝\n• 摄像头被占用\n• 设备不支持\n\n解决方法：\n• 在设置中开启摄像头权限\n• 关闭其他使用摄像头的应用\n• 重启微信后重试`,
      confirmText: '去设置',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          Taro.openSetting()
        }
      }
    })
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

            // 使用详细建议（从evaluation.suggestions中提取）
            const suggestions: string[] = []

            // 优先显示得分最低的维度的具体建议
            const scores = [
              {name: '构图', score: result.composition_score, suggestion: result.suggestions.composition},
              {name: '角度', score: result.angle_score, suggestion: result.suggestions.angle},
              {name: '距离', score: result.distance_score, suggestion: result.suggestions.distance},
              {name: '机位', score: result.height_score, suggestion: result.suggestions.height},
              {name: '姿态', score: result.pose_score || 20, suggestion: result.suggestions.pose}
            ]

            // 按得分排序，优先显示得分低的维度
            scores.sort((a, b) => a.score - b.score)

            // 显示前3个需要改进的维度的具体建议
            let addedCount = 0
            for (const item of scores) {
              if (item.suggestion && addedCount < 3) {
                // 添加维度标签和具体建议
                suggestions.push(`${item.name}：${item.suggestion}`)
                addedCount++
              }
            }

            // 如果所有维度都很好，显示鼓励信息
            if (suggestions.length === 0) {
              suggestions.push('画面优秀，可以拍摄！')
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
  const confirmCapture = useCallback(async () => {
    console.log('✅ 确认拍摄')
    if (evaluationTimerRef.current) {
      clearInterval(evaluationTimerRef.current)
      evaluationTimerRef.current = null
    }
    setIsEvaluating(false)

    // 立即保存到手机相册
    if (currentImage) {
      try {
        await Taro.saveImageToPhotosAlbum({
          filePath: currentImage
        })
        console.log('✅ 已保存到相册')
        Taro.showToast({title: '照片已保存到相册', icon: 'success', duration: 2000})
      } catch (error: any) {
        console.error('❌ 保存到相册失败:', error)
        // 如果是权限问题，提示用户
        if (error.errMsg?.includes('auth')) {
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
        }
      }
    }

    setMode('captured')
  }, [currentImage])

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

            // 立即保存到手机相册
            try {
              await Taro.saveImageToPhotosAlbum({
                filePath: res.tempImagePath
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

            // 本地评估
            const result = await evaluatePhotoLocally(res.tempImagePath)
            console.log('✅ 评估完成 - 总分:', result.total_score)

            setEvaluation(result)
            setMode('captured')

            Taro.hideLoading()
            Taro.showToast({title: '拍摄成功并已保存到相册', icon: 'success', duration: 2000})
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

  // 保存评估结果（只保存评估记录，不上传照片）
  const saveEvaluation = useCallback(async () => {
    if (!currentImage || !evaluation) {
      Taro.showToast({title: '没有可保存的评估', icon: 'none'})
      return
    }

    try {
      // 获取当前用户ID（如果已登录）
      const userId = await getCurrentUserId()

      // 如果未登录，提示用户但仍然显示结果
      if (!userId) {
        Taro.showModal({
          title: '提示',
          content: '登录后可保存评估记录到历史，当前仅查看结果。是否前往登录？',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({url: '/pages/login/index'})
            } else {
              // 用户选择不登录，直接显示临时结果
              Taro.setStorageSync('tempEvaluationResult', {
                total_score: evaluation.total_score,
                composition_score: evaluation.composition_score,
                pose_score: evaluation.pose_score,
                angle_score: evaluation.angle_score,
                distance_score: evaluation.distance_score,
                height_score: evaluation.height_score,
                suggestions: evaluation.suggestions,
                scene_type: evaluation.scene_type,
                evaluation_type: 'realtime',
                created_at: new Date().toISOString()
              })

              Taro.navigateTo({
                url: '/pages/result/index?temp=1'
              })
            }
          }
        })
        return
      }

      // 已登录：保存评估记录
      Taro.showLoading({title: '保存中...'})

      const record = await createEvaluation({
        // photo_url不传，保护用户隐私
        evaluation_type: 'realtime',
        total_score: evaluation.total_score,
        composition_score: evaluation.composition_score,
        pose_score: evaluation.pose_score ?? undefined,
        angle_score: evaluation.angle_score,
        distance_score: evaluation.distance_score,
        height_score: evaluation.height_score,
        suggestions: evaluation.suggestions,
        scene_type: evaluation.scene_type as 'portrait' | 'landscape' | 'group' | 'other' | undefined,
        user_id: userId // 关联用户ID
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

  // 切换前后摄像头
  const toggleCamera = useCallback(() => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'))
    Taro.showToast({
      title: cameraPosition === 'back' ? '切换到前置摄像头' : '切换到后置摄像头',
      icon: 'none',
      duration: 1000
    })
  }, [cameraPosition])

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
      {/* H5 环境提示 */}
      {isH5 && (
        <View className="flex flex-col items-center justify-center min-h-screen p-6">
          <View className="bg-card rounded-2xl p-8 max-w-md w-full text-center">
            <View className="i-mdi-camera-off text-6xl text-muted-foreground mb-4 mx-auto" />
            <Text className="text-xl font-bold text-foreground mb-4 block">拍照助手功能仅在微信小程序中可用</Text>
            <Text className="text-sm text-muted-foreground mb-6 block leading-relaxed">
              当前运行在浏览器环境，无法使用摄像头实时评估功能。
            </Text>
            <Text className="text-sm text-muted-foreground mb-6 block leading-relaxed">
              请在微信中搜索"拍Ta智能摄影助手"小程序，或扫描小程序码使用完整功能。
            </Text>
            <Button
              className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={() => Taro.switchTab({url: '/pages/home/index'})}>
              返回首页
            </Button>
          </View>
        </View>
      )}

      {/* 微信小程序环境 - 正常功能 */}
      {isWeapp && mode === 'preview' && (
        <View className="relative" style={{height: '100vh'}}>
          {/* Camera组件 */}
          <Camera
            className="w-full h-full"
            mode="normal"
            devicePosition={cameraPosition}
            flash="off"
            onInitDone={handleCameraReady}
            onError={handleCameraError}
            style={{width: '100%', height: '100%'}}
          />

          {/* 构图辅助线 - 三分法网格（仅在实时评估时显示）*/}
          {isEvaluating && (
            <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              {/* 横向辅助线 - 上 */}
              <View
                className="absolute left-0 right-0 border-t-2 border-dashed border-white/40"
                style={{top: '33.33%'}}
              />
              {/* 横向辅助线 - 下 */}
              <View
                className="absolute left-0 right-0 border-t-2 border-dashed border-white/40"
                style={{top: '66.67%'}}
              />
              {/* 纵向辅助线 - 左 */}
              <View
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/40"
                style={{left: '33.33%'}}
              />
              {/* 纵向辅助线 - 右 */}
              <View
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/40"
                style={{left: '66.67%'}}
              />
              {/* 四个交点标记 - 标识最佳构图位置 */}
              <View
                className="absolute w-3 h-3 rounded-full bg-white/60"
                style={{left: 'calc(33.33% - 6px)', top: 'calc(33.33% - 6px)'}}
              />
              <View
                className="absolute w-3 h-3 rounded-full bg-white/60"
                style={{left: 'calc(66.67% - 6px)', top: 'calc(33.33% - 6px)'}}
              />
              <View
                className="absolute w-3 h-3 rounded-full bg-white/60"
                style={{left: 'calc(33.33% - 6px)', top: 'calc(66.67% - 6px)'}}
              />
              <View
                className="absolute w-3 h-3 rounded-full bg-white/60"
                style={{left: 'calc(66.67% - 6px)', top: 'calc(66.67% - 6px)'}}
              />
            </View>
          )}

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
                <View className="bg-primary/70 rounded-xl p-3 mb-3">
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center">
                      <View
                        className="i-mdi-camera-timer text-lg text-white mr-2"
                        style={{filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))'}}
                      />
                      <Text
                        className="text-sm text-white font-semibold"
                        style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                        实时评估中...
                      </Text>
                    </View>
                    <Text
                      className="text-sm text-white font-semibold"
                      style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                      已评估 {evaluationCount} 次
                    </Text>
                  </View>
                </View>

                {/* 实时建议 */}
                {realtimeSuggestions.length > 0 && (
                  <View className="bg-black/40 rounded-2xl p-5 border-2 border-primary/60">
                    <View className="flex flex-row items-center mb-3">
                      <View
                        className="i-mdi-lightbulb-on text-2xl text-primary mr-2"
                        style={{filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))'}}
                      />
                      <Text
                        className="text-base font-bold text-white"
                        style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                        实时建议
                      </Text>
                    </View>
                    <View className="space-y-2">
                      {realtimeSuggestions.map((suggestion, index) => (
                        <View key={index} className="flex flex-row items-start">
                          <View
                            className="i-mdi-chevron-right text-lg text-primary mr-1 mt-0.5"
                            style={{filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))'}}
                          />
                          <Text
                            className="text-base text-white font-medium leading-relaxed flex-1"
                            style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                            {suggestion}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 当前评分 */}
                {evaluation && (
                  <View className="bg-black/40 rounded-xl p-4 mt-3">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <Text
                        className="text-sm font-semibold text-white"
                        style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                        当前评分
                      </Text>
                      <View className="flex flex-row items-center">
                        <Text
                          className="text-2xl font-bold text-primary mr-1"
                          style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          {evaluation.total_score}
                        </Text>
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          分
                        </Text>
                      </View>
                    </View>
                    <View className="space-y-2">
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          构图
                        </Text>
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          {evaluation.composition_score}/30
                        </Text>
                      </View>
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          角度
                        </Text>
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          {evaluation.angle_score}/20
                        </Text>
                      </View>
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          距离
                        </Text>
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          {evaluation.distance_score}/10
                        </Text>
                      </View>
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          光线
                        </Text>
                        <Text className="text-xs text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                          {evaluation.height_score}/10
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 底部操作按钮 */}
          <View className="absolute bottom-8 left-0 right-0 px-6">
            {/* 摄像头切换按钮 - 放在底部右侧，避免与顶部系统按钮重叠 */}
            <View className="absolute -top-20 right-6">
              <View
                className="bg-black/70 rounded-full p-4 border-2 border-white/30"
                onClick={toggleCamera}
                style={{
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <View className="i-mdi-camera-flip text-3xl text-white" />
              </View>
            </View>

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

      {/* 已拍摄模式 - 仅微信小程序环境 */}
      {isWeapp && mode === 'captured' && currentImage && evaluation && (
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
