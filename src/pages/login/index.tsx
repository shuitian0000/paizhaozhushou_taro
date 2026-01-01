import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getAndClearLoginRedirectPath, usernameLogin, usernameRegister, wechatLogin} from '@/utils/auth'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    // 清空表单
    setUsername('')
    setPassword('')
    setAgreed(false)
  })

  // 登录成功后的处理
  const handleLoginSuccess = useCallback(() => {
    const redirectPath = getAndClearLoginRedirectPath()

    if (redirectPath) {
      // 检查是否是tabBar页面
      const tabBarPages = ['/pages/home/index', '/pages/history/index']
      if (tabBarPages.includes(redirectPath)) {
        Taro.switchTab({url: redirectPath})
      } else {
        Taro.navigateTo({url: redirectPath})
      }
    } else {
      // 默认跳转到首页
      Taro.switchTab({url: '/pages/home/index'})
    }
  }, [])

  // 微信登录
  const handleWechatLogin = useCallback(async () => {
    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (loading) return

    setLoading(true)
    const result = await wechatLogin()
    setLoading(false)

    if (result.success) {
      Taro.showToast({title: '登录成功', icon: 'success'})
      setTimeout(() => {
        handleLoginSuccess()
      }, 1000)
    } else {
      Taro.showToast({title: result.message || '登录失败', icon: 'none', duration: 2000})
    }
  }, [agreed, loading, handleLoginSuccess])

  // 用户名密码登录
  const handleUsernameLogin = useCallback(async () => {
    if (!username || !password) {
      Taro.showToast({title: '请输入用户名和密码', icon: 'none'})
      return
    }

    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (loading) return

    setLoading(true)
    const result = await usernameLogin(username, password)
    setLoading(false)

    if (result.success) {
      Taro.showToast({title: '登录成功', icon: 'success'})
      setTimeout(() => {
        handleLoginSuccess()
      }, 1000)
    } else {
      Taro.showToast({title: result.message || '登录失败', icon: 'none', duration: 2000})
    }
  }, [username, password, agreed, loading, handleLoginSuccess])

  // 用户名密码注册
  const handleUsernameRegister = useCallback(async () => {
    if (!username || !password) {
      Taro.showToast({title: '请输入用户名和密码', icon: 'none'})
      return
    }

    if (password.length < 6) {
      Taro.showToast({title: '密码至少6位', icon: 'none'})
      return
    }

    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (loading) return

    setLoading(true)
    const result = await usernameRegister(username, password)
    setLoading(false)

    if (result.success) {
      Taro.showToast({title: '注册成功', icon: 'success'})
      setTimeout(() => {
        handleLoginSuccess()
      }, 1000)
    } else {
      Taro.showToast({title: result.message || '注册失败', icon: 'none', duration: 2000})
    }
  }, [username, password, agreed, loading, handleLoginSuccess])

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY style={{height: '100vh', background: 'transparent'}}>
        <View className="px-6 py-12">
          {/* Logo和标题 */}
          <View className="flex flex-col items-center mb-12">
            <View className="i-mdi-camera-iris text-6xl text-primary mb-4" />
            <Text className="text-3xl font-bold text-white mb-2">智能摄影助手</Text>
            <Text className="text-sm text-muted-foreground">登录以保存您的评估记录</Text>
          </View>

          {/* 切换登录/注册 */}
          <View className="flex flex-row gap-3 mb-8">
            <View
              className={`flex-1 py-3 rounded-xl text-center ${mode === 'login' ? 'bg-primary' : 'bg-card border border-border'}`}
              onClick={() => setMode('login')}>
              <Text className={`text-base font-medium ${mode === 'login' ? 'text-white' : 'text-foreground'}`}>
                登录
              </Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-xl text-center ${mode === 'register' ? 'bg-primary' : 'bg-card border border-border'}`}
              onClick={() => setMode('register')}>
              <Text className={`text-base font-medium ${mode === 'register' ? 'text-white' : 'text-foreground'}`}>
                注册
              </Text>
            </View>
          </View>

          {/* 用户名密码表单 */}
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-sm text-white mb-2">用户名</Text>
              <View className="bg-card rounded-xl border border-border px-4 py-3">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="请输入用户名"
                  placeholderClass="text-muted-foreground"
                  value={username}
                  onInput={(e) => setUsername(e.detail.value)}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm text-white mb-2">密码</Text>
              <View className="bg-card rounded-xl border border-border px-4 py-3">
                <Input
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  password
                  placeholder="请输入密码"
                  placeholderClass="text-muted-foreground"
                  value={password}
                  onInput={(e) => setPassword(e.detail.value)}
                />
              </View>
            </View>
          </View>

          {/* 用户协议 */}
          <View className="flex flex-row items-center mb-6" onClick={() => setAgreed(!agreed)}>
            <View
              className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-2 ${agreed ? 'bg-primary border-primary' : 'border-border'}`}>
              {agreed && <View className="i-mdi-check text-white text-sm" />}
            </View>
            <Text className="text-xs text-muted-foreground">我已阅读并同意《用户协议》和《隐私政策》</Text>
          </View>

          {/* 登录/注册按钮 */}
          <Button
            className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base mb-4"
            size="default"
            onClick={mode === 'login' ? handleUsernameLogin : handleUsernameRegister}>
            {loading ? (mode === 'login' ? '登录中...' : '注册中...') : mode === 'login' ? '登录' : '注册'}
          </Button>

          {/* 微信登录 */}
          <View className="relative mb-6">
            <View className="absolute inset-0 flex items-center">
              <View className="w-full border-t border-border" />
            </View>
            <View className="relative flex justify-center">
              <Text className="bg-background px-4 text-xs text-muted-foreground">或</Text>
            </View>
          </View>

          <Button
            className="w-full bg-green-600 text-white py-4 rounded-xl break-keep text-base"
            size="default"
            onClick={handleWechatLogin}>
            <View className="flex flex-row items-center justify-center">
              <View className="i-mdi-wechat text-xl mr-2" />
              <Text className="text-white">微信快捷登录</Text>
            </View>
          </Button>

          {/* 提示信息 */}
          <View className="mt-8 bg-card rounded-xl p-4 border border-border">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-primary text-xl mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">
                  • 微信登录仅在小程序中可用，网页端请使用用户名密码登录{'\n'}•
                  登录后可保存评估记录，未登录也可正常使用功能{'\n'}• 用户名只能包含字母、数字和下划线
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
