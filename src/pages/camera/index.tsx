import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useCallback, useEffect, useRef, useState} from 'react'
import {createEvaluation} from '@/db/api'
import type {LocalEvaluationResult} from '@/utils/localEvaluation'
import {evaluatePhotoLocally} from '@/utils/localEvaluation'
import {uploadFile} from '@/utils/upload'

export default function CameraPage() {
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [_analyzing, setAnalyzing] = useState(false)
  const [evaluation, setEvaluation] = useState<LocalEvaluationResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const analyzeTimerRef = useRef<any>(null)

  // 清理定时器
  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current)
      }
    }
  }, [])

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

  // 调用相机拍照
  const takePhoto = useCallback(async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera'] // 只允许拍照
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const imagePath = res.tempFilePaths[0]
        setCurrentImage(imagePath)
        setShowResult(false)

        // 自动开始分析
        analyzePhoto(imagePath)
      }
    } catch (error) {
      console.error('拍照失败:', error)
      Taro.showToast({title: '拍照失败', icon: 'none'})
    }
  }, [analyzePhoto])

  // 重新拍照
  const retakePhoto = useCallback(() => {
    setCurrentImage(null)
    setEvaluation(null)
    setShowResult(false)
    takePhoto()
  }, [takePhoto])

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
        // 跳转到结果页面
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

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        <View className="px-6 py-8">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white mb-2">拍照助手</Text>
            <Text className="text-sm text-muted-foreground">拍摄照片，获取实时评分和建议</Text>
          </View>

          {/* 图片预览区域 */}
          {currentImage ? (
            <View className="mb-6">
              <Image
                src={currentImage}
                mode="aspectFit"
                className="w-full rounded-2xl bg-card"
                style={{height: '400px'}}
              />
            </View>
          ) : (
            <View
              className="w-full bg-card rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center mb-6"
              style={{height: '400px'}}
              onClick={takePhoto}>
              <View className="i-mdi-camera text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-foreground mb-2">点击调用相机拍照</Text>
              <Text className="text-sm text-muted-foreground">拍照后立即获得评分和建议</Text>
            </View>
          )}

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

              {/* 各项得分 */}
              <View className="space-y-4 mb-6">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">构图</Text>
                  <View className="flex flex-row items-center">
                    <View className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-3">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(evaluation.composition_score / 30) * 100}%`
                        }}
                      />
                    </View>
                    <Text className="text-sm text-foreground w-12 text-right">{evaluation.composition_score}/30</Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">角度</Text>
                  <View className="flex flex-row items-center">
                    <View className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-3">
                      <View
                        className="h-full bg-secondary rounded-full"
                        style={{
                          width: `${(evaluation.angle_score / 20) * 100}%`
                        }}
                      />
                    </View>
                    <Text className="text-sm text-foreground w-12 text-right">{evaluation.angle_score}/20</Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">距离</Text>
                  <View className="flex flex-row items-center">
                    <View className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-3">
                      <View
                        className="h-full bg-accent rounded-full"
                        style={{
                          width: `${(evaluation.distance_score / 10) * 100}%`
                        }}
                      />
                    </View>
                    <Text className="text-sm text-foreground w-12 text-right">{evaluation.distance_score}/10</Text>
                  </View>
                </View>

                <View className="flex flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">高度</Text>
                  <View className="flex flex-row items-center">
                    <View className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-3">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(evaluation.height_score / 10) * 100}%`
                        }}
                      />
                    </View>
                    <Text className="text-sm text-foreground w-12 text-right">{evaluation.height_score}/10</Text>
                  </View>
                </View>
              </View>

              {/* 改进建议 */}
              {Object.keys(evaluation.suggestions).length > 0 && (
                <View className="bg-muted/50 rounded-xl p-4">
                  <View className="flex flex-row items-center mb-3">
                    <View className="i-mdi-lightbulb-on text-xl text-primary mr-2" />
                    <Text className="text-sm font-semibold text-foreground">改进建议</Text>
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
          )}

          {/* 操作按钮 */}
          <View className="space-y-3">
            {currentImage ? (
              <>
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
              </>
            ) : (
              <Button
                className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={takePhoto}>
                开始拍照
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
    </View>
  )
}
