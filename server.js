const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const constants = require('./config/constants.json');
const initExpressConfig = require('./config/express');
const router = require('./config/routes');

class Server {
  constructor() {
    this.app = express();
    this.init();
  }

  init() {
    this.app.use(morgan('dev'));
    initExpressConfig(this.app);

    mongoose.connect(constants.uri.mongodb, {
      useCreateIndex: true,
      useNewUrlParser: true
    });

    this.app.use('/api', router);
    this.app.listen(constants.apiPort, () => {
      console.log(`Listening on port ${constants.apiPort}`);
    });
  }
}

module.exports = new Server().app;
