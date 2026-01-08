# requiredPrivateInfos 字段分析报告

## 📋 当前配置

**位置：** `src/app.config.ts`

```typescript
requiredPrivateInfos: ['chooseImage', 'chooseMedia', 'saveImageToPhotosAlbum', 'camera']
```

---

## 🔍 实际使用情况分析

### 1. ✅ chooseImage（正在使用）

**声明：** 已在 `requiredPrivateInfos` 中声明  
**实际使用：** ✅ 是

**使用位置：**
- `src/utils/upload.ts:115` - `Taro.chooseImage()` 函数
- `src/pages/upload/index.tsx:17` - 照片评估页面选择图片
- `src/pages/feedback/index.tsx:27` - 反馈页面选择图片

**使用场景：**
```typescript
// src/utils/upload.ts
export async function chooseImage(count = 1): Promise<UploadFileInput[] | null> {
  const res = await Taro.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  })
  // ...
}
```

**结论：** ✅ 必须保留，实际使用中

---

### 2. ❌ chooseMedia（未使用）

**声明：** 已在 `requiredPrivateInfos` 中声明  
**实际使用：** ❌ 否

**搜索结果：**
```bash
grep -r "Taro.chooseMedia" src/
# 无结果
```

**分析：**
- 代码中没有使用 `Taro.chooseMedia()` 接口
- 只使用了 `Taro.chooseImage()` 接口
- `chooseMedia` 是更新的接口，可以选择图片和视频
- `chooseImage` 只能选择图片

**结论：** ❌ 可以删除，代码中未使用

---

### 3. ✅ saveImageToPhotosAlbum（正在使用）

**声明：** 已在 `requiredPrivateInfos` 中声明  
**实际使用：** ✅ 是

**使用位置：**
- `src/pages/camera/index.tsx:220` - 拍照助手页面保存照片
- `src/pages/camera/index.tsx:287` - 拍照助手页面保存照片

**使用场景：**
```typescript
// src/pages/camera/index.tsx
await Taro.saveImageToPhotosAlbum({
  filePath: tempImagePath
})
```

**结论：** ✅ 必须保留，实际使用中

---

### 4. ✅ camera（正在使用）

**声明：** 已在 `requiredPrivateInfos` 中声明  
**实际使用：** ✅ 是

**使用位置：**
- `src/pages/camera/index.tsx:464` - 使用 `<Camera>` 组件

**使用场景：**
```typescript
// src/pages/camera/index.tsx
<Camera
  className="w-full h-full"
  mode="normal"
  devicePosition={devicePosition}
  flash="off"
  onInitDone={handleCameraReady}
  onError={handleCameraError}
/>
```

**结论：** ✅ 必须保留，实际使用中

---

## 📊 汇总结果

| 隐私接口 | 是否声明 | 是否使用 | 建议 |
|---------|---------|---------|------|
| chooseImage | ✅ | ✅ | 保留 |
| chooseMedia | ✅ | ❌ | **删除** |
| saveImageToPhotosAlbum | ✅ | ✅ | 保留 |
| camera | ✅ | ✅ | 保留 |

---

## ⚠️ 问题发现

### 问题：声明了未使用的隐私接口

**当前配置：**
```typescript
requiredPrivateInfos: ['chooseImage', 'chooseMedia', 'saveImageToPhotosAlbum', 'camera']
```

**问题：**
- 声明了 `chooseMedia` 但代码中未使用
- 这可能导致微信审核时产生疑问
- 微信可能要求说明为什么声明了但不使用

**影响：**
- 可能影响小程序审核
- 增加不必要的隐私声明
- 用户可能对隐私保护产生疑虑

---

## ✅ 修复建议

### 建议：删除未使用的 chooseMedia

**修改前：**
```typescript
requiredPrivateInfos: ['chooseImage', 'chooseMedia', 'saveImageToPhotosAlbum', 'camera']
```

**修改后：**
```typescript
requiredPrivateInfos: ['chooseImage', 'saveImageToPhotosAlbum', 'camera']
```

**理由：**
1. **代码中未使用** - 搜索整个代码库，没有找到 `Taro.chooseMedia()` 的调用
2. **功能重复** - `chooseImage` 已经满足需求（选择图片）
3. **减少隐私声明** - 只声明实际使用的接口，更符合隐私保护原则
4. **避免审核问题** - 避免微信审核时询问为什么声明了但不使用

---

## 🔧 修复步骤

### 步骤1：修改 app.config.ts

**文件：** `src/app.config.ts`

**修改内容：**
```typescript
// 修改前
requiredPrivateInfos: ['chooseImage', 'chooseMedia', 'saveImageToPhotosAlbum', 'camera']

// 修改后
requiredPrivateInfos: ['chooseImage', 'saveImageToPhotosAlbum', 'camera']
```

