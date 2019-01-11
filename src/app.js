const logger = require('../configs/logger');
const redisClient = require('./redis');
const redisSubClient = require('./sub');
const redisPubClient = require('./pub');
const { getRandomString } = require('../configs/helpers');
const { text, CHANNEL_NAME, MESSAGE_LIST, MESSAGE_INTERVAL, MESSAGE_TYPE, GET_ERR_FLAG } = require('../configs/config');

let messageIntervalId = null;

const run = async () => {
  const client = redisClient.connect();

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

    logger.info(`${text.RECIEVED_MESSAGE_FROM_CHANNEL} ${chan}: ${message} ${new Date()}`);

    const valueFromList = await redisClient.lPopAsync(MESSAGE_LIST);

    if (Math.random() * 100 <= 95) {
      logger.info(`${text.MESSAGE_PROCESSED}: ${valueFromList} ${new Date()}`);
      return;
    }

    logger.info(`${text.RECIEVED_ERR_MESSAGE_FROM_CHANNEL}: ${valueFromList} ${new Date()}`);

    await redisClient.setAsync(valueFromList);

    logger.info(`${text.SET_MESSAGE_TO_REDIS}: ${valueFromList} ${new Date()}`);
  });

  const checkIntervalId = setInterval(async () => {
    const listArr = await redisClient.lRangeAsync(MESSAGE_LIST, 0, -1);

    if (!listArr.length) {
      const pub = await redisPubClient.getPub(CHANNEL_NAME).catch(err => {
        logger.error(text.FAILED_CONNECT_REDIS, err);
      });

      messageIntervalId = setInterval(async () => {
        const message = getRandomString();

        logger.info(`${text.MESSAGE_GENERATED}: ${message} ${new Date()}`);

        await redisClient.rPushAsync(MESSAGE_LIST, message);

        pub.publish(CHANNEL_NAME, MESSAGE_TYPE);
      }, MESSAGE_INTERVAL);
    }
  }, MESSAGE_INTERVAL + 1);

  client.on('end', () => {
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });
};

module.exports = {
  run
};
