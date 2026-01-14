# 微信小程序权限配置完整指南

## 🎯 本应用权限配置总结

### 当前配置（完整且正确）

```typescript
// src/app.config.ts
export default {
  pages,
  permission: {
    // 相机权限 - 用于 Camera 组件
    'scope.camera': {
      desc: '需要使用您的摄像头进行拍照和实时预览'
    },
    // 相册读取权限 - 用于 chooseImage
    'scope.album': {
      desc: '需要访问您的相册以选择照片'
    },
    // 相册写入权限 - 用于 saveImageToPhotosAlbum
    'scope.writePhotosAlbum': {
      desc: '需要保存照片到您的相册'
    }
  },
  // 隐私保护配置（微信小程序审核要求）
  __usePrivacyCheck__: true,
  // ✅ 不声明 requiredPrivateInfos（只用于位置相关接口）
  tabBar: {...},
  window: {...}
}
```

### 配置说明

| 权限 | 用途 | 对应接口 | 状态 | 说明 |
|------|------|---------|------|------|
| **scope.camera** | 使用摄像头 | Camera 组件 | ✅ 已配置 | 拍照助手页面需要 |
| **scope.album** | 读取相册 | chooseImage | ✅ 已配置 | 照片评估、反馈页面需要 |
| **scope.writePhotosAlbum** | 写入相册 | saveImageToPhotosAlbum | ✅ 已配置 | 保存照片到相册需要 |
| **scope.userInfo** | 获取用户信息 | getUserInfo | ❌ 已废弃 | 不需要配置，使用新方式 |

---

## 📚 微信小程序权限体系

### 1. 相机和相册相关权限

#### scope.camera - 相机权限

**用途：** 使用摄像头拍照或录像

**对应接口：**
- Camera 组件
- wx.createCameraContext

**本应用使用：**
- ✅ `src/pages/camera/index.tsx` - 拍照助手页面

**permission 配置：**
```typescript
'scope.camera': {
  desc: '需要使用您的摄像头进行拍照和实时预览'
}
```

#### scope.album - 相册读取权限

**用途：** 从相册选择图片或视频

**对应接口：**
- wx.chooseImage / Taro.chooseImage
- wx.chooseMedia / Taro.chooseMedia
- wx.chooseVideo / Taro.chooseVideo

**本应用使用：**
- ✅ `src/utils/upload.ts` - chooseImage 函数
- ✅ `src/pages/upload/index.tsx` - 照片评估页面
- ✅ `src/pages/feedback/index.tsx` - 反馈页面
- ✅ `src/pages/login/index.tsx` - 登录页面（H5环境）

**permission 配置：**
```typescript
'scope.album': {
  desc: '需要访问您的相册以选择照片'
}
```

#### scope.writePhotosAlbum - 相册写入权限

**用途：** 保存图片或视频到相册

**对应接口：**
- wx.saveImageToPhotosAlbum / Taro.saveImageToPhotosAlbum
- wx.saveVideoToPhotosAlbum / Taro.saveVideoToPhotosAlbum

**本应用使用：**
- ✅ `src/pages/camera/index.tsx` - 拍照助手页面（保存照片）

**permission 配置：**
```typescript
'scope.writePhotosAlbum': {
  desc: '需要保存照片到您的相册'
}
```

### 2. 用户信息相关权限

#### scope.userInfo - 用户信息权限（已废弃）

**状态：** ❌ 已废弃（2021年4月13日起）

**旧方式（不要使用）：**
```typescript
// ❌ 已废弃
wx.getUserInfo({
  success: (res) => {
    console.log(res.userInfo.nickName)
    console.log(res.userInfo.avatarUrl)
  }
})
```

**新方式（推荐使用）：**
```typescript
// ✅ 获取头像
<Button 
  openType="chooseAvatar"
  onChooseAvatar={handleChooseAvatar}>
  选择头像
</Button>

// ✅ 获取昵称
<Input 
  type="nickname"
  placeholder="请输入昵称"
/>
```

**本应用使用：**
- ✅ `src/pages/login/index.tsx` - 使用新方式
- ✅ 不需要 scope.userInfo 权限

**permission 配置：**
- ❌ 不需要配置
- ❌ 配置了也无效

### 3. 位置相关权限

#### scope.userLocation - 精确位置权限

**用途：** 获取用户精确位置

**对应接口：**
- wx.getLocation
- wx.onLocationChange
- wx.startLocationUpdate
- wx.chooseLocation
- wx.choosePoi
- wx.chooseAddress

**本应用使用：**
- ❌ 不使用位置功能

**permission 配置：**
- ❌ 不需要配置

**requiredPrivateInfos 配置：**
- ❌ 不需要配置

