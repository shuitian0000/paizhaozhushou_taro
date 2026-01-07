import {Button, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useEffect, useState} from 'react'

interface PrivacyModalProps {
  onAgree: () => void
  onDisagree: () => void
}

/**
 * 隐私保护指引弹窗组件
 * 用于展示小程序隐私保护指引，符合微信小程序审核要求
 */
export default function PrivacyModal({onAgree, onDisagree}: PrivacyModalProps) {
  const [visible, setVisible] = useState(false)
  const [privacyContractName, setPrivacyContractName] = useState('')

  useEffect(() => {
    // 检查是否需要显示隐私弹窗
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      // 获取隐私协议信息
      const privacyResolves = new Set<any>()
      const privacyRejects = new Set<any>()

      // 监听隐私协议需要用户同意事件
      if (Taro.onNeedPrivacyAuthorization) {
        Taro.onNeedPrivacyAuthorization((resolve: any, reject: any) => {
          privacyResolves.add(resolve)
          privacyRejects.add(reject)
          setVisible(true)
        })
      }

      // 获取隐私协议名称
      if (Taro.getPrivacySetting) {
        Taro.getPrivacySetting({
          success: (res: any) => {
            console.log('隐私协议信息:', res)
            if (res.needAuthorization) {
              setPrivacyContractName(res.privacyContractName || '《用户隐私保护指引》')
            }
          },
          fail: (err: any) => {
            console.error('获取隐私协议信息失败:', err)
          }
        })
      }
      // 保存resolve和reject函数供按钮调用
      ;(window as any).__privacyResolves = privacyResolves
      ;(window as any).__privacyRejects = privacyRejects
    }
  }, [])

  const handleAgree = () => {
    setVisible(false)
    const resolves = (window as any).__privacyResolves as Set<() => void>
    if (resolves) {
      resolves.forEach((resolve) => resolve())
      resolves.clear()
    }
    onAgree()
  }

  const handleDisagree = () => {
    setVisible(false)
    const rejects = (window as any).__privacyRejects as Set<() => void>
    if (rejects) {
      rejects.forEach((reject) => reject())
      rejects.clear()
    }
    onDisagree()
  }

  if (!visible) {
    return null
  }

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <View className="bg-card rounded-2xl mx-6 p-6 max-w-sm">
        {/* 标题 */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-foreground text-center block">用户隐私保护提示</Text>
        </View>

        {/* 内容 */}
        <View className="mb-6">
          <Text className="text-sm text-muted-foreground leading-relaxed block mb-4">
            感谢您使用智能摄影助手！为了向您提供更好的服务，我们需要获取以下权限：
          </Text>

          <View className="bg-muted/30 rounded-lg p-4 mb-4">
            <View className="mb-2">
              <Text className="text-sm text-foreground block">• 相册权限（仅写入）</Text>
              <Text className="text-xs text-muted-foreground block ml-4 mt-1">用于保存拍摄的照片到您的相册</Text>
            </View>
            <View className="mb-2">
              <Text className="text-sm text-foreground block">• 摄像头权限</Text>
              <Text className="text-xs text-muted-foreground block ml-4 mt-1">用于拍照助手的实时预览和拍摄功能</Text>
            </View>
            <View>
              <Text className="text-sm text-foreground block">• 选择图片权限</Text>
              <Text className="text-xs text-muted-foreground block ml-4 mt-1">用于照片评估功能上传照片</Text>
            </View>
          </View>

          <Text className="text-xs text-muted-foreground leading-relaxed block mb-1">我们承诺：</Text>
          <Text className="text-xs text-muted-foreground leading-relaxed block">• 不会上传或保存您的照片到云端</Text>
          <Text className="text-xs text-muted-foreground leading-relaxed block">• 所有照片分析均在本地完成</Text>
          <Text className="text-xs text-muted-foreground leading-relaxed block">• 仅保存评估结果，不保存照片URL</Text>
          <Text className="text-xs text-muted-foreground leading-relaxed block">• 评估记录保存30天后自动删除</Text>
          <Text className="text-xs text-muted-foreground leading-relaxed block">
            • 您可以随时删除历史记录或注销账号
          </Text>

          <Text className="text-xs text-muted-foreground leading-relaxed block mt-4">
            第三方服务：我们使用Supabase提供数据存储服务（仅存储评估结果，不存储照片）
          </Text>

          <Text className="text-xs text-muted-foreground leading-relaxed block mt-4">
            请阅读并同意
            <Text className="text-primary">{privacyContractName || '《用户隐私保护指引》'}</Text>
            后继续使用。
          </Text>
        </View>

        {/* 按钮 */}
        <View className="flex flex-row space-x-3">
          <Button
            className="flex-1 bg-muted text-foreground py-3 rounded-xl break-keep text-sm"
            size="default"
            onClick={handleDisagree}>
            不同意
          </Button>
          <Button
            className="flex-1 bg-primary text-white py-3 rounded-xl break-keep text-sm"
            size="default"
            onClick={handleAgree}>
            同意
          </Button>
        </View>
      </View>
    </View>
  )
}
