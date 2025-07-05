import { expect } from 'chai';
import request from 'supertest';
import app  from '../../src/app'; // 确保app导出Express实例
import User from '../../src/models/user';
// import sinon from 'sinon';
import bcrypt from 'bcrypt';

const TEST_USER = {
  email: 'test1@example.com',
  password: 'validPassword123',
  nickname: 'testUser'
}

const TEST_USER2 = {
  email: 'test2@example.com',
  password: '1145141919810',
  nickname: 'testUser2'
}

describe('Auth Routes', () => {
  // 测试前清理数据库
  before(async () => {
    await User.delete({'email': TEST_USER.email});
    await User.delete({'email': TEST_USER2.email});
  });

  after(async () => {
    await User.delete({'email': TEST_USER.email});
    await User.delete({'email': TEST_USER2.email});
  });

  describe('POST /register', () => {
    // 测试用例1: 成功注册
    it('应返回201状态码和成功消息 (输入有效)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);
      
      expect(response.status).to.equal(201);
      expect(response.body).to.deep.equal({ msg: 'success' });
    
      const user = await User.findOne({ email: TEST_USER.email });
      
      expect(user).to.not.be.null;
      expect(user?.nickname).to.equal(TEST_USER.nickname);

      const response2 = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER2);

      expect(response2.status).to.equal(201);
      expect(response2.body).to.deep.equal({ msg: 'success' });
      
      // 验证数据库记录
      const user2 = await User.findOne({ email: TEST_USER2.email });
      expect(user2).to.not.be.null;
      expect(user2?.nickname).to.equal(TEST_USER2.nickname);
    });

    // 测试用例2: 邮箱格式无效
    it('应返回400状态码和验证错误 (邮箱无效)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'validPassword123',
          nickname: 'tester'
        });
      
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('message', 'Invalid email or password');
      expect(response.body.details).to.be.an('array');
    });

    // 测试用例3: 密码过短
    it('应返回400状态码和验证错误 (密码过短)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          nickname: 'tester'
        });
      
      expect(response.status).to.equal(400);
      expect(response.body.message).to.include('Invalid email or password');
    });

    // 测试用例4: 邮箱已被注册
    it('应返回409状态码 (邮箱已存在)', async () => {
      // 创建已存在用户
      const response = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER);
      
      expect(response.status).to.equal(409);
      expect(response.body.message).to.equal('Email already registered');;
    });

    // // 测试用例5: 数据库错误处理
    // it('应返回500状态码 (数据库错误)', async () => {
    //   // 模拟数据库错误
    //   const saveStub = sinon.stub(User.prototype, 'save');
    //   saveStub.rejects(new Error('Database connection failed'));

    //   const response = await request(app)
    //     .post('/api/auth/register')
    //     .send({
    //       email: 'dberror@example.com',
    //       password: 'validPassword123',
    //       nickname: 'tester'
    //     });
      
    //   expect(response.status).to.equal(500);
    //   expect(response.body).to.have.property('error', 'Server error');
      
    //   // 恢复原始方法
    //   saveStub.restore();
    // });

    // 测试用例6: 密码加密验证
    it('应正确加密存储密码', async () => {
      const user = await User.findOne({ email: TEST_USER.email });
      expect(user?.password).to.not.equal(TEST_USER.password);
      expect(await bcrypt.compare(TEST_USER.password, user?.password || '')).to.be.true;
    });
  });

  describe('POST /login 登录接口', () => {
    it('应成功登录并返回安全Cookie (有效凭证)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
      
      // 验证安全Cookie设置
      const setCookieHeader = response.headers['set-cookie'];
      const cookieHeader = Array.isArray(setCookieHeader) 
                          ? setCookieHeader.join(';') 
                          : setCookieHeader || ''; // 非数组时直接使用或返回空字符串
      expect(cookieHeader).to.include('token=');
      expect(cookieHeader).to.include('HttpOnly');
      expect(cookieHeader).to.include('SameSite=Strict');
    });

    it('应拒绝登录 (无效邮箱)', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: TEST_USER.password
        });
      
      const duration = Date.now() - startTime;
      
      // 验证计时攻击防护
      expect(duration).to.be.at.least(30); // 确保有足够的延迟
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('message', 'Invalid credentials');
    });

    it('应拒绝登录 (错误密码)', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'wrongPassword'
        });
      
      const duration = Date.now() - startTime;
      
      // 验证计时攻击防护
      expect(duration).to.be.at.least(30);
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('message', 'Invalid credentials');
    });

    it('应返回401错误 (缺失邮箱)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: TEST_USER.password });
      
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('message', 'Invalid credentials');
    });

    it('应返回500错误 (缺失密码)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email });
      
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property('message', 'Server error');
    });

    it('应返回500错误 (数据库异常)', async () => {
      // 模拟数据库错误
      const originalFindOne = User.findOne;
      User.findOne = () => { throw new Error('DB connection failed'); };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      // 恢复原始方法
      User.findOne = originalFindOne;
      
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property('message', 'Server error');
    });
  });

  describe('POST /logout 登出接口', () => {
    let authToken: string;

    // 获取有效token
    before(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      authToken = loginResponse.body.token;
    });

    it('未认证用户访问应返回401错误', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['token=invalid_token']); // 无效token
      
      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('message');
    });

    it('应成功登出并清除Cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`token=${authToken}`])
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('msg', 'Logout successfully');
      
      // 验证Cookie清除
      const setCookieHeader = response.headers['set-cookie'];
      const cookieHeader = Array.isArray(setCookieHeader) 
                          ? setCookieHeader.join(';') 
                          : setCookieHeader || ''; // 非数组时直接使用或返回空字符串
      expect(cookieHeader).to.include('token=;');
      expect(cookieHeader).to.include('HttpOnly');
    });

  //   it('应返回500错误 (服务端异常)', async () => {
  //     // 模拟中间件错误
  //     const originalHandler = app._router.stack.pop();
      
  //     app.post('/api/auth/logout', () => {
  //       throw new Error('Forced server error');
  //     });
      
  //     const response = await request(app)
  //       .post('/api/auth/logout')
  //       .set('Cookie', [`token=${authToken}`]);
      
  //     // 恢复原始处理程序
  //     app.post('/api/auth/logout', originalHandler.handle);
      
  //     expect(response.status).to.equal(500);
  //     expect(response.body).to.have.property('error', 'Server error');
  //   });
  });
});