#### scope.userFuzzyLocation - 模糊位置权限

**用途：** 获取用户模糊位置

**对应接口：**
- wx.getFuzzyLocation

**本应用使用：**
- ❌ 不使用位置功能

**permission 配置：**
- ❌ 不需要配置

**requiredPrivateInfos 配置：**
- ❌ 不需要配置

#### scope.userLocationBackground - 后台位置权限

**用途：** 在后台获取用户位置

**对应接口：**
- wx.startLocationUpdateBackground

**本应用使用：**
- ❌ 不使用位置功能

**permission 配置：**
- ❌ 不需要配置

**requiredPrivateInfos 配置：**
- ❌ 不需要配置

---

## 🔍 权限配置规则

### 1. permission 配置规则

**作用：**
- 声明小程序需要使用的系统权限
- 提供权限请求时的描述文字
- 帮助用户理解为什么需要这个权限

**配置原则：**
- ✅ 使用了某个接口，必须声明对应权限
- ✅ 提供清晰的权限描述
- ✅ 与代码中的权限检查逻辑匹配
- ❌ 不要声明未使用的权限

**示例：**
```typescript
permission: {
  'scope.camera': {
    desc: '需要使用您的摄像头进行拍照和实时预览'
  }
}
```

### 2. __usePrivacyCheck__ 配置规则

**作用：**
- 启用微信小程序的隐私保护检查
- 确保符合微信小程序审核要求
- 与 permission 配置配合使用

**配置原则：**
- ✅ 设置为 true，启用隐私保护检查
- ✅ 与 permission 配置配合使用
- ✅ 不一定需要 requiredPrivateInfos

**示例：**
```typescript
__usePrivacyCheck__: true
```

### 3. requiredPrivateInfos 配置规则

**作用：**
- 声明小程序使用的隐私接口
- **只用于位置相关接口**

**允许声明的接口：**
- chooseAddress - 选择收货地址
- chooseLocation - 选择位置
- choosePoi - 选择POI
- getFuzzyLocation - 获取模糊位置
- getLocation - 获取精确位置
- onLocationChange - 监听位置变化
- startLocationUpdate - 开始位置更新
- startLocationUpdateBackground - 后台位置更新

**不允许声明的接口：**
- ❌ chooseImage - 选择图片（使用 scope.album）
- ❌ chooseMedia - 选择图片或视频（使用 scope.album）
- ❌ saveImageToPhotosAlbum - 保存图片（使用 scope.writePhotosAlbum）
- ❌ camera - 相机（使用 scope.camera）

**配置原则：**
- ✅ 只声明位置相关接口
- ✅ 只声明实际使用的接口
- ❌ 不使用位置接口时不要声明此字段
- ❌ 声明空数组会导致拦截

**示例：**
```typescript
// ✅ 使用位置接口时
requiredPrivateInfos: ['getLocation', 'chooseLocation']

// ✅ 不使用位置接口时（推荐）
// 不声明此字段

// ❌ 错误：声明空数组
requiredPrivateInfos: []

// ❌ 错误：声明不允许的接口
requiredPrivateInfos: ['chooseImage', 'camera']
```

---

## 📊 权限配置对比

### 本应用 vs 其他常见场景

| 场景 | scope.camera | scope.album | scope.writePhotosAlbum | scope.userInfo | requiredPrivateInfos |
|------|-------------|-------------|----------------------|---------------|---------------------|
| **本应用（摄影助手）** | ✅ 需要 | ✅ 需要 | ✅ 需要 | ❌ 不需要 | ❌ 不需要 |
| **纯相册应用** | ❌ 不需要 | ✅ 需要 | ✅ 需要 | ❌ 不需要 | ❌ 不需要 |
| **纯拍照应用** | ✅ 需要 | ❌ 不需要 | ✅ 需要 | ❌ 不需要 | ❌ 不需要 |
| **地图导航应用** | ❌ 不需要 | ❌ 不需要 | ❌ 不需要 | ❌ 不需要 | ✅ 需要 |
| **社交应用** | ✅ 可能需要 | ✅ 需要 | ✅ 可能需要 | ❌ 不需要 | ❌ 不需要 |

---

## ✅ 最佳实践

### 1. 权限配置最佳实践

**原则：**
- ✅ 最小化权限原则：只声明必需的权限
- ✅ 清晰的描述：让用户理解为什么需要这个权限
- ✅ 与代码匹配：配置与实际使用的接口匹配
- ✅ 及时更新：代码变化时同步更新配置

