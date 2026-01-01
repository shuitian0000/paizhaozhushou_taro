import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getRecentEvaluations} from '@/db/api'
import type {PhotoEvaluation} from '@/db/types'

export default function HistoryPage() {
  const [evaluations, setEvaluations] = useState<PhotoEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'realtime' | 'upload'>('all')

  const loadEvaluations = useCallback(async () => {
    setLoading(true)
    const data = await getRecentEvaluations(50)
    setLoading(false)
    setEvaluations(data)
  }, [])

  useDidShow(() => {
    loadEvaluations()
  })

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({url: `/pages/result/index?id=${id}`})
  }

  const getTypeText = (type: string) => {
    return type === 'realtime' ? '实时拍摄' : '上传照片'
  }

  const getTypeColor = (type: string) => {
    return type === 'realtime' ? 'bg-primary' : 'bg-secondary'
  }

  const filteredEvaluations =
    filter === 'all' ? evaluations : evaluations.filter((item) => item.evaluation_type === filter)

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        <View className="px-6 py-8">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white mb-2">历史记录</Text>
            <Text className="text-sm text-muted-foreground">查看所有评估记录</Text>
          </View>

          {/* 筛选器 */}
          <View className="flex flex-row gap-3 mb-6">
            <View
              className={`flex-1 py-3 rounded-xl text-center ${filter === 'all' ? 'bg-primary' : 'bg-card border border-border'}`}
              onClick={() => setFilter('all')}>
              <Text className={`text-sm font-medium ${filter === 'all' ? 'text-white' : 'text-foreground'}`}>全部</Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-xl text-center ${filter === 'realtime' ? 'bg-primary' : 'bg-card border border-border'}`}
              onClick={() => setFilter('realtime')}>
              <Text className={`text-sm font-medium ${filter === 'realtime' ? 'text-white' : 'text-foreground'}`}>
                实时拍摄
              </Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-xl text-center ${filter === 'upload' ? 'bg-primary' : 'bg-card border border-border'}`}
              onClick={() => setFilter('upload')}>
              <Text className={`text-sm font-medium ${filter === 'upload' ? 'text-white' : 'text-foreground'}`}>
                上传照片
              </Text>
            </View>
          </View>

          {/* 列表 */}
          {loading ? (
            <View className="flex items-center justify-center py-20">
              <Text className="text-white">加载中...</Text>
            </View>
          ) : filteredEvaluations.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-image-off text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-white mb-2">暂无记录</Text>
              <Text className="text-sm text-muted-foreground">开始使用摄影助手吧</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredEvaluations.map((item) => (
                <View
                  key={item.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-card"
                  onClick={() => handleViewDetail(item.id)}>
                  <View className="p-5">
                    {/* 头部信息 */}
                    <View className="flex flex-row items-center justify-between mb-4">
                      <View className={`${getTypeColor(item.evaluation_type)} rounded-full px-3 py-1`}>
                        <Text className="text-xs text-white">{getTypeText(item.evaluation_type)}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <Text className="text-3xl font-bold text-primary mr-1">{item.total_score}</Text>
                        <Text className="text-sm text-muted-foreground">分</Text>
                      </View>
                    </View>

                    {/* 评分详情 */}
                    <View className="flex flex-row flex-wrap gap-3 mb-3">
                      <View className="flex flex-row items-center">
                        <View className="i-mdi-grid text-base text-primary mr-1" />
                        <Text className="text-xs text-muted-foreground">构图 {item.composition_score || 0}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <View className="i-mdi-angle-acute text-base text-secondary mr-1" />
                        <Text className="text-xs text-muted-foreground">角度 {item.angle_score || 0}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <View className="i-mdi-arrow-expand-horizontal text-base text-accent mr-1" />
                        <Text className="text-xs text-muted-foreground">距离 {item.distance_score || 0}</Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <View className="i-mdi-white-balance-sunny text-base text-yellow-500 mr-1" />
                        <Text className="text-xs text-muted-foreground">光线 {item.height_score || 0}</Text>
                      </View>
                    </View>

                    {/* 时间和场景 */}
                    <View className="flex flex-row items-center justify-between mb-3">
                      <Text className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      {item.scene_type && (
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-tag text-xs text-muted-foreground mr-1" />
                          <Text className="text-xs text-muted-foreground">
                            {item.scene_type === 'portrait'
                              ? '人像'
                              : item.scene_type === 'landscape'
                                ? '风景'
                                : item.scene_type === 'group'
                                  ? '合影'
                                  : '其他'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 隐私保护提示 */}
                    <View className="flex flex-row items-center pt-3 border-t border-border">
                      <View className="i-mdi-shield-check text-xs text-primary mr-1" />
                      <Text className="text-xs text-muted-foreground">照片未保存，仅保留评估结果</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
