import {Image, ScrollView, Text, View} from '@tarojs/components'
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
                  <View className="flex flex-row">
                    {/* 照片缩略图 */}
                    <Image src={item.photo_url} mode="aspectFill" className="w-28 h-28 bg-muted" />

                    {/* 信息 */}
                    <View className="flex-1 p-4">
                      <View className="flex flex-row items-center justify-between mb-2">
                        <View className={`${getTypeColor(item.evaluation_type)} rounded-full px-3 py-1`}>
                          <Text className="text-xs text-white">{getTypeText(item.evaluation_type)}</Text>
                        </View>
                        <View className="flex flex-row items-center">
                          <Text className="text-2xl font-bold text-primary mr-1">{item.total_score}</Text>
                          <Text className="text-xs text-muted-foreground">分</Text>
                        </View>
                      </View>

                      {/* 评分条 */}
                      <View className="space-y-1 mb-2">
                        {item.composition_score !== null && (
                          <View className="flex flex-row items-center">
                            <Text className="text-xs text-muted-foreground w-12">构图</Text>
                            <View className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <View
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(item.composition_score / 30) * 100}%`
                                }}
                              />
                            </View>
                          </View>
                        )}
                        {item.pose_score !== null && (
                          <View className="flex flex-row items-center">
                            <Text className="text-xs text-muted-foreground w-12">姿态</Text>
                            <View className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <View
                                className="h-full bg-secondary rounded-full"
                                style={{
                                  width: `${(item.pose_score / 30) * 100}%`
                                }}
                              />
                            </View>
                          </View>
                        )}
                      </View>

                      {/* 时间 */}
                      <Text className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 底部间距 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