**示例：**
```typescript
export default {
  pages,
  permission: {
    // ✅ 清晰的描述
    'scope.camera': {
      desc: '需要使用您的摄像头进行拍照和实时预览'
    },
    // ✅ 只声明使用的权限
    'scope.album': {
      desc: '需要访问您的相册以选择照片'
    }
    // ❌ 不声明未使用的权限
    // 'scope.userLocation': {...}
  },
  __usePrivacyCheck__: true,
  // ✅ 不使用位置接口时不声明
  // requiredPrivateInfos: []
}
```

### 2. 权限请求最佳实践

**原则：**
- ✅ 在需要时请求：不要在启动时请求所有权限
- ✅ 提供引导：权限被拒绝后引导用户去设置
- ✅ 优雅降级：权限被拒绝后提供替代方案
- ✅ 透明说明：清楚告诉用户为什么需要这个权限

**示例：**
```typescript
// ✅ 检查权限状态
const {authSetting} = await Taro.getSetting()

if (authSetting['scope.album'] === false) {
  // ✅ 引导用户去设置
  const modalRes = await Taro.showModal({
    title: '需要相册权限',
    content: '请在设置中允许访问相册，以选择照片',
    confirmText: '去设置',
    cancelText: '取消'
  })

  if (modalRes.confirm) {
    await Taro.openSetting()
  }
  return null
}

// ✅ 请求权限
const res = await Taro.chooseImage({...})
```

### 3. 用户信息获取最佳实践

**原则：**
- ✅ 使用新方式：open-type="chooseAvatar" + type="nickname"
- ❌ 不使用旧方式：wx.getUserInfo
- ✅ 用户主动触发：不要强制要求
- ✅ 提供默认值：用户不提供时使用默认头像和昵称

**示例：**
```typescript
// ✅ 新方式
<Button 
  openType="chooseAvatar"
  onChooseAvatar={handleChooseAvatar}>
  {avatarUrl ? (
    <Image src={avatarUrl} />
  ) : (
    <View>点击选择头像</View>
  )}
</Button>

<Input 
  type="nickname"
  placeholder="请输入昵称"
  value={nickname}
/>

// ❌ 旧方式（不要使用）
wx.getUserInfo({...})
```

---

## 🎯 本应用配置总结

### 当前配置状态

**permission 配置：**
- ✅ scope.camera - 已配置，正确
- ✅ scope.album - 已配置，正确
- ✅ scope.writePhotosAlbum - 已配置，正确
- ✅ scope.userInfo - 未配置，正确（已废弃）

**__usePrivacyCheck__ 配置：**
- ✅ 设置为 true，正确

**requiredPrivateInfos 配置：**
- ✅ 未声明，正确（不使用位置接口）

**用户信息获取方式：**
- ✅ 使用 open-type="chooseAvatar"，正确
- ✅ 使用 type="nickname"，正确
- ✅ 不使用 getUserInfo，正确

### 配置完整性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| **权限配置完整性** | ✅ 完整 | 包含所有需要的权限 |
| **权限配置正确性** | ✅ 正确 | 与代码使用匹配 |
| **隐私保护配置** | ✅ 正确 | __usePrivacyCheck__: true |
| **位置接口配置** | ✅ 正确 | 不使用位置接口，未声明 |
| **用户信息获取** | ✅ 正确 | 使用新方式，不需要权限 |
| **符合最新规范** | ✅ 符合 | 完全符合微信小程序最新规范 |

### 建议

**当前配置：**
- ✅ 完全正确，不需要修改
- ✅ 符合最新微信小程序规范
- ✅ 可以直接用于生产环境

**未来维护：**
- ⚠️ 如果添加新功能，同步更新 permission 配置
- ⚠️ 如果使用位置接口，添加 requiredPrivateInfos 配置
- ⚠️ 定期检查微信小程序规范更新

---

## 📚 参考资料

### 官方文档

1. **授权 - 权限列表**
   https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html

2. **配置 - permission**
   https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#permission

3. **用户信息接口调整说明**
   https://developers.weixin.qq.com/community/develop/doc/000cacfa20ce88df04cb468bc52801

4. **获取用户信息**
   https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userInfo.html

5. **头像昵称填写**
   https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html

### 相关文档

- CORRECT_SOLUTION_ANALYSIS.md - 正确的解决方案分析
- SCOPE_ALBUM_ANALYSIS.md - scope.album 权限分析
- SCOPE_USERINFO_ANALYSIS.md - scope.userInfo 权限分析
- FINAL_FIX_WITH_SCOPE_ALBUM.md - 最终修复方案

---

**文档创建时间：** 2026-01-13  
**配置状态：** ✅ 完整且正确  
**符合规范：** ✅ 完全符合最新微信小程序规范  
**建议操作：** 保持当前配置不变
