import {Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import type {Profile} from '@/db/types'
import {getCurrentUser, logout, navigateToLogin} from '@/utils/auth'

export default function ProfilePage() {
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

  const handleLogin = () => {
    navigateToLogin('/pages/profile/index')
  }

  const handleHistory = () => {
    Taro.navigateTo({url: '/pages/history/index'})
  }

  const handleFeedback = () => {
    Taro.navigateTo({url: '/pages/feedback/index'})
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await logout()
            setUser(null)
            Taro.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 2000
            })
          } catch (error) {
            console.error('退出登录失败:', error)
            Taro.showToast({
              title: '退出失败',
              icon: 'error',
              duration: 2000
            })
          }
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        {/* 用户信息卡片 */}
        <View className="px-6 pt-8 pb-6">
          {user ? (
            <View className="bg-gradient-primary rounded-2xl p-6 shadow-elegant">
              <View className="flex flex-row items-center">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} mode="aspectFill" className="w-16 h-16 rounded-full mr-4" />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                    <View className="i-mdi-account text-4xl text-white" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">{user.nickname || '用户'}</Text>
                  <Text className="text-sm text-white opacity-80">已登录</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-card rounded-2xl p-6 shadow-card border border-border" onClick={handleLogin}>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <View className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mr-4">
                    <View className="i-mdi-account text-4xl text-muted-foreground" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-foreground mb-1">未登录</Text>
                    <Text className="text-sm text-muted-foreground">点击登录以保存记录</Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
              </View>
            </View>
          )}
        </View>

        {/* 功能列表 */}
        <View className="px-6 space-y-4">
          {/* 记录 */}
          <View className="bg-card rounded-2xl p-5 shadow-card border border-border" onClick={handleHistory}>
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <View className="i-mdi-history text-2xl text-primary mr-3" />
                <View>
                  <Text className="text-lg font-semibold text-foreground mb-1">记录</Text>
                  <Text className="text-sm text-muted-foreground">查看所有评估记录</Text>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
            </View>
          </View>

          {/* 建议和吐槽 */}
          <View className="bg-card rounded-2xl p-5 shadow-card border border-border" onClick={handleFeedback}>
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

          {/* 退出登录 */}
          {user && (
            <View className="bg-card rounded-2xl p-5 shadow-card border border-border" onClick={handleLogout}>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <View className="i-mdi-logout text-2xl text-destructive mr-3" />
                  <View>
                    <Text className="text-lg font-semibold text-destructive mb-1">退出账号</Text>
                    <Text className="text-sm text-muted-foreground">退出当前登录账号</Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
              </View>
            </View>
          )}
        </View>

        {/* 底部间距 */}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
