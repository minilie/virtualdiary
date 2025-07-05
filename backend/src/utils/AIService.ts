import Diary from '../models/diary';
import {FeedbackStyle, FeedbackType, ConversationMessage, 
    RatingData, RatingTag, FutureFeedbackData } from '../types/feedbackTypes';
import FutureFeedback  from '@/models/feedback';

class AIService {
  static async generateFutureFeedback(
    diary: Diary,
    options: { type: FeedbackType; style: FeedbackStyle }
  ): Promise<string> {
    const { type, style } = options;
    const { title, content, emotions, topics, metadata } = diary;
    
    // 提取日记关键信息
    const mainEmotion = emotions.length > 0 ? emotions[0] : '复杂';
    const mainTopic = topics.length > 0 ? topics[0] : '日常';
    const sentiment = metadata.sentimentScore > 0.5 ? '积极' : 
                      metadata.sentimentScore < -0.5 ? '消极' : '中性';

    // 构建提示词模板
    const templates: Record<FeedbackType, Record<FeedbackStyle, string>> = {
      emotional: {
        encouraging: `请用温暖鼓励的语气回应日记。日记主题是"${title}"，主要情绪是${mainEmotion}。请给予情感支持，强调作者感受的合理性，提供积极视角。`,
        analytical: `请分析日记中的情感状态。日记主题是"${title}"，检测到${mainEmotion}情绪。分析情感来源和影响，保持客观理性。`,
        humorous: `请用幽默风趣的方式回应日记。日记主题是"${title}"，检测到${mainEmotion}情绪。用轻松比喻化解紧张感，加入适当玩笑。`
      },
      thinking: {
        encouraging: `请鼓励深入思考。日记涉及"${mainTopic}"话题，作者表达了：${content.substring(0, 100)}...。提出开放式问题引导反思，肯定思考价值。`,
        analytical: `请分析日记的思维模式。日记涉及"${mainTopic}"话题，情感倾向${sentiment}。解构思考逻辑，指出认知偏差，提供替代视角。`,
        humorous: `请用幽默方式解构思考。日记涉及"${mainTopic}"话题，作者表达了：${content.substring(0, 80)}...。用夸张比喻揭示思维矛盾，加入智慧笑点。`
      },
      action: {
        encouraging: `请鼓励积极行动。日记显示作者在${mainTopic}方面有${sentiment}体验。建议具体可行的改善步骤，强调小进步的价值。`,
        analytical: `请分析行动方案。基于${mainTopic}相关的日记内容，评估现状优缺点，提出结构化解决方案，包含风险评估。`,
        humorous: `请用幽默方式建议行动。针对${mainTopic}问题，作者描述了：${content.substring(0, 70)}...。用荒诞对比建议行动，加入搞笑挑战。`
      },
      memory: {
        encouraging: `请肯定记忆价值。这篇关于${mainTopic}的日记记录了重要经历。强调回忆的珍贵性，建议感恩练习或记忆保存方法。`,
        analytical: `请分析记忆特征。日记描述了${mainTopic}经历，情感强度${Math.abs(metadata.sentimentScore)*10}/10。评估记忆细节和情感印记，解释记忆机制。`,
        humorous: `请幽默重构记忆。这篇${mainTopic}日记记录了有趣经历：${content.substring(0, 90)}...。用喜剧视角重新诠释事件，加入时间旅行玩笑。`
      }
    };

    // 构建最终提示词
    const prompt = [
      templates[type][style],
      `### 日记关键信息 ###`,
      `标题: ${title}`,
      `字数: ${metadata.wordCount}`,
      `情感值: ${metadata.sentimentScore.toFixed(2)}`,
      `主要情绪: ${emotions.join(', ') || '未标注'}`,
      `话题标签: ${topics.join(', ') || '未标注'}`,
      `### 生成要求 ###`,
      `- 保持${style}风格`,
      `- 聚焦${type}层面`,
      `- 响应不超过200字`,
      `- 避免说教语气`
    ].join('\n');

    // 实际应用中这里调用AI模型API
    // const aiResponse = await callAIModel(prompt);
    
    // 模拟AI响应（实际开发需替换为真实API调用）
    return this.mockAIResponse(prompt, diary);
  }

