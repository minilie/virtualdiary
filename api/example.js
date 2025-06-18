/**
 * 虚拟时间旅行日记 API 使用示例
 * 这个文件展示了如何在实际项目中使用 VirtualDiaryAPI 类
 */

// 引入 API 客户端（根据环境选择合适的方式）
// const { VirtualDiaryAPI, APIError } = require('./api-client'); // Node.js
// import { VirtualDiaryAPI, APIError } from './api-client.js'; // ES6 模块

// 示例：完整的用户体验流程
class DiaryAppExample {
  constructor() {
    // 初始化 API 客户端
    this.api = new VirtualDiaryAPI('http://localhost:3000/api', {
      timeout: 15000,
      retries: 3
    });
    
    // 尝试从本地存储恢复登录状态
    this.restoreAuthState();
  }

  // 恢复认证状态
  restoreAuthState() {
    const token = localStorage.getItem('virtual_diary_token');
    if (token) {
      this.api.setAuthToken(token);
      console.log('已恢复登录状态');
    }
  }

  // 示例1: 用户注册和初始化流程
  async userRegistrationFlow() {
    console.log('=== 用户注册流程示例 ===');
    
    try {
      // 1. 用户注册
      const registerData = {
        email: 'user@example.com',
        password: 'securePassword123',
        nickname: '时间旅行者'
      };
      
      const user = await this.api.register(registerData);
      console.log('✅ 注册成功:', user.nickname);
      
      // 2. 完成个性化设置
      const personalityData = {
        personality: {
          openness: 4,        // 开放性较高
          conscientiousness: 5, // 责任感很强
          extraversion: 3,     // 外向性中等
          agreeableness: 4,    // 宜人性较高
          neuroticism: 2       // 神经质较低
        },
        goals: ['个人成长', '工作发展', '人际关系', '健康生活'],
        communicationStyle: 'encouraging' // 鼓励型沟通
      };
      
      await this.api.completePersonalitySetup(personalityData);
      console.log('✅ 个性化设置完成');
      
      return user;
    } catch (error) {
      console.error('❌ 注册流程失败:', error.message);
      throw error;
    }
  }

  // 示例2: 用户登录流程
  async userLoginFlow(email = 'user@example.com', password = 'securePassword123') {
    console.log('=== 用户登录流程示例 ===');
    
    try {
      const loginResult = await this.api.login({ email, password });
      
      // 保存 token 到本地存储
      localStorage.setItem('virtual_diary_token', loginResult.token);
      localStorage.setItem('virtual_diary_user', JSON.stringify(loginResult.user));
      
      console.log('✅ 登录成功:', loginResult.user.nickname);
      return loginResult;
    } catch (error) {
      if (error instanceof APIError && error.status === 401) {
        console.error('❌ 登录失败: 邮箱或密码错误');
      } else {
        console.error('❌ 登录失败:', error.message);
      }
      throw error;
    }
  }

  // 示例3: 日记创建和反馈流程
  async diaryCreationFlow() {
    console.log('=== 日记创建流程示例 ===');
    
    try {
      // 1. 创建日记
      const diaryData = {
        title: '今天的收获与思考',
        content: `
今天是充实的一天。早上完成了一个重要的项目，虽然过程中遇到了一些技术难题，
但通过与团队的协作最终解决了。这让我意识到沟通和协作的重要性。

下午参加了一个关于个人成长的讲座，讲师提到了"刻意练习"的概念，
这让我思考自己在技能提升方面是否足够专注和系统。

晚上和朋友聊天，发现大家都在为未来的方向而焦虑，
但我觉得焦虑本身不是问题，关键是要将焦虑转化为行动的动力。

明天想要尝试制定一个更具体的学习计划，让每一天的努力都更有方向性。
        `.trim(),
        emotions: ['accomplished', 'thoughtful', 'optimistic'],
        topics: ['工作', '个人成长', '人际关系', '学习'],
        visibility: 'private'
      };
      
      const diary = await this.api.createDiary(diaryData);
      console.log('✅ 日记创建成功:', diary.id);
      
      // 2. 生成"未来的你"反馈
      const feedback = await this.api.generateFutureFeedback(diary.id, {
        type: 'thinking',
        style: 'encouraging'
      });
      console.log('✅ 未来反馈生成成功');
      console.log('💭 来自未来的你:', feedback.content);
      
      // 3. 获取相关记忆
      const relatedMemories = await this.api.getRelatedMemories(diary.id);
      if (relatedMemories.length > 0) {
        console.log('🔗 发现相关记忆:', relatedMemories.length, '条');
      }
      
      return { diary, feedback, relatedMemories };
    } catch (error) {
      console.error('❌ 日记创建流程失败:', error.message);
      throw error;
    }
  }

