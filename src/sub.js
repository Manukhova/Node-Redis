const redis = require('redis');
const logger = require('../configs/logger');
const { text, MESSAGE_LIST, MESSAGE_INTERVAL } = require('../configs/config');
const { getRandomString } = require('../configs/helpers');

const REDIS_EXPIRE_SEC = 1000;

class RedisSubClient {
  constructor() {
    this.subClient = null;
    this.messageIntervalId = null;
  }

  async getSub(channel) {
    this.subClient = redis.createClient();

    const sub = await this.subscribeAsync(channel);

    if (!sub) return null;

    logger.info(`${text.SUBSCRIBED_TO_CHANNEL} ${sub}`);

    // this.subClient.on('message', async (chan, message) => {
    //   if (message !== 'msg') return;
    //
    //   logger.info(`${text.RECIEVED_MESSAGE_FROM_CHANNEL} ${chan}: ${message} ${new Date()}`);
    //
    //   const valueFromList = await this.lPopAsync(MESSAGE_LIST);
    //
    //   if (Math.random() * 100 <= 95) {
    //     logger.info(`${text.MESSAGE_PROCESSED}: ${valueFromList} ${new Date()}`);
    //     return;
    //   }
    //
    //   logger.info(`${text.RECIEVED_ERR_MESSAGE_FROM_CHANNEL}: ${valueFromList} ${new Date()}`);
    //
    //   await this.setAsync(valueFromList);
    //
    //   logger.info(`${text.SET_MESSAGE_TO_REDIS}: ${valueFromList} ${new Date()}`);
    // });

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
