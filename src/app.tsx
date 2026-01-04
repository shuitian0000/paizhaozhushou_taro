/**
 * @file Taro application entry file
 */

import Taro from '@tarojs/taro'
import type React from 'react'
import type {PropsWithChildren} from 'react'
import {useState} from 'react'
import PrivacyModal from '@/components/PrivacyModal'
import {useTabBarPageClass} from '@/hooks/useTabBarPageClass'

import './app.scss'

const App: React.FC = ({children}: PropsWithChildren<unknown>) => {
  useTabBarPageClass()
  const [_showPrivacy, setShowPrivacy] = useState(false)

  const handleAgree = () => {
    console.log('用户同意隐私协议')
    setShowPrivacy(false)
  }

  const handleDisagree = () => {
    console.log('用户不同意隐私协议')
    setShowPrivacy(false)
    Taro.showModal({
      title: '提示',
      content: '您需要同意隐私保护指引才能使用小程序的完整功能',
      showCancel: false,
      confirmText: '我知道了'
    })
  }

  return (
    <>
      {children}
      <PrivacyModal onAgree={handleAgree} onDisagree={handleDisagree} />
    </>
  )
}

export default App
