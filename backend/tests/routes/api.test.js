const request = require('supertest');
const app = require('../../server'); // 确保路径正确
const { expect } = require('chai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/user'); // 确保路径正确

// 配置环境变量
const JWT_SECRET = 'dev'; // 匹配开发环境的secret

describe('Auth API 端点测试', () => {
  // 测试数据
  const validUser = {
    email: 'test@example.com',
    password: 'Password123!',
    nickname: '测试用户'
  };

  // 测试完成后清理数据库
  after(async () => {
    try {
      await User.delete({ email: validUser.email });
      console.log('测试数据已清除');
    } catch (err) {
      console.error('清理数据库失败:', err);
    }
  });

  describe('用户注册', () => {
    it('应该成功注册有效用户', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(validUser);
      
      expect(res.status).to.equal(201);
    //   expect(res.body).to.have.property('id', res.body.id);
      expect(res.body.email).to.equal('a', validUser.id);
      expect(res.body.nickname).to.equal('nickname', validUser.nickname);
      
      // 验证数据库中确实存在该用户
      const dbUser = await User.findOne({ email: validUser.email });
      expect(dbUser).to.exist;
      expect(dbUser.email).to.equal(validUser.email);
      
      // 验证密码已被哈希（非明文存储）
      const isPasswordMatch = await bcrypt.compare(validUser.password, dbUser.password);
      expect(isPasswordMatch).to.be.true;
    });

    it('应该拒绝无效的邮箱格式', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' });
      
      expect(res.status).to.equal(400);
      expect(res.body.errors[0].msg).to.include('邮箱格式无效');
    });

    it('应该拒绝密码长度不足8个字符', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: 'short' });
      
      expect(res.status).to.equal(400);
      expect(res.body.errors[0].msg).to.include('密码长度至少为8个字符');
    });

    it('应该拒绝已注册的邮箱', async () => {
      // 先注册有效用户
      await request(app).post('/api/auth/register').send(validUser);
      
      // 尝试重复注册
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      expect(res.status).to.equal(409);
      expect(res.body.error).to.equal('Email already registered');
    });
  });

  describe('用户登录', () => {
    before(async () => {
      // 测试前创建用户
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validUser.password, salt);
      await new User({
        email: validUser.email,
        password: hashedPassword,
        nickname: validUser.nickname
      }).save();
    });

    it('应该允许有效用户登录并返回token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Login successful');
      
      // 验证token被设置为HTTP-only cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).to.be.an('array');
      expect(cookies[0]).to.include('token=');
      expect(cookies[0]).to.include('HttpOnly');
      
      // 从cookie中提取token
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      const token = tokenCookie.split(';')[0].split('=')[1];
      
      // 验证token有效性
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).to.exist;
    });

    it('应该拒绝错误密码的登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'wrong-password'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal('Invalid credentials');
    });

    it('应该拒绝未注册用户的登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unregistered@example.com',
          password: 'any-password'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal('Invalid credentials');
    });

    it('登录后应该可以登出', async () => {
      // 先登录获取有效cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        });
      
      // 使用登录获取的cookie登出
      const cookies = loginRes.headers['set-cookie'];
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);
      
      expect(logoutRes.status).to.equal(200);
      expect(logoutRes.body.message).to.equal('Logout successful');
      
      // 验证cookie已被清除
      const logoutCookies = logoutRes.headers['set-cookie'];
      expect(logoutCookies[0]).to.include('token=;');
    });
  });
});