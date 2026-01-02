/*
# 创建用户反馈表

1. 新建表
    - `user_feedback`
        - `id` (uuid, primary key, default: gen_random_uuid())
        - `user_id` (uuid, references profiles(id), not null)
        - `content` (text, not null) - 反馈内容
        - `images` (text[], nullable) - 反馈图片URL数组
        - `status` (text, default: 'pending', not null) - 状态：pending/reviewed/resolved
        - `created_at` (timestamptz, default: now())
        - `updated_at` (timestamptz, default: now())

2. 安全策略
    - 启用RLS
    - 用户可以创建自己的反馈
    - 用户可以查看自己的反馈
    - 管理员可以查看所有反馈
    - 管理员可以更新反馈状态

3. 索引
    - 为user_id创建索引以提高查询性能
    - 为created_at创建索引以支持按时间排序
*/

-- 创建反馈状态枚举类型
CREATE TYPE feedback_status AS ENUM ('pending', 'reviewed', 'resolved');

-- 创建用户反馈表
CREATE TABLE IF NOT EXISTS user_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    images text[],
    status feedback_status DEFAULT 'pending'::feedback_status NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);

-- 启用RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 用户可以创建自己的反馈
CREATE POLICY "Users can create their own feedback" ON user_feedback
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 用户可以查看自己的反馈
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- 管理员可以查看所有反馈
CREATE POLICY "Admins can view all feedback" ON user_feedback
    FOR SELECT TO authenticated
    USING (is_admin(auth.uid()));

-- 管理员可以更新反馈状态
CREATE POLICY "Admins can update feedback status" ON user_feedback
    FOR UPDATE TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为user_feedback表添加更新时间触发器
CREATE TRIGGER update_user_feedback_updated_at
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
