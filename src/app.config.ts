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

// Taro小程序配置文件，使用 defineAppConfig 包裹确保配置正确解析
export default {
  pages,
  permission: {
    'scope.camera': {
      desc: '用于拍照和预览'
    },
    'scope.writePhotosAlbum': {
      desc: '保存照片到相册'
    }
  },
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
