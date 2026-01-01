import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'
import type {Profile} from '@/db/types'

// 获取当前用户ID
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: {session}
    } = await supabase.auth.getSession()
    return session?.user?.id || null
  } catch (error) {
    console.error('获取用户ID失败:', error)
    return null
  }
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return null

    const {data, error} = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (error) {
      console.error('获取用户信息失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 检查是否已登录
export async function isLoggedIn(): Promise<boolean> {
  const userId = await getCurrentUserId()
  return userId !== null
}

// 微信小程序登录
export async function wechatLogin(): Promise<{success: boolean; message?: string}> {
  try {
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) {
      return {
        success: false,
        message: '微信授权登录请在小程序体验，网页端请使用用户名密码登录'
      }
    }

    // 获取微信登录code
    const loginResult = await Taro.login()
    if (!loginResult.code) {
      return {success: false, message: '获取微信登录code失败'}
    }

    // 调用Edge Function
    const {data, error} = await supabase.functions.invoke('wechat-miniprogram-login', {
      body: {code: loginResult.code}
    })

    if (error) {
      const errorMsg = (await error?.context?.text?.()) || error.message
      return {success: false, message: errorMsg}
    }

    if (!data?.token) {
      return {success: false, message: '登录失败，未获取到token'}
    }

    // 验证OTP
    const {error: verifyError} = await supabase.auth.verifyOtp({
      token_hash: data.token,
      type: 'email'
    })

    if (verifyError) {
      return {success: false, message: verifyError.message}
    }

    return {success: true}
  } catch (error: any) {
    console.error('微信登录失败:', error)
    return {success: false, message: error.message || '登录失败'}
  }
}

// 用户名密码登录
export async function usernameLogin(username: string, password: string): Promise<{success: boolean; message?: string}> {
  try {
    if (!username || !password) {
      return {success: false, message: '用户名和密码不能为空'}
    }

    // 用户名转换为邮箱格式
    const email = `${username}@miaoda.com`

    const {error} = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {success: false, message: error.message}
    }

    return {success: true}
  } catch (error: any) {
    console.error('登录失败:', error)
    return {success: false, message: error.message || '登录失败'}
  }
}

// 用户名密码注册
export async function usernameRegister(
  username: string,
  password: string
): Promise<{success: boolean; message?: string}> {
  try {
    if (!username || !password) {
      return {success: false, message: '用户名和密码不能为空'}
    }

    // 验证用户名格式（只允许字母、数字和下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {success: false, message: '用户名只能包含字母、数字和下划线'}
    }

    // 用户名转换为邮箱格式
    const email = `${username}@miaoda.com`

    const {error} = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return {success: false, message: error.message}
    }

    return {success: true}
  } catch (error: any) {
    console.error('注册失败:', error)
    return {success: false, message: error.message || '注册失败'}
  }
}

// 退出登录
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut()
    // 清除本地存储
    Taro.clearStorageSync()
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 保存登录前的路径
export function saveLoginRedirectPath(path: string): void {
  Taro.setStorageSync('loginRedirectPath', path)
}

// 获取并清除登录重定向路径
export function getAndClearLoginRedirectPath(): string | null {
  const path = Taro.getStorageSync('loginRedirectPath')
  if (path) {
    Taro.removeStorageSync('loginRedirectPath')
  }
  return path
}

// 跳转到登录页面
export function navigateToLogin(currentPath?: string): void {
  if (currentPath) {
    saveLoginRedirectPath(currentPath)
  }
  Taro.navigateTo({url: '/pages/login/index'})
}
