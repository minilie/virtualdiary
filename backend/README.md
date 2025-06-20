# 后端
## 1. 开发环境
在 Linux 下
```bash
sudo apt update
sudo apt install nodejs npm
npm install express # Express 框架
npm install --save-dev nodemon # 自动重启服务器
npm install dotenv # 环境变量管理
npm install cors # 处理跨域请求
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