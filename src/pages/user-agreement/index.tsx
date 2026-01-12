import {ScrollView, Text, View} from '@tarojs/components'

export default function UserAgreement() {
  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY style={{height: '100vh'}}>
        <View className="px-6 py-6">
          <Text className="text-2xl font-bold text-foreground mb-4">用户协议</Text>

          <View className="space-y-4">
            <View>
              <Text className="text-base font-semibold text-foreground mb-2">欢迎使用拍Ta智能摄影助手</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                在使用本小程序前，请您仔细阅读并充分理解本协议。您使用本小程序即表示您已阅读并同意接受本协议的全部内容。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">一、服务说明</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                1.1
                拍Ta智能摄影助手（以下简称"本小程序"）是一款基于AI技术的智能摄影辅助工具，为用户提供实时拍摄建议和照片评估服务。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                1.2 本小程序提供的服务包括但不限于：实时拍照助手、照片评估、评估记录查看等功能。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                1.3 我们保留随时修改、中断或终止部分或全部服务的权利，恕不另行通知。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">二、用户账号</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                2.1 您可以通过微信授权登录使用本小程序的完整功能。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                2.2 您应妥善保管您的账号信息，对账号下的所有行为负责。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                2.3 如发现账号被盗用或存在安全漏洞，请立即联系我们。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">三、用户行为规范</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                3.1 您在使用本小程序时，应遵守中华人民共和国相关法律法规。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                3.2 禁止利用本小程序从事任何违法违规活动。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                3.3 禁止上传包含色情、暴力、恐怖、政治敏感等违法违规内容的照片。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                3.4 禁止恶意攻击、破坏本小程序的正常运行。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">四、知识产权</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                4.1
                本小程序的所有内容，包括但不限于文字、图片、软件、程序、数据等，均受著作权法、商标法和其他法律法规的保护。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                4.2 未经我们书面许可，任何人不得擅自使用、复制、修改、传播本小程序的内容。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                4.3 您上传的照片版权归您所有，我们不会将您的照片用于任何商业用途。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">五、免责声明</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                5.1 本小程序提供的评估结果仅供参考，不构成专业摄影指导。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                5.2 我们不对因使用本小程序而产生的任何直接或间接损失承担责任。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                5.3 因不可抗力、网络故障、系统维护等原因导致的服务中断，我们不承担责任。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                5.4 对于第三方链接或服务，我们不承担任何责任。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">六、协议修改</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                6.1 我们有权随时修改本协议的内容，修改后的协议将在本小程序内公布。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                6.2 如您继续使用本小程序，即视为您已接受修改后的协议。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">七、法律适用与争议解决</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-2">
                7.1 本协议的订立、执行、解释及争议解决均适用中华人民共和国法律。
              </Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                7.2
                如就本协议内容或其执行发生任何争议，双方应友好协商解决；协商不成时，任何一方均可向本小程序运营方所在地人民法院提起诉讼。
              </Text>
            </View>

            <View>
              <Text className="text-base font-semibold text-foreground mb-2">八、联系我们</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                如您对本协议有任何疑问或建议，请通过小程序内的"建议和吐槽"功能联系我们。
              </Text>
            </View>

            <View className="mt-6 pt-4 border-t border-border">
              <Text className="text-sm text-muted-foreground text-center">本协议最后更新日期：2026年1月</Text>
            </View>
          </View>
        </View>

        {/* 底部间距 */}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
