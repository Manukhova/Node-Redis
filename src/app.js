const logger = require('../configs/logger');
const redisClient = require('./redis');
const redisSubClient = require('./sub');
const redisPubClient = require('./pub');
const generateMsg = require('./generate');
const {
  text,
  CHANNEL_NAME,
  MESSAGE_LIST,
  MESSAGE_INTERVAL,
  MESSAGE_TYPE,
  PUB_MESSAGE_TYPE,
  NO_PUB_MESSAGE_TYPE,
  GET_ERR_FLAG
} = require('../configs/config');

let messageIntervalId = null;
let heartbeatTimestamp = 0;
let isPub = false;

const onMsgHandler = async (chan, message) => {
  if (message === PUB_MESSAGE_TYPE) {
    isPub = true;
    return;
  }

  if (message === NO_PUB_MESSAGE_TYPE) {
    isPub = false;
    return;
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

const checkForPub = async (sub, pub) => {
  const lastMsgDate = Date.now() - MESSAGE_INTERVAL;

  if (heartbeatTimestamp < lastMsgDate) {
    pub.publish(CHANNEL_NAME, NO_PUB_MESSAGE_TYPE);
    logger.info(`${text.NO_PUB_MESSAGE_PUBLISHED} ${new Date()}`);

    if (isPub) return;

    if (Object.keys(sub.subscription_set).length) {
      await redisSubClient.quitSub(CHANNEL_NAME);
    }

    pub.publish(CHANNEL_NAME, PUB_MESSAGE_TYPE);
    logger.info(`${text.PUB_MESSAGE_PUBLISHED} ${new Date()}`);

    if (messageIntervalId) return;

    messageIntervalId = setInterval(generateMsg, MESSAGE_INTERVAL, redisClient, pub);
  }
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

  const checkIntervalId = setInterval(checkForPub, MESSAGE_INTERVAL - 1, sub, pub);

  client.on('end', () => {
    sub.off('message', onMsgHandler);
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });

  client.on('error', err => {
    sub.off('message', onMsgHandler);
    clearInterval(messageIntervalId);
    clearInterval(checkIntervalId);
  });
};

module.exports = {
  run
};
