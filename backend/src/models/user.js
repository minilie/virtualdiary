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
  user_settings TEXT DEFAULT '{}',        
  notification_settings TEXT DEFAULT '{}', 
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);


class User {
  constructor(params) {
    if (params.id) this.id = params.id;
    this.email = params.email;
    this.password = params.password;
    this.nickname = params.nickname;
  }
  
  // 保存用户到数据库（实际插入操作）
  save() {
    const that = this; // 保存User实例引用
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)`,
        [that.email, that.password, that.nickname],
        function (err) {
          if (err) { /* 错误处理 */ }
          that.id = this.lastID; // 将新ID绑定到User实例
          resolve(that);
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
  

  //setting设置函数
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
  /**
   * 获取用户设置
   * @param {number} userId 
   * @returns {Promise<Object>}
   */
  static getUserSettings(userId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT user_settings FROM users WHERE id = ?`;
      db.get(query, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row ? JSON.parse(row.user_settings) : {});
      });
    });
  }

  /**
   * 更新用户设置
   * @param {number} userId 
   * @param {Object} settings 
   * @returns {Promise<Object>}
   */
  static updateUserSettings(userId, settings) {
    return new Promise((resolve, reject) => {
      const settingsString = JSON.stringify(settings);
      const query = `UPDATE users SET user_settings = ? WHERE id = ?`;
      db.run(query, [settingsString, userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  /**
   * 获取通知设置
   * @param {number} userId 
   * @returns {Promise<Object>}
   */
  static getNotificationSettings(userId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT notification_settings FROM users WHERE id = ?`;
      db.get(query, [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row ? JSON.parse(row.notification_settings) : {});
      });
    });
  }

  /**
   * 更新通知设置
   * @param {number} userId 
   * @param {Object} settings 
   * @returns {Promise<Object>}
   */
  static updateNotificationSettings(userId, settings) {
    return new Promise((resolve, reject) => {
      const settingsString = JSON.stringify(settings);
      const query = `UPDATE users SET notification_settings = ? WHERE id = ?`;
      db.run(query, [settingsString, userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }
    /**
   * 通过ID删除用户账户
   * @param {number} userId 
   * @returns {Promise<Object>}
   */
  static deleteById(userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      db.run(query, [userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true, changes: this.changes });
      });
    });
  }
}

module.exports = User;
