import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import Diary from '../../src/models/diary';
import User from '../../src/models/user';
import { extractUserId } from '@/utils/authenticate';
import db from '../../src/models/db';
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

    authToken = loginRes.body.token;
    
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
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('diaries').that.is.an('array');
      expect(res.body.diaries.length).to.be.greaterThan(0);
    });

    it('应过滤日记 (按情绪)', async () => {
      const res = await request(app)
        .get('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(Number(res.body.id)).to.equal(testDiaryId);
    });

    it('应返回404错误 (无效ID)', async () => {
      const res = await request(app)
        .get('/api/diary/999999')
        .set('Authorization', `Bearer ${authToken}`);

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
        .set('Authorization', `Bearer ${authToken}`)
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
      const otherToken = loginRes.body.token;

      const res = await request(app)
        .put(`/api/diary/${testDiaryId}`)
        .set('Authorization', `Bearer ${otherToken}`)
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
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('msg', 'Diary deleted successfully');

      // 确认数据库中已删除
      const diary = await Diary.findById(testDiaryId);
      expect(diary).to.be.null;

      // 清空 testDiaryId 避免 after 重复删除
      testDiaryId = 0;
    });
  });
  /*
    describe('POST /diary/:diaryId/share', () => {
    let friendToken: string;
    let friendId: number;

    before(async () => {
      // 创建一个好友用户
      const friend = {
        email: 'friend@example.com',
        password: 'friendpass123',
        nickname: 'friendly',
      };

      await request(app).post('/api/auth/register').send(friend);
      const loginRes = await request(app).post('/api/auth/login').send({
        email: friend.email,
        password: friend.password,
      });
      friendToken = loginRes.body.token;

      const friendUser = await User.findOne({ email: friend.email });
      friendId = friendUser.id;

      // 添加互为好友（模拟数据库插入）
      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
          [friendId, extractUserId(authToken), extractUserId(friendToken), friendId],
          err => (err ? reject(err) : resolve())
        );
      });

      // 重新创建一篇日记供测试分享
      const res = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Diary to Share',
          content: 'Content for sharing test.',
          emotions: ['calm'],
          topics: ['test'],
          visibility: 'private',
        });
      testDiaryId = res.body.id;
    });

    it('应成功将日记分享给好友', async () => {
      const res = await request(app)
        .post(`/api/diary/${testDiaryId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendIds: [friendId],
          settings: {
            allowComment: true,
            visibility: 'friends',
          },
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.sharedCount).to.equal(1);
    });

    it('应返回 400 错误（无效好友）', async () => {
      const res = await request(app)
        .post(`/api/diary/${testDiaryId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendIds: [999999], // 不存在的好友
          settings: {
            allowComment: false,
            visibility: 'friends',
          },
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('应返回 400 错误（请求格式非法）', async () => {
      const res = await request(app)
        .post(`/api/diary/${testDiaryId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          friendIds: 'not-an-array',
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });
  });

  describe('GET /diary/:diaryId/friends-feedback', () => {
    it('应成功获取好友的未来评论（空数组）', async () => {
      const res = await request(app)
        .get(`/api/diary/${testDiaryId}/friends-feedback`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('comments');
      expect(res.body.comments).to.be.an('array');
    });

    it('应返回 403（无权访问他人私密日记）', async () => {
      // 创建一个未共享的日记
      const resDiary = await request(app)
        .post('/api/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Private Diary',
          content: 'This is private',
          emotions: ['angry'],
          topics: ['secret'],
          visibility: 'private',
        });

      const res = await request(app)
        .get(`/api/diary/${resDiary.body.id}/friends-feedback`)
        .set('Authorization', `Bearer ${friendToken}`);

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error');
    });
  });*/

});
