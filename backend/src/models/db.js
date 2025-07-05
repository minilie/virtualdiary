// src/models/db.js
const sqlite3 = require('sqlite3').verbose();

// 创建数据库连接
const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});
db.serialize(() => {
  // 创建好友请求表
  db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    message TEXT,
    status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
    
  // 创建好友关系表（双向关系）
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
// 日记分享表
  db.run(`CREATE TABLE IF NOT EXISTS diary_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diary_id INTEGER NOT NULL,
    sharer_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    allow_comment BOOLEAN DEFAULT 1,
    visibility TEXT CHECK(visibility IN ('private', 'friends', 'public')) DEFAULT 'friends',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE,
    FOREIGN KEY (sharer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(diary_id, friend_id)  -- 防止重复分享
  )`);

  // 日记评论表
  db.run(`CREATE TABLE IF NOT EXISTS diary_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diary_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    is_future_comment BOOLEAN DEFAULT 0,  -- 标记是否为"未来评论"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
});
// 启用外键约束
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('Failed to enable foreign key constraints:', err.message);
  } else {
    console.log('Foreign key constraints enabled');
  }
});

// 导出共享的数据库连接
module.exports = db;