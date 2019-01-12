const logger = require('../configs/logger');
const redisClient = require('./redis');
const redisSubClient = require('./sub');
const redisPubClient = require('./pub');
const { getRandomString } = require('../configs/helpers');
const {
  text,
  CHANNEL_NAME,
  MESSAGE_LIST,
  MESSAGE_INTERVAL,
  CHECK_INTERVAL,
  MESSAGE_TYPE,
  PUB_MESSAGE_TYPE,
  GET_ERR_FLAG
} = require('../configs/config');

let messageIntervalId = null;
let checkIntervalId = null;
let heartbeatTimestamp = 0;
let isPub = false;

const onMsgHandler = async (chan, message) => {
  if (message === PUB_MESSAGE_TYPE) {
    isPub = true;
  }

  if (message !== MESSAGE_TYPE) return;

  heartbeatTimestamp = Date.now();
  logger.info(`${text.RECIEVED_MESSAGE_FROM_CHANNEL} ${chan}: ${message} ${new Date()}`);

  const valueFromList = await redisClient.lPopAsync(MESSAGE_LIST).catch(err => {
    logger.error(text.FAILED_CONNECT_REDIS, err);
  });

  if (!valueFromList) return;

  if (Math.random() * 100 <= 95) {
    logger.info(`${text.MESSAGE_PROCESSED}: ${valueFromList} ${new Date()}`);
    return;
  }

  logger.info(`${text.RECIEVED_ERR_MESSAGE_FROM_CHANNEL}: ${valueFromList} ${new Date()}`);
  redisClient.setAsync(valueFromList).catch(err => {
    logger.error(text.FAILED_CONNECT_REDIS, err);
  });
};

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

  const pub = await redisPubClient.getPub(CHANNEL_NAME).catch(err => {
    logger.error(text.FAILED_CONNECT_REDIS, err);
  });

  sub.on('message', onMsgHandler);

  const checkIntervalId = setInterval(async () => {
    const listArr = await redisClient.lRangeAsync(MESSAGE_LIST, 0, -1).catch(err => {
      logger.error(text.FAILED_CONNECT_REDIS, err);
    });

    const lastMsgDate = Date.now() - MESSAGE_INTERVAL;

    if (!listArr.length && heartbeatTimestamp < lastMsgDate) {
      isPub = false;

      if (Object.keys(sub.subscription_set).length) {
        await redisSubClient.quitSub(CHANNEL_NAME);
      }

      await redisClient.deleteAsync(MESSAGE_LIST);

      pub.publish(CHANNEL_NAME, PUB_MESSAGE_TYPE);
      logger.info(`${text.PUB_MESSAGE_PUBLISHED} ${new Date()}`);
      isPub = true;

      if (messageIntervalId) return;

      messageIntervalId = setInterval(async () => {
        const message = getRandomString();
        await redisClient.rPushAsync(MESSAGE_LIST, message).catch(err => {
          logger.error(text.FAILED_CONNECT_REDIS, err);
        });
        pub.publish(CHANNEL_NAME, MESSAGE_TYPE);
        logger.info(`${text.MESSAGE_PUBLISHED}: ${message} ${new Date()}`);
      }, MESSAGE_INTERVAL);
    }
  }, MESSAGE_INTERVAL - 1);

  client.on('end', () => {
    sub.off('message', onMsgHandler);
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });

  client.on('error', function (err) {
    sub.off('message', onMsgHandler);
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });
};

module.exports = {
  run
};
