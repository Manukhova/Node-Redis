const redis = require('redis');
const logger = require('../configs/logger');
const { text } = require('../configs/config');

class RedisPubClient {
  constructor() {
    this.pubClient = null;
  }

  async getPub(channel) {
    this.pubClient = redis.createClient();
    logger.info(`${text.OPEN_CHANNEL} ${channel}`);
    return this.pubClient;
  }

  async quitPub(channel) {
    logger.info(`${text.CLOSE_CHANNEL} ${channel}`);
    this.pubClient.disconnect();
    this.pubClient.quit();
  }
}

module.exports = new RedisPubClient();
