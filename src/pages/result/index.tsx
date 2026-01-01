import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getEvaluationById} from '@/db/api'
import type {PhotoEvaluation} from '@/db/types'

export default function ResultPage() {
  const [evaluation, setEvaluation] = useState<PhotoEvaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadEvaluation = useCallback(async () => {
    const id = router.params.id

    if (!id) {
      Taro.showToast({title: '参数错误', icon: 'none'})
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
      return
    }

    setLoading(true)
    const data = await getEvaluationById(id)
    setLoading(false)

    if (data) {
      setEvaluation(data)
    } else {
      Taro.showToast({title: '加载失败', icon: 'none'})
    }
  }, [router.params.id])

  useDidShow(() => {
    loadEvaluation()
  })

  const handleBackHome = () => {
    Taro.switchTab({url: '/pages/home/index'})
  }

  const handleNewEvaluation = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Text className="text-white">加载中...</Text>
      </View>
    )
  }

  if (!evaluation) {
    return (
      <View className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Text className="text-white">加载失败</Text>
      </View>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-primary'
    return 'text-orange-500'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '中等'
    if (score >= 60) return '及格'
    return '需改进'
  }

  // 生成简略建议（不超过10个字）
  const getShortSuggestion = (dimension: string, score: number | null): string => {
    if (score === null) return ''

    switch (dimension) {
      case 'composition':
        if (score < 20) return '构图需优化'
        if (score < 25) return '可调整主体'
        return '构图良好'
      case 'pose':
        if (score < 20) return '姿态欠佳'
        if (score < 25) return '可调整姿势'
        return '姿态自然'
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
          {/* 隐私保护提示 */}
          <View className="bg-card rounded-2xl p-4 mb-6 shadow-card border border-primary/30">
            <View className="flex flex-row items-center">
              <View className="i-mdi-shield-check text-2xl text-primary mr-3" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-1">隐私保护</Text>
                <Text className="text-xs text-muted-foreground">您的照片未保存到云端，仅保留评估结果</Text>
              </View>
            </View>
          </View>

          {/* 总分卡片 */}
          <View className="bg-gradient-primary rounded-2xl p-6 mb-6 shadow-elegant">
            <View className="flex flex-col items-center">
              <Text className="text-sm text-white/80 mb-2">综合评分</Text>
              <Text className="text-6xl font-bold text-white mb-2">{evaluation.total_score}</Text>
              <Text className="text-lg text-white/90">{getScoreLevel(evaluation.total_score)}</Text>
            </View>
          </View>

          {/* 评分详情 */}
          <View className="bg-card rounded-2xl p-6 mb-6 shadow-card">
            <Text className="text-lg font-semibold text-foreground mb-4">评分详情</Text>
            <View className="space-y-4">
              {/* 构图 */}
              {evaluation.composition_score !== null && (
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="flex flex-row items-center">
                      <View className="i-mdi-grid text-xl text-primary mr-2" />
                      <Text className="text-sm font-medium text-foreground">构图合理性</Text>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('composition', evaluation.composition_score)}
                      </Text>
                      <Text className={`text-lg font-bold ${getScoreColor(evaluation.composition_score)}`}>
                        {evaluation.composition_score}/30
                      </Text>
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
              )}

              {/* 姿态 */}
              {evaluation.pose_score !== null && (
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="flex flex-row items-center">
                      <View className="i-mdi-human-handsup text-xl text-secondary mr-2" />
                      <Text className="text-sm font-medium text-foreground">人物姿态</Text>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('pose', evaluation.pose_score)}
                      </Text>
                      <Text className={`text-lg font-bold ${getScoreColor(evaluation.pose_score)}`}>
                        {evaluation.pose_score}/30
                      </Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-secondary rounded-full"
                      style={{
                        width: `${(evaluation.pose_score / 30) * 100}%`
                      }}
                    />
                  </View>
                </View>
              )}

              {/* 角度 */}
              {evaluation.angle_score !== null && (
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="flex flex-row items-center">
                      <View className="i-mdi-angle-acute text-xl text-accent mr-2" />
                      <Text className="text-sm font-medium text-foreground">拍摄角度</Text>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('angle', evaluation.angle_score)}
                      </Text>
                      <Text className={`text-lg font-bold ${getScoreColor(evaluation.angle_score)}`}>
                        {evaluation.angle_score}/20
                      </Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-accent rounded-full"
                      style={{
                        width: `${(evaluation.angle_score / 20) * 100}%`
                      }}
                    />
                  </View>
                </View>
              )}

              {/* 距离 */}
              {evaluation.distance_score !== null && (
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="flex flex-row items-center">
                      <View className="i-mdi-ruler text-xl text-primary mr-2" />
                      <Text className="text-sm font-medium text-foreground">拍摄距离</Text>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('distance', evaluation.distance_score)}
                      </Text>
                      <Text className={`text-lg font-bold ${getScoreColor(evaluation.distance_score)}`}>
                        {evaluation.distance_score}/10
                      </Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(evaluation.distance_score / 10) * 100}%`
                      }}
                    />
                  </View>
                </View>
              )}

              {/* 高度 */}
              {evaluation.height_score !== null && (
                <View>
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="flex flex-row items-center">
                      <View className="i-mdi-arrow-expand-vertical text-xl text-secondary mr-2" />
                      <Text className="text-sm font-medium text-foreground">机位高度</Text>
                    </View>
                    <View className="flex flex-row items-center">
                      <Text className="text-xs text-muted-foreground mr-2">
                        {getShortSuggestion('height', evaluation.height_score)}
                      </Text>
                      <Text className={`text-lg font-bold ${getScoreColor(evaluation.height_score)}`}>
                        {evaluation.height_score}/10
                      </Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-secondary rounded-full"
                      style={{
                        width: `${(evaluation.height_score / 10) * 100}%`
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 改进建议 */}
          {evaluation.suggestions && (
            <View className="bg-card rounded-2xl p-6 mb-6 shadow-card">
              <Text className="text-lg font-semibold text-foreground mb-4">改进建议</Text>
              <View className="space-y-3">
                {evaluation.suggestions.composition && (
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-lightbulb text-lg text-accent mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground mb-1">构图建议</Text>
                      <Text className="text-sm text-muted-foreground">{evaluation.suggestions.composition}</Text>
                    </View>
                  </View>
                )}
                {evaluation.suggestions.pose && (
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-lightbulb text-lg text-accent mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground mb-1">姿态建议</Text>
                      <Text className="text-sm text-muted-foreground">{evaluation.suggestions.pose}</Text>
                    </View>
                  </View>
                )}
                {evaluation.suggestions.angle && (
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-lightbulb text-lg text-accent mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground mb-1">角度建议</Text>
                      <Text className="text-sm text-muted-foreground">{evaluation.suggestions.angle}</Text>
                    </View>
                  </View>
                )}
                {evaluation.suggestions.distance && (
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-lightbulb text-lg text-accent mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground mb-1">距离建议</Text>
                      <Text className="text-sm text-muted-foreground">{evaluation.suggestions.distance}</Text>
                    </View>
                  </View>
                )}
                {evaluation.suggestions.height && (
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-lightbulb text-lg text-accent mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground mb-1">高度建议</Text>
                      <Text className="text-sm text-muted-foreground">{evaluation.suggestions.height}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 操作按钮 */}
          <View className="space-y-3">
            <Button
              className="w-full bg-gradient-primary text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleNewEvaluation}>
              继续评估
            </Button>
            <Button
              className="w-full bg-card text-foreground py-4 rounded-xl border border-border break-keep text-base"
              size="default"
              onClick={handleBackHome}>
              返回首页
            </Button>
          </View>

          {/* 底部间距 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