  // 示例4: 决策辅助流程
  async decisionMakingFlow() {
    console.log('=== 决策辅助流程示例 ===');
    
    try {
      // 1. 创建决策请求
      const decisionData = {
        title: '是否应该跳槽到新公司',
        description: `
我目前在一家中型科技公司工作了两年，最近收到了一个大公司的 offer。
现在需要决定是否接受这个新机会。
        `.trim(),
        options: [
          {
            title: '留在当前公司',
            description: '继续在现在的公司发展',
            pros: [
              '工作环境熟悉，团队关系融洽',
              '项目有连续性，容易出成果',
              '工作压力相对较小，work-life balance好',
              '有升职加薪的可能性'
            ],
            cons: [
              '薪资增长有限',
              '技术栈比较传统，学习机会有限',
              '公司规模小，职业发展天花板较低',
              '业务方向不够前瞻'
            ]
          },
          {
            title: '跳槽到新公司',
            description: '接受新公司的 offer',
            pros: [
              '薪资提升 40%',
              '大公司平台，更好的职业发展机会',
              '接触最新技术和大规模系统',
              '更完善的培训和晋升体系'
            ],
            cons: [
              '需要适应新环境和新团队',
              '工作压力可能更大',
              '通勤时间增加',
              '离开熟悉的技术栈，有学习成本'
            ]
          }
        ],
        context: {
          urgency: 'high',
          importance: 'high',
          category: '职业发展',
          stakeholders: ['自己', '家人', '现团队']
        }
      };
      
      const decision = await this.api.createDecisionRequest(decisionData);
      console.log('✅ 决策请求创建成功:', decision.id);
      
      // 2. 获取决策分析
      const analysis = await this.api.getDecisionAnalysis(decision.id);
      console.log('✅ 决策分析完成');
      console.log('📊 分析建议:', analysis.recommendations.slice(0, 2));
      
      // 3. 模拟做出决定
      await this.api.updateDecisionResult(decision.id, {
        chosenOption: 'option-2',
        reasoning: `
经过综合考虑，我决定接受新公司的 offer。主要原因：
1. 薪资提升幅度很大，能显著改善生活质量
2. 大公司平台对长期职业发展更有利
3. 技术挑战更大，有助于个人成长
4. 我还年轻，正是承担挑战的好时候

虽然会有适应期的困难，但我相信这是值得的投资。
        `.trim()
      });
      console.log('✅ 决策结果已记录');
      
      return decision;
    } catch (error) {
      console.error('❌ 决策辅助流程失败:', error.message);
      throw error;
    }
  }

  // 示例5: 好友互动流程
  async friendInteractionFlow() {
    console.log('=== 好友互动流程示例 ===');
    
    try {
      // 1. 搜索用户
      const users = await this.api.searchUsers('张三');
      console.log('🔍 搜索到用户:', users.length, '个');
      
      if (users.length > 0) {
        // 2. 发送好友请求
        await this.api.sendFriendRequest(users[0].id, '你好！我们有共同的兴趣，希望能成为朋友');
        console.log('✅ 好友请求已发送');
      }
      
      // 3. 获取好友列表
      const friends = await this.api.getFriendsList();
      console.log('👥 当前好友:', friends.length, '人');
      
      // 4. 如果有好友，分享日记
      if (friends.length > 0) {
        // 先创建一篇可分享的日记
        const sharedDiary = await this.api.createDiary({
          title: '今天的美好时光',
          content: '和朋友们一起度过了愉快的下午，感恩这些美好的友谊。',
          emotions: ['grateful', 'happy'],
          topics: ['友谊', '生活'],
          visibility: 'friends'
        });
        
        await this.api.shareDiaryWithFriends(sharedDiary.id, [friends[0].id], {
          allowComment: true,
          visibility: 'friends_only'
        });
        console.log('✅ 日记已分享给好友');
      }
      
      return friends;
    } catch (error) {
      console.error('❌ 好友互动流程失败:', error.message);
      throw error;
    }
  }

