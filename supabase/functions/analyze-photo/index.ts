import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface AnalyzeRequest {
  imageBase64: string
  evaluationType: 'realtime' | 'upload'
}

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageBase64, evaluationType }: AnalyzeRequest = await req.json()

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: '缺少图片数据' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 构建提示词
    const promptText = evaluationType === 'realtime'
      ? `你是一位专业的摄影指导。请分析这张照片的拍摄质量，并按照以下维度进行评分和建议：

1. 构图合理性（0-30分）：基于三分法、黄金螺旋等构图理论
2. 人物姿态（0-30分）：姿态自然度、表情状态（如果有人物）
3. 拍摄角度（0-20分）：角度新颖性、主体突出度
4. 拍摄距离（0-10分）：主体清晰度、环境协调度
5. 机位高度（0-10分）：视角选择合理性

请以JSON格式返回结果：
{
  "total_score": 总分(0-100),
  "composition_score": 构图得分,
  "pose_score": 姿态得分,
  "angle_score": 角度得分,
  "distance_score": 距离得分,
  "height_score": 高度得分,
  "suggestions": {
    "composition": "构图建议",
    "pose": "姿态建议",
    "angle": "角度建议",
    "distance": "距离建议",
    "height": "高度建议"
  },
  "scene_type": "portrait/landscape/group/other"
}

请给出专业、具体、可操作的建议。`
      : `你是一位专业的摄影评论家。请详细分析这张照片的拍摄质量，并按照以下维度进行评分：

1. 构图合理性（0-30分）：基于三分法、黄金螺旋等构图理论
2. 人物姿态（0-30分）：姿态自然度、表情状态（如果有人物）
3. 拍摄角度（0-20分）：角度新颖性、主体突出度
4. 拍摄距离（0-10分）：主体清晰度、环境协调度
5. 机位高度（0-10分）：视角选择合理性

请以JSON格式返回结果：
{
  "total_score": 总分(0-100),
  "composition_score": 构图得分,
  "pose_score": 姿态得分,
  "angle_score": 角度得分,
  "distance_score": 距离得分,
  "height_score": 高度得分,
  "suggestions": {
    "composition": "构图分析",
    "pose": "姿态分析",
    "angle": "角度分析",
    "distance": "距离分析",
    "height": "高度分析"
  },
  "scene_type": "portrait/landscape/group/other"
}

请给出专业、详细的分析和改进建议。`

    // 调用文心一言API
    const apiUrl = 'https://api-integrations.appmiaoda.com/app-8l12za1oblz5/api-eLMlJvr1AwV9/v2/chat/completions'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API调用失败:', errorText)
      return new Response(
        JSON.stringify({ error: 'AI分析服务暂时不可用' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 读取流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6))
              if (jsonData.choices?.[0]?.delta?.content) {
                fullContent += jsonData.choices[0].delta.content
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    }

    // 解析AI返回的结果
    let analysisResult
    try {
      // 尝试提取JSON
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        // 如果没有JSON，返回默认结果
        analysisResult = {
          total_score: 70,
          composition_score: 20,
          pose_score: 20,
          angle_score: 15,
          distance_score: 8,
          height_score: 7,
          suggestions: {
            composition: '构图基本合理',
            pose: '姿态自然',
            angle: '角度适中',
            distance: '距离合适',
            height: '高度适中'
          },
          scene_type: 'other',
          raw_response: fullContent
        }
      }
    } catch (e) {
      console.error('解析AI结果失败:', e)
      analysisResult = {
        total_score: 70,
        composition_score: 20,
        pose_score: 20,
        angle_score: 15,
        distance_score: 8,
        height_score: 7,
        suggestions: {
          composition: '构图基本合理',
          pose: '姿态自然',
          angle: '角度适中',
          distance: '距离合适',
          height: '高度适中'
        },
        scene_type: 'other',
        raw_response: fullContent
      }
    }

    return new Response(
      JSON.stringify(analysisResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('处理请求失败:', error)
    return new Response(
      JSON.stringify({ error: error.message || '服务器错误' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
