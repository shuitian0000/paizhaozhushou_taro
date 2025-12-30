/*
# 创建照片评估表和存储桶

## 1. 新建表
- `photo_evaluations` - 照片评估记录表
  - `id` (uuid, 主键) - 记录ID
  - `photo_url` (text, 非空) - 照片URL
  - `evaluation_type` (text, 非空) - 评估类型：realtime(实时拍照) 或 upload(上传照片)
  - `total_score` (integer, 非空) - 总分 (0-100)
  - `composition_score` (integer) - 构图得分 (0-30)
  - `pose_score` (integer) - 姿态得分 (0-30)
  - `angle_score` (integer) - 角度得分 (0-20)
  - `distance_score` (integer) - 距离得分 (0-10)
  - `height_score` (integer) - 高度得分 (0-10)
  - `suggestions` (jsonb) - 改进建议JSON
  - `scene_type` (text) - 场景类型：portrait(人像)、landscape(风景)、group(合影)等
  - `created_at` (timestamptz) - 创建时间

## 2. 存储桶
- 创建 `app-8l12za1oblz5_photos` 存储桶用于存储照片
- 文件大小限制：1MB
- 允许所有用户上传（无需登录）

## 3. 安全策略
- 表为公开表，不启用RLS
- 所有用户可以查看和创建评估记录
- 存储桶允许公开访问和上传
*/

-- 创建评估类型枚举
CREATE TYPE evaluation_type AS ENUM ('realtime', 'upload');

-- 创建场景类型枚举
CREATE TYPE scene_type AS ENUM ('portrait', 'landscape', 'group', 'other');

-- 创建照片评估表
CREATE TABLE IF NOT EXISTS photo_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url text NOT NULL,
  evaluation_type evaluation_type NOT NULL,
  total_score integer NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  composition_score integer CHECK (composition_score >= 0 AND composition_score <= 30),
  pose_score integer CHECK (pose_score >= 0 AND pose_score <= 30),
  angle_score integer CHECK (angle_score >= 0 AND angle_score <= 20),
  distance_score integer CHECK (distance_score >= 0 AND distance_score <= 10),
  height_score integer CHECK (height_score >= 0 AND height_score <= 10),
  suggestions jsonb,
  scene_type scene_type,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_photo_evaluations_created_at ON photo_evaluations(created_at DESC);
CREATE INDEX idx_photo_evaluations_type ON photo_evaluations(evaluation_type);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('app-8l12za1oblz5_photos', 'app-8l12za1oblz5_photos', true, 1048576)
ON CONFLICT (id) DO NOTHING;

-- 存储桶策略：允许所有人上传
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'app-8l12za1oblz5_photos');

-- 存储桶策略：允许所有人查看
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'app-8l12za1oblz5_photos');

-- 插入示例数据
INSERT INTO photo_evaluations (
  photo_url,
  evaluation_type,
  total_score,
  composition_score,
  pose_score,
  angle_score,
  distance_score,
  height_score,
  suggestions,
  scene_type
) VALUES 
(
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'upload'::evaluation_type,
  85,
  26,
  28,
  18,
  8,
  5,
  '{"composition": "构图采用三分法，主体位置合理", "pose": "人物姿态自然，表情生动", "angle": "拍摄角度略高，建议平视或略低", "distance": "拍摄距离适中", "height": "机位高度可以再降低一些，增强视觉冲击力"}'::jsonb,
  'portrait'::scene_type
),
(
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'upload'::evaluation_type,
  78,
  24,
  0,
  16,
  9,
  9,
  '{"composition": "风景构图较好，天空与地面比例协调", "angle": "拍摄角度常规，可尝试更低或更高的视角", "distance": "拍摄距离合适，景深表现良好", "height": "机位高度适中"}'::jsonb,
  'landscape'::scene_type
),
(
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
  'realtime'::evaluation_type,
  72,
  22,
  25,
  15,
  6,
  4,
  '{"composition": "构图略显平淡，建议调整主体位置", "pose": "人物姿态较好", "angle": "角度需要调整，建议向左移动", "distance": "距离稍远，建议靠近主体", "height": "机位偏低，建议提高"}'::jsonb,
  'portrait'::scene_type
);