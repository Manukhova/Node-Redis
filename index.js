const app = require('./src/app');

app.run().catch(err => {
  console.error(`${err}, ${new Date()}`);
  process.exit(1);
});
