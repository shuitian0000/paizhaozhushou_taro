import {ScrollView, Text, View} from '@tarojs/components'

export default function PrivacyPolicy() {
  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY style={{height: '100vh'}}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-foreground mb-4">隐私政策</Text>

          <View className="space-y-4">
            <View>
              <Text className="text-base font-semibold text-foreground mb-2">引言</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                拍Ta智能摄影助手（以下简称"我们"）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。请您仔细阅读本隐私政策，以便更好地了解我们的隐私保护措施。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">一、我们收集的信息</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                1.1 账号信息：当您使用微信授权登录时，我们会收集您的微信昵称、头像等基本信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                1.2 照片信息：当您使用拍照助手或照片评估功能时，我们会临时处理您选择的照片，用于AI分析和评估。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                1.3 使用记录：我们会记录您的评估历史，包括评估时间、评分结果等信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                1.4 设备信息：我们可能收集您的设备型号、操作系统版本、设备标识符等信息，用于优化服务体验。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">二、我们如何使用您的信息</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                2.1 提供服务：使用您的信息为您提供拍照助手、照片评估等核心功能。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                2.2 改进服务：分析使用数据，优化产品功能和用户体验。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                2.3 安全保障：检测和防范安全威胁，保护您的账号安全。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                2.4 客户服务：处理您的反馈和投诉，提供技术支持。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">三、照片隐私保护</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                3.1 本地处理：拍照助手功能在您的设备本地进行实时分析，照片不会上传到服务器。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                3.2 临时存储：照片评估功能会临时上传照片进行AI分析，分析完成后立即删除，不会永久保存。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                3.3 相册保存：使用拍照助手拍摄的照片仅保存到您的手机相册，完全由您控制。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                3.4 不会泄露：我们承诺不会将您的照片用于任何商业用途，不会向第三方泄露。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">四、信息存储</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                4.1 存储位置：您的个人信息存储在中华人民共和国境内的服务器上。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                4.2 存储期限：我们仅在为您提供服务所必需的期限内保留您的个人信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                4.3 安全措施：我们采用行业标准的安全技术和管理措施保护您的信息安全。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">五、信息共享</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                5.1 我们不会向任何第三方出售您的个人信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                5.2 除以下情况外，我们不会与第三方共享您的个人信息：
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed ml-4 mb-2">• 获得您的明确同意</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed ml-4 mb-2">
                • 根据法律法规或政府部门的要求
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed ml-4">• 为维护您或他人的合法权益</Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">六、您的权利</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                6.1 访问权：您有权访问您的个人信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                6.2 更正权：您有权更正不准确的个人信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                6.3 删除权：您有权要求删除您的个人信息。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                6.4 撤回同意：您有权撤回对个人信息处理的同意。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                6.5 注销账号：您可以随时注销账号，我们将删除您的个人信息。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">七、未成年人保护</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                7.1 我们非常重视未成年人的个人信息保护。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                7.2 如您为未成年人，请在监护人的陪同下阅读本政策，并在监护人同意后使用我们的服务。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                7.3 如我们发现在未获得监护人同意的情况下收集了未成年人的个人信息，将尽快删除相关信息。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">八、隐私政策的更新</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                8.1 我们可能会不时更新本隐私政策。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                8.2 更新后的隐私政策将在本小程序内公布。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                8.3 如您继续使用我们的服务，即表示您同意接受更新后的隐私政策。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">九、联系我们</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                如您对本隐私政策有任何疑问、意见或建议，或需要行使您的权利，请通过小程序内的"建议和吐槽"功能联系我们，我们将在15个工作日内回复您的请求。
              </Text>
            </View>

            <View className="mt-6 pt-4 border-t border-border">
              <Text className="text-sm text-muted-foreground text-center">本隐私政策最后更新日期：2026年1月</Text>
            </View>
          </View>
        </View>

        {/* 底部间距 */}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
