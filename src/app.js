const logger = require('../configs/logger');
const redisClient = require('./redis');
const redisSubClient = require('./sub');
const redisPubClient = require('./pub');
const { getRandomString } = require('../configs/helpers');
const { text, CHANNEL_NAME, MESSAGE_LIST, MESSAGE_INTERVAL, CHECK_INTERVAL, MESSAGE_TYPE, GET_ERR_FLAG } = require('../configs/config');

let messageIntervalId = null;
let checkIntervalId = null;
let heartbeatTimestamp = 0;

const run = async () => {
  const client = redisClient.create();

  const args = process.argv.slice(2);

  if (args.length && args[0] === GET_ERR_FLAG) {
    const errors = await redisClient.getErrors().catch(err => {
      logger.error(text.FAILED_GET_ERR, err);
    });

    console.log(errors);
    process.exit(0);
  }

  const sub = await redisSubClient.getSub(CHANNEL_NAME).catch(err => {
    logger.error(text.FAILED_CONNECT_REDIS, err);
  });

  sub.on('message', async (chan, message) => {
    if (message !== MESSAGE_TYPE) return;

    heartbeatTimestamp = Date.now();
    logger.info(`${text.RECIEVED_MESSAGE_FROM_CHANNEL} ${chan}: ${message} ${new Date()}`);

    const valueFromList = await redisClient.lPopAsync(MESSAGE_LIST).catch(err => {
      logger.error(text.FAILED_CONNECT_REDIS, err);
    });

    if (!valueFromList) {
      return;
    }

    if (Math.random() * 100 <= 95) {
      logger.info(`${text.MESSAGE_PROCESSED}: ${valueFromList} ${new Date()}`);
      return;
    }

    logger.info(`${text.RECIEVED_ERR_MESSAGE_FROM_CHANNEL}: ${valueFromList} ${new Date()}`);

    redisClient.setAsync(valueFromList).catch(err => {
      logger.error(text.FAILED_CONNECT_REDIS, err);
    });

    logger.info(`${text.SET_MESSAGE_TO_REDIS}: ${valueFromList} ${new Date()}`);
  });

  const checkIntervalId = setInterval(async () => {
    const listArr = await redisClient.lRangeAsync(MESSAGE_LIST, 0, -1);
    const noMsgInterval = Date.now() - MESSAGE_INTERVAL;

    if (!listArr.length || heartbeatTimestamp < noMsgInterval) {
      if (Object.keys(sub.subscription_set).length) {
        await redisSubClient.quitSub(CHANNEL_NAME);
      }

      if (messageIntervalId) return;

      const pub = await redisPubClient.getPub(CHANNEL_NAME).catch(err => {
        logger.error(text.FAILED_CONNECT_REDIS, err);
      });

      messageIntervalId = setInterval(async () => {
        const message = getRandomString();
        await redisClient.rPushAsync(MESSAGE_LIST, message);
        pub.publish(CHANNEL_NAME, MESSAGE_TYPE);
        logger.info(`${text.MESSAGE_PUBLISHED}: ${message} ${new Date()}`);
      }, MESSAGE_INTERVAL);
    }
  }, MESSAGE_INTERVAL - 1);

  client.on('end', () => {
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });

  client.on("error", function (err) {
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });

};

module.exports = {
  run
};
