import { expect } from 'chai';
import request from 'supertest';
import app  from '../../src/app'; // 确保app导出Express实例
import User from '../../src/models/user';
import Diary from '@/models/diary';
import FutureFeedback  from '@/models/feedback';


// 测试用户凭证
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'password123'
};
const diaryData = {
    title: 'My first diary',
    content: 'This is the content of my first diary entry.',
    emotions: ['happy', 'excited'],
    topics: ['personal', 'growth'],
    visibility: 'private',
};

describe('日记反馈 API 测试', () => {
  let authToken: string;
  let testDiaryId: number;

  // 创建测试环境
  before(async function() {
    // 创建测试用户
    this.timeout(20000);
    await request(app)
            .post('/api/auth/register')
            .send(TEST_USER);

    // 登录获取token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(TEST_USER);
    
    authToken = loginRes.body.token;

    // 创建测试日记
    const diaryRes = await request(app)
      .post('/api/diary')
      .set('Authorization', `Bearer ${authToken}`)
      .send(diaryData);
    
    testDiaryId = Number(diaryRes.body.id);
  });

  // 清理测试数据
  after(async function() {
    this.timeout(20000);
    try{
        const user = await User.findOne({ email: TEST_USER.email });
        if (user) {
            // 正确顺序：先删反馈 → 再删日记 → 最后删用户
            const diaries = await Diary.findByUserId(user.id);
            for (const diary of diaries) {
            // 删除每篇日记的反馈
                if (diary.id != undefined)
                    await FutureFeedback.deleteByDiaryId(diary.id); // 需实现此方法
            }
            await Diary.deleteByUserId(user.id); // 删除日记
            await User.delete({ email: TEST_USER.email }); // 最后删用户
        }
    } catch (err) {
        console.error('清理测试数据失败:', err);
    }
  });

  describe('POST /diary/:diaryId/future-feedback 生成反馈', () => {
    it('未认证用户应返回401错误', async function () {
      this.timeout(50000);
      const res = await request(app)
        .post(`/api/diary/${testDiaryId}/future-feedback`)
        .send({ type: 'emotional', style: 'encouraging' });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message');
    });

    it('无请求体应使用默认参数生成反馈', async function () {
        this.timeout(50000);
      const res = await request(app)
        .post(`/api/diary/${testDiaryId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.keys([
        'id', 'diaryId', 'userId', 'type', 'style', 
        'content', 'createdAt', 'updatedAt'
      ]);
      expect(res.body.type).to.equal('emotional');
      expect(res.body.style).to.equal('encouraging');
      expect(res.body.content).to.be.a('string');
    });

    it('应成功生成指定类型的反馈', async function () {
      this.timeout(50000);
      const res = await request(app)
        .post(`/api/diary/${testDiaryId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          type: 'thinking', 
          style: 'analytical' 
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.type).to.equal('thinking');
      expect(res.body.style).to.equal('analytical');
      expect(res.body.content.length).to.be.greaterThan(0);
    });

    it('应更新已有反馈', async function () {
      // 先生成一个反馈
      this.timeout(50000);
      const firstRes = await request(app)
        .post(`/api/diary/${testDiaryId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const initialContent = firstRes.body.content;
      
      // 更新该反馈
      const updateRes = await request(app)
        .post(`/api/diary/${testDiaryId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'action', style: 'humorous' });
      
      expect(updateRes.status).to.equal(200);
      expect(updateRes.body.id).to.equal(firstRes.body.id);
      expect(updateRes.body.content).to.not.equal(initialContent);
      expect(updateRes.body.type).to.equal('action');
    });
  });

  describe('GET /diary/:diaryId/future-feedback 获取反馈', () => {
    before(async () => {
      // 确保存在反馈
      await request(app)
        .post(`/api/diary/${testDiaryId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('未认证用户应返回401错误', async () => {
      const res = await request(app)
        .get(`/api/diary/${testDiaryId}/future-feedback`);
      
      expect(res.status).to.equal(401);
    });

    it('应成功获取存在的反馈', async () => {
      const res = await request(app)
        .get(`/api/diary/${testDiaryId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.keys([
        'id', 'diaryId', 'userId', 'type', 'style', 
        'content', 'conversations', 
        'createdAt', 'updatedAt'
      ]);
      expect(res.body.content).to.be.a('string');
    });

    it('日记不存在时应返回404', async () => {
      const invalidId = 99999;
      const res = await request(app)
        .get(`/api/diary/${invalidId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Diary not found or access denied');
    });

    it('反馈不存在时应返回404', async () => {
      // 创建新日记（无反馈）
      const diaryRes = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Empty Diary', content: 'No feedback' });
      
      const noFeedbackId = diaryRes.body.id;
      
      const res = await request(app)
        .get(`/api/diary/${noFeedbackId}/future-feedback`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Diary not found or access denied');
    });
  });
});