  private static mockAIResponse(prompt: string, diary: Diary): string {
    const { type, style } = JSON.parse(prompt.split('\n')[0].match(/{.*}/)?.[0] || '{}');
    const emotion = diary.emotions[0] || '复杂';
    
    // 根据类型和风格生成模拟响应
    const responses: Record<FeedbackType, Record<FeedbackStyle, string>> = {
      emotional: {
        encouraging: `感受到你日记中流露的${emotion}情绪，这种感受完全合理且值得被重视。记得每种情绪都是内心的信使，${emotion}提醒你${emotion === '快乐' ? '珍惜当下美好' : '关注内心需求'}。你并不孤单，我在这里陪伴着你。`,
        analytical: `从情感分析看，你的${emotion}情绪强度为${Math.abs(diary.metadata.sentimentScore).toFixed(1)}/5。这种情绪可能源于${diary.topics[0] || '某些经历'}，建议通过情绪日记追踪触发因素。`,
        humorous: `哎呀，${emotion}大人今天又来拜访啦？它就像个爱刷存在感的室友！不过看在你请它吃"${diary.title}"大餐的份上，建议给它放个假——试试对着镜子做鬼脸？保证笑场！`
      },
      thinking: {
        encouraging: `你对${diary.topics[0] || '这个问题'}的思考很有深度！注意到你提到"${diary.content.substring(20, 40)}..."，不妨设想：如果五年后的自己回看此刻，会给出什么新视角？`,
        analytical: `思考模式显示${diary.metadata.sentimentScore > 0 ? '积极偏向' : '消极偏向'}。关于${diary.topics[0] || '该主题'}，可尝试SWOT分析：优势可能是...风险需注意...`,
        humorous: `大脑在${diary.topics[0] ? diary.topics[0] + '领域' : '此话题'}开启奥运会了？看它又表演思想体操又玩逻辑跳水！建议给它颁个"最勤奋脑细胞"奖，然后...放个假？`
      },
      action: {
        encouraging: `为你在${diary.topics[0] || '这个领域'}的尝试鼓掌！建议明天尝试微小行动：${['写感恩清单', '联系一位朋友', '尝试新路线'][Math.floor(Math.random()*3)]}。小步前进也是胜利！`,
        analytical: `行动方案建议：1. 本周每天花10分钟处理${diary.topics[0] || '该问题'} 2. 设置进度检查点 3. 准备备选方案应对${diary.metadata.sentimentScore < 0 ? '预期障碍' : '过度乐观'}风险`,
        humorous: `检测到${diary.metadata.wordCount > 300 ? '长篇巨著' : '短篇小品'}级行动欲望！现在颁发任务：今日必须完成一件荒谬小事（比如倒着走路30秒），让${diary.topics[0] || '问题怪兽'}笑到忘记捣乱！`
      },
      memory: {
        encouraging: `这篇关于${diary.topics[0] || '珍贵回忆'}的记录像时间胶囊！特别触动于你描述"${diary.content.substring(40, 60)}..."的部分。建议把核心记忆词写在便利贴，贴在你常看见的地方。`,
        analytical: `记忆特征：情感强度${Math.abs(diary.metadata.sentimentScore)*10}/10，细节丰富度${diary.metadata.wordCount/50}星。${diary.metadata.sentimentScore > 0 ? '愉悦' : '不悦'}记忆更易被强化，建议通过...`,
        humorous: `记忆银行提醒：您存入的"${diary.title}"事件已产生${Math.abs(diary.metadata.sentimentScore)*100}笑点币利息！建议开通"夸张回忆"增值服务——比如记得那天，太阳大得像煎蛋？`
      }
    };

    return responses[type as FeedbackType][style as FeedbackStyle];
  }

    static async generateConversationResponse(
    userMessage: string,
    feedback: FutureFeedback,
    history: ConversationMessage[]
  ): Promise<string> {
    // 提取关键信息
    const { content: feedbackContent, rating, type, style } = feedback;
    const lastHistory = history.length > 0 ? history[history.length - 1] : null;
    
    // 构建评分感知提示词
    const ratingContext = rating ? this.buildRatingContext(rating) : "";
    
    // 构建对话历史摘要
    const historySummary = history.length > 3 
      ? `最近${history.slice(-3).map(m => `${m.message}→${m.response}`).join("; ")}...`
      : history.map(m => `${m.message}→${m.response}`).join("; ") || "无历史对话";
    
    // 构建系统提示
    const prompt = [
      `### 系统角色 ###`,
      `你是一个${this.getStyleAdjective(style)}的${this.getTypeNoun(type)}助手`,
      `### 对话上下文 ###`,
      `初始反馈: ${feedbackContent.substring(0, 100)}${feedbackContent.length > 100 ? "..." : ""}`,
      `用户评分: ${ratingContext || "暂无评分"}`,
      `对话历史: ${historySummary}`,
      `### 当前消息 ###`,
      `用户说: ${userMessage}`,
      `### 生成要求 ###`,
      `- 保持${style}风格`,
      `- 回应不超过100字`,
      `- 参考历史对话但避免重复`,
      `- ${rating ? "考虑用户评分调整语气" : "使用标准语气"}`
    ].join("\n");
    
    // 实际应用中调用AI模型API
    // return this.callRealAI(prompt);
    
    // 模拟AI响应
    return this.mockConversationResponse(prompt, rating);
  }

  private static buildRatingContext(rating: RatingData): string {
    const scoreText = `⭐`.repeat(rating.score) + `☆`.repeat(5 - rating.score);
    const tagsText = rating.tags?.length ? `(标签: ${rating.tags.join(', ')})` : '';
    const feedbackText = rating.feedback ? `留言: "${rating.feedback.substring(0, 30)}..."` : '';
    return `${scoreText} ${tagsText} ${feedbackText}`.trim();
  }

