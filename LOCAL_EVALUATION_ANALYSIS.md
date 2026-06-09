# 照片本地评估算法深度分析报告

> 分析时间：2026-02-27  
> 算法版本：v3.0（优化后）  
> 文档版本：v1.0

---

## 一、算法流程详解

### 1.1 整体处理流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    evaluatePhotoLocally()                        │
│                    (主入口函数)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: 初始化                                                  │
│  - 创建 OffscreenCanvas (300x400)                               │
│  - 获取 Canvas 2D 上下文                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: 图片加载                                               │
│  - 创建 Image 对象                                              │
│  - 绘制到 Canvas                                                │
│  - 获取 ImageData (RGBA 像素数组)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: 图像分析阶段 (7个核心指标)                            │
│                                                                     │
│  3.1 analyzeImageData()                                          │
│      - 灰度转换: L = 0.299*R + 0.587*G + 0.114*B               │
│      - 亮度统计: mean, histogram, darkRatio, brightRatio         │
│      ✓ 一次遍历，同时计算灰度数组和亮度信息                     │
│                                                                     │
│  3.2 analyzeContrast()                                           │
│      - 标准差计算: stdDev = sqrt(Σ(x-mean)² / N)                │
│      ✓ 复用灰度数据，避免重复遍历                               │
│                                                                     │
│  3.3 analyzeColorSaturation()                                    │
│      - 饱和度: S = (max-min) / max                              │
│                                                                     │
│  3.4 analyzeEdges()                                              │
│      - Sobel 算子边缘检测                                       │
│      - edgeStrength, detailRichness                             │
│      - highContrastPixels 数组                                   │
│      ✓ 修复后：预分配数组，索引正确                             │
│                                                                     │
│  3.5 analyzeRuleOfThirds()                                       │
│      - 四个交叉点区域兴趣度                                     │
│      ✓ 复用灰度数据                                            │
│                                                                     │
│  3.6 analyzeCenterFocus()                                        │
│      - 中心 vs 边缘区域对比度                                   │
│      ✓ 复用灰度数据                                            │
│                                                                     │
│  3.7 analyzeSubjectSize()                                        │
│      - subjectRatio (主体占比)                                  │
│      - centerDensity (中心密度)                                 │
│      ✓ 复用边缘检测结果                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: 评分计算阶段                                           │
│                                                                     │
│  4.1 构图得分 (30分)                                            │
│      compositionBase = ruleOfThirds*0.5                         │
│                     + centerFocus*0.3                           │
│                     + detailRichness*0.2                        │
│      compositionScore = compositionBase * 30                   │
│      + 加分项: detailRichness > 0.6 时 +2分                    │
│                                                                     │
│  4.2 角度得分 (20分)                                            │
│      angleBase = contrast*0.5 + edgeStrength*0.5               │
│      angleScore = angleBase * 20                                │
│      + 加分项: contrast > 0.6 时 +2分                           │
│                                                                     │
│  4.3 距离得分 (10分)                                            │
│      基于 subjectRatio 分段:                                     │
│      - 40-60%: 10分 (理想)                                     │
│      - 30-70%: 8分 (可接受)                                    │
│      - 20-80%: 6分 (需调整)                                    │
│      - <20%: 4分 (太远)                                        │
│      - >80%: 5分 (太近)                                        │
│                                                                     │
│  4.4 光线得分 (10分)                                            │
│      基于 brightness.mean 分段:                                  │
│      - 0.35-0.65: 10分 (理想)                                   │
│      - 0.25-0.75: 8分 (可接受)                                 │
│      - 0.15-0.85: 6分 (需调整)                                 │
│      + 加分项: saturation 0.3-0.7 时 +1分                       │
│      - 减分项: darkRatio/brightRatio > 0.4 时 -2分            │
│                                                                     │
│  4.5 姿态得分 (20分)                                            │
│      - poseScore = null (本地无法评估)                          │
│      - poseBaseScore: 18-22分 (场景自适应)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: 建议生成阶段                                           │
│                                                                     │
│  5.1 构图建议 (3级: poor/fair/good)                             │
│      - 基于 ruleOfThirds, centerFocus, detailRichness           │
│                                                                     │
│  5.2 角度建议 (3级)                                             │
│      - 基于 contrast, edgeStrength, centerFocus                │
│                                                                     │
│  5.3 距离建议 (3级)                                              │
│      - 基于 subjectRatio 精确判断                                │
│                                                                     │
│  5.4 机位建议 (3级)                                              │
│      - 基于 brightness, saturation, darkRatio, brightRatio       │
│                                                                     │
│  5.5 姿态建议 (人像场景)                                        │
│      - 基于 isPortrait/isLandscape 判断                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: 场景判断                                                │
│                                                                     │
│  portrait: centerFocus>0.7 && detailRichness>0.5               │
│  landscape: centerFocus<0.4 && ruleOfThirds>0.6                 │
│  group: centerFocus>0.5 && ruleOfThirds>0.5                    │
│  other: 其他情况                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 7: 返回结果                                                │
│                                                                     │
│  {                                                               │
│    total_score: 0-100,                                          │
│    composition_score: 0-30,                                     │
│    angle_score: 0-20,                                           │
│    distance_score: 0-10,                                        │
│    height_score: 0-10,                                          │
│    pose_score: null,                                            │
│    suggestions: {...},                                          │
│    scene_type: 'portrait'|'landscape'|'group'|'other'          │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心算法详解

#### 1.2.1 亮度分析 (analyzeImageData)

```typescript
// 公式: ITU-R BT.601 标准亮度公式
Luminance = 0.299*R + 0.587*G + 0.114*B

// 直方图构建
histogram[round(brightness)]++

// 平均亮度
mean = totalBrightness / pixelCount  // 归一化到 0-1

// 暗部/亮部比例
darkRatio = pixels(brightness < 85) / totalPixels
brightRatio = pixels(brightness > 170) / totalPixels
```

**配置参数：**
| 参数 | 值 | 说明 |
|------|-----|------|
| darkThreshold | 85 | 暗部阈值 |
| brightThreshold | 170 | 亮部阈值 |
| idealMin | 0.35 | 理想亮度最小值 |
| idealMax | 0.65 | 理想亮度最大值 |

---

#### 1.2.2 饱和度分析 (analyzeColorSaturation)

```typescript
// HSL 色彩空间饱和度公式
max = Math.max(R, G, B)
min = Math.min(R, G, B)
saturation = max === 0 ? 0 : (max - min) / max
```

**配置参数：**
| 参数 | 值 | 说明 |
|------|-----|------|
| idealMin | 0.3 | 理想饱和度最小值 |
| idealMax | 0.7 | 理想饱和度最大值 |

---

#### 1.2.3 边缘检测 (analyzeEdges) - Sobel算子

```typescript
// 水平方向梯度 (Gx)
Gx = [
  [-1,  0, +1],
  [-2,  0, +2],
  [-1,  0, +1]
]

// 垂直方向梯度 (Gy)
Gy = [
  [-1, -2, -1],
  [ 0,  0,  0],
  [+1, +2, +1]
]

// 梯度幅值
magnitude = sqrt(Gx² + Gy²)

// 边缘强度
edgeStrength = avg(magnitude) / 500  // 归一化

// 细节丰富度
detailRichness = edgePixels / totalPixels * 2  // 归一化
```

**配置参数：**
| 参数 | 值 | 说明 |
|------|-----|------|
| sobelThreshold | 50 | 边缘判定阈值 |
| sobelNormalization | 500 | 归一化因子 |
| detailThreshold | 0.6 | 细节丰富度阈值 |

---

#### 1.2.4 对比度分析 (analyzeContrast)

```typescript
// 标准差作为对比度指标
mean = Σbrightness / N
variance = Σ(brightness - mean)² / N
stdDev = sqrt(variance)

// 归一化
contrast = min(stdDev / 128, 1)
```

---

#### 1.2.5 三分法构图 (analyzeRuleOfThirds)

```typescript
// 四个黄金交叉点
points = [
  {x: width/3,   y: height/3},   // 左上
  {x: 2*width/3, y: height/3},   // 右上
  {x: width/3,   y: 2*height/3}, // 左下
  {x: 2*width/3, y: 2*height/3}  // 右下
]

// 每个点周围 20x20 区域的兴趣度
interest = |brightness - 128|  // 相对于中性灰的偏差

// 归一化得分
score = min(totalInterest / (4 * 128), 1)
```

---

#### 1.2.6 中心焦点 (analyzeCenterFocus)

```typescript
// 区域划分
centerRegion = distFromCenter < min(w,h)/4
edgeRegion = distFromCenter > min(w,h)/2

// 计算各区域兴趣度
centerInterest = Σ|brightness - 128| (center pixels)
edgeInterest = Σ|brightness - 128| (edge pixels)

// 中心应该比边缘更有"兴趣"
score = centerAvg > edgeAvg ? centerAvg/128 : 0.5
```

---

#### 1.2.7 主体大小 (analyzeSubjectSize)

```typescript
// 基于高对比度像素（边缘）估算主体
subjectRatio = highContrastPixels / totalPixels * 10  // 归一化

// 中心密度
centerDensity = centerHighContrastPixels / centerPixels * 2
```

---

## 二、算法合理性评价

### 2.1 优点

| 方面 | 评价 | 说明 |
|------|------|------|
| **理论基础** | ⭐⭐⭐⭐⭐ | 采用标准摄影理论（三分法、黄金分割、Sobel边缘检测） |
| **性能优化** | ⭐⭐⭐⭐⭐ | 已合并灰度计算，复用预计算数据，减少重复遍历 |
| **配置管理** | ⭐⭐⭐⭐⭐ | 阈值参数化，支持灵活调整 |
| **代码结构** | ⭐⭐⭐⭐⭐ | 模块化设计，函数职责清晰 |
| **建议生成** | ⭐⭐⭐⭐☆ | 分级建议（poor/fair/good），具体明确 |
| **错误处理** | ⭐⭐⭐⭐☆ | 有基本的 try-catch 和空值保护 |

### 2.2 潜在问题

| 问题 | 严重程度 | 说明 | 解决方案 |
|------|----------|------|----------|
| **Canvas尺寸限制** | 中 | 最大300x400像素，小图可能损失精度 | 可提升到500x500 |
| **主体识别不准确** | 中 | 依赖边缘检测，纹理复杂的背景可能误判 | 引入颜色分割或深度学习 |
| **姿态评估缺失** | 低 | pose_score返回null，无法本地评估 | 结合云端AI |
| **场景判断简化** | 中 | 仅用centerFocus和detailRichness判断 | 引入更多特征 |
| **归一化因子硬编码** | 低 | 部分(128,500)可配置化 | 已优化为CONFIG |

---

## 三、准确性分析

### 3.1 评分体系

```
总分 = composition(30) + angle(20) + distance(10) + height(10) + pose(20)
     = 90分 (姿态基于场景预估，非实际评估)
```

| 维度 | 评分方法 | 理论准确性 | 实际准确性 | 原因 |
|------|----------|------------|------------|------|
| **构图** | 三分点兴趣度+中心焦点+细节 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 依赖灰度对比，非语义理解 |
| **角度** | 对比度+边缘强度 | ⭐⭐⭐ | ⭐⭐⭐ | 无法判断实际拍摄角度 |
| **距离** | 主体占比(subjectRatio) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 边缘检测可反映主体轮廓 |
| **光线** | 亮度+饱和度+曝光 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 数学计算准确 |
| **姿态** | 场景预设 | ⭐⭐ | ⭐ | 本地无法评估 |

### 3.2 场景识别准确度

| 场景 | 判断条件 | 准确度 | 说明 |
|------|----------|--------|------|
| 人像 | centerFocus>0.7 && detailRichness>0.5 | ⭐⭐⭐ | 可能误判中心区域丰富风景照 |
| 风景 | centerFocus<0.4 && ruleOfThirds>0.6 | ⭐⭐⭐ | 可能误判边缘构图人像 |
| 合影 | centerFocus>0.5 && ruleOfThirds>0.5 | ⭐⭐ | 与人像条件重叠 |

---

## 四、已完成的优化

### 4.1 代码优化 (2026-02-27)

| 步骤 | 内容 | 状态 |
|------|------|------|
| 1 | 修复 `analyzeEdges` 的 `highContrastPixels` 数组构建错误 | ✅ |
| 2 | 修复 `analyzeRuleOfThirds` 使用预计算灰度数据 | ✅ |
| 3 | 修复 `analyzeCenterFocus` 使用预计算灰度数据 | ✅ |
| 4 | 合并 `analyzeImageData` 与 `precomputeGrayscale` | ✅ |
| 5 | 添加 `exposureThreshold` 配置项 | ✅ |

### 4.2 优化详情

#### 优化1: analyzeEdges 数组修复

**问题：** 原代码在循环中反复使用 `push/unshift`，导致数组长度混乱

**修复：**
```typescript
// 之前：数组长度不确定
const highContrastPixels: boolean[] = []
for (...) {
  highContrastPixels.push(isHighEdge)
  highContrastPixels.unshift(false)  // 错误！
}

// 现在：预分配正确长度
const highContrastPixels: boolean[] = new Array(width * height).fill(false)
for (...) {
  highContrastPixels[idx] = isHighEdge  // 直接索引赋值
}
```

#### 优化2: 灰度数据复用

**修复：** 添加可选参数 `precomputedGray`

```typescript
// 之前：重复计算亮度
function analyzeRuleOfThirds(imageData) {
  const {data} = imageData
  for (...) {
    const brightness = getBrightness(r, g, b)  // 重复计算
  }
}

// 现在：复用预计算数据
function analyzeRuleOfThirds(imageData, precomputedGray?) {
  const gray = precomputedGray || precomputeGrayscale(imageData)
  for (...) {
    const brightness = gray[grayIdx]  // 直接使用
  }
}
```

#### 优化3: 合并像素遍历

**修复：** `analyzeImageData` 一次遍历同时输出灰度数组和亮度统计

```typescript
// 之前：两次遍历
const grayScale = precomputeGrayscale(imageData)
const brightnessInfo = analyzeBrightnessDistribution(imageData)

// 现在：一次遍历
const {gray: grayScale, brightness: brightnessInfo} = analyzeImageData(imageData)
```

---

## 五、改进建议

### 5.1 短期优化

| 优先级 | 优化项 | 预期效果 | 难度 |
|--------|--------|----------|------|
| 高 | 提高Canvas分辨率 | 小图精度提升 | 低 |
| 中 | 增加面部检测辅助 | 人像判断更准 | 中 |
| 低 | 自适应阈值 | 场景适应性更强 | 中 |

### 5.2 长期方向

| 方向 | 方案 | 预期效果 |
|------|------|----------|
| AI辅助评估 | 结合云端AI | 姿态识别、构图建议更准确 |
| 主体分割 | 显著性检测/深度学习 | 距离评估更准确 |
| 个性化 | 用户反馈学习 | 评分更符合用户审美 |

---

## 六、总结

### 6.1 综合评分

| 指标 | 评分 |
|------|------|
| 代码质量 | ⭐⭐⭐⭐☆ (4/5) |
| 算法合理性 | ⭐⭐⭐☆☆ (3.5/5) |
| 准确性 | ⭐⭐⭐☆☆ (3/5) |
| 性能 | ⭐⭐⭐⭐☆ (4/5) |
| 可维护性 | ⭐⭐⭐⭐⭐ (5/5) |

### 6.2 结论

该算法作为一个**轻量级本地评估方案**是**合理且可行**的：

✅ 核心指标计算基于标准图像处理理论  
✅ 性能优化到位，响应速度快  
✅ 代码结构清晰，易于维护  
✅ 建议生成具体明确，用户体验好  

⚠️ 对于专业摄影评估，建议结合云端AI能力提升准确性

---

**文档创建时间：** 2026-02-27  
**分析版本：** localEvaluation.ts v3.0
