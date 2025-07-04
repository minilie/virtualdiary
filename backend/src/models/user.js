//const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database('./db.sqlite');
const db = require('./db');
// 确保用户表存在
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  personality_settings TEXT DEFAULT '{}',
  goals TEXT DEFAULT '[]',
  communication_style TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);


class User {
  constructor({email, password, nickname}) {
    //this.id = id; // 添加 id 属性
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
          //resolve(row ? new User(row) : null);
          resolve(row || null);
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

  /*static updatePersonality(userId, data) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET personality_settings = ? WHERE id = ?`;
      db.run(query, [data.personality_settings, userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }*/
  static updatePersonality(userId, data) {
    return new Promise((resolve, reject) => {
      const personalitySettings = JSON.stringify({
        personality: data.personality,
        goals: data.goals,
        communicationStyle: data.communicationStyle
      });
      const query = `UPDATE users SET personality_settings = ? WHERE id = ?`;
      db.run(query, [personalitySettings, userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }


  static updateProfile(userId, data) {
    return new Promise((resolve, reject) => {
      // 动态生成 SET 语句和参数数组，支持部分字段更新
      const fields = [];
      const params = [];

      if (data.avatar !== undefined) {
        fields.push('avatar = ?');
        params.push(data.avatar);
      }
      if (data.nickname !== undefined) {
        fields.push('nickname = ?');
        params.push(data.nickname);
      }

      if (fields.length === 0) {
        // 没有字段更新，直接resolve
        return resolve({ success: false, message: 'No fields to update' });
      }

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      params.push(userId);

      db.run(query, params, function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  static getUserProfile(userId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, email, nickname, avatar, personality_settings, goals, communication_style, createdAt FROM users WHERE id = ?`;
    db.get(query, [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
      });
    });
  }
  static findById(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row ? new User(row) : null);
      });
    });
  }
  // 在 User 类中添加
  /**
   * 通过ID查找用户
   * @param {number} id 
   * @returns {Promise<Object>}
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

module.exports = User;
