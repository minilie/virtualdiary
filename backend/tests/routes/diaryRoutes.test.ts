import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import Diary from '../../src/models/diary';
import User from '../../src/models/user';

const TEST_USER = {
  email: 'test_diary@example.com',
  password: 'password123',
  nickname: 'diaryTester',
};

let authToken: string;
let testDiaryId: number;

describe('Diary Routes', () => {
  before(async () => {
    // 注册测试用户
    await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    // 登录获取token，直接使用接口返回的token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

    authToken = loginRes.body.other.token;
    //console.log('登录返回的token:', authToken);
  });

  after(async () => {
    // 删除测试日记
    
        try{
            const user = await User.findOne({ email: TEST_USER.email });
            if (user) {
                await Diary.deleteByUserId(user.id);
                await User.delete({email: TEST_USER.email});
                console.log('测试用户及其日记删除成功');
            
        }}catch (err) {
            console.error('清理测试数据失败:', err);
    }
  });

  describe('POST /diary/', () => {
    it('应成功创建日记 (有效数据)', async () => {
      const diaryData = {
        title: 'My first diary',
        content: 'This is the content of my first diary entry.',
        emotions: ['happy', 'excited'],
        topics: ['personal', 'growth'],
        visibility: 'private',
      };

      const res = await request(app)
        .post('/api/diary')
        .set('Cookie', [`token=${authToken}`])
        .send(diaryData);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
      expect(res.body.title).to.equal(diaryData.title);
      expect(res.body.content).to.equal(diaryData.content);
      expect(res.body.metadata.wordCount).to.be.greaterThan(0);

      testDiaryId = Number(res.body.id);
      //console.log('登录返回的token:', testDiaryId);
    });

    it('应返回400错误 (缺少标题)', async () => {
      const res = await request(app)
        .post('/api/diary')
        .set('Cookie', [`token=${authToken}`])
        .send({
          content: 'Content without title',
          emotions: ['sad'],
          topics: ['work'],
          visibility: 'private',
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Validation failed');
    });

    it('应返回401错误 (未认证)', async () => {
      const res = await request(app)
        .post('/api/diary')
        .send({
          title: 'Unauthorized diary',
          content: 'This should fail',
          emotions: ['neutral'],
          topics: ['test'],
          visibility: 'public',
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /diary', () => {
    it('应获取日记列表', async () => {
      const res = await request(app)
        .get('/api/diary')
        .set('Cookie', [`token=${authToken}`])
        .query({ page: 1, limit: 10 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('diaries').that.is.an('array');
      expect(res.body.diaries.length).to.be.greaterThan(0);
    });

    it('应过滤日记 (按情绪)', async () => {
      const res = await request(app)
        .get('/api/diary')
        .set('Cookie', [`token=${authToken}`])
        .query({ emotion: 'excited' });

      expect(res.status).to.equal(200);
      expect(res.body.diaries.length).to.be.greaterThan(0);
      expect(res.body.diaries[0].emotions).to.include('excited');
    });
  });

  describe('GET /diary/:diaryId', () => {
    it('应获取日记详情', async () => {
      const res = await request(app)
        .get(`/api/diary/${testDiaryId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).to.equal(200);
      expect(Number(res.body.id)).to.equal(testDiaryId);
    });

    it('应返回404错误 (无效ID)', async () => {
      const res = await request(app)
        .get('/api/diary/999999')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /diary/:diaryId', () => {
    it('应更新日记', async () => {
      const updateData = {
        title: 'Updated title',
        content: 'Updated content with more words to ensure word count is high enough.',
        emotions: ['happy', 'thoughtful'],
        topics: ['growth', 'reflection'],
        visibility: 'public',
      };

      const res = await request(app)
        .put(`/api/diary/${testDiaryId}`)
        .set('Cookie', [`token=${authToken}`])
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.title).to.equal(updateData.title);
      expect(res.body.metadata.wordCount).to.be.greaterThan(10);
      expect(res.body.visibility).to.equal(updateData.visibility);
    });

    it('应返回403错误 (非日记所有者)', async () => {
      // 创建另一个用户
      const otherUser = {
        email: 'another@example.com',
        password: 'password456',
        nickname: 'otherUser',
      };
      await request(app).post('/api/auth/register').send(otherUser);
      const loginRes = await request(app).post('/api/auth/login').send({
        email: otherUser.email,
        password: otherUser.password,
      });
      const otherToken = loginRes.body.other.token;

      const res = await request(app)
        .put(`/api/diary/${testDiaryId}`)
        .set('Cookie', [`token=${otherToken}`])
        .send({ title: 'Hack attempt' });

      expect(res.status).to.equal(403);

      // 清理新增用户
      await User.delete({ email: otherUser.email });
    });
  });

  describe('DELETE /diary/:diaryId', () => {
    it('应成功删除日记', async () => {
      const res = await request(app)
        .delete(`/api/diary/${testDiaryId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('msg', 'Diary deleted successfully');

      // 确认数据库中已删除
      const diary = await Diary.findById(testDiaryId);
      expect(diary).to.be.null;

      // 清空 testDiaryId 避免 after 重复删除
      testDiaryId = 0;
    });
  });
});
