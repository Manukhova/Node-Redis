const redis = require('redis');
const { REDIS_EXPIRE_SEC, MESSAGE_LIST } = require('../configs/config');

class RedisClient {
  constructor() {
    this.client = null;
  }

  connect() {
    this.client = redis.createClient();

    return this.client;
  }

  async getErrors() {
    const keys = await this.getKeysAsync('*');

    const msgArray = keys
      .filter(it => it !== MESSAGE_LIST)
      .map(async key => {
        const msgValue = await this.getAsync(key);

        await this.deleteAsync(key);

        return msgValue;
      });

    const vals = await Promise.all(msgArray);

    return vals.join('\n');
  }

  async setAsync(message) {
    return new Promise(async (resolve, reject) => {
      this.client.set(`msg-${message}`, `${message}`, 'EX', REDIS_EXPIRE_SEC, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  async getAsync(key) {
    return new Promise(async (resolve, reject) => {
      this.client.get(key, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  async getKeysAsync(pattern) {
    return new Promise(async (resolve, reject) => {
      this.client.keys(pattern, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  async lPopAsync(list) {
    return new Promise(async (resolve, reject) => {
      this.client.lpop(list, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  async rPushAsync(list, msg) {
    return new Promise(async (resolve, reject) => {
      this.client.rpush(list, msg, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  async deleteAsync(key) {
    return new Promise(async (resolve, reject) => {
      this.client.del(key, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }
}

module.exports = new RedisClient();
