const winston = require('winston');

winston.configure({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.Console({ format: winston.format.simple() })
	]
});

module.exports = winston;
