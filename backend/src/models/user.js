const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

// 确保用户表存在
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

class User {
  constructor({email, password, nickname}) {
    this.email = email;
    this.password = password;
    this.nickname = nickname;
  }
  
  // 保存用户到数据库（实际插入操作）
  save() {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO users (email, password, nickname)
        VALUES (?, ?, ?)
      `;
      
      db.run(query, 
        [this.email, this.password, this.nickname],
        function(err) {
          if (err) {
            // 处理特定错误
            if (err.message.includes('UNIQUE')) {
              const uniqueError = new Error('Email already exists');
              uniqueError.code = 409;
              return reject(uniqueError);
            }
            return reject(err);
          }
        
          resolve(this);
        }
      );
    });
  }
  
  // 通过邮箱查找用户（静态方法）
  static findOne({ email }) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) return reject(err);
          resolve(row ? new User(row) : null);
        }
      );
    });
  }

  // 通过邮箱删除任务
  static delete({ email }) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE email = ?';
      db.run(query, [email], function(err) {
        if (err) return reject(err);
        // 无论是否实际删除了数据都视为成功
        resolve({ success: true, changes: this.changes });
      });
    });
  }
}

module.exports = User;