  // 示例6: 数据分析和回顾流程
  async analyticsAndReviewFlow() {
    console.log('=== 数据分析流程示例 ===');
    
    try {
      // 1. 获取情绪趋势
      const emotionTrends = await this.api.getEmotionTrends('month');
      console.log('📈 情绪趋势分析完成');
      console.log('主要情绪:', Object.keys(emotionTrends.summary || {}).slice(0, 3));
      
      // 2. 获取个人成长报告
      const growthReport = await this.api.getGrowthReport('monthly');
      console.log('📊 个人成长报告生成完成');
      console.log('成长亮点:', growthReport.highlights?.slice(0, 2));
      
      // 3. 获取写作统计
      const writingStats = await this.api.getWritingStats();
      console.log('✍️ 写作统计:');
      console.log(`- 总日记数: ${writingStats.totalDiaries || 0}`);
      console.log(`- 总字数: ${writingStats.totalWords || 0}`);
      console.log(`- 连续写作天数: ${writingStats.streakDays || 0}`);
      
      // 4. 搜索过往记忆
      const memories = await this.api.searchDiaries({
        keyword: '成长',
        emotions: ['accomplished', 'proud'],
        dateRange: '2023-01-01,2024-12-31'
      });
      console.log('🔍 成长相关记忆:', memories.items?.length || 0, '条');
      
      // 5. 获取记忆推荐
      const recommendations = await this.api.getMemoryRecommendations();
      console.log('💡 推荐回顾的记忆:', recommendations.length, '条');
      
      return {
        emotionTrends,
        growthReport,
        writingStats,
        memories,
        recommendations
      };
    } catch (error) {
      console.error('❌ 数据分析流程失败:', error.message);
      throw error;
    }
  }

  // 示例7: 错误处理和恢复流程
  async errorHandlingExample() {
    console.log('=== 错误处理示例 ===');
    
    try {
      // 尝试访问不存在的日记
      await this.api.getDiary('non-existent-diary-id');
    } catch (error) {
      if (error instanceof APIError) {
        switch (error.status) {
          case 404:
            console.log('✅ 正确处理了 404 错误: 日记不存在');
            break;
          case 401:
            console.log('🔑 检测到认证错误，尝试重新登录...');
            // 这里可以触发重新登录流程
            break;
          default:
            console.log('⚠️ 其他 API 错误:', error.status, error.message);
        }
      } else {
        console.log('⚠️ 网络或其他错误:', error.message);
      }
    }
    
    // 测试网络中断恢复
    try {
      // 模拟网络请求失败后的重试
      const diaries = await this.api.getDiaryList({ limit: 5 });
      console.log('✅ 网络恢复，成功获取日记列表');
    } catch (error) {
      console.log('❌ 网络仍然不可用:', error.message);
    }
  }

  // 运行所有示例
  async runAllExamples() {
    console.log('🚀 开始运行虚拟时间旅行日记 API 示例\n');
    
    try {
      // 1. 注册用户
      await this.userRegistrationFlow();
      console.log('\n');
      
      // 2. 登录用户
      await this.userLoginFlow();
      console.log('\n');
      
      // 3. 创建日记
      await this.diaryCreationFlow();
      console.log('\n');
      
      // 4. 决策辅助
      await this.decisionMakingFlow();
      console.log('\n');
      
      // 5. 好友互动
      await this.friendInteractionFlow();
      console.log('\n');
      
      // 6. 数据分析
      await this.analyticsAndReviewFlow();
      console.log('\n');
      
      // 7. 错误处理
      await this.errorHandlingExample();
      console.log('\n');
      
      console.log('🎉 所有示例运行完成！');
      
    } catch (error) {
      console.error('💥 示例运行失败:', error.message);
    }
  }
}

// 创建并运行示例
const example = new DiaryAppExample();

// 如果是在 Node.js 环境中直接运行
if (typeof require !== 'undefined' && require.main === module) {
  example.runAllExamples().catch(console.error);
}

// 导出示例类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiaryAppExample;
} else if (typeof window !== 'undefined') {
  window.DiaryAppExample = DiaryAppExample;
}

// 也可以单独运行某个示例
// example.userLoginFlow().then(() => example.diaryCreationFlow()); 