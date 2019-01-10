const express = require('express');
const logger = require('../configs/logger');
const redis = require('./redis');
const { text } = require('../configs/text');

const app = express();

const run = async () => {
  await redis.connect().catch(err => {
    logger('error', text.FAILED_CONNECT_REDIS, err);
  });

  logger.info(text.OK_CONNECT_REDIS);

  app.use(express.json());

  // startSendingFormsToAO();

  app.listen(8080, () => logger.info('Forms app listening on port 8080'));
};

module.exports = {
  run
};
