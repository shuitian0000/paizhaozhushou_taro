# 智能摄影助手微信小程序

一款基于AI技术的智能摄影辅助工具，通过实时分析拍摄场景和人物姿态，为用户提供专业的摄影构图建议和评分，帮助用户快速提升摄影水平。

## 核心功能

### 1. 拍照助手模式
- 📷 调用手机相机，全屏显示取景画面
- 🤖 实时分析当前拍摄场景（景色、人物）
- 💡 提供即时建议：
  - 拍摄角度调整建议
  - 拍摄距离调整建议
  - 机位高度调整建议
  - 人物pose调整建议
- ⭐ 实时为当前镜头画面打分（0-100分）
- 📊 显示打分依据和改进方向

### 2. 照片评估模式
- 📤 用户上传已拍摄照片
- 🔍 系统自动分析照片
- 📈 输出照片综合评分（0-100分）
- 📋 提供详细评估报告：
  - 构图分析
  - 人物姿态评估
  - 角度距离评价
  - 改进建议

### 3. 历史记录
- 📚 查看所有评估记录
- 🔖 按类型筛选（实时拍摄/上传照片）
- 📊 统计数据展示

## 评分体系

### 评分维度
- **构图合理性（30%）**：基于三分法、黄金螺旋等构图理论
- **人物姿态（30%）**：姿态自然度、表情状态
- **拍摄角度（20%）**：角度新颖性、主体突出度
- **拍摄距离（10%）**：主体清晰度、环境协调度
- **机位高度（10%）**：视角选择合理性

## 技术栈

- **前端框架**：Taro + React + TypeScript
- **样式方案**：Tailwind CSS
- **后端服务**：Supabase
  - 数据库：PostgreSQL
  - 存储：Supabase Storage
  - 函数：Edge Functions
- **AI能力**：文心一言多模态API
- **状态管理**：Zustand

## 项目结构

```
src/
├── pages/              # 页面
│   ├── home/          # 首页
│   ├── camera/        # 拍照助手
│   ├── upload/        # 照片评估
│   ├── result/        # 评估结果
│   └── history/       # 历史记录
├── db/                # 数据库操作
│   ├── types.ts       # 类型定义
│   └── api.ts         # API函数
├── utils/             # 工具函数
│   ├── upload.ts      # 图片上传
│   └── ai.ts          # AI分析
├── client/            # 客户端配置
│   └── supabase.ts    # Supabase客户端
└── app.config.ts      # 应用配置

supabase/
├── migrations/        # 数据库迁移
└── functions/         # Edge Functions
    └── analyze-photo/ # AI分析函数
```

## 数据库设计

### photo_evaluations 表
- `id`: 记录ID
- `photo_url`: 照片URL
- `evaluation_type`: 评估类型（realtime/upload）
- `total_score`: 总分（0-100）
- `composition_score`: 构图得分（0-30）
- `pose_score`: 姿态得分（0-30）
- `angle_score`: 角度得分（0-20）
- `distance_score`: 距离得分（0-10）
- `height_score`: 高度得分（0-10）
- `suggestions`: 改进建议（JSON）
- `scene_type`: 场景类型
- `created_at`: 创建时间

### Storage Bucket
- `app-8l12za1oblz5_photos`: 照片存储桶

## 使用说明

### 拍照助手
1. 点击首页"拍照助手"卡片
2. 允许相机权限
3. 对准拍摄对象
4. 查看实时评分和建议
5. 点击拍照按钮进行拍摄和分析
6. 查看详细评估报告

### 照片评估
1. 点击首页"照片评估"卡片
2. 选择要评估的照片
3. 点击"开始分析"
4. 等待AI分析完成
5. 查看详细评估报告和改进建议

### 历史记录
1. 点击底部"记录"标签
2. 查看所有评估记录
3. 使用筛选器按类型查看
4. 点击记录查看详情

## 特色功能

- ✨ **专业配色**：深蓝科技风格，符合摄影专业定位
- 🎨 **渐变设计**：丰富的渐变效果提升视觉体验
- 📱 **响应式布局**：完美适配各种屏幕尺寸
- 🚀 **流畅动画**：平滑的过渡和交互反馈
- 🔒 **数据安全**：使用Supabase保障数据安全
- 🤖 **AI驱动**：文心一言多模态模型提供专业分析

## 开发说明

本项目使用Taro框架开发，支持编译为微信小程序和H5应用。

### 环境变量
- `TARO_APP_SUPABASE_URL`: Supabase项目URL
- `TARO_APP_SUPABASE_ANON_KEY`: Supabase匿名密钥
- `TARO_APP_APP_ID`: 应用ID

### 主要依赖
- `@tarojs/taro`: Taro核心库
- `@supabase/supabase-js`: Supabase客户端
- `miaoda-taro-utils`: 工具库（包含流式API调用）
- `tailwindcss`: CSS框架

## 版权信息

© 2025 智能摄影助手
