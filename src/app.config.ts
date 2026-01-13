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

// Taro小程序配置文件，直接导出配置对象
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
  // 隐私保护配置（微信小程序审核要求）
  // 根据微信小程序隐私保护指引，使用以下接口必须声明
  __usePrivacyCheck__: true,
  requiredPrivateInfos: [
    'chooseImage', // 选择图片接口 - 用于照片评估和头像上传
    'saveImageToPhotosAlbum' // 保存图片到相册接口 - 用于保存评估结果
  ],
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
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/images/unselected/profile.png',
        selectedIconPath: './assets/images/selected/profile.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1e3a5f',
    navigationBarTitleText: '拍Ta智能摄影助手',
    navigationBarTextStyle: 'white'
  }
}
