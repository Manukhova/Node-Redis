const express = require('express');
const logger = require('../logger');
const redis = require('./redis');
const { text } = require('../text');

const app = express();

const run = async () => {

  await redis.connect().catch(err => {
    logger('error', text.FAILED_CONNECT_REDIS, err);
  });

  log('info', text.OK_CONNECT_REDIS);

  app.use(express.json());

  // startSendingFormsToAO();

  app.listen(8080, () => logger.info('info', 'Forms app listening on port 8080'));
};

module.exports = {
  run
};
