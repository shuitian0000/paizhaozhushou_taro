// 数据库API函数
import {supabase} from '@/client/supabase'
import type {CreateEvaluationInput, PhotoEvaluation} from './types'

/**
 * 创建照片评估记录
 */
export async function createEvaluation(input: CreateEvaluationInput): Promise<PhotoEvaluation | null> {
  const {data, error} = await supabase.from('photo_evaluations').insert(input).select().maybeSingle()

  if (error) {
    console.error('创建评估记录失败:', error)
    return null
  }

  return data
}

/**
 * 获取最近的评估记录列表
 */
export async function getRecentEvaluations(limit = 20): Promise<PhotoEvaluation[]> {
  const {data, error} = await supabase
    .from('photo_evaluations')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(limit)

  if (error) {
    console.error('获取评估记录失败:', error)
    return []
  }

  return data || []
}

/**
 * 根据评估类型获取记录
 */
export async function getEvaluationsByType(type: 'realtime' | 'upload', limit = 20): Promise<PhotoEvaluation[]> {
  const {data, error} = await supabase
    .from('photo_evaluations')
    .select('*')
    .eq('evaluation_type', type)
    .order('created_at', {ascending: false})
    .limit(limit)

  if (error) {
    console.error('获取评估记录失败:', error)
    return []
  }

  return data || []
}

/**
 * 根据ID获取单个评估记录
 */
export async function getEvaluationById(id: string): Promise<PhotoEvaluation | null> {
  const {data, error} = await supabase.from('photo_evaluations').select('*').eq('id', id)

  if (error) {
    console.error('获取评估记录失败:', error)
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

/**
 * 获取评估统计信息
 */
export async function getEvaluationStats(): Promise<{
  total: number
  avgScore: number
  realtimeCount: number
  uploadCount: number
} | null> {
  try {
    const {data, error} = await supabase.from('photo_evaluations').select('total_score, evaluation_type')

    if (error) {
      console.error('获取统计信息失败:', error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        realtimeCount: 0,
        uploadCount: 0
      }
    }

    const total = data.length
    const avgScore = Math.round(data.reduce((sum, item) => sum + item.total_score, 0) / total)
    const realtimeCount = data.filter((item) => item.evaluation_type === 'realtime').length
    const uploadCount = data.filter((item) => item.evaluation_type === 'upload').length

    return {
      total,
      avgScore,
      realtimeCount,
      uploadCount
    }
  } catch (error) {
    console.error('获取统计信息异常:', error)
    return null
  }
}
