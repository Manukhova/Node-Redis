const Redis = require('ioredis');
const dbConfig = require('../configs/db');

const REDIS_EXPIRE_SEC = 5700; // 95 min

class RedisClient {
  constructor() {
    this.client = null;
  }

  static makeSentObj(sents) {
    return sents.map(item => ({
      host: item.split(':')[0],
      port: parseInt(item.split(':')[1], 10)
    }));
  }

  async connect() {
    const sentinels = RedisClient.makeSentObj(dbConfig.redisSentinels.split(','));

    this.client = new Redis({
      sentinels,
      name: dbConfig.redisMasterName
    });

    // this.client = new Redis(); - DEV mode

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
