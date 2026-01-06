// 数据库类型定义

export type EvaluationType = 'realtime' | 'upload'
export type SceneType = 'portrait' | 'landscape' | 'group' | 'other'
export type UserRole = 'user' | 'admin'
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved'

export interface Profile {
  id: string
  openid: string
  nickname: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface UserFeedback {
  id: string
  user_id: string
  content: string
  images: string[] | null
  status: FeedbackStatus
  created_at: string
  updated_at: string
}

export interface CreateFeedbackInput {
  content: string
  images?: string[]
  user_id: string
}

export interface PhotoEvaluation {
  id: string
  photo_url: string | null // 可选，为保护隐私不强制保存
  evaluation_type: EvaluationType
  total_score: number
  composition_score: number | null
  pose_score: number | null
  angle_score: number | null
  distance_score: number | null
  height_score: number | null
  suggestions: {
    composition?: string
    pose?: string
    angle?: string
    distance?: string
    height?: string
  } | null
  scene_type: SceneType | null
  user_id: string | null // 用户ID，未登录用户为NULL
  created_at: string
}

export interface CreateEvaluationInput {
  photo_url?: string // 可选，为保护隐私不强制保存
  evaluation_type: EvaluationType
  total_score: number
  composition_score?: number
  pose_score?: number
  angle_score?: number
  distance_score?: number
  height_score?: number
  suggestions?: {
    composition?: string
    pose?: string
    angle?: string
    distance?: string
    height?: string
  }
  scene_type?: SceneType
  user_id?: string // 用户ID，未登录时不传
}
