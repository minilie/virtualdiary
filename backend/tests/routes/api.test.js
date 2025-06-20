const request = require('supertest');
const app = require('../../server');
const { expect } = require('chai');

describe('API 端点测试', () => {
  it('GET / - 应返回基础状态', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('后端服务运行中');
  });

  it('POST /api/auth/register - 应成功注册用户', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      nickname: '测试用户'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(userData);
    
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('success', true);
    expect(res.body.user).to.have.property('email', userData.email);
    expect(res.body.user).to.have.property('nickname', userData.nickname);
  });

//   it('POST /api/diary - 应成功创建日记', async () => {
//     const diaryData = {
//       title: '测试日记',
//       content: '这是测试内容',
//       emotions: ['happy'],
//       topics: ['测试'],
//       visibility: 'private'
//     };

//     const res = await request(app)
//       .post('/api/diary')
//       .send(diaryData);
    
//     expect(res.status).to.equal(201);
//     expect(res.body).to.have.property('success', true);
//     expect(res.body.diary).to.have.property('title', diaryData.title);
//   });
});