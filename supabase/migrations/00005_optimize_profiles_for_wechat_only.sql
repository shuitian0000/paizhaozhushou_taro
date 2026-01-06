/*
# 优化用户表结构 - 仅支持微信登录

## 1. 修改profiles表
- 删除字段：
  - `username` - 不再支持用户名登录
  - `phone` - 不需要手机号
  - `email` - 不需要邮箱
  - `password_hash` - 不需要密码
- 添加字段：
  - `nickname` (text) - 微信昵称
  - `avatar_url` (text) - 微信头像URL
- 修改字段：
  - `openid` 设置为UNIQUE - 每个微信用户只能有一个账号

## 2. 更新触发器
- 修改handle_new_user()函数，只处理微信登录
- 从raw_user_meta_data中提取nickname和avatar_url

## 3. 安全策略
- 保持现有RLS策略不变
*/

-- 删除旧的触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- 删除不需要的字段（如果存在）
ALTER TABLE profiles DROP COLUMN IF EXISTS username;
ALTER TABLE profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
ALTER TABLE profiles DROP COLUMN IF EXISTS password_hash;

-- 添加新字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 修改openid为UNIQUE（先删除旧索引）
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_openid;
ALTER TABLE profiles ADD CONSTRAINT profiles_openid_unique UNIQUE (openid);
CREATE INDEX IF NOT EXISTS idx_profiles_openid ON profiles(openid);

-- 更新触发器函数 - 只处理微信登录
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_openid text;
  extracted_nickname text;
  extracted_avatar text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 从raw_user_meta_data中提取微信信息
  extracted_openid := COALESCE((NEW.raw_user_meta_data->>'openid')::text, NULL);
  extracted_nickname := COALESCE((NEW.raw_user_meta_data->>'nickname')::text, '微信用户');
  extracted_avatar := COALESCE((NEW.raw_user_meta_data->>'avatar_url')::text, NULL);
  
  -- 插入用户信息（只支持微信登录）
  INSERT INTO public.profiles (id, openid, nickname, avatar_url, role)
  VALUES (
    NEW.id,
    extracted_openid,
    extracted_nickname,
    extracted_avatar,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar_url = EXCLUDED.avatar_url;
  
  RETURN NEW;
END;
$$;

-- 重新创建触发器
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- 更新注释
COMMENT ON TABLE profiles IS '用户信息表（仅支持微信登录）';
COMMENT ON COLUMN profiles.openid IS '微信OpenID（唯一标识）';
COMMENT ON COLUMN profiles.nickname IS '微信昵称';
COMMENT ON COLUMN profiles.avatar_url IS '微信头像URL';
COMMENT ON COLUMN profiles.role IS '用户角色';
