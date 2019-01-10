const Redis = require('ioredis');

const REDIS_EXPIRE_SEC = 1000;

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = new Redis();
    return this.client;
  }

  async setAsync(uuid) {
    return new Promise(async (resolve, reject) => {
      this.client.set(`uuid-${uuid}`, `${uuid}`, 'EX', REDIS_EXPIRE_SEC, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  }

  async getAsync(uuid) {
    return new Promise(async (resolve, reject) => {
      this.client.get(`uuid-${uuid}`, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  }

  async deleteAsync(uuid) {
    return new Promise(async (resolve, reject) => {
      this.client.del(`uuid-${uuid}`, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(results);
      });
    });
  }

  async saveUuid(uuid) {
    await this.setAsync(uuid).catch(err => {
      throw err;
    });

    return true;
  }

  async checkUuid(uuid) {
    const uuidReply = await this.getAsync(uuid).catch(err => {
      throw err;
    });

    if (!uuidReply) {
      return false;
    }

    await this.deleteAsync(uuid).catch(err => {
      throw err;
    });

    return true;
  }
}

module.exports = new RedisClient();