---

### 步骤2：同步更新秒哒平台配置

**重要：** 修改代码后，需要同步更新秒哒平台的隐私保护指引配置

**操作：**
1. 登录秒哒平台
2. 进入"用户隐私保护指引"配置
3. 删除或不配置 `chooseMedia` 相关的隐私信息采集
4. 保持其他3项配置不变：
   - 用户信息（微信昵称、头像）
   - 选中的照片（对应 `chooseImage`）
   - 摄像头（对应 `camera`）
   - 相册（仅写入）（对应 `saveImageToPhotosAlbum`）

---

### 步骤3：验证修改

**检查清单：**
- [ ] `app.config.ts` 中删除了 `chooseMedia`
- [ ] 代码中确实没有使用 `Taro.chooseMedia()`
- [ ] 秒哒平台配置已同步更新
- [ ] 运行 `pnpm run lint` 检查无错误

---

## 📝 chooseImage vs chooseMedia 说明

### chooseImage（旧接口）
- **功能：** 只能选择图片
- **支持格式：** JPG、PNG 等图片格式
- **本项目使用：** ✅ 是

### chooseMedia（新接口）
- **功能：** 可以选择图片和视频
- **支持格式：** 图片 + 视频
- **本项目使用：** ❌ 否

### 为什么本项目只需要 chooseImage？

**原因：**
1. 本项目是"智能摄影助手"，只处理照片，不处理视频
2. 所有功能都是基于照片的评估和分析
3. 不需要视频选择功能

**结论：**
- 使用 `chooseImage` 足够满足需求
- 不需要 `chooseMedia`

---

## 🎯 修改后的最终配置

### app.config.ts 完整配置

```typescript
export default {
  pages: [
    'pages/home/index',
    'pages/camera/index',
    'pages/upload/index',
    'pages/result/index',
    'pages/history/index',
    'pages/login/index',
    'pages/feedback/index'
  ],
  permission: {
    'scope.camera': {
      desc: '需要使用您的摄像头进行拍照和实时预览'
    },
    'scope.writePhotosAlbum': {
      desc: '需要保存照片到您的相册'
    }
  },
  // 隐私保护配置
  __usePrivacyCheck__: true,
  requiredPrivateInfos: ['chooseImage', 'saveImageToPhotosAlbum', 'camera'], // 删除了 chooseMedia
  tabBar: {
    color: '#8B9AAD',
    selectedColor: '#1E5EFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: './assets/images/unselected/home.png',
        selectedIconPath: './assets/images/selected/home.png'
      },
      {
        pagePath: 'pages/history/index',
        text: '记录',
        iconPath: './assets/images/unselected/history.png',
        selectedIconPath: './assets/images/selected/history.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1e3a5f',
    navigationBarTitleText: '智能摄影助手',
    navigationBarTextStyle: 'white'
  }
}
```

---

## 📊 修改前后对比

### 修改前（4项）
```typescript
requiredPrivateInfos: [
  'chooseImage',        // ✅ 使用中
  'chooseMedia',        // ❌ 未使用
  'saveImageToPhotosAlbum', // ✅ 使用中
  'camera'              // ✅ 使用中
]
```

### 修改后（3项）
```typescript
requiredPrivateInfos: [
  'chooseImage',        // ✅ 使用中
  'saveImageToPhotosAlbum', // ✅ 使用中
  'camera'              // ✅ 使用中
]
```

---

## ✅ 修改的好处

1. **更准确的隐私声明**
   - 只声明实际使用的接口
   - 符合最小化原则

2. **避免审核问题**
   - 减少微信审核时的疑问
   - 避免被要求说明未使用的接口

3. **提升用户信任**
   - 用户看到的隐私声明更精准
   - 不会产生"为什么声明了但不用"的疑虑

4. **简化配置**
   - 减少不必要的配置项
   - 降低维护成本

---

## 🚨 注意事项

### 1. 同步更新秒哒平台配置

**重要：** 修改代码后，必须同步更新秒哒平台的配置，否则可能导致：
- 代码声明与平台配置不一致
- 提交失败
- 审核被拒

### 2. 如果未来需要视频功能

如果未来需要添加视频选择功能：
1. 将 `chooseImage` 改为 `chooseMedia`
2. 或同时保留 `chooseImage` 和 `chooseMedia`
3. 更新秒哒平台配置
4. 更新隐私保护指引说明

---

## 📞 相关文档

- `MIAODA_THIRD_PARTY_DEV_SOLUTION.md` - 秒哒代开发模式解决方案
- `MIAODA_QUICK_CHECKLIST.md` - 快速检查清单
- `WECHAT_PRIVACY_GUIDE.md` - 隐私保护指引填写指南

---

**最后更新：** 2025-01-04  
**文档版本：** v1.0
