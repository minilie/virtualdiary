import { expect } from 'chai';
import request from 'supertest';
import app  from '../../src/app'; // 确保app导出Express实例
import User from '../../src/models/user';
// import sinon from 'sinon';
import bcrypt from 'bcrypt';

describe('POST /register', () => {
  // 测试前清理数据库
  beforeEach(async () => {
    await User.delete({'email': 'valid@example.com'});
    await User.delete({'email': 'exists@example.com'});
  });

  // 测试用例1: 成功注册
  it('应返回201状态码和成功消息 (输入有效)', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'valid@example.com',
        password: 'securePassword123',
        nickname: 'tester'
      });
    
    expect(response.status).to.equal(201);
    expect(response.body).to.deep.equal({ msg: 'success' });
    
    // 验证数据库记录
    const user = await User.findOne({ email: 'valid@example.com' });
    expect(user).to.not.be.null;
    expect(user?.nickname).to.equal('tester');
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
    expect(response.body).to.have.property('error', 'Invalid email or password');
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
    expect(response.body.error).to.include('Invalid email or password');
  });

  // 测试用例4: 邮箱已被注册
  it('应返回409状态码 (邮箱已存在)', async () => {
    // 创建已存在用户
    await new User({
      email: 'exists@example.com',
      password: await bcrypt.hash('password123', 10),
      nickname: 'existing'
    }).save();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'exists@example.com',
        password: 'newPassword123',
        nickname: 'newuser'
      });
    
    expect(response.status).to.equal(409);
    expect(response.body.error).to.equal('Email already registered');;
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
    const plainPassword = 'mySecurePassword';
    
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'encrypt@example.com',
        password: plainPassword,
        nickname: 'crypto'
      });

    const user = await User.findOne({ email: 'encrypt@example.com' });
    expect(user?.password).to.not.equal(plainPassword);
    expect(await bcrypt.compare(plainPassword, user?.password || '')).to.be.true;
  });
});