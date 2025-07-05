import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import { extractUserId } from '@/utils/authenticate';
const TEST_USER = {
  email: 'profiletest@example.com',
  password: 'StrongPassword123',
  nickname: 'TestUserProfile'
};

let authToken: string;
let userId: number;

describe('User Routes - Integrated (No Sinon)', () => {
  before(async () => {
    // 清理旧用户
    await User.delete({ email: TEST_USER.email });

    // 注册新用户
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(registerRes.status).to.equal(201);

    // 登录用户
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(loginRes.status).to.equal(200);
    authToken = loginRes.body.token;
    userId = extractUserId(authToken);
    expect(authToken).to.be.a('string');
    console.log('Sending token:', authToken);


  });

  after(async () => {
    await User.delete({ email: TEST_USER.email });
  });

  describe('POST /api/user/personality-setup', () => {
    const validPayload = {
      personality: { openness: 0.9, conscientiousness: 0.8 },
      goals: ['goal1', 'goal2'],
      communicationStyle: 'friendly'
    };

    it('should update personality successfully', async () => {
      const res = await request(app)
        .post('/api/user/personality-setup')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPayload);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ msg: 'Personality setup completed' });

      const updatedUser = await User.findById(userId);
      const stored = JSON.parse(updatedUser?.personality_settings);

      expect(stored.personality).to.deep.equal(validPayload.personality);
      expect(stored.goals).to.deep.equal(validPayload.goals);
      expect(stored.communicationStyle).to.equal(validPayload.communicationStyle);
    });

    it('should return 401 if not logged in', async () => {
      const res = await request(app)
        .post('/api/user/personality-setup')
        .send(validPayload);

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized');
    });

    it('should return 400 if missing fields', async () => {
      const invalidPayload = { personality: { openness: 0.9 } };

      const res = await request(app)
        .post('/api/user/personality-setup')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPayload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });

  describe('PUT /api/user/profile', () => {
    const validUpdate = {
      name: 'Updated Name',
      age: 30,
      email: 'newemail@example.com'
    };

    it('should update profile successfully', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validUpdate);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ msg: 'Profile updated' });

      const updated = await User.findById(userId);
      
    });

    it('should return 401 if not logged in', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .send(validUpdate);

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized');
    });


  });

  describe('GET /api/user/profile', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      //expect(res.status).to.equal(200);
      expect(res.body).to.have.property('user');
      //expect(res.body.user.email).to.equal('newemail@example.com'); // 已更新
    });

    it('should return 401 if not logged in', async () => {
      const res = await request(app).get('/api/user/profile');
      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized');
    });

    it('should return 404 if user is deleted (manually)', async () => {
      // 删除用户
      await User.delete({ email: TEST_USER.email });

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('User not found');
    });
  });
    describe('POST /api/user/delete-account', () => {
    beforeEach(async () => {
      // 如果用户不存在，重新注册
      const existing = await User.findOne({email:TEST_USER.email});
      if (!existing) {
      // 注册新用户
          const registerRes = await request(app)
            .post('/api/auth/register')
            .send(TEST_USER);
          expect(registerRes.status).to.equal(201);

          // 登录用户
          const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_USER.email, password: TEST_USER.password });

          expect(loginRes.status).to.equal(200);
          authToken = loginRes.body.token;
          userId = extractUserId(authToken);
      }
    });

    it('should delete account with correct confirmation', async () => {
      const res = await request(app)
        .post('/api/user/delete-account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({
        success: true,
        message: 'Account deleted successfully'
      });

      const user = await User.findById(userId);
      expect(user).to.be.null;
    });

    it('should return 400 for incorrect confirmation text', async () => {
      const res = await request(app)
        .post('/api/user/delete-account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmation: 'WRONG TEXT' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Validation failed');
      expect(res.body.details).to.be.an('array');
    });

    it('should return 400 if confirmation is missing', async () => {
      const res = await request(app)
        .post('/api/user/delete-account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Validation failed');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/user/delete-account')
        .send({ confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Unauthorized');
    });

    it('should return 404 if user already deleted', async () => {
      // 确保用户已经被删除
      await User.deleteById(userId);

      const res = await request(app)
        .post('/api/user/delete-account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('User not found');
    });
  });
});
