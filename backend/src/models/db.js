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