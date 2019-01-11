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

    if (!sub) return null;

    logger.info(`${text.SUBSCRIBED_TO_CHANNEL} ${sub}`);

    return this.subClient;
  }

  async quitSub(channel) {
    logger.info(`${text.CLOSE_CHANNEL} ${channel}`);

    this.subClient.unsubscribe();
    this.subClient.quit();
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
}

module.exports = new RedisSubClient();
