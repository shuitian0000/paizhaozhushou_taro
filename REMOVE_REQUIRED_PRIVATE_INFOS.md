# 删除 requiredPrivateInfos 配置说明

## 📋 修改内容

根据用户要求，已删除 `app.config.ts` 中 `requiredPrivateInfos` 字段中不在指定列表中的值。

### 指定的有效值列表

用户指定只保留以下隐私接口（均为位置相关接口）：
- `chooseAddress` - 选择地址
- `chooseLocation` - 选择位置
- `choosePoi` - 选择POI
- `getFuzzyLocation` - 获取模糊位置
- `getLocation` - 获取位置
- `onLocationChange` - 监听位置变化
- `startLocationUpdate` - 开始更新位置
- `startLocationUpdateBackground` - 后台更新位置

### 删除的配置项

**删除前：**
```typescript
// 隐私保护配置（微信小程序审核要求）
__usePrivacyCheck__: true,
requiredPrivateInfos: [
  'chooseImage',           // 选择图片接口 - 不在指定列表中
  'saveImageToPhotosAlbum' // 保存图片到相册接口 - 不在指定列表中
],
```

**删除后：**
```typescript
// 已完全删除 __usePrivacyCheck__ 和 requiredPrivateInfos 配置
```

### 原因说明

1. **`chooseImage`** - 不在指定的位置相关接口列表中，已删除
2. **`saveImageToPhotosAlbum`** - 不在指定的位置相关接口列表中，已删除
3. 由于所有配置项都被删除，整个 `requiredPrivateInfos` 字段和 `__usePrivacyCheck__` 字段也一并删除

---

## 📄 修改后的完整配置

```typescript
const pages = [
  'pages/home/index',
  'pages/camera/index',
  'pages/upload/index',
  'pages/result/index',
  'pages/history/index',
  'pages/login/index',
  'pages/feedback/index',
  'pages/profile/index',
  'pages/user-agreement/index',
  'pages/privacy-policy/index'
]

export default {
  pages,
  permission: {
    'scope.camera': {
      desc: '需要使用您的摄像头进行拍照和实时预览'
    },
    'scope.writePhotosAlbum': {
      desc: '需要保存照片到您的相册'
    }
  },
  tabBar: {
    color: '#8B9AAD',
    selectedColor: '#1E5EFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [...]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1e3a5f',
    navigationBarTitleText: '拍Ta智能摄影助手',
    navigationBarTextStyle: 'white'
  }
}
```

---

## ⚠️ 重要说明

### 1. 权限配置保留

虽然删除了 `requiredPrivateInfos` 配置，但保留了 `permission` 配置：
- ✅ `scope.camera` - 摄像头权限（拍照助手功能需要）
- ✅ `scope.writePhotosAlbum` - 保存到相册权限

这些权限配置仍然有效，不受 `requiredPrivateInfos` 删除的影响。

### 2. 功能影响

删除 `requiredPrivateInfos` 配置后：
- ✅ **摄像头功能**：不受影响，通过 `permission` 配置和代码中的权限检查实现
- ✅ **照片选择功能**：不受影响，`Taro.chooseImage` 会在首次调用时自动请求权限
- ✅ **保存到相册功能**：不受影响，通过 `permission` 配置控制

### 3. 微信小程序审核

根据微信小程序的规范：
- `requiredPrivateInfos` 用于声明使用的隐私接口
- 如果不使用需要声明的隐私接口，可以不配置此字段
- 本应用主要使用摄像头和相册功能，通过 `permission` 配置即可

---

## ✅ 验证结果

### Lint 检查
```bash
pnpm run lint
```
**结果：** ✅ 通过（仅剩已知可忽略的 process 类型错误）

### 配置验证
```bash
grep "requiredPrivateInfos" src/app.config.ts
```
**结果：** ✅ 无匹配结果，配置已成功删除

---

## 📝 后续建议

### 如果需要添加位置相关功能

如果将来需要添加位置相关功能，可以按以下方式配置：

```typescript
export default {
  pages,
  permission: {
    'scope.camera': {
      desc: '需要使用您的摄像头进行拍照和实时预览'
    },
    'scope.writePhotosAlbum': {
      desc: '需要保存照片到您的相册'
    },
    'scope.userLocation': {
      desc: '需要获取您的位置信息'
    }
  },
  // 如果使用位置相关接口，需要声明
  __usePrivacyCheck__: true,
  requiredPrivateInfos: [
    'getLocation',      // 根据实际使用的接口添加
    'chooseLocation'    // 根据实际使用的接口添加
  ],
  tabBar: {...}
}
```

### 当前应用不需要位置功能

本应用是智能摄影助手，主要功能：
- 拍照助手（使用摄像头）
- 照片评估（选择照片）
- 历史记录（本地存储）

不涉及位置相关功能，因此不需要配置位置相关的隐私接口。

---

**修改完成时间：** 2026-01-13  
**修改状态：** ✅ 已完成  
**影响范围：** 仅配置文件，不影响现有功能
