const redis = require('redis');
const logger = require('../configs/logger');
const { text, MESSAGE_LIST, MESSAGE_INTERVAL } = require('../configs/config');
const { getRandomString } = require('../configs/helpers');

class RedisPubClient {
  constructor() {
    this.pubClient = null;
    this.messageIntervalId = null;
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
