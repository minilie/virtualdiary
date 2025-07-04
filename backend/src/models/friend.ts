import db from './db';

interface FriendRequest {
  id: number;
  from_user_id: number;
  to_user_id: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface FriendRelation {
  user_id: number;
  friend_id: number;
  created_at: string;
}

interface UserProfile {
  id: number;
  nickname: string;
  avatar?: string;
}

class Friend {
  /**
   * 发送好友请求
   * @param fromUserId 发送请求的用户ID
   * @param toUserId 接收请求的用户ID
   * @param message 请求消息
   * @returns 包含请求ID的对象
   */
  static async sendRequest(
    fromUserId: number,
    toUserId: number,
    message: string = ''
  ): Promise<{ id: number }> {
    return new Promise((resolve, reject) => {
      // 检查是否已经是好友
      db.get(
        `SELECT * FROM friends WHERE user_id = ? AND friend_id = ?`,
        [fromUserId, toUserId],
        (err, row: FriendRelation | undefined) => {
          if (err) return reject(err);
          if (row) return reject(new Error('Already friends'));

          // 检查是否已有待处理请求
          db.get(
            `SELECT * FROM friend_requests 
             WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'`,
            [fromUserId, toUserId],
            (err, row: FriendRequest | undefined) => {
              if (err) return reject(err);
              if (row) return reject(new Error('Friend request already sent'));

              // 创建新请求
              const query = `
                INSERT INTO friend_requests (from_user_id, to_user_id, message)
                VALUES (?, ?, ?)
              `;
              db.run(query, [fromUserId, toUserId, message], function (err) {
                if (err) return reject(err);
                resolve({ id: this.lastID });
              });
            }
          );
        }
      );
    });
  }

  /**
   * 响应好友请求
   * @param requestId 请求ID
   * @param userId 响应请求的用户ID
   * @param accept 是否接受请求
   * @returns 操作结果
   */
  static async respondRequest(
    requestId: number,
    userId: number,
    accept: boolean
  ): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      // 获取请求详情
      db.get(
        `SELECT * FROM friend_requests WHERE id = ?`,
        [requestId],
        (err, request: FriendRequest | undefined) => {
          if (err) return reject(err);
          if (!request) return reject(new Error('Request not found'));
          if (request.to_user_id !== userId)
            return reject(new Error('Unauthorized'));

          if (accept) {
            // 接受请求 - 创建双向好友关系
            const queries = [
              `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
              `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
              `UPDATE friend_requests SET status = 'accepted' WHERE id = ?`,
            ];

            db.serialize(() => {
              db.run('BEGIN TRANSACTION');

              db.run(queries[0], [request.from_user_id, request.to_user_id]);
              db.run(queries[1], [request.to_user_id, request.from_user_id]);
              db.run(queries[2], [requestId]);

              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(err);
                }
                resolve({ success: true });
              });
            });
          } else {
            // 拒绝请求
            db.run(
              `UPDATE friend_requests SET status = 'rejected' WHERE id = ?`,
              [requestId],
              function (err) {
                if (err) return reject(err);
                resolve({ success: true });
              }
            );
          }
        }
      );
    });
  }

  /**
   * 获取好友列表
   * @param userId 用户ID
   * @returns 好友列表
   */
  static async getFriends(userId: number): Promise<UserProfile[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.nickname, u.avatar 
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
      `;
      db.all(query, [userId], (err, rows: UserProfile[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

/**
   * 获取待处理的好友请求
   * @param userId 用户ID
   * @returns 待处理请求列表
   */
  static async getPendingRequests(
    userId: number
  ): Promise<
    Array<
      FriendRequest & {
        from_user_id: number;
        nickname: string;
        avatar?: string;
      }
    >
  > {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT fr.id, fr.message, fr.created_at, u.id as from_user_id, u.nickname, u.avatar 
        FROM friend_requests fr
        JOIN users u ON fr.from_user_id = u.id
        WHERE fr.to_user_id = ? AND fr.status = 'pending'
      `;
      db.all(
        query,
        [userId],
        (
          err,
          rows: Array<
            FriendRequest & {
              from_user_id: number;
              nickname: string;
              avatar?: string;
            }
          >
        ) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }
    static async checkFriendship(userId1: number, userId2: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM friends 
        WHERE (user_id = ? AND friend_id = ?)
        OR (user_id = ? AND friend_id = ?)`,
        [userId1, userId2, userId2, userId1],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });
  }

  static async checkPendingRequest(fromUserId: number, toUserId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM friend_requests 
        WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'`,
        [fromUserId, toUserId],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });
  }
  static async getRequestById(requestId: number): Promise<FriendRequest | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM friend_requests WHERE id = ?`,
        [requestId],
        (err, row: FriendRequest | undefined) => {  // 明确指定row类型
          if (err) return reject(err);
          resolve(row ? row : null);  // 更明确的类型转换
        }
      );
    });
  }
}
export default Friend;