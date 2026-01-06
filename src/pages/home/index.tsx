import {Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import type {Profile} from '@/db/types'
import {getCurrentUser, getCurrentUserId, navigateToLogin} from '@/utils/auth'

export default function Home() {
  const [user, setUser] = useState<Profile | null>(null)

  const loadUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }, [])

  useDidShow(() => {
    loadUser()
  })

  const handleRealtimeMode = () => {
    Taro.navigateTo({url: '/pages/camera/index'})
  }

  const handleUploadMode = () => {
    Taro.navigateTo({url: '/pages/upload/index'})
  }

  const handleHistory = () => {
    Taro.navigateTo({url: '/pages/history/index'})
  }

  const handleLogin = () => {
    navigateToLogin()
  }

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        {/* 头部 */}
        <View className="px-6 pt-12 pb-8">
          <View className="flex flex-col items-center">
            <View className="i-mdi-camera-iris text-6xl text-primary mb-4" />
            <Text className="text-3xl font-bold text-white text-center mb-2">智能摄影助手</Text>
            <Text className="text-base text-muted-foreground text-center">AI驱动的专业摄影指导工具</Text>
          </View>

          {/* 用户信息 */}
          {user ? (
            <View className="mt-6 bg-card rounded-2xl p-4 shadow-card border border-border">
              <View className="flex flex-row items-center">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} mode="aspectFill" className="w-12 h-12 rounded-full mr-3" />
                ) : (
                  <View className="i-mdi-account-circle text-3xl text-primary mr-3" />
                )}
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{user.nickname}</Text>
                  <Text className="text-xs text-muted-foreground">已登录</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="mt-6 bg-card rounded-2xl p-4 shadow-card border border-border" onClick={handleLogin}>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <View className="i-mdi-account-circle text-3xl text-muted-foreground mr-3" />
                  <View>
                    <Text className="text-base font-semibold text-foreground">未登录</Text>
                    <Text className="text-xs text-muted-foreground">登录以保存评估记录</Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
              </View>
            </View>
          )}
        </View>

        {/* 功能卡片 */}
        <View className="px-6 space-y-4">
          {/* 拍照助手 */}
          <View className="bg-gradient-primary rounded-2xl p-6 shadow-elegant" onClick={handleRealtimeMode}>
            <View className="flex flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex flex-row items-center mb-2">
                  <View className="i-mdi-camera text-3xl text-white mr-3" />
                  <Text className="text-2xl font-bold text-white">拍照助手</Text>
                </View>
                <Text className="text-sm text-white opacity-90 mb-2">实时分析取景画面，提供即时建议和评分</Text>

                {/* 隐私保护提示 */}
                <View className="flex flex-row items-center mb-3 bg-white bg-opacity-15 rounded-lg px-3 py-2">
                  <View className="i-mdi-shield-check text-base text-white mr-2" />
                  <Text className="text-xs text-white font-medium">照片仅保存到您的手机相册，不上传云端</Text>
                </View>

                <View className="flex flex-row flex-wrap gap-2">
                  <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">实时评分</Text>
                  </View>
                  <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">构图建议</Text>
                  </View>
                  <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">姿态指导</Text>
                  </View>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-3xl text-white ml-4" />
            </View>
          </View>

          {/* 照片评估 */}
          <View className="bg-gradient-secondary rounded-2xl p-6 shadow-elegant" onClick={handleUploadMode}>
            <View className="flex flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex flex-row items-center mb-2">
                  <View className="i-mdi-image-search text-3xl text-white mr-3" />
                  <Text className="text-2xl font-bold text-white">照片评估</Text>
                </View>
                <Text className="text-sm text-white opacity-90 mb-2">上传已拍摄照片，获取详细评估报告</Text>

                {/* 隐私保护提示 */}
                <View className="flex flex-row items-center mb-3 bg-white bg-opacity-15 rounded-lg px-3 py-2">
                  <View className="i-mdi-shield-lock text-base text-white mr-2" />
                  <Text className="text-xs text-white font-medium">照片仅用于AI分析，不会存储或泄露</Text>
                </View>

                <View className="flex flex-row flex-wrap gap-2">
                  <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">综合评分</Text>
                  </View>
                  <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">详细分析</Text>
                  </View>
                  <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">改进建议</Text>
                  </View>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-3xl text-white ml-4" />
            </View>
          </View>

          {/* 历史记录 */}
          <View className="bg-card rounded-2xl p-5 shadow-card border border-border" onClick={handleHistory}>
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <View className="i-mdi-history text-2xl text-primary mr-3" />
                <View>
                  <Text className="text-lg font-semibold text-foreground mb-1">历史记录</Text>
                  <Text className="text-sm text-muted-foreground">查看所有评估记录</Text>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
            </View>
          </View>

          {/* 建议和吐槽 */}
          <View
            className="bg-card rounded-2xl p-5 shadow-card border border-border"
            onClick={async () => {
              const userId = await getCurrentUserId()
              if (!userId) {
                Taro.showModal({
                  title: '提示',
                  content: '需要登录后才能提交反馈，是否前往登录？',
                  success: (res) => {
                    if (res.confirm) {
                      navigateToLogin('/pages/home/index')
                    }
                  }
                })
                return
              }
              Taro.navigateTo({url: '/pages/feedback/index'})
            }}>
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <View className="i-mdi-message-text text-2xl text-secondary mr-3" />
                <View>
                  <Text className="text-lg font-semibold text-foreground mb-1">建议和吐槽</Text>
                  <Text className="text-sm text-muted-foreground">帮助我们改进产品</Text>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
            </View>
          </View>
        </View>

        {/* 评分维度说明 */}
        <View className="px-6 py-8">
          <Text className="text-lg font-semibold text-white mb-4">评分维度</Text>
          <View className="space-y-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-grid text-xl text-primary mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-white mb-1">构图合理性 (30%)</Text>
                <Text className="text-xs text-muted-foreground">基于三分法、黄金螺旋等构图理论</Text>
              </View>
            </View>
            <View className="flex flex-row items-start">
              <View className="i-mdi-human-handsup text-xl text-secondary mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-white mb-1">人物姿态 (30%)</Text>
                <Text className="text-xs text-muted-foreground">姿态自然度、表情状态</Text>
              </View>
            </View>
            <View className="flex flex-row items-start">
              <View className="i-mdi-angle-acute text-xl text-accent mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-white mb-1">拍摄角度 (20%)</Text>
                <Text className="text-xs text-muted-foreground">角度新颖性、主体突出度</Text>
              </View>
            </View>
            <View className="flex flex-row items-start">
              <View className="i-mdi-ruler text-xl text-primary mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-white mb-1">拍摄距离 (10%)</Text>
                <Text className="text-xs text-muted-foreground">主体清晰度、环境协调度</Text>
              </View>
            </View>
            <View className="flex flex-row items-start">
              <View className="i-mdi-arrow-expand-vertical text-xl text-secondary mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-white mb-1">机位高度 (10%)</Text>
                <Text className="text-xs text-muted-foreground">视角选择合理性</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部间距 */}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
