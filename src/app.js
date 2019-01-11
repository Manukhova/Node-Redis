const logger = require('../configs/logger');
const redisClient = require('./redis');
const redisSubClient = require('./sub');
const redisPubClient = require('./pub');
const { getRandomString } = require('../configs/helpers');
const { text, CHANNEL_NAME, MESSAGE_LIST, MESSAGE_INTERVAL, MESSAGE_TYPE } = require('../configs/config');

const args = process.argv.slice(2);

let GET_ERR_FLAG = false;

if (args.length && args[0] === '--getErrors') {
  GET_ERR_FLAG = true;
}

const run = async () => {
  redisClient.connect();

  if (GET_ERR_FLAG) {
    const errors = await redisClient.getErrors().catch(err => {
      logger.error(text.FAILED_GET_ERR, err);
    });

    console.log('Errors:');

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

  const pub = await redisPubClient.getPub(CHANNEL_NAME).catch(err => {
    logger.error(text.FAILED_CONNECT_REDIS, err);
  });

  this.messageIntervalId = setInterval(async () => {
    const message = getRandomString();

    logger.info(`${text.MESSAGE_GENERATED}: ${message} ${new Date()}`);

    await redisClient.rPushAsync(MESSAGE_LIST, message);

    pub.publish(CHANNEL_NAME, MESSAGE_TYPE);
  }, MESSAGE_INTERVAL);
};

module.exports = {
  run
};
