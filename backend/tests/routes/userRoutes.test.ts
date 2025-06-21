import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import express from 'express';
import app from '../../src/app';
import User from '../../src/models/user';
let getUserProfileStub: sinon.SinonStub;

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

// 创建一个独立的 express app 代理，避免对全局 app 中间件修改影响
function createTestApp() {
  const testApp = express();

  // 解析JSON请求体
  testApp.use(express.json());

  // 模拟授权中间件，依据请求头注入用户
  testApp.use((req, res, next) => {
    const mockUserId = req.header('x-mock-user-id');
    if (mockUserId) {
      req.user = { id: Number(mockUserId) };
    }
    next();
  });

  // 复制原app的中间件和路由，确保req.user可用
  testApp.use(app);

  return testApp;
}

describe('User Routes', () => {
  let updatePersonalityStub: sinon.SinonStub;
  let updateProfileStub: sinon.SinonStub;

  const MOCK_USER_ID = 123;

  // 使用独立的 testApp，防止中间件污染
  const testApp = createTestApp();
  const agent = request.agent(testApp);

  beforeEach(() => {
    updatePersonalityStub = sinon.stub(User, 'updatePersonality').resolves();
    updateProfileStub = sinon.stub(User, 'updateProfile').resolves();
  });

  afterEach(() => {
    updatePersonalityStub.restore();
    updateProfileStub.restore();
  });

  describe('POST /api/user/personality-setup', () => {
    const validPayload = {
      personality: { openness: 0.9, conscientiousness: 0.8 },
      goals: ['goal1', 'goal2'],
      communicationStyle: 'friendly',
    };

    it('should update personality successfully', async () => {
      const res = await agent
        .post('/api/user/personality-setup')
        .set('x-mock-user-id', String(MOCK_USER_ID))
        .send(validPayload);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ msg: 'Personality setup completed' });

      sinon.assert.calledOnceWithExactly(updatePersonalityStub, MOCK_USER_ID, validPayload);
    });

    it('should return 401 unauthorized if no user', async () => {
      const res = await agent.post('/api/user/personality-setup').send(validPayload);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 400 bad request if payload invalid', async () => {
      // 传递不完整payload
      const invalidPayload = { personality: { openness: 0.9 } }; // 缺少 goals 和 communicationStyle

      const res = await agent
        .post('/api/user/personality-setup')
        .set('x-mock-user-id', String(MOCK_USER_ID))
        .send(invalidPayload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should handle updatePersonality throwing error gracefully', async () => {
      updatePersonalityStub.rejects(new Error('DB error'));

      const res = await agent
        .post('/api/user/personality-setup')
        .set('x-mock-user-id', String(MOCK_USER_ID))
        .send(validPayload);

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('error');
    });
  });

  describe('PUT /api/user/profile', () => {
    const validProfilePayload = {
      name: 'Alice',
      age: 28,
      email: 'alice@example.com',
    };

    it('should update profile successfully', async () => {
      const res = await agent
        .put('/api/user/profile')
        .set('x-mock-user-id', String(MOCK_USER_ID))
        .send(validProfilePayload);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ msg: 'Profile updated' });

      sinon.assert.calledOnceWithExactly(updateProfileStub, MOCK_USER_ID, validProfilePayload);
    });

    it('should return 401 unauthorized if no user', async () => {
      const res = await agent.put('/api/user/profile').send(validProfilePayload);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    /*it('should return 400 bad request if payload invalid', async () => {
      const invalidPayload = { name: 'Alice' }; // 缺少 age 和 email

      const res = await agent
        .put('/api/user/profile')
        .set('x-mock-user-id', String(MOCK_USER_ID))
        .send(invalidPayload);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });*/

    it('should handle updateProfile throwing error gracefully', async () => {
      updateProfileStub.rejects(new Error('DB error'));

      const res = await agent
        .put('/api/user/profile')
        .set('x-mock-user-id', String(MOCK_USER_ID))
        .send(validProfilePayload);

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('error');
    });
  });

  describe('GET /api/user/profile', () => {
  const mockUserProfile = {
    nickname: 'test_user',
    avatar: 'https://example.com/avatar.jpg',
    personality_settings: { openness: 0.9 },
    goals: ['goal1'],
    communicationStyle: 'friendly',
  };

  beforeEach(() => {
    getUserProfileStub = sinon.stub(User, 'getUserProfile').resolves(mockUserProfile);
  });

  afterEach(() => {
    getUserProfileStub.restore();
  });

  it('should return user profile successfully', async () => {
    const res = await agent
      .get('/api/user/profile')
      .set('x-mock-user-id', String(MOCK_USER_ID));

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('user');
    expect(res.body.user).to.deep.equal(mockUserProfile);

    sinon.assert.calledOnceWithExactly(getUserProfileStub, MOCK_USER_ID);
  });

  it('should return 401 unauthorized if no user', async () => {
    const res = await agent.get('/api/user/profile');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error', 'Unauthorized');
  });

  it('should return 404 if user not found', async () => {
    getUserProfileStub.resolves(null); // 模拟找不到用户

    const res = await agent
      .get('/api/user/profile')
      .set('x-mock-user-id', String(MOCK_USER_ID));

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error', 'User not found');
  });

  it('should handle getUserProfile throwing error gracefully', async () => {
    getUserProfileStub.rejects(new Error('DB error'));

    const res = await agent
      .get('/api/user/profile')
      .set('x-mock-user-id', String(MOCK_USER_ID));

    expect(res.status).to.equal(500);
    expect(res.body).to.have.property('error', 'Server error');
  });
});
});