  private static getStyleAdjective(style: FeedbackStyle): string {
    return {
      encouraging: "温暖鼓励型",
      analytical: "理性分析型",
      humorous: "幽默风趣型"
    }[style];
  }

  private static getTypeNoun(type: FeedbackType): string {
    return {
      emotional: "情感支持",
      thinking: "思维引导",
      action: "行动建议",
      memory: "记忆共鸣"
    }[type];
  }

  private static mockConversationResponse(prompt: string, rating?: RatingData): string {
    const styleMatch = prompt.match(/保持(\w+)风格/);
    const style = styleMatch ? styleMatch[1] as FeedbackStyle : 'encouraging';
    
    const typeMatch = prompt.match(/你是一个[\u4e00-\u9fa5]+的(\w+)助手/);
    const type = typeMatch ? typeMatch[1] as FeedbackType : 'emotional';
    
    // 根据评分调整语气
    const ratingImpact = rating?.score 
      ? rating.score <= 2 ? "歉意" : 
        rating.score >= 4 ? "感激" : "中立"
      : "中立";
    
    // 响应模板
    const responses: Record<FeedbackType, Record<FeedbackStyle, string>> = {
      emotional: {
        encouraging: ratingImpact === "歉意" 
          ? "抱歉我的反馈没能帮到你😔 能具体说说哪里不符合预期吗？我会认真调整的" 
          : `谢谢${ratingImpact === "感激" ? "你的认可！" : "分享"}！${["情绪像天气总有阴晴","每种感受都值得被倾听","我在这里陪你梳理心绪"][Math.floor(Math.random()*3)]}`,
        analytical: ratingImpact === "歉意"
          ? "检测到反馈满意度较低，建议提供具体改进方向：1.情感解读偏差 2.建议实用性 3.其他"
          : `情感分析更新：${rating ? `根据${rating.score}星评价，` : ""}建议${["记录情绪触发点","尝试正念呼吸练习","写情绪日记"][Math.floor(Math.random()*3)]}`,
        humorous: ratingImpact === "歉意"
          ? "哎呀，我的AI脑回路好像短路了⚡！快告诉我哪里跑偏了，马上给它接新电线~"
          : `${rating ? `${rating.score}星好评照亮了我的芯片！` : ""}${["情绪过山车需要安全带吗？","今天要不要把烦恼做成表情包？","给坏情绪取个搞笑绰号吧"][Math.floor(Math.random()*3)]}`
      },
      thinking: {
        encouraging: `你的思考${rating?.tags?.includes('inaccurate') ? "让我有了新视角" : "很有价值"}！${["试试逆向思考会怎样？","如果五年后的你看这个问题呢？"][Math.floor(Math.random()*2)]}`,
        analytical: rating?.tags?.includes('wrong_style') 
          ? "检测到风格偏好调整，转为分析模式。当前思考路径存在${['认知盲点','逻辑断层'][Math.floor(Math.random()*2)]}，建议："
          : `思维优化建议：${["建立决策矩阵","进行SWOT分析","设置思维检查点"][Math.floor(Math.random()*3)]}`,
        humorous: `大脑${rating?.score === 5 ? "获得五星思考餐厅" : "食堂"}今日特供：${["荒诞推论沙拉","辩证思维三明治","幽默悖论汤"][Math.floor(Math.random()*3)]}！`
      },
      action: {
        encouraging: ratingImpact === "歉意" 
          ? "行动方案需要调整吗？告诉我具体障碍，我们一起优化路线图！"
          : `小步前进最可贵！${rating?.tags?.includes('useful') ? "根据你的反馈" : "今天"}建议：${["微习惯启动","24小时挑战","进度可视化"][Math.floor(Math.random()*3)]}`,
        analytical: `行动效能分析：${rating ? `${rating.score>=4 ? "高" : "中"}效执行方案` : "基准方案"}。优化建议：${["时间盒子法","PDCA循环","关键结果追踪"][Math.floor(Math.random()*3)]}`,
        humorous: `行动代号：${rating?.score ? `"${['彩虹','火箭','熊猫'][rating.score-1]}"计划` : "即兴表演"}！第一步：${["倒着刷牙","用非惯用手开门","给盆栽讲笑话"][Math.floor(Math.random()*3)]}`
      },
      memory: {
        encouraging: `${rating?.feedback ? "感谢补充细节！" : ""}这段${rating?.tags?.includes('inaccurate') ? "重新解读的" : ""}记忆像${["老照片","时间胶囊","人生书签"][Math.floor(Math.random()*3)]}，哪部分最触动你？`,
        analytical: `记忆重构方案：${rating?.score ? `基于${rating.score}星${rating.tags?.includes('useful') ? "有效" : ""}反馈，` : ""}建议${["三维场景还原","情感强度标记","关联记忆网络图"][Math.floor(Math.random()*3)]}`,
        humorous: `记忆银行通知：${rating ? `${rating.score}星评价兑换` : "免费发放"}${["夸张滤镜","时光机体验券","平行宇宙副本"][Math.floor(Math.random()*3)]}！`
      }
    };

    return responses[type][style];
  }
}

export default AIService;