/*
# 修改photo_url为可选字段

## 变更说明
为了保护用户隐私，应用不再保存用户照片到云端。
- photo_url字段改为可选（允许NULL）
- 评估记录只保存评分和建议，不保存照片URL

## 隐私保护策略
1. 拍照助手：照片只保存到用户手机相册，不上传云端
2. 照片评估：照片上传后仅用于AI分析，分析完成后不保存URL
3. 历史记录：只显示评估结果，不显示照片

## 数据库变更
- photo_evaluations表的photo_url字段改为可选
*/

-- 修改photo_url字段为可选
ALTER TABLE photo_evaluations ALTER COLUMN photo_url DROP NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN photo_evaluations.photo_url IS '照片URL（可选，为保护隐私不强制保存）';
