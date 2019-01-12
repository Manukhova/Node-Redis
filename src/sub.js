const redis = require('redis');
const logger = require('../configs/logger');
const { text } = require('../configs/config');

class RedisSubClient {
  constructor() {
    this.subClient = null;
  }

  async getSub(channel) {
    this.subClient = redis.createClient();
    const sub = await this.subscribeAsync(channel);
    logger.info(`${text.SUBSCRIBED_TO_CHANNEL} ${sub}`);
    return this.subClient;
  }

  async quitSub(channel) {
    await this.unsubscribeAsync(channel);
    logger.info(`${text.UNSUBSCRIBE} ${channel}`);
  }

  async subscribeAsync(chan) {
    return new Promise(async (resolve, reject) => {
      this.subClient.subscribe(chan, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }

  async unsubscribeAsync(chan) {
    return new Promise(async (resolve, reject) => {
      this.subClient.unsubscribe(chan, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }
}

module.exports = new RedisSubClient();
