const app = require('./src/app');

try {
  app.run();
} catch (err) {
  console.error(err);
}
