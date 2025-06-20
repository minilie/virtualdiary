# 后端
## 1. 开发环境
在 Linux 下
```bash
sudo apt update
sudo apt install nodejs npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash # 安装 nvm
source ~/.bashrc
command -v nvm # 验证安装成功，应当输出 nvm
nvm install --lts
nvm use --lts
```

## 2. 启动
```bash
cd backend
node server.js
```

## 3. 测试
```bash
cd backend
npm test
```
测试逻辑在 backend/tests 目录下

## ?
  /**
   * 获取用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile() {
    return this.request('GET', '/user/profile');
  }

  /**
   * 更新用户信息
   * @param {Object} profileData - 用户信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserProfile(profileData) {
    return this.request('PUT', '/user/profile', profileData);
  }

  /**
   * 完成个性化初始设置
   * @param {Object} personalityData - 个性化数据
   * @param {Object} personalityData.personality - 性格问卷结果
   * @param {Array} personalityData.goals - 生活目标
   * @param {string} personalityData.communicationStyle - 沟通风格
   * @returns {Promise<Object>} 设置结果
   */
  async completePersonalitySetup(personalityData) {
    return this.request('POST', '/user/personality-setup', personalityData);
  }

这是web应用项目的前后端接口规范，里面涉及到 user 路由的内容。实现三个 auth 路由下的函数。要求符合工业规范，要保证安全性。