const logger = require('../configs/logger');
const { getRandomString } = require('../configs/helpers');
const { text, CHANNEL_NAME, MESSAGE_LIST, MESSAGE_TYPE } = require('../configs/config');

const generateMsg = async (client, pub) => {
  const message = getRandomString();
  await client.rPushAsync(MESSAGE_LIST, message).catch(err => {
    logger.error(text.FAILED_CONNECT_REDIS, err);
  });
  pub.publish(CHANNEL_NAME, MESSAGE_TYPE);
  logger.info(`${text.MESSAGE_PUBLISHED}: ${message} ${new Date()}`);
};

module.exports = generateMsg;
