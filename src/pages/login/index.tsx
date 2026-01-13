import {Button, Image, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getAndClearLoginRedirectPath, wechatLogin} from '@/utils/auth'
import {chooseImage} from '@/utils/upload'

export default function LoginPage() {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // 检查运行环境
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  useDidShow(() => {
    // 重置状态
    setAgreed(false)
    setNickname('')
    setAvatarUrl('')
  })

  // 登录成功后的处理
  const handleLoginSuccess = useCallback(() => {
    const redirectPath = getAndClearLoginRedirectPath()

    if (redirectPath) {
      // 检查是否是tabBar页面
      const tabBarPages = ['/pages/home/index', '/pages/history/index', '/pages/profile/index']
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

  // 选择头像（微信小程序）
  const handleChooseAvatar = useCallback((e: any) => {
    const {avatarUrl: url} = e.detail
    setAvatarUrl(url)
    console.log('选择头像:', url)
  }, [])

  // 选择头像（H5环境）
  const handleChooseAvatarH5 = useCallback(async () => {
    const images = await chooseImage(1)
    if (images && images.length > 0) {
      setAvatarUrl(images[0].path)
      console.log('选择头像(H5):', images[0].path)
    }
  }, [])

  // 输入昵称
  const handleNicknameInput = useCallback((e: any) => {
    const value = e.detail.value
    setNickname(value)
  }, [])

  // 微信登录
  const handleWechatLogin = useCallback(async () => {
    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (!nickname || !avatarUrl) {
      Taro.showToast({title: '请先选择头像和输入昵称', icon: 'none'})
      return
    }

    if (loading) return

    setLoading(true)
    const result = await wechatLogin(nickname, avatarUrl)
    setLoading(false)

    if (result.success) {
      Taro.showToast({title: '登录成功', icon: 'success'})
      setTimeout(() => {
        handleLoginSuccess()
      }, 1000)
    } else {
      // 检查是否是配置问题
      if (result.message?.includes('invalid appid') || result.message?.includes('appid')) {
        Taro.showModal({
          title: '配置提示',
          content: '微信小程序登录功能需要配置AppID和AppSecret。请联系管理员在Supabase后台配置环境变量。',
          showCancel: false
        })
      } else {
        Taro.showToast({title: result.message || '登录失败', icon: 'none', duration: 2000})
      }
    }
  }, [agreed, loading, nickname, avatarUrl, handleLoginSuccess])

  return (
    <View className="min-h-screen bg-gradient-dark">
      <ScrollView scrollY className="h-screen" style={{background: 'transparent'}}>
        <View className="px-6 py-12">
          {/* Logo和标题 */}
          <View className="text-center mb-12 mt-8">
            <View className="i-mdi-camera text-6xl text-primary mb-4" />
            <Text className="text-3xl font-bold gradient-text block mb-2">拍Ta智能摄影助手</Text>
            <Text className="text-sm text-muted-foreground block">专业摄影评估，助力完美拍摄</Text>
          </View>

          {/* 登录卡片 */}
          <View className="bg-card rounded-2xl p-6 shadow-elegant mb-6">
            <Text className="text-xl font-bold text-foreground block mb-6 text-center">微信登录</Text>

            {/* 头像和昵称填写 */}
            <View className="mb-6">
              <Text className="text-sm text-foreground block mb-3">完善个人信息</Text>

              {/* 头像选择 */}
              <View className="flex flex-col items-center mb-4">
                {/* 微信小程序环境 */}
                {isWeapp && (
                  <Button
                    className="p-0 bg-transparent border-0"
                    style={{background: 'transparent', border: 'none', padding: 0}}
                    openType="chooseAvatar"
                    onChooseAvatar={handleChooseAvatar}>
                    <View className="relative">
                      {avatarUrl ? (
                        <Image src={avatarUrl} mode="aspectFill" className="w-20 h-20 rounded-full" />
                      ) : (
                        <View className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                          <View className="i-mdi-camera text-3xl text-muted-foreground" />
                        </View>
                      )}
                      <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <View className="i-mdi-pencil text-sm text-white" />
                      </View>
                    </View>
                  </Button>
                )}

                {/* H5 环境 */}
                {isH5 && (
                  <Button
                    className="p-0 bg-transparent border-0"
                    style={{background: 'transparent', border: 'none', padding: 0}}
                    onClick={handleChooseAvatarH5}>
                    <View className="relative">
                      {avatarUrl ? (
                        <Image src={avatarUrl} mode="aspectFill" className="w-20 h-20 rounded-full" />
                      ) : (
                        <View className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                          <View className="i-mdi-camera text-3xl text-muted-foreground" />
                        </View>
                      )}
                      <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <View className="i-mdi-pencil text-sm text-white" />
                      </View>
                    </View>
                  </Button>
                )}
                <Text className="text-xs text-muted-foreground mt-2">点击选择头像</Text>
              </View>

              {/* 昵称输入 */}
              <View className="bg-input rounded-xl border border-border px-4 py-3">
                <Input
                  type="nickname"
                  className="w-full text-foreground"
                  style={{padding: 0, border: 'none', background: 'transparent'}}
                  placeholder="请输入昵称"
                  placeholderClass="text-muted-foreground"
                  value={nickname}
                  onInput={handleNicknameInput}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-2">* 头像和昵称仅用于个人资料展示</Text>
            </View>

            {/* 功能说明 */}
            <View className="bg-muted/30 rounded-xl p-4 mb-6">
              <View className="flex flex-row items-start mb-3">
                <View className="i-mdi-check-circle text-lg text-primary mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground block font-medium mb-1">快速登录</Text>
                  <Text className="text-xs text-muted-foreground block">使用微信一键登录，无需注册</Text>
                </View>
              </View>
              <View className="flex flex-row items-start mb-3">
                <View className="i-mdi-shield-check text-lg text-primary mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground block font-medium mb-1">安全可靠</Text>
                  <Text className="text-xs text-muted-foreground block">微信官方授权，保护您的隐私</Text>
                </View>
              </View>
              <View className="flex flex-row items-start">
                <View className="i-mdi-cloud-sync text-lg text-primary mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm text-foreground block font-medium mb-1">数据同步</Text>
                  <Text className="text-xs text-muted-foreground block">评估记录云端保存，随时查看</Text>
                </View>
              </View>
            </View>

            {/* 微信登录按钮 */}
            <Button
              className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base mb-4"
              size="default"
              onClick={handleWechatLogin}>
              {loading ? '登录中...' : '微信授权登录'}
            </Button>

            {/* 用户协议 */}
            <View className="flex flex-row items-center justify-center">
              <View
                className={`w-4 h-4 rounded border-2 mr-2 flex items-center justify-center ${
                  agreed ? 'bg-primary border-primary' : 'border-border'
                }`}
                onClick={() => setAgreed(!agreed)}>
                {agreed && <View className="i-mdi-check text-xs text-white" />}
              </View>
              <Text className="text-xs text-muted-foreground">
                我已阅读并同意
                <Text
                  className="text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    Taro.navigateTo({url: '/pages/user-agreement/index'})
                  }}>
                  《用户协议》
                </Text>
                和
                <Text
                  className="text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    Taro.navigateTo({url: '/pages/privacy-policy/index'})
                  }}>
                  《隐私政策》
                </Text>
              </Text>
            </View>
          </View>

          {/* 提示信息 */}
          <View className="bg-muted/20 rounded-xl p-4">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-lg text-primary mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground block leading-relaxed">登录后可以：</Text>
                <Text className="text-xs text-muted-foreground block leading-relaxed">• 保存评估历史记录</Text>
                <Text className="text-xs text-muted-foreground block leading-relaxed">• 查看历史评估结果</Text>
                <Text className="text-xs text-muted-foreground block leading-relaxed">• 提交建议和反馈</Text>
                <Text className="text-xs text-muted-foreground block leading-relaxed mt-2">
                  未登录也可以使用拍照助手和照片评估功能，但不会保存历史记录。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
