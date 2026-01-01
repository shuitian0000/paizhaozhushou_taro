/*
# 创建用户表和添加user_id关联

## 1. 新建表
- `profiles` - 用户信息表
  - `id` (uuid, 主键, 引用auth.users) - 用户ID
  - `username` (text, 唯一) - 用户名
  - `openid` (text) - 微信OpenID（不唯一，同一微信用户可能有多个账号）
  - `role` (user_role, 默认'user') - 用户角色
  - `created_at` (timestamptz) - 创建时间

## 2. 修改现有表
- `photo_evaluations` 添加 `user_id` 字段
  - `user_id` (uuid, 可选, 引用profiles) - 用户ID
  - 未登录用户的评估记录user_id为NULL

## 3. 触发器
- `handle_new_user()` - 自动同步auth.users到profiles
  - 首个用户自动设为admin
  - 微信登录用户同步openid
  - 用户名登录用户同步username

## 4. 安全策略
- profiles表启用RLS
- 管理员可以查看和修改所有用户
- 普通用户只能查看和修改自己的信息（不能修改role）
- photo_evaluations表启用RLS
- 用户只能查看自己的评估记录
- 未登录用户的记录（user_id为NULL）不可见
*/

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 创建用户信息表
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  openid text,  -- 不设置UNIQUE，同一微信用户可能有多个账号
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_openid ON profiles(openid);

-- 添加user_id到photo_evaluations表
ALTER TABLE photo_evaluations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_photo_evaluations_user_id ON photo_evaluations(user_id);

-- 创建自动同步用户的触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
  extracted_openid text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 提取username（从邮箱中提取@前面的部分，如果不是微信登录）
  IF NEW.email LIKE '%@wechat.login' THEN
    extracted_username := NULL;
  ELSE
    extracted_username := split_part(NEW.email, '@', 1);
  END IF;
  
  -- 提取openid（从raw_user_meta_data中获取）
  extracted_openid := COALESCE((NEW.raw_user_meta_data->>'openid')::text, NULL);
  
  -- 插入用户信息
  INSERT INTO public.profiles (id, username, openid, role)
  VALUES (
    NEW.id,
    extracted_username,
    extracted_openid,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_evaluations ENABLE ROW LEVEL SECURITY;

-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- profiles表的RLS策略
CREATE POLICY "管理员可以查看所有用户" ON profiles
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以修改所有用户" ON profiles
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的信息" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以修改自己的信息" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- photo_evaluations表的RLS策略
CREATE POLICY "用户可以查看自己的评估记录" ON photo_evaluations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "用户可以创建自己的评估记录" ON photo_evaluations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "管理员可以查看所有评估记录" ON photo_evaluations
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- 添加注释
COMMENT ON TABLE profiles IS '用户信息表';
COMMENT ON COLUMN profiles.username IS '用户名（用户名登录）';
COMMENT ON COLUMN profiles.openid IS '微信OpenID（微信登录，不唯一）';
COMMENT ON COLUMN profiles.role IS '用户角色';
COMMENT ON COLUMN photo_evaluations.user_id IS '用户ID（未登录用户为NULL）';
