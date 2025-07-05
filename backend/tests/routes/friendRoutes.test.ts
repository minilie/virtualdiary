process.env.BASE_PATH = '/api';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import Friend from '../../src/models/friend';
import jwt from 'jsonwebtoken';
import { extractUserId } from '@/utils/authenticate';
import Diary from '../../src/models/diary';
//import Comment from '../../src/models/comment';
// 测试用户数据
const TEST_USERS = [
  { email: 'friend1@test.com', password: 'password123', nickname: 'FriendOne' },
  { email: 'friend2@test.com', password: 'password123', nickname: 'FriendTwo' },
  { email: 'friend3@test.com', password: 'password123', nickname: 'FriendThree' },
  { email: 'friend4@test.com', password: 'password123', nickname: 'Friendfour' }
];

describe('Friend System', () => {
  let userTokens: string[] = [];
  let userIds: number[] = [];

  before(async () => {
    // 清理测试用户
    for (const user of TEST_USERS) {
      await User.delete({ email: user.email });
    }
    // 注册测试用户
    for (const user of TEST_USERS) {
      const res = await request(app)
        .post('/api/auth/register')
        .send(user);
      expect(res.status).to.equal(201);
    }
    // 登录获取token
    for (const user of TEST_USERS) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(res.status).to.equal(200);
      const token = res.body.token;
      userTokens.push(token);
      const userId = extractUserId(token);
      userIds.push(userId);
    }
  });

  after(async () => {
    for (const user of TEST_USERS) {
      await User.delete({ email: user.email });
    }
  });

  describe('Search Users', () => {
    it('should search users by keyword', async () => {
      const res = await request(app)
        .get('/api/friends/search?q=Friend')
        .set('Authorization', `Bearer ${userTokens[0]}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(2);
      expect(res.body.some((u: any) => u.nickname === 'FriendTwo')).to.be.true;
    });

    it('should not return current user in search', async () => {
      const res = await request(app)
        .get('/api/friends/search?q=FriendOne')
        .set('Authorization', `Bearer ${userTokens[0]}`);
      expect(res.status).to.equal(200);
      expect(res.body.some((u: any) => u.nickname === 'FriendOne')).to.be.false;
    });

    it('should return 400 for short keyword', async () => {
      const res = await request(app)
        .get('/api/friends/search?q=a')
        .set('Authorization', `Bearer ${userTokens[0]}`);
      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Keyword must be at least 2 characters long');
    });

    it('should return 401 if no token', async () => {
      const res = await request(app).get('/api/friends/search?q=Friend');
      expect(res.status).to.equal(401);
    });
  });

  describe('Friend Requests', () => {
    it('should send a friend request', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ userId: userIds[1] });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('requestId');
    });

    it('should not allow duplicate friend requests', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ userId: userIds[1] });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Friend request already sent');
    });

    it('should return 404 if target user not found', async () => {
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ userId: 999999 });
      expect(res.status).to.equal(404);
      expect(res.body.error).to.equal('User not found');
    });

    it('should return 400 if already friends', async () => {
      // 首先接受请求使他们成为好友
      const pendingRes = await request(app)
        .get('/api/friends/requests/pending')
        .set('Authorization', `Bearer ${userTokens[1]}`);
      const requestId = pendingRes.body[0].id;

      await request(app)
        .post(`/api/friends/request/${requestId}/respond`)
        .set('Authorization', `Bearer ${userTokens[1]}`)
        .send({ accept: true });

      // 再发送请求应该返回已是好友
      const res = await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ userId: userIds[1] });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Already friends');
    });

    it('should get pending friend requests', async () => {
      // 让第三个用户发送请求给第一个用户，产生新的待处理请求
      await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${userTokens[2]}`)
        .send({ userId: userIds[0] });

      const res = await request(app)
        .get('/api/friends/requests/pending')
        .set('Authorization', `Bearer ${userTokens[0]}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.some((r: any) => r.from_user_id === userIds[2])).to.be.true;
    });

    it('should accept a friend request', async () => {
      const pendingRes = await request(app)
        .get('/api/friends/requests/pending')
        .set('Authorization', `Bearer ${userTokens[0]}`);
      const requestId = pendingRes.body.find((r: any) => r.from_user_id === userIds[2]).id;

      const res = await request(app)
        .post(`/api/friends/request/${requestId}/respond`)
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ accept: true });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.action).to.equal('accepted');
    });

    it('should reject a friend request', async () => {
      // 让第三个用户再发一次请求给第二个用户
      await request(app)
        .post('/api/friends/request')
        .set('Authorization', `Bearer ${userTokens[2]}`)
        .send({ userId: userIds[1] });

      const pendingRes = await request(app)
        .get('/api/friends/requests/pending')
        .set('Authorization', `Bearer ${userTokens[1]}`);
      const requestId = pendingRes.body.find((r: any) => r.from_user_id === userIds[2]).id;

      const res = await request(app)
        .post(`/api/friends/request/${requestId}/respond`)
        .set('Authorization', `Bearer ${userTokens[1]}`)
        .send({ accept: false });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.action).to.equal('rejected');
    });

    it('should return 400 on invalid request ID', async () => {
      const res = await request(app)
        .post('/api/friends/request/invalid/respond')
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ accept: true });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Invalid request ID');
    });

    it('should return 404 if friend request not found', async () => {
      const res = await request(app)
        .post('/api/friends/request/999999/respond')
        .set('Authorization', `Bearer ${userTokens[0]}`)
        .send({ accept: true });
      expect(res.status).to.equal(404);
      expect(res.body.error).to.equal('Friend request not found');
    });

    it('should return 403 if responding user is not the recipient', async () => {
    // user0发送给user2请求
    const requestRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send({ userId: userIds[3] });

    console.log('requestRes.status:', requestRes.status); // 是 201 吗？
    console.log('requestRes.body:', requestRes.body);     // 含有 requestId 吗？

    // user2获取待处理请求
    const pendingRes = await request(app)
        .get('/api/friends/requests/pending')
        .set('Authorization', `Bearer ${userTokens[3]}`);

    // 确认找到了请求
    const friendRequest = pendingRes.body.find((r: any) => r.from_user_id === userIds[0]);
    console.log('pendingRes.body:', pendingRes.body);
    expect(friendRequest).to.not.be.undefined;

    // user1尝试响应这个请求（user1不是请求的接收人user2）
    const res = await request(app)
        .post(`/api/friends/request/${friendRequest.id}/respond`)
        .set('Authorization', `Bearer ${userTokens[1]}`)
        .send({ accept: true });

    expect(res.status).to.equal(403);
    expect(res.body.error).to.equal('Unauthorized');
    });
  });

  describe('Friend List', () => {
    it('should get friend list', async () => {
      const res = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${userTokens[0]}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      expect(res.body.some((f: any) => f.nickname === 'FriendTwo')).to.be.true;
    });

    it('should return empty array if no friends', async () => {
      // 用一个新用户，没有任何好友
      const newUser = { email: 'newuser@test.com', password: 'password123', nickname: 'NewUser' };
      await request(app).post('/api/auth/register').send(newUser);
      const loginRes = await request(app).post('/api/auth/login').send({ email: newUser.email, password: newUser.password });
      const newToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${newToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').that.is.empty;

      await User.delete({ email: newUser.email });
    });
  });

  /*describe('Diary Sharing and Comments', () => {
    it('should share a diary entry to friends', async () => {
      const res = await request(app)
        .post('/api/friends/diary/share')
        .set('Cookie', [`token=${userTokens[0]}`])
        .send({ diaryId: 1 }); // 假设日记ID 1存在
      // 这里判断逻辑根据实际实现调整
      expect(res.status).to.be.oneOf([200, 201]);
    });

    it('should get friends\' comments on diaries', async () => {
      const res = await request(app)
        .get('/api/friends/diary/comments')
        .set('Cookie', [`token=${userTokens[0]}`]);
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should deny access if no token provided', async () => {
      const endpoints = [
        '/api/friends/search?q=Friend',
        '/api/friends/request',
        '/api/friends/requests/pending',
        '/api/friends',
        '/api/friends/diary/share',
        '/api/friends/diary/comments'
      ];

      for (const ep of endpoints) {
        const res = await request(app).get(ep).set('Authorization', `[]`);
        if (ep === '/api/friends/request' || ep === '/api/friends/diary/share') {
          // POST接口用post调用，GET接口用get
          continue;
        } else {
          expect(res.status).to.equal(401);
        }
      }
    });
  });*/
});